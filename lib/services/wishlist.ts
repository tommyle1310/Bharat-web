import { buyerApi } from "@/lib/http";
import type { VehicleApi } from "@/lib/types";

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

export const wishlistService = {
  async getWishlist(page?: number): Promise<{ data: VehicleApi[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const res = await buyerApi.get('/wishlist', {
      params: { page: page || 1 }
    });
    return res.data.data;
  },

  async getConfiguration(): Promise<WishlistConfiguration> {
    const res = await buyerApi.get('/wishlist/configuration');
    return res.data.data;
  },

  async updateWishlist(params: {
    vehicle_type?: string;
    make?: string;
    sellerId?: string;
    subcategoryIds?: string;
    stateIds?: string;
  }): Promise<void> {
    await buyerApi.post('/wishlist/update-wishlist', null, { params });
  },
};

export default wishlistService;


