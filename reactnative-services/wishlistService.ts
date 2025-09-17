import api from '../config/axiosConfig';
import { Vehicle } from '../types/Vehicle';

export interface UpdateWishlistParams {
  vehicle_type?: string;
  vehicle_fuel?: string;
  ownership?: string;
  rc_available?: string;
  sellerId?: string;
  regstate?: string;
  make?: string;
  subcategoryIds?: string;
  stateIds?: string;
  categoryId?: string;
}

export interface UpdateWishlistResponse {
  success: boolean;
  updated: {
    vehicletype: number;
    make: number;
    seller: number;
    state: number;
    subcategory: number;
  };
}

export interface WishlistConfiguration {
  success: boolean;
  configuration: {
    state: number[];
    seller: number[];
    subcategory: number[];
    vehicleType: number[];
    make: number[];
  };
}

export interface State {
  id: number;
  state: string;
  region: string;
}

export interface VehicleMake {
  id: number;
  make_name: string;
}

export interface Seller {
  seller_id: number;
  name: string;
  email: string;
  phone: string;
}

export const wishlistService = {
  async getWishlist(): Promise<Vehicle[]> {
    const res = await api.get('/wishlist');
    console.log('chec kre res', res.data.data)
    return res.data.data as Vehicle[];
  },

  async getWishlistConfiguration(): Promise<WishlistConfiguration> {
    const res = await api.get('/wishlist/configuration');
    return res.data.data as WishlistConfiguration;
  },

  async getStates(): Promise<State[]> {
    const res = await api.get('/states');
    return res.data as State[];
  },

  async getVehicleMakes(): Promise<VehicleMake[]> {
    const res = await api.get('/vehicle-makes');
    return res.data as VehicleMake[];
  },

  async searchSellers(query: string): Promise<Seller[]> {
    const res = await api.get(`/sellers/search?query=${encodeURIComponent(query)}`);
    return res.data.data.sellers as Seller[];
  },

  async searchStates(query: string): Promise<State[]> {
    const res = await api.get(`/states/search?query=${encodeURIComponent(query)}`);
    return res.data.data.states as State[];
  },

  async updateWishlist(params: UpdateWishlistParams): Promise<UpdateWishlistResponse> {
    const queryParts: string[] = [];
    
    // Add parameters only if they exist and are not empty
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParts.push(`${key}=${value}`);
      }
    });

    const url = `wishlist/update-wishlist?${queryParts.join('&')}`;
    console.log('cehck url', url);
    const res = await api.post(url);
    return res.data.data as UpdateWishlistResponse;
  },
};

export default wishlistService;
