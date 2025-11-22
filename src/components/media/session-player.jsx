"use client";

import { use, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTeamStore } from '@/stores/teamStore';
import { fetchSessionReplay } from '@/scripts/supabase/fetcher';
import 'rrweb/dist/style.css';
import { Replayer } from 'rrweb';
import rrwebPlayer from 'rrweb-player';

export default function SessionPlayer({ sessionUUID, className }) {
    const teamId = useTeamStore((state) => state.id);
    const replayViewRef = useRef();
    const wrapperRef = useRef();
    const replayerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);

    useEffect(() => {
        const loadReplay = async () => {
            if (hasLoaded === true) return;
            setIsLoading(true);

            const events = await fetchSessionReplay(teamId, sessionUUID);

            if (!events || events.length === 0) return; // set up empty state

            // Insert small CSS rule for the replayer so the iframe is centered
            // rrweb creates an <iframe> inside `.replayer-wrapper`; make it display block
            // and use horizontal auto margins to center it within the container.
            // Use !important to ensure we override rrweb inline styles like `display: inherit;`
            // const insertRules = `.replayer-wrapper iframe { display: block !important; margin-left: auto !important; margin-right: auto !important; }
            //                       .replayer-wrapper canvas { display: block !important; margin-left: auto !important; margin-right: auto !important; }`;

            // const replayer = new Replayer(events, { root: replayViewRef.current, speed,  });
            
            const replayer = new rrwebPlayer({
                target: replayViewRef.current,
                props: {
                    events,
                    height: 200,
                    width: 500,
                    showController: false
                }
            });
            replayerRef.current = replayer;

            // set total time from metadata
            const replayMetadata = replayer.getMetaData?.();
            if (replayMetadata?.totalTime) {
                setTotalTime(replayMetadata.totalTime);
            }

            // update current time while playing
            let requestAnimationFrameId = -1;
            const tick = () => {
                try {
                    const currentTime = replayer.getCurrentTime();
                    setCurrentTime(currentTime);
                } catch (error) {
                    // ignore
                }
                requestAnimationFrameId = requestAnimationFrame(tick);
            };

            replayer.on?.('state-change', (state) => {
                // simple heuristics: if state contains 'playing'
                setPlaying(replayer.service?.state?.matches('playing') || replayer.service?.state?.value === 'playing');
            });

            replayer.on?.('finish', () => {
                setPlaying(false);
                setCurrentTime(replayer.getCurrentTime());
            });

            // start requestAnimationFrame when playing
            replayer.on?.('state-change', () => {
                if (replayer.service?.state?.matches('playing')) {
                    cancelAnimationFrame(requestAnimationFrameId);
                    requestAnimationFrameId = requestAnimationFrame(tick);
                } else {
                    cancelAnimationFrame(requestAnimationFrameId);
                }
            });

            // autoplay is intentionally false for this lean player
            // keep replayer mounted for scrubbing

            setIsLoading(false);
            setHasLoaded(true);

            // cleanup on unmount
            return () => {
                cancelAnimationFrame(requestAnimationFrameId);

                try {
                    replayer.pause();
                } catch (error) {}

                replayerRef.current = null;

                if (replayViewRef.current) replayViewRef.current.innerHTML = '';
            };
        };
        
        loadReplay();
    }, [sessionUUID, teamId]);

    
    useEffect(() => {
        // window.addEventListener('resize', () => {
        //     console.log(window.innerWidth);
        // });

        if (window) {
            const pageWidth = window.innerWidth;
            const sidebarMaxWidth = 256; // 16rem
            const paddingX = 32; // 8rem total
            const availableWidth = pageWidth - sidebarMaxWidth - paddingX;

            if (wrapperRef.current) {
                // wrapperRef.current.style.maxWidth = `${availableWidth}px`;
            }

            // Get the height of the recording
            const recordingHeight = replayViewRef.current?.firstChild?.getBoundingClientRect()?.height || 0;
            console.log("recordingHeight", recordingHeight);
            console.log(replayerRef.current);
        }

        console.log(window.innerWidth);
    }, []);

    useEffect(() => {
        const handler = (event) => {
            const skipStep = 5000;

            if (!replayerRef.current) return;

            const replayer = replayerRef.current;

            if (event.key === 'ArrowLeft') {
                const newTime = Math.max(0, replayer.getCurrentTime() - skipStep);
                replayer.play(newTime);
                replayer.pause();
                setCurrentTime(newTime);
                event.preventDefault();
            } else if (event.key === 'ArrowRight') {
                const newTime = Math.min((replayer.getMetaData?.()?.totalTime || 0), replayer.getCurrentTime() + skipStep);
                replayer.play(newTime);
                replayer.pause();
                setCurrentTime(newTime);
                event.preventDefault();
            } else if (event.key === ' ') {
                togglePlay();
                event.preventDefault();
            }
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, []);

    const togglePlay = () => {
        const replayer = replayerRef.current;
        if (!replayer) return;

        if (replayer.service?.state?.matches('playing')) {
            replayer.pause();
            setPlaying(false);
            return;
        }

        // play from current time
        replayer.play(replayer.getCurrentTime());
        setPlaying(true);
    };

    const setPlaybackSpeed = (newSpeed) => {
        const replayer = replayerRef.current;
        if (!replayer) return;

        replayer.setConfig?.({ speed: newSpeed });

        setSpeed(newSpeed);
    };

    const onSeek = (event) => {
        const replayer = replayerRef.current;
        if (!replayer) return;

        const valueMs = Number(event.target.value);
        // Play to the time so rrweb applies DOM state, then pause to stay there
        const wasPlaying = replayer.service?.state?.matches('playing');
        if (wasPlaying) replayer.pause();
        replayer.play(valueMs);
        replayer.pause();
        
        setCurrentTime(valueMs);
        if (wasPlaying) replayer.play(valueMs);
    };

    return (
        <div ref={wrapperRef} className={cn("mt-12 bg-red-500", className)}>
            <div className={cn("border border-border rounded-md overflow-clip bg-black")}> 
                <div ref={replayViewRef} className="w-full h-full" />
            </div>

            {/* Controls: play/pause, slider, time, speed */}
            <div className="mt-2 flex items-center gap-4">
                <button onClick={togglePlay} className="rounded px-3 py-1 bg-gray-800 text-white">
                    {playing ? 'Pause' : 'Play'}
                </button>
                <button
                    className="rounded px-2 py-1 bg-transparent border border-border text-muted-foreground"
                    aria-label="Step backward 5s"
                    onClick={() => {
                        const r = replayerRef.current;
                        if (!r) return;
                        const newTime = Math.max(0, r.getCurrentTime() - 5000);
                        r.play(newTime);
                        r.pause();
                        setCurrentTime(newTime);
                    }}
                >
                    -5s
                </button>
                <button
                    className="rounded px-2 py-1 bg-transparent border border-border text-muted-foreground"
                    aria-label="Step forward 5s"
                    onClick={() => {
                        const r = replayerRef.current;
                        if (!r) return;
                        const newTime = Math.min((r.getMetaData?.()?.totalTime || 0), r.getCurrentTime() + 5000);
                        r.play(newTime);
                        r.pause();
                        setCurrentTime(newTime);
                    }}
                >
                    +5s
                </button>

                <div className="flex-1">
                    <input
                        aria-label="Replay progress"
                        type="range"
                        min={0}
                        max={totalTime || 0}
                        value={Math.min(currentTime || 0, totalTime || 0)}
                        onChange={onSeek}
                        className="w-full"
                    />
                </div>

                <div className="text-xs text-muted-foreground">
                    {formatTime(currentTime || 0)} / {formatTime(totalTime || 0)}
                </div>

                <select
                    aria-label="playback speed"
                    value={speed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="rounded border px-2 py-1"
                >
                    <option value={0.25}>0.25x</option>
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                </select>
            </div>
        </div>
    );
}


const formatTime = (miliseconds) => {
    const seconds = Math.floor(miliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const formattedSeconds = String(seconds % 60).padStart(2, '0');

    return `${minutes}:${formattedSeconds}`;
};