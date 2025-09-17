import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle } from '../types/Vehicle';
import { authService } from '../reactnative-services/authService';

export interface UserState {
  // User profile information
  businessVertical: 'I' | 'B' | 'A';
  username: string;
  email: string;
  avatar: string;
  token: string;
  refreshToken: string;
  buyerId?: number;
  mobile: string;
  address: string;
  aadhaarNumber: string;
  panNumber: string;
  companyName: string;
  pincode: string | null;
  
  // User lists
  watchList: Vehicle[];
  wins: Vehicle[];
  bids: Vehicle[];
  wishlist: Vehicle[];
  
  // Authentication state
  isAuthenticated: boolean;
  
  // Actions
  setBusinessVertical: (businessVertical: 'I' | 'B' | 'A') => void;
  setUsername: (username: string) => void;
  setEmail: (email: string) => void;
  setAvatar: (avatar: string) => void;
  setAuthTokens: (payload: { token: string; refreshToken: string }) => void;
  setBuyerId: (buyerId: number) => void;
  setUserProfile: (profile: {
    name: string;
    id: number;
    email: string;
    mobile: string;
    business_vertical: string;
    address: string;
    aadhaar_number: string;
    pan_number: string;
    company_name: string;
    pincode: string | null;
  }) => void;
  
  // List management actions
  addToWatchList: (vehicle: Vehicle) => void;
  removeFromWatchList: (vehicleId: string) => void;
  addToWins: (vehicle: Vehicle) => void;
  removeFromWins: (vehicleId: string) => void;
  addToBids: (vehicle: Vehicle) => void;
  removeFromBids: (vehicleId: string) => void;
  addToWishlist: (vehicle: Vehicle) => void;
  removeFromWishlist: (vehicleId: string) => void;
  
  // Authentication actions
  logout: () => Promise<void>;
  register: (userData: {
    businessVertical: string;
    username: string;
    email: string;
    avatar?: string;
  }) => void;
  refreshAuthToken: (newToken: string) => void;
  
  // Utility actions
  clearAllData: () => void;
  isVehicleInList: (vehicleId: string, listType: 'watchList' | 'wins' | 'bids' | 'wishlist') => boolean;
}

const initialState = {
  businessVertical: 'I' as 'I' | 'B' | 'A',
  username: '',
  email: '',
  avatar: '',
  token: '',
  refreshToken: '',
  buyerId: undefined as number | undefined,
  mobile: '',
  address: '',
  aadhaarNumber: '',
  panNumber: '',
  companyName: '',
  pincode: null as string | null,
  watchList: [],
  wins: [],
  bids: [],
  wishlist: [],
  isAuthenticated: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Profile setters
      setBusinessVertical: (businessVertical: 'I' | 'B' | 'A') => set({ businessVertical }),
      setUsername: (username: string) => set({ username }),
      setEmail: (email: string) => set({ email }),
      setAvatar: (avatar: string) => set({ avatar }),
      setBuyerId: (buyerId: number) => set({ buyerId }),

      setAuthTokens: ({ token, refreshToken }) => {
        set({ token, refreshToken, isAuthenticated: true });
      },

      setUserProfile: (profile) => {
        set({
          username: profile.name,
          email: profile.email,
          businessVertical: profile.business_vertical as 'I' | 'B' | 'A',
          buyerId: profile.id,
          mobile: profile.mobile,
          address: profile.address,
          aadhaarNumber: profile.aadhaar_number,
          panNumber: profile.pan_number,
          companyName: profile.company_name,
          pincode: profile.pincode,
        });
      },
      
      // WatchList management
      addToWatchList: (vehicle: Vehicle) => {
        const { watchList } = get();
        if (!watchList.find(v => v.id === vehicle.id)) {
          set({ watchList: [...watchList, vehicle] });
        }
      },
      removeFromWatchList: (vehicleId: string) => {
        const { watchList } = get();
        set({ watchList: watchList.filter(v => v.id !== vehicleId) });
      },
      
      // Wins management
      addToWins: (vehicle: Vehicle) => {
        const { wins } = get();
        if (!wins.find(v => v.id === vehicle.id)) {
          set({ wins: [...wins, vehicle] });
        }
      },
      removeFromWins: (vehicleId: string) => {
        const { wins } = get();
        set({ wins: wins.filter(v => v.id !== vehicleId) });
      },
      
      // Bids management
      addToBids: (vehicle: Vehicle) => {
        const { bids } = get();
        if (!bids.find(v => v.id === vehicle.id)) {
          set({ bids: [...bids, vehicle] });
        }
      },
      removeFromBids: (vehicleId: string) => {
        const { bids } = get();
        set({ bids: bids.filter(v => v.id !== vehicleId) });
      },
      
      // Wishlist management
      addToWishlist: (vehicle: Vehicle) => {
        const { wishlist } = get();
        if (!wishlist.find(v => v.id === vehicle.id)) {
          set({ wishlist: [...wishlist, vehicle] });
        }
      },
      removeFromWishlist: (vehicleId: string) => {
        const { wishlist } = get();
        set({ wishlist: wishlist.filter(v => v.id !== vehicleId) });
      },
      
      // Authentication
      logout: async () => {
        const { token } = get();
        try {
          // Call logout API with token if available
          if (token) {
            await authService.logout(token);
          }
        } catch (error) {
          console.error('Logout API call failed:', error);
          // Continue with local logout even if API call fails
        }
        
        set({ 
          ...initialState,
          // Keep some data if needed, or clear everything
        });
      },
      
      register: (userData) => {
        set({
          businessVertical: userData.businessVertical as 'I' | 'B' | 'A',
          username: userData.username,
          email: userData.email,
          avatar: userData.avatar || '',
          isAuthenticated: true,
        });
      },

      refreshAuthToken: (newToken: string) => {
        set({ token: newToken });
      },
      
      // Utility functions
      clearAllData: () => set(initialState),
      
      isVehicleInList: (vehicleId: string, listType: 'watchList' | 'wins' | 'bids' | 'wishlist') => {
        const state = get();
        return state[listType].some(vehicle => vehicle.id === vehicleId);
      },
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain fields, exclude sensitive data like password
      partialize: (state) => ({
        businessVertical: state.businessVertical,
        username: state.username,
        email: state.email,
        avatar: state.avatar,
        token: state.token,
        refreshToken: state.refreshToken,
        buyerId: state.buyerId,
        mobile: state.mobile,
        address: state.address,
        aadhaarNumber: state.aadhaarNumber,
        panNumber: state.panNumber,
        companyName: state.companyName,
        pincode: state.pincode,
        watchList: state.watchList,
        wins: state.wins,
        bids: state.bids,
        wishlist: state.wishlist,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
