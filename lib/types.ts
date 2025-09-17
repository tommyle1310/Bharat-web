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
  status: "Winning" | "Losing";
  img_extension?: string;
  is_favorite?: boolean;
  manager_name: string;
  manager_phone: string;
  has_bidded: boolean;
  bidding_status: "Winning" | "Losing" | null;
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


