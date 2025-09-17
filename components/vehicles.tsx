"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { bidsService } from "@/lib/services/bids";
import type { BuyerLimits } from "@/lib/types";
import { toast } from "sonner";
import type { VehicleApi, VehicleGroupApi } from "@/lib/types";
import { buyerApi } from "@/lib/http";
import { cn, getIstEndMs, ordinal } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

export function VehicleGroupGrid({ groups }: { groups: VehicleGroupApi[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setOffset((o) => (o + 1) % 1000000), 20);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative overflow-hidden">
      <div
        ref={containerRef}
        className="flex gap-3 will-change-transform"
        style={{ transform: `translateX(-${offset}px)` }}
      >
        {[...groups, ...groups, ...groups].map((group, idx) => (
          <Link
            key={`${group.id}-${idx}`}
            href={`/?group=${group.id}`}
            className="min-w-[220px]"
          >
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-muted" />
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{group.title}</div>
                  <Badge variant="secondary">{group.total_vehicles}</Badge>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function VehicleList({ vehicles }: { vehicles: VehicleApi[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vehicles.map((v) => (
        <VehicleCard key={v.vehicle_id} v={v} />
      ))}
    </div>
  );
}

export function VehicleCard({ v }: { v: VehicleApi }) {
  const [placeBidOpen, setPlaceBidOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [buyerLimits, setBuyerLimits] = useState<BuyerLimits | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(false);
  const [placingBid, setPlacingBid] = useState(false);
  const [remaining, setRemaining] = useState<number>(() => {
    const end = v.end_time ? getIstEndMs(v.end_time) : Date.now();
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  });
  useEffect(() => {
    if (!v.end_time) return;
    const interval = setInterval(() => {
      const end = getIstEndMs(v.end_time as string);
      const secs = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(secs);
    }, 1000);
    return () => clearInterval(interval);
  }, [v.end_time]);
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
    return [days, pad(hours), pad(minutes), pad(seconds)] as [
      number,
      string,
      string,
      string
    ];
  }, [remaining]);

  const owner = useMemo(() => {
    const ord = ordinal(Number(v.owner_serial));
    return ord === "0th" ? "Current Owner" : `${ord} Owner`;
  }, [v.owner_serial]);

  const imageUrl = `http://13.203.1.159:1310/data-files/vehicles/${v.vehicle_id}/${v.imgIndex}.${v.img_extension || "jpg"}`;
  const isFavorite = v.is_favorite ?? false;

  return (
    <Link href={`/vehicles/${v.vehicle_id}`}>
      <Card className="overflow-hidden pt-0">
        <div className="relative aspect-video bg-muted">
          <Image
            src={imageUrl}
            alt={`${v.make} ${v.model}`}
            fill
            className="object-cover"
          />
          <div className="absolute top-2 right-2">
            <Star
              className={cn(
                "h-5 w-5",
                isFavorite ? "fill-red-500 text-red-500" : "text-white/80"
              )}
            />
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">
              {v.make} {v.model} {v.variant} ({v.manufacture_year})
            </div>
            <Badge
              variant={v.bidding_status === "Winning" ? "default" : "destructive"}
            >
              {v.bidding_status || v.status}
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {ddhhmmss.map((val, idx) => (
              <div
                key={idx}
                className="rounded-md border px-2 py-1 text-center"
              >
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
            {owner} • {v.transmissionType} • Fuel: {v.fuel} • Odo: {v.odometer}
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="font-medium">{v.manager_name}</div>
            <div className="text-primary">{v.manager_phone}</div>
          </div>
          <div className="mt-1">
            <Dialog
              open={placeBidOpen}
              onOpenChange={(open) => {
                setPlaceBidOpen(open);
                if (open) {
                  const buyerIdStr = typeof window !== "undefined" ? localStorage.getItem("buyer-id") : null;
                  const buyerId = buyerIdStr ? Number(buyerIdStr) : NaN;
                  if (!buyerId || Number.isNaN(buyerId)) return;
                  setLimitsLoading(true);
                  bidsService
                    .getBuyerLimits(buyerId)
                    .then((limits) => setBuyerLimits(limits))
                    .catch(() => setBuyerLimits(null))
                    .finally(() => setLimitsLoading(false));
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="w-full">Place Bid</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Place Bid</DialogTitle>
                  <DialogDescription>Enter your bid amount for this vehicle.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Bid Amount</div>
                    <Input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
                  </div>
                  <div className="rounded-md border p-3 text-xs">
                    {limitsLoading ? (
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
                <DialogFooter>
                  <Button
                    disabled={placingBid}
                    onClick={async () => {
                      const buyerIdStr = typeof window !== "undefined" ? localStorage.getItem("buyer-id") : null;
                      const buyerId = buyerIdStr ? Number(buyerIdStr) : NaN;
                      if (!buyerId || Number.isNaN(buyerId)) {
                        toast.error("Buyer not identified");
                        return;
                      }
                      setPlacingBid(true);
                      try {
                        await bidsService.placeManualBid({
                          buyer_id: buyerId,
                          vehicle_id: Number(v.vehicle_id),
                          bid_amount: Number(bidAmount || 0),
                        });
                        setPlaceBidOpen(false);
                        toast.success("Bid placed");
                      } catch (e: any) {
                        const msg = e?.response?.data?.message || e?.message || "Failed to place bid";
                        toast.error(msg);
                      } finally {
                        setPlacingBid(false);
                      }
                    }}
                  >
                    {placingBid ? "Placing..." : "Place Bid"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>
    </Link>
  );
}
export function GroupsWithFetcher({
  initialGroups,
  onVehicles,
  businessVertical,
}: {
  initialGroups: VehicleGroupApi[];
  onVehicles: (vehicles: VehicleApi[]) => void;
  businessVertical: "I" | "B" | "A";
}) {
  const [groups, setGroups] = useState<VehicleGroupApi[]>(initialGroups);
  const [loading, setLoading] = useState(false);
  const getGroupAsset = (title?: string) => {
    if (!title) return undefined;
    const t = title.toLowerCase().replace(/\s+/g, "");
    const map: Record<string, string> = {
      all: "/assets/pan.png",
      pan: "/assets/pan.png",
      theft: "/assets/theft.png",
      flood: "/assets/flood.png",
      luxury: "/assets/luxury.png",
      readytolift: "/assets/readytolift.png",
      partialsalvage: "/assets/partialsalvage.png",
      fireloss: "/assets/fireloss.png",
      transit: "/assets/transit.png",
      commercial: "/assets/commercial.png",
      north: "/assets/north.png",
      south: "/assets/south.png",
      east: "/assets/east.png",
      west: "/assets/west.png",
    };
    if (map[t]) return map[t];
    // Fuzzy fallback for spaced titles like "Ready to lift"
    if (/ready.*lift/.test(title.toLowerCase())) return "/assets/readytolift.png";
    if (/partial.*salvage/.test(title.toLowerCase())) return "/assets/partialsalvage.png";
    if (/fire.*loss/.test(title.toLowerCase())) return "/assets/fireloss.png";
    return undefined;
  };
  useEffect(() => {
    if (!groups.length) return;
    const g = groups[0];
    setLoading(true);
    buyerApi
      .get("/vehicles/groups/list", {
        params: { type: g.type, title: g.title, businessVertical },
      })
      .then((res) => onVehicles(res.data.data as VehicleApi[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groups, businessVertical, onVehicles]);
  const handleClick = async (g: VehicleGroupApi) => {
    try {
      setLoading(true);
      const res = await buyerApi.get("/vehicles/groups/list", {
        params: { type: g.type, title: g.title, businessVertical },
      });
      onVehicles(res.data.data as VehicleApi[]);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {groups.map((g, i) => (
        <div
          key={i}
          onClick={() => handleClick(g)}
          className="cursor-pointer select-none"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <Card className="p-2 flex items-center gap-3 flex flex-row items-center justify-between hover:shadow-sm transition-shadow outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 active:ring-0">
            <div className="h-12 w-16 bg-muted rounded overflow-hidden relative flex-shrink-0">
              {(() => {
                const src = getGroupAsset(g.title) || g.image;
                return src ? (
                  <Image src={src} alt={g.title} fill className="object-cover rounded-lg" />
                ) : (
                  <div className="h-full w-full bg-muted" />
                );
              })()}
            </div>
            <div className="flex-1 flex items-center justify-between gap-3">
              <div className="text-sm font-medium line-clamp-1">{g.title}</div>
              <Badge variant="secondary">{g.total_vehicles}</Badge>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
