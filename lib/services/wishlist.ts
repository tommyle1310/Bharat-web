import { buyerApi } from "@/lib/http";
import type { VehicleApi } from "@/lib/types";

export const wishlistService = {
  async getWishlist(): Promise<VehicleApi[]> {
    const res = await buyerApi.get('/wishlist');
    return res.data.data as VehicleApi[];
  },
};

export default wishlistService;


