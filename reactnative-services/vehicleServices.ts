import { resolveBaseUrl } from '../config';
import axiosInstance from '../config/axiosConfig';

export type VehicleGroupApi = {
  id: string;
  title: string;
  vehicleId: number;
  imgIndex: number;
  total_vehicles: string | number;
  image: string;
  type?: string;
};

export type VehicleApi = {
  vehicle_id: string;
  end_time: string;
  odometer: string | number;
  vehicleId: number;
  imgIndex: number;
  fuel: string;
  owner_serial: string | number;
  state_rto: string;
  transmissionType: string;
  rc_availability: boolean;
  repo_date: string;
  regs_no: string;
  make: string;
  model: string;
  variant: string;
  manufacture_year: string | number;
  main_image: string;
  status: 'Winning' | 'Losing';
  is_favorite?: boolean;
  manager_name: string;
  manager_phone: string;
  has_bidded: boolean;
  bidding_status: 'Winning' | 'Losing' | null;
  bid_amount?: string;
  manager_email?: string;
  manager_image?: string;
  manager_id?: string;
  yard_contact_person_name?: string | null;
  yard_address?: string | null;
  yard_address_zip?: string | null;
  yard_city?: string | null;
  yard_state?: string | null;
};

export const vehicleServices = {
  async getGroups(businessVertical?: 'I' | 'B' | 'A'): Promise<VehicleGroupApi[]> {
    try {
      const url = '/vehicles/groups'; // Base URL already includes /kmsg/buyer
      const response = await axiosInstance.get(url, {
        params: { businessVertical },
      });
      return response.data.data as VehicleGroupApi[];
    } catch (error) {
      // Error handling is done in axiosConfig interceptor
      throw error;
    }
  },

  async getVehiclesByGroup(params: {
    type: string;
    title: string;
    businessVertical: 'I' | 'B' | 'A';
  }): Promise<VehicleApi[]> {
    try {
      const url = '/vehicles/groups/list'; // Base URL already includes /kmsg/buyer
      console.log(
        '[vehicleServices.getVehiclesByGroup] Requesting:',
        `${url}?type=${params.type}&title=${params.title}`,
      );
      const response = await axiosInstance.get(url, {
        params: {
          type: params.type,
          title: params.title,
          businessVertical: params.businessVertical,
        },
      });
      console.log(
        '[vehicleServices.getVehiclesByGroup] Response:',
        response.data,
      );
      return response.data.data as VehicleApi[];
    } catch (error) {
      // Error handling is done in axiosConfig interceptor
      throw error;
    }
  },
  async getVehicleImages(vehicleId: number) {
    console.log('check vehi id', vehicleId);
    const res = await axiosInstance.get(
      `/vehicles/lookup/vehicle-images?id=${vehicleId}`,
    );
    return res.data.data;
  },

  async getVehicleById(vehicleId: number): Promise<VehicleApi> {
    try {
      const url = `/vehicles/${vehicleId}`;
      console.log('[vehicleServices.getVehicleById] Requesting:', url);
      const response = await axiosInstance.get(url);
      console.log('[vehicleServices.getVehicleById] Response:', response.data);
      return response.data.data as VehicleApi;
    } catch (error) {
      console.error('[vehicleServices.getVehicleById] Error:', error);
      throw error;
    }
  },
};
