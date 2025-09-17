"use client";
import React, { useEffect, useMemo, useState } from "react";
import { vehicleService } from "@/lib/services/vehicles";
import { bidsService } from "@/lib/services/bids";
import type { VehicleApi, BidHistoryItem, AutoBidData, BuyerLimits } from "@/lib/types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn, getIstEndMs, ordinal } from "@/lib/utils";
import { Star, Settings, Hand, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [vehicle, setVehicle] = useState<VehicleApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bidHistory, setBidHistory] = useState<BidHistoryItem[] | null>(null);
  const [bidHistoryError, setBidHistoryError] = useState<string | null>(null);

  const [autoBidOpen, setAutoBidOpen] = useState(false);
  const [autoBidData, setAutoBidData] = useState<AutoBidData | null>(null);
  const [buyerLimits, setBuyerLimits] = useState<BuyerLimits | null>(null);
  const [autoBidLoading, setAutoBidLoading] = useState(false);
  const [setAutoBidSubmitting, setSetAutoBidSubmitting] = useState(false);
  const [formStartAmt, setFormStartAmt] = useState<string>("");
  const [formMaxPrice, setFormMaxPrice] = useState<string>("");
  const [formStepAmt, setFormStepAmt] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    vehicleService
      .getVehicleById(id)
      .then((v) => {
        if (mounted) setVehicle(v);
      })
      .catch(() => {
        if (mounted) setError("Unable to load vehicle details.");
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  // Fetch bid history when buyerId available
  useEffect(() => {
    const buyerIdStr = typeof window !== "undefined" ? localStorage.getItem("buyer-id") : null;
    const buyerId = buyerIdStr ? Number(buyerIdStr) : NaN;
    if (!vehicle?.vehicle_id || !buyerId || Number.isNaN(buyerId)) return;
    let cancelled = false;
    setBidHistoryError(null);
    bidsService
      .getHistoryByVehicle(buyerId, Number(vehicle.vehicle_id))
      .then((hist) => {
        if (!cancelled) setBidHistory(hist);
      })
      .catch(() => {
        if (!cancelled) setBidHistoryError("Unable to load bid history.");
      });
    return () => {
      cancelled = true;
    };
  }, [vehicle?.vehicle_id]);

  const [remaining, setRemaining] = useState<number>(() => {
    const end = vehicle?.end_time ? getIstEndMs(vehicle.end_time) : Date.now();
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!vehicle?.end_time) return;
    const interval = setInterval(() => {
      const end = getIstEndMs(vehicle.end_time as string);
      const secs = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(secs);
    }, 1000);
    return () => clearInterval(interval);
  }, [vehicle?.end_time]);

  const ddhhmmss = useMemo(() => {
    let s = remaining;
    const days = Math.floor(s / 86400);
    s -= days * 86400;
    const hours = Math.floor(s / 3600);
    s -= hours * 3600;
    const minutes = Math.floor(s / 60);
    s -= minutes * 60;
    const seconds = s;
    const pad = (n: number) => String(n).padStart(2, "0");
    return [days, pad(hours), pad(minutes), pad(seconds)] as [number, string, string, string];
  }, [remaining]);

  const owner = useMemo(() => {
    if (!vehicle) return "";
    const ord = ordinal(Number(vehicle.owner_serial));
    return ord === "0th" ? "Current Owner" : `${ord} Owner`;
  }, [vehicle]);

  const imageUrl = vehicle
    ? `http://13.203.1.159:1310/data-files/vehicles/${vehicle.vehicle_id}/${vehicle.imgIndex}.${
        vehicle.img_extension || "jpg"
      }`
    : undefined;

  const onOpenAutoBid = (open: boolean) => {
    setAutoBidOpen(open);
    if (!open) return;
    const buyerIdStr = typeof window !== "undefined" ? localStorage.getItem("buyer-id") : null;
    const buyerId = buyerIdStr ? Number(buyerIdStr) : NaN;
    if (!vehicle?.vehicle_id || !buyerId || Number.isNaN(buyerId)) return;
    setAutoBidLoading(true);
    Promise.all([
      bidsService.getAutoBid(Number(vehicle.vehicle_id)),
      bidsService.getBuyerLimits(buyerId),
    ])
      .then(([autoData, limits]) => {
        if (autoData && (autoData as any).vehicle_id) {
          const d = autoData as AutoBidData;
          setAutoBidData(d);
          setFormStartAmt(String(d.bid_start_amt ?? ""));
          setFormMaxPrice(String(d.max_price ?? d.max_bid_amt ?? ""));
          setFormStepAmt(String(d.step_amt ?? ""));
        } else {
          setAutoBidData(null);
          setFormStartAmt("");
          setFormMaxPrice("");
          setFormStepAmt("");
        }
        setBuyerLimits(limits);
      })
      .finally(() => setAutoBidLoading(false));
  };

  const onSubmitSetAutoBid = async () => {
    const buyerIdStr = typeof window !== "undefined" ? localStorage.getItem("buyer-id") : null;
    const buyerId = buyerIdStr ? Number(buyerIdStr) : NaN;
    if (!vehicle?.vehicle_id || !buyerId || Number.isNaN(buyerId)) return;
    setSetAutoBidSubmitting(true);
    try {
      await bidsService.setAutoBid({
        buyer_id: buyerId,
        vehicle_id: Number(vehicle.vehicle_id),
        start_amount: Number(formStartAmt || 0),
        max_bid: Number(formMaxPrice || 0),
        step_amount: Number(formStepAmt || 0),
      });
      setAutoBidOpen(false);
      toast.success("Auto bid set");
    } catch (e) {
      const msg = (e as any)?.response?.data?.message || (e as any)?.message || "Failed to set auto bid";
      toast.error(msg);
    } finally {
      setSetAutoBidSubmitting(false);
    }
  };

  const onUpdateAutoBid = async () => {
    const buyerIdStr = typeof window !== "undefined" ? localStorage.getItem("buyer-id") : null;
    const buyerId = buyerIdStr ? Number(buyerIdStr) : NaN;
    if (!vehicle?.vehicle_id || !buyerId || Number.isNaN(buyerId)) return;
    setSetAutoBidSubmitting(true);
    try {
      await bidsService.updateAutoBid(Number(vehicle.vehicle_id), {
        buyer_id: buyerId,
        vehicle_id: Number(vehicle.vehicle_id),
        start_amount: Number(formStartAmt || 0),
        max_bid: Number(formMaxPrice || 0),
        step_amount: Number(formStepAmt || 0),
      } as any);
      setAutoBidOpen(false);
      toast.success("Auto bid updated");
    } catch (e) {
      const msg = (e as any)?.response?.data?.message || (e as any)?.message || "Failed to update auto bid";
      toast.error(msg);
    } finally {
      setSetAutoBidSubmitting(false);
    }
  };

  const onDeleteAutoBid = async () => {
    if (!vehicle?.vehicle_id) return;
    setSetAutoBidSubmitting(true);
    try {
      await bidsService.deleteAutoBid(Number(vehicle.vehicle_id));
      setAutoBidOpen(false);
      toast.success("Auto bid deleted");
    } catch (e) {
      const msg = (e as any)?.response?.data?.message || (e as any)?.message || "Failed to delete auto bid";
      toast.error(msg);
    } finally {
      setSetAutoBidSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {!vehicle ? (
        <p className="text-muted-foreground">{error || "Loading..."}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
            {imageUrl && (
              <Image src={imageUrl} alt={`${vehicle.make} ${vehicle.model}`} fill className="object-cover" />
            )}
            <div className="absolute top-2 right-2">
              <Star
                className={cn(
                  "h-5 w-5",
                  (vehicle.is_favorite ?? false) ? "fill-red-500 text-red-500" : "text-white/80"
                )}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold">
                {vehicle.make} {vehicle.model} {vehicle.variant} ({vehicle.manufacture_year})
              </div>
              <Badge variant={vehicle.bidding_status === "Winning" ? "default" : "destructive"}>
                {vehicle.bidding_status || vehicle.status}
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {ddhhmmss.map((val, idx) => (
                <div key={idx} className="rounded-md border px-2 py-1 text-center">
                  <div className="font-semibold">{val}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
              {["Days", "Hours", "Minutes", "Seconds"].map((l) => (
                <div key={l} className="text-center">
                  {l}
                </div>
              ))}
            </div>

            <div className="text-sm text-muted-foreground">
              {owner} • {vehicle.transmissionType} • Fuel: {vehicle.fuel} • Odo: {vehicle.odometer}
            </div>
            {/* Yard info */}
            <div className="text-sm space-y-0.5">
              {vehicle.yard_contact_person_name && (
                <div>Yard Contact: {vehicle.yard_contact_person_name}</div>
              )}
              {(vehicle.yard_address || vehicle.yard_city || vehicle.yard_state || vehicle.yard_address_zip) && (
                <div className="text-muted-foreground">
                  {[vehicle.yard_address, vehicle.yard_city, vehicle.yard_state, vehicle.yard_address_zip]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="font-medium">{vehicle.manager_name}</div>
              <div className="text-primary">{vehicle.manager_phone}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button className="w-full">Place Bid</Button>
              <Dialog open={autoBidOpen} onOpenChange={onOpenAutoBid}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="w-full">Auto Bid</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Auto Bid</DialogTitle>
                    <DialogDescription>Configure automatic bidding for this vehicle.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Start Amount</div>
                      <Input type="number" value={formStartAmt} onChange={(e) => setFormStartAmt(e.target.value)} disabled={autoBidLoading} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Max Price</div>
                      <Input type="number" value={formMaxPrice} onChange={(e) => setFormMaxPrice(e.target.value)} disabled={autoBidLoading} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Step Amount</div>
                      <Input type="number" value={formStepAmt} onChange={(e) => setFormStepAmt(e.target.value)} disabled={autoBidLoading} />
                    </div>
                    {buyerLimits && (
                      <div className="rounded-md border p-3 text-xs grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>Security Deposit: <span className="font-medium">{buyerLimits.security_deposit}</span></div>
                        <div>Bid Limit: <span className="font-medium">{buyerLimits.bid_limit}</span></div>
                        <div>Limit Used: <span className="font-medium">{buyerLimits.limit_used}</span></div>
                        <div>Pending Limit: <span className="font-medium">{buyerLimits.pending_limit}</span></div>
                        <div>Active Vehicles: <span className="font-medium">{buyerLimits.active_vehicle_bids?.length || 0}</span></div>
                        <div>Unpaid Vehicles: <span className="font-medium">{buyerLimits.unpaid_vehicles?.length || 0}</span></div>
                      </div>
                    )}
                  <div className="rounded-md border p-3 text-xs">
                    {autoBidLoading ? (
                      <div className="text-muted-foreground">Loading limits...</div>
                    ) : buyerLimits ? (
                      <div className="space-y-1">
                        <div>Security Deposit: {buyerLimits.security_deposit.toLocaleString()}</div>
                        <div>Bid Limit: {buyerLimits.bid_limit.toLocaleString()}</div>
                        <div>Limit Used: {buyerLimits.limit_used.toLocaleString()}</div>
                        <div>Pending Limit: {buyerLimits.pending_limit.toLocaleString()}</div>
                        {buyerLimits.active_vehicle_bids?.length ? (
                          <div className="mt-2">
                            <div className="font-medium text-[11px]">Active Vehicle Bids</div>
                            {buyerLimits.active_vehicle_bids.map((item) => (
                              <div key={`avb-${item.vehicle_id}`}>Vehicle #{item.vehicle_id}: Max Bidded {item.max_bidded.toLocaleString()}</div>
                            ))}
                          </div>
                        ) : null}
                        {buyerLimits.unpaid_vehicles?.length ? (
                          <div className="mt-2">
                            <div className="font-medium text-[11px]">Unpaid Vehicles</div>
                            {buyerLimits.unpaid_vehicles.map((item) => (
                              <div key={`uv-${item.vehicle_id}`}>Vehicle #{item.vehicle_id}: Unpaid {item.unpaid_amt.toLocaleString()}</div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">Limits unavailable</div>
                    )}
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  {autoBidData ? (
                    <>
                      <Button onClick={onUpdateAutoBid} disabled={autoBidLoading || setAutoBidSubmitting}>
                        <Save className="h-4 w-4 mr-1" /> {setAutoBidSubmitting ? "Saving..." : "Update Auto Bid"}
                      </Button>
                      <Button variant="destructive" onClick={onDeleteAutoBid} disabled={autoBidLoading || setAutoBidSubmitting}>
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </>
                  ) : (
                    <Button onClick={onSubmitSetAutoBid} disabled={autoBidLoading || setAutoBidSubmitting}>
                      {setAutoBidSubmitting ? "Setting..." : "Set Auto Bid"}
                    </Button>
                  )}
                </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      )}
      {/* Bid history table */}
      {vehicle && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Bid History</div>
          {bidHistoryError ? (
            <div className="text-xs text-destructive">{bidHistoryError}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">Mode</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(bidHistory || []).map((item) => (
                  <TableRow key={item.bid_id}>
                    <TableCell>
                      {item.bid_mode === "A" ? (
                        <Settings className="h-4 w-4" />
                      ) : (
                        <Hand className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.bid_amt}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.created_dttm}</TableCell>
                  </TableRow>
                ))}
                {(!bidHistory || bidHistory.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">No bids yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}


