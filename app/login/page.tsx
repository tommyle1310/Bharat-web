"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { authApi } from "@/lib/http";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!phone || !password) {
      setError("Phone and password are required");
      return;
    }
    if (!agree) {
      setError("Please agree to Terms & Conditions");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.post("buyer/login", { phone, password });
      const { token, refreshToken } = res.data || {};
      if (typeof window !== "undefined") {
        localStorage.setItem("web-token", token || "");
        localStorage.setItem("web-refresh", refreshToken || "");
      }
      router.replace("/");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <div className="space-y-3">
        <Input placeholder="Phone number" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex items-center gap-2">
          <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
          <label htmlFor="agree" className="text-sm select-none">
            I agree to the <a className="underline" href="/terms">Terms & Conditions</a>
          </label>
        </div>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <Button className="w-full" onClick={handleLogin} disabled={loading || !agree}>{loading ? "Logging in..." : "Login"}</Button>
        <div className="text-sm flex items-center justify-between">
          <a className="underline text-muted-foreground" href="/forgot">Forgot Password?</a>
          <a className="underline text-muted-foreground" href="/register">Create account</a>
        </div>
      </div>
    </div>
  );
}


