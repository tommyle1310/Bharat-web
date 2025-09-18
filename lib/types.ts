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
  bidding_status: "Winning" | "Losing" | "Won" | "Lost" | null;
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


// Bidding related types (web)
export type BidMode = "A" | "M";

export type BidHistoryItem = {
  bid_id: number;
  vehicle_id: number;
  buyer_id: number;
  bid_amt: number;
  bid_mode: BidMode;
  top_bid_at_insert: number;
  created_dttm: string;
};

export type ManualBidPayload = {
  buyer_id: number;
  vehicle_id: number;
  bid_amount: number;
};

export type SetAutoBidPayload = {
  buyer_id: number;
  vehicle_id: number;
  start_amount: number;
  max_bid: number;
  step_amount: number;
};

export type AutoBidData = {
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
};

export type UpdateAutoBidPayload = {
  buyer_id: number;
  vehicle_id: number;
  start_amount: number;
  max_bid: number;
  step_amount: number;
};

export type BuyerLimitsVehicleBidItem = {
  vehicle_id: number;
  max_bidded: number;
};

export type BuyerLimitsUnpaidVehicleItem = {
  vehicle_id: number;
  unpaid_amt: number;
};

export type BuyerLimits = {
  security_deposit: number;
  bid_limit: number;
  active_vehicle_bids: BuyerLimitsVehicleBidItem[];
  unpaid_vehicles: BuyerLimitsUnpaidVehicleItem[];
  limit_used: number;
  pending_limit: number;
};


