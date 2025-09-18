import { buyerApi } from "@/lib/http";
import type {
  AutoBidData,
  BidHistoryItem,
  BuyerLimits,
  ManualBidPayload,
  SetAutoBidPayload,
  UpdateAutoBidPayload,
} from "@/lib/types";

export const bidsService = {
  async getHistoryByVehicle(buyerId: number, vehicleId: number, page?: number): Promise<{ data: BidHistoryItem[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const res = await buyerApi.get(`/buyer-bids/history-by-vehicle/${buyerId}/${vehicleId}`, {
      params: { page: page || 1 }
    });
    return res.data.data;
  },

  async getHistoryByBuyer(buyerId: number): Promise<BidHistoryItem[]> {
    const res = await buyerApi.get(`/buyer-bids/history/${buyerId}`);
    return res.data.data as BidHistoryItem[];
  },

  async placeManualBid(payload: ManualBidPayload): Promise<{ message?: string } & Record<string, any>> {
    const res = await buyerApi.post("/buyer-bids/manual", payload);
    return res.data.data as any;
  },

  async setAutoBid(payload: SetAutoBidPayload): Promise<{ message?: string } & Record<string, any>> {
    const res = await buyerApi.post("/auto-bid/set", payload);
    return res.data.data as any;
  },

  async getAutoBid(vehicleId: number): Promise<AutoBidData | { message: string }> {
    const res = await buyerApi.get(`/auto-bid/${vehicleId}`);
    return res.data.data as any;
  },

  async updateAutoBid(vehicleId: number, payload: UpdateAutoBidPayload): Promise<{ message?: string } & Record<string, any>> {
    const res = await buyerApi.put(`/auto-bid/${vehicleId}`, payload);
    return res.data.data as any;
  },

  async deleteAutoBid(vehicleId: number): Promise<{ message?: string } & Record<string, any>> {
    const res = await buyerApi.delete(`/auto-bid/${vehicleId}`);
    return res.data.data as any;
  },

  async getBuyerLimits(buyerId: number): Promise<BuyerLimits> {
    const res = await buyerApi.get(`/buyer-bids/limits/${buyerId}`);
    console.log('check buyerlimit',res.data.data);
    return res.data.data as BuyerLimits;
  },
};


