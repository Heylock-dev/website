import { fetchUserMetadata } from "@/scripts/supabase/fetcher";
import { create } from "zustand";

export const useUserStore = create((set) => ({
    uuid: null,
    name: null,
    username: null,
    email: null,
    avatar: null,
    teams: [],
    fetchAndSetMetadata: async () => {
        const { uuid, name, email, username, avatar, teams } = await fetchUserMetadata();
        set({ uuid, name, username, email, avatar, teams });
        return { uuid, name, email, username, avatar, teams };
    }
}));