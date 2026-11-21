import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type TSidebarState = {
  /** The console's side nav shrunk to icons (desktop only). */
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
};

/** Whether the admin and organiser side navs are minimized, remembered on this device. */
const useSidebarStore = create<TSidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      setCollapsed: (collapsed) => set({ collapsed }),
      toggle: () => set((state) => ({ collapsed: !state.collapsed })),
    }),
    {
      name: "turnupz-sidebar",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useSidebarStore;
