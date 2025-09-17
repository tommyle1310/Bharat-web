import api from '../config/axiosConfig';
import { Vehicle } from '../types/Vehicle';

export interface ToggleWatchlistResponse {
  message: string;
  is_favorite?: boolean;
  locked?: boolean;
}

export const watchlistService = {
  async getWatchlist(): Promise<Vehicle[]> {
    const res = await api.get('/watchlist');
    return res.data.data as Vehicle[];
  },

  async toggle(vehicleId: number): Promise<ToggleWatchlistResponse> {
    console.log('cehck vehicle id', vehicleId);
    const res = await api.post(`/watchlist/toggle`, { vehicle_id: vehicleId });
    return res.data.data as ToggleWatchlistResponse;
  },
};

export default watchlistService;


