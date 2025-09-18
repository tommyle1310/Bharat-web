import { buyerApi } from "@/lib/http";
import type { VehicleApi } from "@/lib/types";

export const wishlistService = {
  async getWishlist(page?: number): Promise<{ data: VehicleApi[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const res = await buyerApi.get('/wishlist', {
      params: { page: page || 1 }
    });
    return res.data.data;
  },
};

export default wishlistService;


