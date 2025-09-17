"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { authApi } from "@/lib/http";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    state_id: "",
    city_id: "",
    pin_number: "",
    company_name: "",
    aadhaar_number: "",
    pan_number: "",
    business_vertical: "" as "I" | "B" | "A" | "",
  });
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);
    if (!agree) {
      setError("Please agree to Terms & Conditions");
      return;
    }
    if (!form.name || !form.phone || !form.email || !form.address || !form.state_id || !form.city_id || !form.pin_number || !form.company_name || !form.aadhaar_number || !form.pan_number || !form.business_vertical) {
      setError("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form } as any;
      const res = await authApi.post("/buyer/register", payload);
      console.log("register response", res.data);
      // simple success UX
      alert("Thanks! We will contact you soon.");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-xl font-semibold mb-4">Create Account</h1>
      <div className="grid grid-cols-1 gap-3">
        <Input placeholder="Name" value={form.name} onChange={update("name")} />
        <Input placeholder="Phone" inputMode="numeric" value={form.phone} onChange={update("phone")} />
        <Input placeholder="Email" type="email" value={form.email} onChange={update("email")} />
        <Input placeholder="Address" value={form.address} onChange={update("address")} />
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="State ID" value={form.state_id} onChange={update("state_id")} />
          <Input placeholder="City ID" value={form.city_id} onChange={update("city_id")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="PIN" value={form.pin_number} onChange={update("pin_number")} />
          <Input placeholder="Company" value={form.company_name} onChange={update("company_name")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Aadhaar" value={form.aadhaar_number} onChange={update("aadhaar_number")} />
          <Input placeholder="PAN" value={form.pan_number} onChange={update("pan_number")} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Button type="button" variant={form.business_vertical === "I" ? "default" : "outline"} onClick={() => setForm((s) => ({ ...s, business_vertical: s.business_vertical === "I" ? "" : "I" }))}>Insurance</Button>
          <Button type="button" variant={form.business_vertical === "B" ? "default" : "outline"} onClick={() => setForm((s) => ({ ...s, business_vertical: s.business_vertical === "B" ? "" : "B" }))}>Bank</Button>
          <Button type="button" variant={form.business_vertical === "A" ? "default" : "outline"} onClick={() => setForm((s) => ({ ...s, business_vertical: s.business_vertical === "A" ? "" : "A" }))}>All</Button>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
          <label htmlFor="agree" className="text-sm select-none">
            I agree to the <a className="underline" href="/terms">Terms & Conditions</a>
          </label>
        </div>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <Button className="w-full" onClick={handleSubmit} disabled={loading || !agree}>{loading ? "Submitting..." : "Submit"}</Button>
      </div>
    </div>
  );
}


