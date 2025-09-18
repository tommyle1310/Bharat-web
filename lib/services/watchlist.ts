import { buyerApi } from "@/lib/http";
import type { VehicleApi } from "@/lib/types";

export type ToggleWatchlistResponse = {
  message: string;
  is_favorite?: boolean;
  locked?: boolean;
};

export const watchlistService = {
  async getWatchlist(page?: number): Promise<{ data: VehicleApi[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const res = await buyerApi.get("/watchlist", {
      params: { page: page || 1 }
    });
    return res.data.data;
  },

  async toggle(vehicleId: number): Promise<ToggleWatchlistResponse> {
    const res = await buyerApi.post(`/watchlist/toggle`, { vehicle_id: vehicleId });
    return res.data.data as ToggleWatchlistResponse;
  },
};

export default watchlistService;


