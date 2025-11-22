"use server";

import z from "zod";
import { createClient } from "./server";
import zlib from "zlib";

export async function storeOrReplaceApiKey(teamId, keyHash, encryptedKey, iv) {
    const supabase = await createClient();

    const { error } = await supabase.from('keys').upsert({ team_id: teamId, key_hash: keyHash, encrypted_key: encryptedKey, iv: iv }, { onConflict: 'team_id' });

    if (error) {
        throw new Error('Error saving api key:', error);
    }
}

export async function generateAndStoreUserUUID(teamId) {
    if(z.parse(z.number(), teamId) === false) {
        throw new Error('Error generating and saving user identifier: teamId must be a number');
    }

    const supabase = await createClient();

    const { data, error } = await supabase.from('sub_users').insert({ team_id: teamId }).select('uuid').single();

    if (error) {
        throw new Error('Error generating and saving user identifier:', error);
    }

    const uuid = data.uuid;

    return uuid;
}

export async function identifyAndStoreUserIdentifier(teamId, userUUID, identifier) {
    const supabase = await createClient();

    if (z.safeParse(z.number(), teamId).success === false) {
        throw new Error('Error identifying user: teamId must be a number');
    }

    if (z.safeParse(z.uuid(), userUUID).success === false) {
        throw new Error('Error identifying user: userUUID must be a uuid');
    }

    if (z.safeParse(z.string().min(1).max(500), identifier).success === false) {
        throw new Error('Error identifying user: identifier must be a non-empty string of max 500 characters');
    }

    const { data, error } = await supabase.from('sub_users').update({ identifier }).eq('uuid', userUUID).eq('team_id', teamId).select('uuid');

    if (error) {
        console.error(error);
        throw new Error('Error saving user identifier');
    }

    if (data?.length === 0) {
        return { success: false, code: 'NOT_FOUND' };
    }

    return { success: true };
}

export async function generateAndStoreSessionUUID(teamId, userUUID, tags) {
    if(z.parse(z.number(), teamId) === false || z.parse(z.uuid(), userUUID) === false) {
        throw new Error('Error generating and saving session UUID: teamId must be a number and userUUID must be a UUID');
    }

    const supabase = await createClient();

    const tagsSchema = z.array(z.string().min(1).max(500)).optional();

    if (z.safeParse(tagsSchema, tags).success === false) {
        throw new Error('Error generating and saving session UUID: tags must be an array of non-empty strings (each <= 500 chars)');
    }

    const { data, error } = await supabase.from('sessions').insert({ team_id: teamId, sub_user_uuid: userUUID, tags }).select('uuid').single();

    if (error) {
        console.error(error);
        throw new Error('Error generating and saving session UUID:');
    }

    const uuid = data.uuid;

    return uuid;
}

export async function storeEvent(teamId, sessionUUID, type, payload=null, uri=null) {
    const supabase = await createClient();

    const { error } = await supabase.from('events').insert({ team_id: teamId, session_uuid: sessionUUID, type, payload, uri });
    
    if (error) {
        console.error(error);
        throw new Error('Error saving event');
    }
}

export async function updateMetric(teamId, name, { delta, value }) {
    const supabase = await createClient();

    if (Boolean(delta)) {
        const { data, error: selectError } = await supabase.from('metrics').select('value').eq('team_id', teamId).eq('name', name);

        if (selectError) {
            console.error(selectError);
            throw new Error('Error retrieving metric value');
        }
        
        if (data.length === 0) {
            return {
                success: false,
                code: 'NOT_FOUND'
            };
        }

        const newValue = data[0].value + delta;
        
        const { error: updateError } = await supabase.from('metrics').update({ value: newValue }).eq('team_id', teamId).eq('name', name);
        
        if (updateError) {
            console.error(updateError);
            throw new Error('Error updating metric value');
        }
    } else if (Boolean(value)) {
        const { data, error } = await supabase.from('metrics').update({ value }).eq('team_id', teamId).eq('name', name).select();

        if (error) {
            console.error(error);
            throw new Error('Error updating metric value');
        }

        if (data.length === 0) {
            return {
                success: false,
                code: 'NOT_FOUND'
            };
        }
    }  
    
    return { success: true };
}

export async function updatePulse(sessionUUID) {
    const supabase = await createClient();

    const { error } = await supabase.from('sessions').update({ last_pulse: new Date().toISOString() }).eq('uuid', sessionUUID);

    if (error) {
        throw new Error('Error updating pulse:', error);
    }
}

export async function appendReplayEvents(teamId, sessionUUID, events) {
    const supabase = await createClient();

    const storagePath = `${teamId}/${sessionUUID}/replayEvents.jsonl`;

    const jsonlLines = events
        .map(event => JSON.stringify(event))
        .join('\n') + '\n';
    
    try {
        const { data: existingFile, error: getError } = await supabase.storage.from('replays').download(storagePath);

        if (getError) {
            if (getError.status === 404) {
                // File does not exist, which is expected
            } else {
                console.error(getError);
                throw new Error('Error downloading existing replay events');
            }
        }

        let accumulatedReplayEvents;
        if (existingFile) {
            const existingBuffer = Buffer.from(await existingFile.arrayBuffer());
            accumulatedReplayEvents = Buffer.concat([existingBuffer, Buffer.from(jsonlLines)]);
        } else {
            accumulatedReplayEvents = Buffer.from(jsonlLines);
        }

        const { error: uploadError } = await supabase.storage.from('replays').upload(storagePath, accumulatedReplayEvents, { upsert: true });

        if (uploadError) {
            console.error(uploadError);
            throw new Error('Error uploading merged replay events');
        }

        // Update replay_size in sessions table (uncompressed size in KB)
        const replaySizeKB = Math.round(accumulatedReplayEvents.length / 1024);
        const { error: sizeUpdateError } = await supabase
            .from('sessions')
            .update({ replay_size: replaySizeKB })
            .eq('uuid', sessionUUID);

        if (sizeUpdateError) {
            console.error('Error updating replay size:', sizeUpdateError);
        }

    } catch (error) {
        // console.log('No existing file, creating new one. Or it is really an error: ', error);

        const { error: uploadError } = await supabase.storage.from('replays').upload(storagePath, jsonlLines, { upsert: true });

        if (uploadError) {
            console.error(uploadError);
            throw new Error('Error uploading new replay events');
        }

        // Update replay_size in sessions table (uncompressed size in KB)
        const replaySizeKB = Math.round(Buffer.byteLength(jsonlLines) / 1024);
        const { error: sizeUpdateError } = await supabase
            .from('sessions')
            .update({ replay_size: replaySizeKB })
            .eq('uuid', sessionUUID);

        if (sizeUpdateError) {
            console.error('Error updating replay size:', sizeUpdateError);
        }
    }
}

export async function compressReplayEvents(teamId, sessionUUID) {
    const supabase = await createClient();

    const uncompressedPath = `${teamId}/${sessionUUID}/replayEvents.jsonl`;
    const compressedPath = `${teamId}/${sessionUUID}/replayEvents.jsonl.gz`;

    try {
        const { data: uncompressedFile, error: downloadError } = await supabase.storage.from('replays').download(uncompressedPath);

        if (downloadError) {
            console.error(downloadError);
            throw new Error('Error downloading uncompressed replay events');
        }

        const buffer = Buffer.from(await uncompressedFile.arrayBuffer());
        const compressedFile = zlib.gzipSync(buffer);

        const { error: uploadError } = await supabase.storage.from('replays').upload(compressedPath, compressedFile, { upsert: true });

        if (uploadError) {
            console.error(uploadError);
            throw new Error('Error uploading compressed replay events');
        }

        // Update replay_size in sessions table (compressed size in KB)
        const compressedSizeKB = Math.round(compressedFile.length / 1024);
        const { error: sizeUpdateError } = await supabase
            .from('sessions')
            .update({ replay_size: compressedSizeKB })
            .eq('uuid', sessionUUID);

        if (sizeUpdateError) {
            console.error('Error updating compressed replay size:', sizeUpdateError);
        }

        const { error: deleteError } = await supabase.storage.from('replays').remove([uncompressedPath]);

        if (deleteError) {
            console.error(deleteError);
            throw new Error('Error deleting uncompressed replay events');
        }
    } catch (error) {
        console.error(error);
        throw new Error('Error compressing replay events');
    }
}

export async function updateUserNotifications(notifications=[{ title: '', description: '', link: '' }], userUUID) {
    const supabase = await createClient();

    console.log(notifications);
    
    const { error } = await supabase.from('users').update({ notifications }).eq('id', userUUID);
    
    if (error) {
        console.error(error);
        throw new Error('Error updating notifications');
    }
}