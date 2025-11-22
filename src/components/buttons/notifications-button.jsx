"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, BellOffIcon, SquareArrowOutUpRightIcon, Trash2 } from "lucide-react";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemSeparator, ItemTitle } from "@/components/ui/item"
import React, { useState } from "react";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { Button } from "../ui/button";
import { nanoid } from "nanoid";
import Link from "next/link";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useUserStore } from "@/stores/userStore";
import { updateUserNotifications } from "@/scripts/supabase/warehouseInbound";
import { Spinner } from "../ui/spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NotificationsButton({ className }) {
    const notifications = useNotificationsStore((state) => state.notifications);
    const setHasBeenRead = useNotificationsStore((state) => state.setHasBeenReadLocally);
    const deleteNotificationLocally = useNotificationsStore((state) => state.deleteNotificationLocally);
    const fetchAndSetUserNotifications = useNotificationsStore((state) => state.fetchAndSetUserNotifications);
    const userUUID = useUserStore((state) => state.uuid);
    const [refreshing, setRefreshing] = useState(false);
    const hasMustRead = notifications.some(notification => notification.mustBeRead === true);

    function handleLinkVisit(id) {
        setHasBeenRead(id);
        updateUserNotifications(notifications, userUUID);
    }
    
    function handleDelete(id) {
        deleteNotificationLocally(id);

        updateUserNotifications(notifications, userUUID);
    }

    async function handleRefresh() {
        if(userUUID === null) {
            toast("Please wait, the website isn't loaded yet", { position: 'top-center', duration: 1500 });
            return;
        }

        toast("Refreshing...", { position: 'top-center', duration: 1500 });
        setRefreshing(true);
        const notifications = await fetchAndSetUserNotifications(userUUID);
        setRefreshing(false);

        if(notifications?.length === 0) {
            toast("No notifications found", { position: 'top-center', duration: 2000 });
        }
    }

    return (
        <Popover className={className}>
            <PopoverTrigger>
                <div className="relative inline-block">
                    <Bell className={cn("border border-border rounded-md p-1.5 w-8 h-8 hover:bg-muted", )}/>
                    {hasMustRead && <div className="absolute inset-0 rounded-md border-2 border-primary/20 animate-caret-blink pointer-events-none" style={{ animationDuration: '4s' }} />}
                </div>
            </PopoverTrigger>
            <PopoverContent className="min-w-md bg-background max-h-[90vh] overflow-scroll">
                {
                    notifications.length > 0
                    ? <ItemGroup>
                        {notifications.sort((notificationA, notificationB) => { return notificationA.createdAt < notificationB.createdAt }).map((notification, index) => (
                            <ContextMenu key={notification.id || nanoid()}>
                                <ContextMenuTrigger>
                                    <React.Fragment>
                                        <Item>
                                            <ItemContent className="gap-1 ">
                                                <ItemTitle>
                                                    {
                                                        typeof notification.link === 'string'
                                                        ? <Link href={notification.link} onClick={() => { handleLinkVisit(notification.id) }} className="text-foreground hover:underline underline-offset-3">{notification.title}</Link>
                                                        : notification.title
                                                    }
                                                    {
                                                        notification.mustBeRead === true 
                                                        && <div className="w-1.5 h-1.5 bg-primary rounded-full"/>
                                                    }
                                                </ItemTitle>
                                                <ItemDescription>{notification.description} and Lorem Ipsum Dolor Sit Amet 50</ItemDescription>
                                            </ItemContent>
                                            <ItemActions>
                                                {
                                                    typeof notification.link === 'string' &&
                                                    <Link href={notification.link} onClick={() => { handleLinkVisit(notification.id) }}>
                                                        <Button variant="outline" size="icon-sm" className="rounded-md">
                                                            <SquareArrowOutUpRightIcon />
                                                        </Button>
                                                    </Link>
                                                }
                                            </ItemActions>
                                        </Item>

                                        {index !== notifications.length - 1 && <ItemSeparator />}
                                    </React.Fragment>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="w-fit">
                                    <ContextMenuItem>
                                        <button className="flex items-center gap-2" onClick={() => {handleDelete(notification.id)}}>
                                            <Trash2 />Delete
                                        </button>
                                    </ContextMenuItem>
                                    {
                                        typeof notification.link === 'string'
                                        && <Link href={notification.link} onClick={() => { handleLinkVisit(notification.id) }}>
                                            <ContextMenuItem><SquareArrowOutUpRightIcon/>Open</ContextMenuItem>
                                        </Link>
                                    }
                                </ContextMenuContent>
                            </ContextMenu>
                        ))}
                    </ItemGroup>
                    : <Empty>
                        <EmptyHeader>   
                            <EmptyMedia variant="icon">
                                <BellOffIcon />
                            </EmptyMedia>
                            <EmptyTitle>Zero notifications</EmptyTitle>
                            <EmptyDescription>
                                Setup automations so Heylock will research your users while you sleep
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <div>
                                <Link href="/dashboard/automations">
                                    <Button variant="outline" className="mr-4 h-full">
                                        Automations
                                    </Button>
                                </Link>
                                <Button variant="ghost" className="h-full" onClick={handleRefresh}>
                                    {
                                        refreshing && <Spinner className="w-3 h-3 appearance-none"/>
                                    }
                                    Refresh
                                </Button>
                            </div>
                        </EmptyContent>
                    </Empty>
                }
            </PopoverContent>
        </Popover>
    );
}