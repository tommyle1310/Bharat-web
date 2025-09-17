import axios from 'axios';
import axiosConfig from '../config/axiosConfig';

export interface SearchVehicleResponse {
  vehicle_id: string;
  end_time: string;
  odometer: string;
  fuel: string;
  owner_serial: string | null;
  state_rto: number;
  state_code: string;
  has_bidded: boolean;
  make: string;
  model: string;
  variant: string;
  manufacture_year: string;
  img_extension?: string;
  main_image: string;
  vehicleId: number;
  imgIndex: number;
  status: string | null;
  bid_amount: string;
  manager_name: string;
  manager_phone: string;
  manager_email: string;
  manager_image: string;
  manager_id: string;
  is_favorite: boolean;
}

export interface SearchByGroupParams {
  keyword: string;
  type: string;
  title: string;
  limit?: number;
  offset?: number;
}

export const searchVehicleByGroup = async (params: SearchByGroupParams): Promise<SearchVehicleResponse[]> => {
  try {
    const { keyword, type, title, limit = 5, offset = 0 } = params;
    
    const response = await axiosConfig.get('/vehicles/search-by-group', {
      params: {
        keyword,
        type,
        title,
        limit,
        offset,
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Error searching vehicles by group:', error);
    throw error;
  }
};

export const searchVehicles = async (query: string, limit: number = 10, offset: number = 0): Promise<SearchVehicleResponse[]> => {
  try {
    const response = await axiosConfig.get('/vehicles/search', {
      params: {
        q: query,
        limit,
        offset,
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Error searching vehicles:', error);
    throw error;
  }
};

// Wishlist and Watchlist searches
export const searchWishlist = async (
  keyword: string,
  limit: number = 20,
  offset: number = 0,
): Promise<SearchVehicleResponse[]> => {
  try {
    const response = await axiosConfig.get('wishlist/search', {
      params: { keyword, limit, offset },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error searching wishlist:', error);
    throw error;
  }
};

export const searchWatchlist = async (
  keyword: string,
  limit: number = 20,
  offset: number = 0,
): Promise<SearchVehicleResponse[]> => {
  try {
    const response = await axiosConfig.get('/watchlist/search', {
      params: { keyword, limit, offset },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error searching watchlist:', error);
    throw error;
  }
};

export interface FilterByGroupParams {
  type: string;
  title: string;
  vehicle_type?: string;
  vehicle_fuel?: string;
  ownership?: string;
  rc_available?: string;
  limit?: number;
  offset?: number;
}

export const filterVehiclesByGroup = async (params: FilterByGroupParams): Promise<SearchVehicleResponse[]> => {
  try {
    const { type, title, vehicle_type, vehicle_fuel, ownership, rc_available, limit = 10, offset = 0 } = params;
    
    const response = await axiosConfig.get('/vehicles/filter-by-group', {
      params: {
        type,
        title,
        vehicle_type,
        vehicle_fuel,
        ownership,
        rc_available,
        limit,
        offset,
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Error filtering vehicles by group:', error);
    throw error;
  }
};

// Lookup Data Interfaces
export interface LookupItem {
  id: number;
  fuel_type?: string;
  ownership?: string;
  ownership_id?: number;
  vehicle_type?: string;
}

export interface LookupData {
  fuelTypes: LookupItem[];
  ownership: LookupItem[];
  vehicleTypes: LookupItem[];
  vehicleSubcategories: VehicleSubcategory[];
}

export interface VehicleSubcategory {
  sub_category_id: number;
  category_id: number;
  sub_category: string;
}

// Lookup Services
export const fetchLookupData = async (): Promise<LookupData> => {
  try {
    const [fuelResponse, ownershipResponse, vehicleTypesResponse, subcategoriesResponse] = await Promise.all([
      axiosConfig.get('/vehicles/lookup/fuel'),
      axiosConfig.get('/vehicles/lookup/ownership'),
      axiosConfig.get('/vehicles/lookup/vehicle-types'),
      axiosConfig.get('/vehicles/lookup/vehicle-subcategories'),
    ]);

    return {
      fuelTypes: fuelResponse.data.data || [],
      ownership: ownershipResponse.data.data || [],
      vehicleTypes: vehicleTypesResponse.data.data || [],
      vehicleSubcategories: subcategoriesResponse.data.data || [],
    };
  } catch (error) {
    console.error('Error fetching lookup data:', error);
    throw error;
  }
};

export const fetchFuelTypes = async (): Promise<LookupItem[]> => {
  try {
    const response = await axiosConfig.get('/vehicles/lookup/fuel');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching fuel types:', error);
    throw error;
  }
};

export const fetchOwnershipOptions = async (): Promise<LookupItem[]> => {
  try {
    const response = await axiosConfig.get('/vehicles/lookup/ownership');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching ownership options:', error);
    throw error;
  }
};

export const fetchVehicleTypes = async (): Promise<LookupItem[]> => {
  try {
    const response = await axiosConfig.get('/vehicles/lookup/vehicle-types');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    throw error;
  }
};
