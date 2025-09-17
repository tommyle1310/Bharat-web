"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/services/auth";
import { useUserStore } from "@/lib/stores/userStore";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { username, setUserProfile, setAuthTokens, clearAuth } = useUserStore();
  const hasUsername = !!username;

  useEffect(() => {
    if (hasUsername) {
      setShowPassword(true);
    }
  }, [hasUsername]);

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <div className="space-y-3">
        {!hasUsername && (
          <>
            <Input placeholder="Phone number" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={async () => {
                  if (!phone) return;
                  try {
                    const profile = await authService.getNameByPhone(phone);
                    setUserProfile(profile);
                    setShowPassword(true);
                    toast.success("Hi, " + (profile?.name || ""));
                  } catch (e: any) {
                    const msg = e?.response?.data?.message || e?.message || "Failed to get name";
                    toast.error(msg);
                  }
                }}
              >
                Password
              </Button>
              <Button className="flex-1" variant="outline">OTP</Button>
            </div>
          </>
        )}

        {showPassword && !!username && (
          <div className="space-y-2">
            <div className="text-sm">Hi, <span className="font-medium">{username}</span></div>
            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button
              className="w-full"
              disabled={loading}
              onClick={async () => {
                if (!phone || !password) {
                  toast.error("Phone and password required");
                  return;
                }
                setLoading(true);
                try {
                  const res = await authService.login({ phone, password });
                  setAuthTokens({ token: res.token, refreshToken: res.refreshToken });
                  if (typeof window !== "undefined") {
                    localStorage.setItem("web-token", res.token || "");
                    localStorage.setItem("web-refresh", res.refreshToken || "");
                  }
                  toast.success("Logged in");
                  router.replace("/");
                } catch (e: any) {
                  const msg = e?.response?.data?.message || e?.message || "Login failed";
                  toast.error(msg);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                clearAuth();
                setShowPassword(false);
                setPhone("");
                setPassword("");
              }}
            >
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


