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

  async getVehicleImages(vehicleId: string | number): Promise<{ vehicle_image_id: number; vehicle_id: number; img_extension: string }[]> {
    const res = await buyerApi.get(`/vehicles/lookup/vehicle-images?id=${vehicleId}`);
    return res.data.data;
  },

  async searchVehicles(keyword: string): Promise<{ data: VehicleApi[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const res = await buyerApi.get("/vehicles/search", { params: { keyword } });
    return res.data.data;
  },

  async filterVehicles(params: {
    vehicle_type?: string;
    fuel?: string;
    ownership?: string;
    rc_available?: string;
    state?: string;
  }): Promise<{ data: VehicleApi[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const res = await buyerApi.get("/vehicles/filter", { params });
    return res.data.data;
  },

  async getFuelTypes(): Promise<{ id: number; fuel_type: string }[]> {
    const res = await buyerApi.get("/vehicles/lookup/fuel");
    return res.data.data;
  },

  async getOwnershipTypes(): Promise<{ ownership_id: number; ownership: string }[]> {
    const res = await buyerApi.get("/vehicles/lookup/ownership");
    return res.data.data;
  },

  async getVehicleTypes(): Promise<{ id: number; vehicle_type: string }[]> {
    const res = await buyerApi.get("/vehicles/lookup/vehicle-types");
    return res.data.data;
  },

  async getStates(): Promise<{ id: number; state: string; region: string }[]> {
    const res = await buyerApi.get("/states");
    return res.data.data;
  },

  async getVehicleMakes(): Promise<{ id: number; make_name: string }[]> {
    const res = await buyerApi.get("/vehicle-makes");
    return res.data.data;
  },

  async getVehicleSubcategories(): Promise<{ sub_category_id: number; category_id: number; sub_category: string }[]> {
    const res = await buyerApi.get("/vehicles/lookup/vehicle-subcategories");
    return res.data.data;
  },

  async getSellers(): Promise<{ seller_id: number; name: string; contact_person: string | null; email: string; phone: string; address: string; city_name: string; state_name: string; pincode: string; gst_number: string; is_dummy: number; created_at: string }[]> {
    const res = await buyerApi.get("/sellers");
    return res.data.data.sellers;
  },
};


