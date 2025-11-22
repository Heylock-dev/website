"use client";

import { useNotificationsStore } from "@/stores/notificationsStore";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "../ui/sonner";
import { toast } from "sonner"
import { updateUserNotifications } from "@/scripts/supabase/warehouseInbound";
import { useUserStore } from "@/stores/userStore";
import z from "zod";

export default function NotificationsHandler() {
    const notifications = useNotificationsStore((state) => state.notifications);
    const haveNotificationsLoaded = useNotificationsStore((state) => state.hasLoaded);
    const fireNotificationLocally = useNotificationsStore((state) => state.fireNotificationLocally);
    const userUUID = useUserStore((state) => state.uuid);
    const validNotificationsHandlerIdRef = useRef();
    const startupTime = useRef(Date.now());

    async function notificationsInvoker() {
        const handlerId = Math.random();
        validNotificationsHandlerIdRef.current = handlerId;
        
        notifications.map((notification) => {
            if(notification.hasFired === false) {
                fireNotificationLocally(notification.id);
                toast(notification.title, { description: notification.description, position: 'top-center' });
            }
        });
        
        if(Date.now() - startupTime.current < 5000) await new Promise(() => setTimeout(() => {}, 5000));

        if(haveNotificationsLoaded === false) return;
        if(z.safeParse(z.uuid(), userUUID).success === false) return;
        if(z.safeParse(z.array(z.object()), notifications).success === false) return;
        if(handlerId !== validNotificationsHandlerIdRef.current) return;            

        updateUserNotifications(notifications, userUUID);
    }

    useEffect(() => {
        notificationsInvoker();
    }, [notifications, userUUID, haveNotificationsLoaded]);

    return(
        <Toaster />
    );
}