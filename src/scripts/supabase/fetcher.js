"use server";

import { createClient } from "./server";
import zlib from 'zlib';

export async function fetchUserMetadata() {
    const supabase = await createClient();

    // Fetch authenticated user
    const { data, error } = await supabase.auth.getUser();

    if (error) {
        console.error('Error fetching user data:', error);
        return null;
    }    

    const metadata = data.user.user_metadata;

    // Fetch user teams
    const { data: teamsData, error: teamsError } = await supabase.from('members').select('team_id, role, joined_at').eq('user_id', data.user.id);

    if (teamsError) {
        console.error('Error fetching user teams:', teamsError);
        return null;
    }

    // Return consolidated user metadata
    return { 
        uuid: data.user.id,
        name: metadata.full_name || null,
        username: metadata.preferred_username || null,
        email: metadata.email || null,
        avatar: metadata.avatar_url || null,
        teams: teamsData
    };
}

export async function fetchTeamIdByKeyHash(keyHash) {
    const supabase = await createClient();
    
    const { data, error } = await supabase.from('keys').select('team_id').eq('key_hash', keyHash);
    
    if (error) {
        console.error('Error fetching team_id:', error);
        return null;
    }
    
    if(data?.length === 0) {
        return null;
    }
    
    return data[0].team_id;
}

export async function fetchUserNotifications(userUUID) {
    const supabase = await createClient();
    
    const { data, error } = await supabase.from('users').select('notifications').eq('id', userUUID).single();
    
    if (error) {
        console.error('Error fetching noitifications:', error);
        return null;
    }
    
    return data.notifications || [];
}

export async function fetchTeamSessionsMetadata(teamId, from = 0, count = 20) {
    const supabase = await createClient();

    const { data, error, count: totalCount } = await supabase
        .from('sessions')
        .select('uuid, sub_user_uuid, created_at, last_pulse, replay_size, tags', { count: 'exact' })
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .range(from, from + count - 1);

    if (error) {
        console.error('Error fetching team sessions:', error);
        return null;
    }

    const subUserUUIDs = [...new Set(data.map(session => session.sub_user_uuid).filter(Boolean))];

    let identifierMap = {};
    if (subUserUUIDs.length > 0) {
        const { data: subUsersData, error: subUserError } = await supabase.from('sub_users').select('uuid, identifier').in('uuid', subUserUUIDs).eq('team_id', teamId);

        if (subUserError) {
            console.error('Error fetching sub user identifiers:', subUserError);
        } else if (Array.isArray(subUsersData)) {
            identifierMap = subUsersData.reduce((accumulation, subUser) => {
                if (subUser?.uuid) accumulation[subUser.uuid] = subUser.identifier || null;
                return accumulation;
            }, {});
        }
    }

    const dataWithIdentifiers = data.map((session) => ({
        ...session,
        sub_user_identifier: session.sub_user_uuid ? identifierMap[session.sub_user_uuid] || null : null
    }));

    return {
        data: dataWithIdentifiers,
        totalCount
    };
}

export async function fetchSessionMetadata(teamId, sessionUUID) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('sessions')
        .select('uuid, sub_user_uuid, created_at, last_pulse, replay_size, tags')
        .eq('team_id', teamId)
        .eq('uuid', sessionUUID)
        .single();

    if (error) {
        console.error('Error fetching session metadata:', error);
        return null;
    }

    const subUserUUID = data.sub_user_uuid;
    const { data: subUserData, error: subUserError } = await supabase
        .from('sub_users')
        .select('identifier')
        .eq('team_id', teamId)
        .eq('uuid', subUserUUID)
        .single();
        
    if (subUserError) {
        console.error('Error fetching sub user identifier:', subUserError);
    }

    return {
        ...data,
        sub_user_identifier: subUserData?.identifier || null
    };
}

export async function fetchSessionEvents(sessionUUID) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('events')
        .select('created_at, type, payload, uri')
        .eq('session_uuid', sessionUUID)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching session events:', error);
        return null;
    }

    return data;
}

export async function fetchTeamMetadata(teamId) {
    const supabase = await createClient();

    const { data, error } = await supabase.from('teams').select('name, avatar_url').eq('id', teamId).single();

    if (error) {
        console.error('Error fetching team metadata:', error);
        return null;
    }

    return data;
}

export async function fetchSessionReplay(teamId, sessionUUID) {
    const supabase = await createClient();

    const { data: listFiles, error: listError } = await supabase.storage.from('replays').list(`${teamId}/${sessionUUID}`);

    console.log(listFiles);

    let events = [];
    // If listing failed, log and return null so callers can handle
    if (listError) {
        console.error('Error listing replay files:', listError);
        return null;
    }

    if (!Array.isArray(listFiles) || listFiles.length === 0) {
        // No files in storage for this session
        return [];
    }

    // Find uncompressed and compressed files
    const uncompressedName = 'replayEvents.jsonl';
    const compressedName = 'replayEvents.jsonl.gz';

    const uncompressedFile = listFiles.find(file => file?.name === uncompressedName);
    const compressedFile = listFiles.find(file => file?.name === compressedName);

    let chosenFile;

    if (uncompressedFile && compressedFile) {
        // If both exist, choose the most recently updated file if timestamps available
        const uncompressedTime = uncompressedFile?.updated_at || uncompressedFile?.created_at || null;
        const compressedTime = compressedFile?.updated_at || compressedFile?.created_at || null;

        if (!uncompressedTime && !compressedTime) {
            // Fall back to preferring uncompressed (likely up to date)
            chosenFile = uncompressedFile;
        } else if (!uncompressedTime) {
            chosenFile = compressedFile;
        } else if (!compressedTime) {
            chosenFile = uncompressedFile;
        } else {
            chosenFile = new Date(uncompressedTime) > new Date(compressedTime) ? uncompressedFile : compressedFile;
        }
    } else if (compressedFile) {
        chosenFile = compressedFile;
    } else if (uncompressedFile) {
        chosenFile = uncompressedFile;
    }

    if (!chosenFile) {
        return [];
    }

    const path = `${teamId}/${sessionUUID}/${chosenFile.name}`;

    try {
        const { data: fileData, error: downloadError } = await supabase.storage.from('replays').download(path);

        if (downloadError) {
            if (downloadError.status === 404) {
                return [];
            }

            console.error('Error downloading replay file:', downloadError);
            return null;
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());

        let jsonlBuffer;
        if (chosenFile.name.endsWith('.gz')) {
            try {
                jsonlBuffer = zlib.gunzipSync(buffer);
            } catch (err) {
                console.error('Error decompressing replay file:', err);
                return null;
            }
        } else {
            jsonlBuffer = buffer;
        }

        const jsonlString = jsonlBuffer.toString('utf-8');

        // Parse JSONL — each line is a JSON event
        const lines = jsonlString.split('\n').filter(Boolean);

        events = lines.map((line) => {
            try {
                return JSON.parse(line);
            } catch (error) {
                console.error('Error parsing JSONL line in replay file:', error, line);
                return null;
            }
        }).filter(Boolean);

        return events;
    } catch (err) {
        console.error('Unknown error fetching session replay:', err);
        return null;
    }
    
}

