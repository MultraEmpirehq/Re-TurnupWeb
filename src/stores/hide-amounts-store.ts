import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type THideAmountsState = {
  /** Money is shown as dots, for checking the wallet where others can see. */
  hidden: boolean;
  toggle: () => void;
};

/**
 * Whether amounts are hidden, remembered on this device. Hidden until the
 * person taps the eye (money on screen is private by default). The key's
 * "v2" starts everyone hidden once, including anyone who had chosen before.
 */
const useHideAmounts = create<THideAmountsState>()(
  persist(
    (set) => ({
      hidden: true,
      toggle: () => set((state) => ({ hidden: !state.hidden })),
    }),
    {
      name: "turnupz-hide-amounts-v2",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useHideAmounts;
