import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type BusinessVertical = "I" | "B" | "A";

export type UserProfile = {
  name: string;
  id: number;
  email: string;
  mobile: string;
  business_vertical: BusinessVertical;
  address: string;
  aadhaar_number: string;
  pan_number: string;
  company_name: string;
  pincode: string | null;
};

type UserState = {
  businessVertical: BusinessVertical;
  username: string;
  email: string;
  token: string;
  refreshToken: string;
  buyerId?: number;
  mobile: string;
  address: string;
  isAuthenticated: boolean;
  setBusinessVertical: (v: BusinessVertical) => void;
  setAuthTokens: (t: { token: string; refreshToken: string }) => void;
  setUserProfile: (p: UserProfile) => void;
  clearAuth: () => void;
};

const initial: Omit<UserState, "setBusinessVertical" | "setAuthTokens" | "setUserProfile" | "clearAuth"> = {
  businessVertical: "I",
  username: "",
  email: "",
  token: "",
  refreshToken: "",
  buyerId: undefined,
  mobile: "",
  address: "",
  isAuthenticated: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initial,
      setBusinessVertical: (v) => set({ businessVertical: v }),
      setAuthTokens: ({ token, refreshToken }) => set({ token, refreshToken, isAuthenticated: true }),
      setUserProfile: (p) =>
        set({
          username: p.name,
          email: p.email,
          businessVertical: p.business_vertical,
          buyerId: p.id,
          mobile: p.mobile,
          address: p.address,
          isAuthenticated: true,
        }),
      clearAuth: () => set({ ...initial }),
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        businessVertical: s.businessVertical,
        username: s.username,
        email: s.email,
        token: s.token,
        refreshToken: s.refreshToken,
        buyerId: s.buyerId,
        mobile: s.mobile,
        address: s.address,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);


