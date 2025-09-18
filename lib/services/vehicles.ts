import { buyerApi } from "@/lib/http";
import type { VehicleApi, VehicleGroupApi } from "@/lib/types";

export const vehicleService = {
  async getGroups(businessVertical?: "I" | "B" | "A"): Promise<VehicleGroupApi[]> {
    const res = await buyerApi.get("/vehicles/groups", { params: { businessVertical } });
    return res.data.data as VehicleGroupApi[];
  },

  async getVehiclesByGroup(params: {
    type: string;
    title: string;
    businessVertical: "I" | "B" | "A";
    page?: number;
  }): Promise<{ data: VehicleApi[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const res = await buyerApi.get("/vehicles/groups/list", {
      params: {
        type: params.type,
        title: params.title,
        businessVertical: params.businessVertical,
        page: params.page || 1,
      },
    });
    return res.data.data;
  },

  async getVehicleById(vehicleId: string | number): Promise<VehicleApi> {
    const res = await buyerApi.get(`/vehicles/${vehicleId}`);
    return res.data.data as VehicleApi;
  },
};


