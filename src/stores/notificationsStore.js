import { fetchUserNotifications } from "@/scripts/supabase/fetcher";
import { updateUserNotifications } from "@/scripts/supabase/warehouseInbound";
import { nanoid } from "nanoid";
import z from "zod";
import { create } from "zustand";

export const useNotificationsStore = create((set) => ({
    notifications: [],
    hasLoaded: false,
    pushNotificationLocally: ({ title, description, link, mustBeRead=false }) => set((state) => ({ notifications: [...state.notifications, { title, description, link, mustBeRead, hasFired: false, id: nanoid(), createdAt: Date.now() }]})),
    pushNotification: async ({ title, description, link, mustBeRead=false }, userUUID) => {
        if (z.safeParse(z.uuid(), userUUID).success === false) {
            console.warn('Unable to push notification, userUUID is null. Failing.');
            return;
        }

        const notifications = await fetchUserNotifications(userUUID);
        const newNotification = { title, description, link, mustBeRead, hasFired: false, id: nanoid(), createdAt: Date.now() };
        const newNotifications = notifications === null ? Array(newNotification) : [...notifications, newNotification];
        
        set({ notifications: newNotifications });

        updateUserNotifications(newNotifications, userUUID);
    },
    deleteNotificationLocally: ((id) => {
        console.log(id);
        

        set((state) => ({ notifications: state.notifications.filter((notification) => notification.id !== id) }))
    }),
    fireNotificationLocally: ((id) => set((state) => ({ notifications: state.notifications.map((notification) => notification.id === id ? { ...notification, hasFired: true } : notification) }))),
    setHasBeenReadLocally: ((id) => set((state) => ({ notifications: state.notifications.map((notification) => notification.id === id ? { ...notification, mustBeRead: false } : notification) }))),
    fetchAndSetUserNotifications: async (userUUID) => {
        const notifications = await fetchUserNotifications(userUUID);
        
        set({ notifications, hasLoaded: true });
        
        return notifications;
    }
}));