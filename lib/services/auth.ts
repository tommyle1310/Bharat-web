import { authApi, buyerApi } from "@/lib/http";
import type { UserProfile } from "@/lib/stores/userStore";

export type LoginResponse = { token: string; refreshToken: string; category?: number };
export type RefreshTokenResponse = { accessToken: string };

export const authService = {
  async login(payload: { phone: string; password: string }): Promise<LoginResponse> {
    const res = await authApi.post("buyer/login", payload);
    return res.data as LoginResponse;
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
};

export default authService;


