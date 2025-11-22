"use client"

import { useEffect } from "react"
import { useUserStore } from "@/stores/userStore"
import { useNotificationsStore } from "@/stores/notificationsStore";
import { useSessionsStore } from "@/stores/sessionsStore";
import { useTeamStore } from "@/stores/teamStore";

export function DataLoader(){
    const loadUserMetadata = useUserStore((state) => state.fetchAndSetMetadata);
    const loadUserNotifications = useNotificationsStore((state) => state.fetchAndSetUserNotifications);
    const fetchAndSetTeamMetadata = useTeamStore((state) => state.fetchAndSetTeamMetadata);
    const fetchAndMergeTeamSessions = useSessionsStore((state) => state.fetchAndMergeTeamSessions);

    async function loader() {
        // Load user metadata
        const { uuid: userUUID, teams } = await loadUserMetadata();

        // Determine effective team
        const lastUserTeamId = window.localStorage.getItem('last_used_team');
        const effectiveTeam = teams.find(team => team.id === lastUserTeamId) || teams.sort((teamA, teamB) => new Date(teamB.joined_at) - new Date(teamA.joined_at))[0];

        // Fetch team metadata
        fetchAndSetTeamMetadata(effectiveTeam.team_id);

        // Fetch last 20 sessions
        fetchAndMergeTeamSessions(effectiveTeam.team_id, 0, 20);

        // Load user notifications
        loadUserNotifications(userUUID);
    }

    useEffect(() => {
        loader();
    }, [])
}