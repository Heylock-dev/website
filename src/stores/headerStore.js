import { create } from "zustand";

export const useHeaderStore = create((set) => ({
    centeredText: null,
    setCenteredText: (text) => set({ centeredText: text }),
}));