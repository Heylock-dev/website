"use client";

import { use, useEffect, useState } from "react";
import { fetchSessionEvents } from "@/scripts/supabase/fetcher";
import { useSessionsStore } from "@/stores/sessionsStore";
import { useTeamStore } from "@/stores/teamStore";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SessionPlayer from "@/components/media/session-player";

export default function SessionPage({ params }) {
    const { uuid } = use(params) || {};

    const sessions = useSessionsStore((state) => state.sessions);
    const fetchAndMergeTeamSession = useSessionsStore((state) => state.fetchAndMergeTeamSession);
    const teamId = useTeamStore((state) => state.id);
    
    const [session, setSession] = useState(null);

    console.log(session);

    async function loadEvents() {
        fetchAndMergeTeamSession(teamId, uuid);
    }

    useEffect(() => {
        if (!uuid) return;

        loadEvents();
    }, [uuid, teamId]);

    useEffect(() => {
        setSession(sessions?.find((session) => session.uuid === uuid));
    }, [sessions]);

    return (
        <>
        {/* Check if loading */}
            <div className="p-4 h-full">
                <span className="text-muted-foreground flex gap-1 text-sm">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {
                                Boolean(session?.sub_user_identifier)
                                ? <Link className="self-baseline hover:underline underline-offset-2" href={`/dashboard/sessions?search=${session?.sub_user_identifier}`}>{session?.sub_user_identifier}</Link>
                                : <Link className="self-baseline hover:underline underline-offset-2" href={`/dashboard/sessions?search=${session?.sub_user_uuid}`}>{session?.sub_user_uuid}</Link>
                            }
                        </TooltipTrigger>
                        <TooltipContent>
                            Go to all sessions for this user
                        </TooltipContent>
                    </Tooltip>
                    <span>/</span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="self-baseline">{session?.uuid}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                            UUID of this session
                        </TooltipContent>
                    </Tooltip>
                </span>

                <SessionPlayer className="mt-4 mx-auto" sessionUUID={uuid}/>
            </div>
        </>
    );
}