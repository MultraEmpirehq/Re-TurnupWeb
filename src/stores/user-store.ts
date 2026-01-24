import { getData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { UserGenders, UserRoles } from "@/lib/enum";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";

export type TUserDetails = {
  email?: string;
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  isMobileNumberVerified?: boolean;
  isEmailVerified?: boolean;
  role?: UserRoles;
  createdAt?: Date;
  gender?: UserGenders;
  dateOfBirth?: Date;
  avatar?: string;
  skill?: TSkillType;
  totalServices?: number;
};
type TStoreState = {
  userDetails: TUserDetails | null;
  isLoading: boolean;
  fetchingUserDetailsError: string | null;
  hasFetched: boolean;
};

type TStoreActions = {
  setUserDetails: (userDetails: TUserDetails) => void;
  clearStore: () => void;
  setIsLoading: (isLoading: boolean) => void;
  getUserDetails: (retryCount?: number) => Promise<void>;
};

type TUserStoreType = TStoreState & TStoreActions;

const initialValue: TStoreState = {
  userDetails: null,
  isLoading: true,
  fetchingUserDetailsError: null,
  hasFetched: false,
};

const useUserStore = create(
  persist(
    subscribeWithSelector<TUserStoreType>((set, get) => ({
      ...initialValue,
      setUserDetails: (userDetails) => set({ userDetails }),
      clearStore: () => set({ ...initialValue }),
      setIsLoading: (isLoading) => set({ isLoading }),
      getUserDetails: async (retryCount = 0) => {
        const state = get();
        set({
          isLoading: true,
          fetchingUserDetailsError: null,
          hasFetched: true,
        });
        if (!state.userDetails) {
          set({ isLoading: false });
          return;
        }

        try {
          const { data } = await getData<TUserDetails>("/user");
          const userDetails = data?.data;

          if (userDetails) {
            set({
              userDetails,
              isLoading: false,
              fetchingUserDetailsError: null,
            });
          } else {
            set({
              userDetails: null,
              isLoading: false,
              fetchingUserDetailsError: "No user data received",
            });
          }
        } catch (error) {
          const errorContent = error as TApiErrorResponseType;

          if (errorContent?.status === 401 || errorContent?.status === 403) {
            return set({
              userDetails: null,
              isLoading: false,
              fetchingUserDetailsError: "Unauthorized!",
            });
          }

          if (retryCount < 6) {
            const delay = Math.pow(2, retryCount) * 1000;
            setTimeout(() => {
              get().getUserDetails(retryCount + 1);
            }, delay);
            return;
          }

          const errorMessage = constructErrorMessage(
            errorContent,
            "Unknown Error fetching user details!"
          );

          set({
            fetchingUserDetailsError: errorMessage,
            isLoading: false,
          });
        }
      },
    })),
    {
      name: "user-store",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        userDetails: state.userDetails,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== "undefined") {
          state.setIsLoading(false);
          if (!state.hasFetched) {
            setTimeout(() => {
              state.getUserDetails();
            }, 0);
          }
        }
      },
    }
  )
);

export default useUserStore;
