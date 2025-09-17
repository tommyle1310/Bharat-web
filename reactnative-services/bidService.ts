import axiosConfig from '../config/axiosConfig';

export type BidMode = 'A' | 'M';

export interface BidHistoryItem {
  bid_id: number;
  vehicle_id: number;
  buyer_id: number;
  bid_amt: number;
  bid_mode: BidMode;
  top_bid_at_insert: number;
  created_dttm: string;
}

export interface ManualBidPayload {
  buyer_id: number;
  vehicle_id: number;
  bid_amount: number;
}

export interface SetAutoBidPayload {
  buyer_id: number;
  vehicle_id: number;
  start_amount: number;
  max_bid: number;
  step_amount: number;
}

export interface AutoBidData {
  vehicle_id: number;
  buyer_id: number;
  bid_start_amt: number;
  step_amt: number;
  max_bid_amt: number;
  max_steps: number;
  pending_steps: number;
  last_bid_amt: number;
  base_price: number;
  max_price: number;
  end_time: string;
  make: string;
  model: string;
  variant: string;
}

export interface UpdateAutoBidPayload {
  buyer_id: number;
  vehicle_id: number;
  start_amount: number;
  max_bid: number;
  step_amount: number;
}

export interface BuyerLimitsVehicleBidItem {
  vehicle_id: number;
  max_bidded: number;
}

export interface BuyerLimitsUnpaidVehicleItem {
  vehicle_id: number;
  unpaid_amt: number;
}

export interface BuyerLimits {
  security_deposit: number;
  bid_limit: number;
  active_vehicle_bids: BuyerLimitsVehicleBidItem[];
  unpaid_vehicles: BuyerLimitsUnpaidVehicleItem[];
  limit_used: number;
  pending_limit: number;
}

const bidService = {
  async getHistoryByVehicle(buyerId: number, vehicleId: number): Promise<BidHistoryItem[]> {
    const res = await axiosConfig.get(`/buyer-bids/history-by-vehicle/${buyerId}/${vehicleId}`);
    console.log('cehck res getHistoryByVehicle', res.data)
    return res.data.data;
  },

  async getHistoryByBuyer(buyerId: number): Promise<BidHistoryItem[]> {
    const res = await axiosConfig.get(`/buyer-bids/history/${buyerId}`);
    return res.data.data;
  },

  async placeManualBid(payload: ManualBidPayload): Promise<{ message?: string } & Record<string, any>> {
    const res = await axiosConfig.post('/buyer-bids/manual', payload);
    return res.data.data;
  },

  async setAutoBid(payload: SetAutoBidPayload): Promise<{ message?: string } & Record<string, any>> {
    const res = await axiosConfig.post('/auto-bid/set', payload);
    return res.data.data;
  },

  async getAutoBid(vehicleId: number): Promise<AutoBidData | { message: string }> {
    const res = await axiosConfig.get(`/auto-bid/${vehicleId}`);
    return res.data.data;
  },

  async updateAutoBid(vehicleId: number, payload: UpdateAutoBidPayload): Promise<{ message?: string } & Record<string, any>> {
    const res = await axiosConfig.put(`/auto-bid/${vehicleId}`, payload);
    return res.data.data;
  },

  async deleteAutoBid(vehicleId: number): Promise<{ message?: string } & Record<string, any>> {
    const res = await axiosConfig.delete(`/auto-bid/${vehicleId}`);
    return res.data.data;
  },

  async getBuyerLimits(buyerId: number): Promise<BuyerLimits> {
    const res = await axiosConfig.get(`/buyer-bids/limits/${buyerId}`);
    return res.data.data;
  },
};

export default bidService;


