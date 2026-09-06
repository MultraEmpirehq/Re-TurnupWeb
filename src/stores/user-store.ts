import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";

export enum EUserRoles {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum EUserGenders {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHERS = "OTHERS",
}

export type TUserDetails = {
  email?: string;
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  isMobileNumberVerified?: boolean;
  isEmailVerified?: boolean;
  role?: EUserRoles;
  createdAt?: Date;
  gender?: EUserGenders;
  username?: string;
  dateOfBirth?: Date;
  country?: string;
  countryCode?: string;
  platformCurrency?: string;
  avatar?: string;
};

type TStoreState = {
  userDetails: TUserDetails | null;
  isLoading: boolean;
  fetchingUserDetailsError: string | null;

  // Not used.. Rely on cookie for authentication
  userToken: string | null;
};

type TStoreActions = {
  setUserDetails: (userDetails: TUserDetails) => void;
  clearStore: () => void;
  setIsLoading: (isLoading: boolean) => void;
  // Not used.. Rely on cookie for authentication
  setUserToken: (userToken: string) => void;
};

type TUserStoreType = TStoreState & TStoreActions;

const initialValue: TStoreState = {
  userDetails: null,
  isLoading: true,
  fetchingUserDetailsError: null,
  userToken: null,
};

const useUserStore = create(
  persist(
    subscribeWithSelector<TUserStoreType>((set) => ({
      ...initialValue,
      setUserDetails: (userDetails) => set({ userDetails }),
      clearStore: () =>
        set({
          userDetails: null,
          userToken: null,
          fetchingUserDetailsError: null,
        }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setUserToken: (userToken) => set({ userToken }),
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
        userToken: state.userToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== "undefined") {
          state.setIsLoading(false);
        }
      },
    },
  ),
);

export default useUserStore;
