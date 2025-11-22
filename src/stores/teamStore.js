import { fetchTeamMetadata } from "@/scripts/supabase/fetcher";
import { create } from "zustand";

export const useTeamStore = create((set) => ({
    id: null,
    name: null,
    avatarURL: null,
    fetchAndSetTeamMetadata: async (teamId) => {
        const teamData = await fetchTeamMetadata(teamId);

        set({
            id: teamId,
            name: teamData.name,
            avatarURL: teamData.avatar_url
        });

        return {
            id: teamId,
            name: teamData.name,
            avatarURL: teamData.avatar_url
        };
    }
}));