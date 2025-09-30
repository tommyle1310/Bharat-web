"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { buyerApi } from "@/lib/http";
import { authService, type RegisterPayload } from "@/lib/services/auth";
import { toast } from "sonner";
import Image from "next/image";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckIcon, UploadIcon, XIcon } from "lucide-react";

type SelectOption = { label: string; value: string };

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

  // images
  const [aadhaarFront, setAadhaarFront] = useState<File | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<File | null>(null);
  const [panImage, setPanImage] = useState<File | null>(null);

  // selects
  const [stateOptions, setStateOptions] = useState<SelectOption[]>([]);
  const [allCities, setAllCities] = useState<Array<{ city_id: number; state_id: number; city: string }>>([]);

  const cityOptions = useMemo(() => {
    const sid = Number(form.state_id || 0);
    return allCities
      .filter((c) => c.state_id === sid)
      .map((c) => ({ label: c.city, value: String(c.city_id) }));
  }, [allCities, form.state_id]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [statesRes, citiesRes] = await Promise.all([
          buyerApi.get('/states'),
          buyerApi.get('/cities'),
        ]);
        if (!isMounted) return;
        const states = (statesRes.data.data as Array<{ id: number; state: string; region: string }>).map<SelectOption>(s => ({
          label: s.state,
          value: String(s.id),
        }));
        setStateOptions(states);
        const cities = citiesRes.data as Array<{ city_id: number; state_id: number; city: string }>;
        setAllCities(cities);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to load states/cities';
        toast.error(msg);
      }
    })();
    return () => { isMounted = false };
  }, []);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  const resetCityIfStateChanged = (stateId: string) => {
    setForm((s) => ({ ...s, state_id: stateId, city_id: "" }));
  };

  const aadhaarSelectedBoth = Boolean(aadhaarFront && aadhaarBack);
  const panSelected = Boolean(panImage);

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
    if (!aadhaarFront || !aadhaarBack || !panImage) {
      const missing: string[] = [];
      if (!aadhaarFront || !aadhaarBack) missing.push('Aadhaar');
      if (!panImage) missing.push('PAN');
      toast.error(`Please provide ${missing.join(' and ')} uploads`);
      return;
    }
    setLoading(true);
    try {
      const payload: RegisterPayload = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        state_id: Number(form.state_id),
        city_id: Number(form.city_id),
        pin_number: form.pin_number,
        company_name: form.company_name,
        aadhaar_number: form.aadhaar_number,
        pan_number: form.pan_number,
        business_vertical: form.business_vertical as any,
      };

      const res = await authService.register(payload);

      if (res?.id) {
        const fd = new FormData();
        if (panImage) fd.append('pan_image', panImage, 'pan.jpg');
        if (aadhaarFront) fd.append('aadhaar_front_image', aadhaarFront, 'aadhaar_front.jpg');
        if (aadhaarBack) fd.append('aadhaar_back_image', aadhaarBack, 'aadhaar_back.jpg');
        await authService.uploadImages(res.id, fd);
      }

      toast.success("Thanks! We will contact you soon.");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Registration failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="w-full rounded-xl p-6 bg-gradient-to-r from-slate-50 to-slate-100 border">
          <div className="flex items-center flex-col gap-3">
            <Image src="/assets/logo.jpg" alt="Indus Salvage" width={100} height={100} className="rounded-sm object-contain" />
            <div>
              <h1 className="text-xl font-semibold">Create Account</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <Input placeholder="Name" value={form.name} onChange={update("name")} />
        <Input placeholder="Phone" inputMode="numeric" value={form.phone} onChange={update("phone")} />
        <Input placeholder="Email" type="email" value={form.email} onChange={update("email")} />
        <Input placeholder="Address" value={form.address} onChange={update("address")} />
        <div className="grid grid-cols-2 gap-3">
          <Select value={form.state_id} onValueChange={resetCityIfStateChanged}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select State" /></SelectTrigger>
            <SelectContent>
              {stateOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={form.city_id} onValueChange={(v) => setForm((s) => ({ ...s, city_id: v }))}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select City" /></SelectTrigger>
            <SelectContent>
              {cityOptions.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="PIN" value={form.pin_number} onChange={update("pin_number")} />
          <Input placeholder="Company" value={form.company_name} onChange={update("company_name")} />
        </div>
        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-10">
            <Input placeholder="Aadhaar" value={form.aadhaar_number} onChange={update("aadhaar_number")} />
          </div>
          <div className="col-span-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant={aadhaarSelectedBoth ? "default" : "outline"} className="w-full">
                  {aadhaarSelectedBoth ? <CheckIcon className="size-4" /> : <UploadIcon className="size-4" />}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Aadhaar</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <AadhaarBox label="Front" file={aadhaarFront} onFileChange={setAadhaarFront} />
                  <AadhaarBox label="Back" file={aadhaarBack} onFileChange={setAadhaarBack} />
                </div>
                <DialogFooter>
                  <Button type="button" onClick={() => toast.success('Aadhaar selected')}>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-10">
            <Input placeholder="PAN" value={form.pan_number} onChange={update("pan_number")} />
          </div>
          <div className="col-span-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant={panSelected ? "default" : "outline"} className="w-full">
                  {panSelected ? <CheckIcon className="size-4" /> : <UploadIcon className="size-4" />}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload PAN</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1">
                  <PanBox file={panImage} onFileChange={setPanImage} />
                </div>
                <DialogFooter>
                  <Button type="button" onClick={() => toast.success('PAN selected')}>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 items-center">
          {(() => {
            const insuranceChecked = form.business_vertical === 'I' || form.business_vertical === 'A';
            const bankChecked = form.business_vertical === 'B' || form.business_vertical === 'A';
            const onToggleInsurance = (next: boolean) => {
              const bv = next ? (bankChecked ? 'A' : 'I') : (bankChecked ? 'B' : '');
              setForm((s) => ({ ...s, business_vertical: bv as any }));
            };
            const onToggleBank = (next: boolean) => {
              const bv = next ? (insuranceChecked ? 'A' : 'B') : (insuranceChecked ? 'I' : '');
              setForm((s) => ({ ...s, business_vertical: bv as any }));
            };
            return (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox id="vertical-insurance" checked={insuranceChecked} onCheckedChange={(v) => onToggleInsurance(Boolean(v))} />
                  <label htmlFor="vertical-insurance" className="text-sm select-none cursor-pointer">Insurance</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="vertical-bank" checked={bankChecked} onCheckedChange={(v) => onToggleBank(Boolean(v))} />
                  <label htmlFor="vertical-bank" className="text-sm select-none cursor-pointer">Bank</label>
                </div>
              </>
            );
          })()}
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
          <label htmlFor="agree" className="text-xs text-muted-foreground select-none">
            I agree to the <a className="underline" href="/terms">Terms & Conditions</a>
          </label>
        </div>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <Button className="w-full" onClick={handleSubmit} disabled={loading || !agree}>{loading ? "Submitting..." : "Submit"}</Button>
        <div className="text-sm text-muted-foreground text-center">
          Already have an account? <a href="/login" className="text-primary underline">Login</a>
        </div>
      </div>
    </div>
  );
}

function AadhaarBox({ label, file, onFileChange }: { label: string; file: File | null; onFileChange: (f: File | null) => void }) {
  return (
    <div className="border rounded-md p-3 flex flex-col items-center gap-2">
      <div className="text-sm font-medium">{label}</div>
      {file ? (
        <div className="w-full flex flex-col items-center gap-2">
          <img src={URL.createObjectURL(file)} alt={`${label} preview`} className="w-full h-28 object-cover rounded" />
          <Button type="button" variant="outline" size="sm" onClick={() => onFileChange(null)}>
            <XIcon className="size-4 mr-1" /> Remove
          </Button>
        </div>
      ) : (
        <label className="w-full h-28 flex items-center justify-center border rounded cursor-pointer text-sm text-muted-foreground">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0] || null;
            if (f) onFileChange(f);
          }} />
          Click to upload
        </label>
      )}
    </div>
  );
}

function PanBox({ file, onFileChange }: { file: File | null; onFileChange: (f: File | null) => void }) {
  return (
    <div className="border rounded-md p-3 flex flex-col items-center gap-2">
      <div className="text-sm font-medium">PAN</div>
      {file ? (
        <div className="w-full flex flex-col items-center gap-2">
          <img src={URL.createObjectURL(file)} alt="PAN preview" className="w-full h-28 object-cover rounded" />
          <Button type="button" variant="outline" size="sm" onClick={() => onFileChange(null)}>
            <XIcon className="size-4 mr-1" /> Remove
          </Button>
        </div>
      ) : (
        <label className="w-full h-28 flex items-center justify-center border rounded cursor-pointer text-sm text-muted-foreground">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0] || null;
            if (f) onFileChange(f);
          }} />
          Click to upload
        </label>
      )}
    </div>
  );
}


