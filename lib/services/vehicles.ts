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
  }): Promise<VehicleApi[]> {
    const res = await buyerApi.get("/vehicles/groups/list", {
      params: {
        type: params.type,
        title: params.title,
        businessVertical: params.businessVertical,
      },
    });
    return res.data.data as VehicleApi[];
  },

  async getVehicleById(vehicleId: string | number): Promise<VehicleApi> {
    const res = await buyerApi.get(`/vehicles/${vehicleId}`);
    return res.data.data as VehicleApi;
  },
};


