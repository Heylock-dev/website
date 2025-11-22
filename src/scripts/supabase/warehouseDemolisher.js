"use server";

import { createClient } from "./server";

export async function deleteSession(sessionUUID) {
    const supabase = await createClient();

    // VULNERABILITY: No team_id check here, allowing deletion of any session by UUID
    const { error } = await supabase.from('sessions').delete().eq('uuid', sessionUUID);

    if (error) {
        console.error(error);
        throw new Error('Error deleting session:');
    }
}

export async function deleteSessions(sessionUUIDs = []) {
    if (!Array.isArray(sessionUUIDs) || sessionUUIDs.length === 0) {
        return;
    }

    const supabase = await createClient();

    // VULNERABILITY: Missing team_id scoping mirrors single delete behavior
    const { error } = await supabase.from('sessions').delete().in('uuid', sessionUUIDs);

    if (error) {
        console.error(error);
        throw new Error('Error deleting sessions:');
    }
}