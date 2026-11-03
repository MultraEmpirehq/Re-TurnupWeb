import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type THideAmountsState = {
  /** Money is shown as dots, for checking the wallet where others can see. */
  hidden: boolean;
  toggle: () => void;
};

/** Whether amounts are hidden, remembered on this device. */
const useHideAmounts = create<THideAmountsState>()(
  persist(
    (set) => ({
      hidden: false,
      toggle: () => set((state) => ({ hidden: !state.hidden })),
    }),
    {
      name: "turnupz-hide-amounts",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useHideAmounts;
