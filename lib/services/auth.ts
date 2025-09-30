import { authApi, buyerApi } from "@/lib/http";
import type { UserProfile } from "@/lib/stores/userStore";

export type LoginResponse = { token: string; refreshToken: string; category?: number };
export type RefreshTokenResponse = { accessToken: string };
export type RegisterPayload = {
  name: string;
  phone: string;
  email: string;
  address: string;
  state_id: string | number;
  city_id: string | number;
  pin_number: string;
  company_name: string;
  aadhaar_number: string;
  pan_number: string;
  business_vertical: "I" | "B" | "A";
};

export const authService = {
  async login(payload: { phone: string; password: string }): Promise<LoginResponse> {
    const res = await authApi.post("buyer/login", payload);
    return res.data as LoginResponse;
  },
  async register(payload: RegisterPayload): Promise<{ id: number }> {
    const res = await authApi.post("/buyer/register", payload);
    return res.data as { id: number };
  },
  async getNameByPhone(phone: string): Promise<UserProfile> {
    const res = await buyerApi.get(`buyers/name/${phone}`);
    return res.data as unknown as UserProfile;
  },
  async logout(): Promise<void> {
    try {
      await authApi.post("/logout", {});
    } catch {}
  },
  async uploadImages(buyerId: number, formData: FormData): Promise<any> {
    const res = await buyerApi.post(`/buyers/${buyerId}/upload-images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default authService;


