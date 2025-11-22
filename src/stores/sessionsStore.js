import { fetchSessionMetadata, fetchTeamSessionsMetadata } from "@/scripts/supabase/fetcher";
import { deleteSession as deleteSessionFromServer, deleteSessions as deleteSessionsFromServer } from "@/scripts/supabase/warehouseDemolisher";
import { create } from "zustand";

export const useSessionsStore = create((set, get) => ({
    sessions: null,
    totalCount: 0,
    fetchAndMergeTeamSessions: async (teamId, from = 0, count = 20) => {
        const result = await fetchTeamSessionsMetadata(teamId, from, count);

        if (!result) return;

        const { data, totalCount } = result;

        set((state) => {
            if (!state.sessions) {
                // First load
                return { sessions: data, totalCount };
            } else {
                // Merge with existing sessions
                const existingSessions = state.sessions;
                const newSessions = data.filter(newSession => 
                    !existingSessions.some(existing => existing.uuid === newSession.uuid)
                );
                
                return { 
                    sessions: [...existingSessions, ...newSessions], 
                    totalCount 
                };
            }
        });
    },
    fetchAndMergeTeamSession: async (teamId, sessionUUID) => {
        const result = await fetchSessionMetadata(teamId, sessionUUID);
        if (!result) return;

        set((state) => {
            if (!state.sessions) {
                // First load
                return { sessions: [result], totalCount: 1 };
            } else {
                // Merge with existing sessions
                const existingSessions = state.sessions;
                const newSessions = [result].filter(newSession => 
                    !existingSessions.some(existing => existing.uuid === newSession.uuid)
                );
                
                return { 
                    sessions: [...existingSessions, ...newSessions], 
                    totalCount: state.totalCount + newSessions.length
                };
            }
        });
    },
    deleteSession: async (sessionUUID) => {
        try {
            await deleteSessionFromServer(sessionUUID);
    
            set((state) => ({
                sessions: state.sessions.filter(session => session.uuid !== sessionUUID),
                totalCount: state.totalCount - 1
            }));

            return true;
        } catch (error) {
            return false;
        }
    },
    deleteSessions: async (sessionUUIDs = []) => {
        if (!Array.isArray(sessionUUIDs) || sessionUUIDs.length === 0) {
            return true;
        }

        try {
            await deleteSessionsFromServer(sessionUUIDs);

            set((state) => {
                const uuidSet = new Set(sessionUUIDs);
                const filteredSessions = state.sessions.filter(session => !uuidSet.has(session.uuid));
                const removedCount = state.sessions.length - filteredSessions.length;

                return {
                    sessions: filteredSessions,
                    totalCount: Math.max(0, state.totalCount - removedCount)
                };
            });

            return true;
        } catch (error) {
            return false;
        }
    }
}));