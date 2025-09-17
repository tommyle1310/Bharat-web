import { buyerApi } from "@/lib/http";
import type { VehicleApi } from "@/lib/types";

export type ToggleWatchlistResponse = {
  message: string;
  is_favorite?: boolean;
  locked?: boolean;
};

export const watchlistService = {
  async getWatchlist(): Promise<VehicleApi[]> {
    const res = await buyerApi.get("/watchlist");
    return res.data.data as VehicleApi[];
  },

  async toggle(vehicleId: number): Promise<ToggleWatchlistResponse> {
    const res = await buyerApi.post(`/watchlist/toggle`, { vehicle_id: vehicleId });
    return res.data.data as ToggleWatchlistResponse;
  },
};

export default watchlistService;


