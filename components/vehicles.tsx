"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { bidsService } from "@/lib/services/bids";
import { vehicleService } from "@/lib/services/vehicles";
import type { BuyerLimits } from "@/lib/types";
import { toast } from "sonner";
import type { VehicleApi, VehicleGroupApi } from "@/lib/types";
import { buyerApi } from "@/lib/http";
import { cn, getIstEndMs, ordinal } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { useUserStore } from "@/lib/stores/userStore";
import { watchlistService } from "@/lib/services/watchlist";
import { socketService, normalizeAuctionEnd } from "@/lib/socket";

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

export function VehicleList({ 
  vehicles, 
  onLoadMore, 
  hasMore, 
  loading 
}: { 
  vehicles: VehicleApi[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleScroll = useCallback(() => {
    if (loading || isLoadingMore || !hasMore || !onLoadMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 1000) {
      setIsLoadingMore(true);
      onLoadMore();
      setTimeout(() => setIsLoadingMore(false), 1000);
    }
  }, [loading, isLoadingMore, hasMore, onLoadMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((v) => (
          <VehicleCard key={v.vehicle_id} v={v} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center py-4">
          {loading || isLoadingMore ? (
            <div className="text-muted-foreground">Loading more vehicles...</div>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => {
                setIsLoadingMore(true);
                onLoadMore?.();
                setTimeout(() => setIsLoadingMore(false), 1000);
              }}
            >
              Load More
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function VehicleCard({ v }: { v: VehicleApi }) {
  const { isAuthenticated, buyerId } = useUserStore();
  const [placeBidOpen, setPlaceBidOpen] = useState(false);
  const [blockNextNav, setBlockNextNav] = useState(false);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [buyerLimits, setBuyerLimits] = useState<BuyerLimits | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(false);
  const [placingBid, setPlacingBid] = useState(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(v.is_favorite ?? false);
  const [vehicleData, setVehicleData] = useState<VehicleApi>(v);
  const [remaining, setRemaining] = useState<number>(() => {
    const end = v.end_time ? getIstEndMs(v.end_time) : Date.now();
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  });

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!buyerId) return;

    // Set buyer ID for socket connection
    socketService.setBuyerId(buyerId);

    // Listen for bidding status updates
    const disposers: (() => void)[] = [];

    // Handle winning status
    const winningDisposer = socketService.onIsWinning((payload) => {
      if (payload.vehicleId === Number(vehicleData.vehicle_id)) {
        setVehicleData((prev) => ({
          ...prev,
          bidding_status: "Winning",
          has_bidded: true,
        }));
      }
    });

    // Handle losing status
    const losingDisposer = socketService.onIsLosing((payload) => {
      if (payload.vehicleId === Number(vehicleData.vehicle_id)) {
        setVehicleData((prev) => ({
          ...prev,
          bidding_status: "Losing",
          has_bidded: true,
        }));
      }
    });

    // Handle winner updates
    const winnerDisposer = socketService.onVehicleWinnerUpdate((payload) => {
      if (payload.vehicleId === Number(vehicleData.vehicle_id)) {
        if (payload.winnerBuyerId === buyerId) {
          setVehicleData((prev) => ({
            ...prev,
            bidding_status: "Won",
            has_bidded: true,
          }));
        } else {
          setVehicleData((prev) => ({
            ...prev,
            bidding_status: "Lost",
            has_bidded: true,
          }));
        }
      }
    });

    // Handle endtime updates
    const endtimeDisposer = socketService.onVehicleEndtimeUpdate((payload) => {
      if (payload.vehicleId === Number(vehicleData.vehicle_id)) {
        const normalizedTime = normalizeAuctionEnd(payload.auctionEndDttm);
        const endMs = new Date(normalizedTime).getTime();
        const newRemaining = Math.max(
          0,
          Math.floor((endMs - Date.now()) / 1000)
        );
        setRemaining(newRemaining);
        setVehicleData((prev) => ({
          ...prev,
          end_time: payload.auctionEndDttm,
        }));
      }
    });

    disposers.push(
      winningDisposer,
      losingDisposer,
      winnerDisposer,
      endtimeDisposer
    );

    return () => {
      disposers.forEach((dispose) => dispose());
    };
  }, [buyerId, vehicleData.vehicle_id]);

  // Debug: Watch placeBidOpen state changes
  useEffect(() => {
    if (placeBidOpen && isAuthenticated && buyerId) {
      setLimitsLoading(true);
      bidsService
        .getBuyerLimits(buyerId)
        .then((limits) => {
          setBuyerLimits(limits);
        })
        .catch((error) => {
          setBuyerLimits(null);
        })
        .finally(() => setLimitsLoading(false));
    }
  }, [placeBidOpen, isAuthenticated, buyerId]);
  useEffect(() => {
    if (!vehicleData.end_time) return;
    const interval = setInterval(() => {
      const end = getIstEndMs(vehicleData.end_time as string);
      const secs = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(secs);
    }, 1000);
    return () => clearInterval(interval);
  }, [vehicleData.end_time]);
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
    const ord = ordinal(Number(vehicleData.owner_serial));
    return ord === "0th" ? "Current Owner" : `${ord} Owner`;
  }, [vehicleData.owner_serial]);

  const imageUrl = `http://13.203.1.159:1310/data-files/vehicles/${
    vehicleData.vehicle_id
  }/${vehicleData.imgIndex}.${vehicleData.img_extension || "jpg"}`;

  return (
    <div
      className="cursor-pointer"
      onClick={(e) => {
        if (placeBidOpen || blockNextNav) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (!isAuthenticated) {
          e.preventDefault();
          toast.error("You must be logged in to do this action");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("auth:login-required"));
          }
          return;
        }
        // Navigate only when clicking the card (not during dialogs)
        try {
          const { push } = require("next/navigation");
        } catch {}
        // Fallback: use window.location to avoid Link default behavior issues
        if (typeof window !== "undefined") {
          window.location.href = `/vehicles/${vehicleData.vehicle_id}`;
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          (e.target as HTMLElement).click();
        }
      }}
    >
      <Card className="overflow-hidden pt-0 flex flex-col h-full pb-2">
        <div className="relative aspect-video bg-muted">
          <Image
            src={imageUrl}
            alt={`${vehicleData.make} ${vehicleData.model}`}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/assets/logo.jpg';
            }}
          />
          <div className="absolute top-2 right-2 z-10">
            <button
              className="rounded-full bg-white/90 p-1 shadow hover:bg-white"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isAuthenticated) {
                  toast.error("You must be logged in to do this action");
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(
                      new CustomEvent("auth:login-required")
                    );
                  }
                  return;
                }
                console.log(
                  "cehc k any here",
                  vehicleData.has_bidded,
                  isFavorite
                );
                // Prevent removing from watchlist while bidding
                if (vehicleData.has_bidded === true && isFavorite === true) {
                  toast.error(
                    "You can't remove this from watchlist while bidding it."
                  );
                  return;
                }
                try {
                  const res = await watchlistService.toggle(
                    Number(vehicleData.vehicle_id)
                  );
                  setIsFavorite(Boolean(res.is_favorite));
                } catch (err: any) {
                  const msg =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Failed to toggle watchlist";
                  toast.error(msg);
                }
              }}
            >
              <Star
                className={cn(
                  "h-5 w-5 text-black",
                  isFavorite ? "fill-red-500 text-red-500" : ""
                )}
              />
            </button>
          </div>
        </div>
        <div className="p-3 space-y-2 flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <div className="font-semibold">
              {vehicleData.make} {vehicleData.model} {vehicleData.variant} (
              {vehicleData.manufacture_year})
            </div>
            {vehicleData.has_bidded !== false && (
              <Badge
                variant={
                  vehicleData.bidding_status === "Winning"
                    ? "default"
                    : "destructive"
                }
              >
                {vehicleData.bidding_status || vehicleData.status}
              </Badge>
            )}
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
            {owner} • {vehicleData.transmissionType} • Fuel:{" "}
            {vehicleData.fuel} • Odo: {vehicleData.odometer}
          </div>
          <div className="flex items-center justify-between text-sm py-2">
            <div className="font-medium">{vehicleData.manager_name || "N/A"}</div>
            <div className="flex items-center gap-1 text-primary">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              {vehicleData.manager_phone || "N/A"}
            </div>
          </div>
          <div className="mt-auto">
            <Dialog
              open={placeBidOpen}
              onOpenChange={(open) => {
                console.log("Dialog onOpenChange triggered:", open);
                setPlaceBidOpen(open);
                if (!open) {
                  // prevent immediate navigation caused by overlay clicks
                  setBlockNextNav(true);
                  setTimeout(() => setBlockNextNav(false), 0);
                }
                if (open) {
                  if (!isAuthenticated) {
                    toast.error("You must be logged in to do this action");
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("auth:login-required")
                      );
                    }
                    setPlaceBidOpen(false);
                    setBlockNextNav(true);
                    setTimeout(() => setBlockNextNav(false), 0);
                    return;
                  }
                  if (!buyerId) {
                    console.log("No buyerId available");
                    return;
                  }
                  console.log("Fetching buyer limits for buyerId:", buyerId);
                  setLimitsLoading(true);
                  bidsService
                    .getBuyerLimits(buyerId)
                    .then((limits) => {
                      console.log("Buyer limits loaded successfully:", limits);
                      setBuyerLimits(limits);
                    })
                    .catch((error) => {
                      console.error("Failed to load buyer limits:", error);
                      setBuyerLimits(null);
                    })
                    .finally(() => setLimitsLoading(false));
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(
                      "Place Bid button clicked, isAuthenticated:",
                      isAuthenticated,
                      "buyerId:",
                      buyerId
                    );
                    if (!isAuthenticated) {
                      toast.error("You must be logged in to do this action");
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(
                          new CustomEvent("auth:login-required")
                        );
                      }
                      return;
                    }
                    console.log("Setting placeBidOpen to true");
                    setPlaceBidOpen(true);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  Place Bid
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Place Bid</DialogTitle>
                  <DialogDescription>
                    Enter your bid amount for this vehicle.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Bid Amount
                    </div>
                    <Input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                    />
                  </div>
                  <div className="rounded-md border p-3 text-xs">
                    {limitsLoading ? (
                      <div className="text-muted-foreground">
                        Loading limits...
                      </div>
                    ) : buyerLimits ? (
                      <div className="space-y-1">
                        <div>
                          Security Deposit:{" "}
                          {buyerLimits.security_deposit.toLocaleString()}
                        </div>
                        <div>
                          Bid Limit: {buyerLimits.bid_limit.toLocaleString()}
                        </div>
                        <div>
                          Limit Used: {buyerLimits.limit_used.toLocaleString()}
                        </div>
                        <div>
                          Pending Limit:{" "}
                          {buyerLimits.pending_limit.toLocaleString()}
                        </div>
                        {buyerLimits.active_vehicle_bids?.length ? (
                          <div className="mt-2">
                            <div className="font-medium text-[11px]">
                              Active Vehicle Bids
                            </div>
                            {buyerLimits.active_vehicle_bids.map((item) => (
                              <div key={`avb-${item.vehicle_id}`}>
                                Vehicle #{item.vehicle_id}: Max Bidded{" "}
                                {item.max_bidded.toLocaleString()}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {buyerLimits.unpaid_vehicles?.length ? (
                          <div className="mt-2">
                            <div className="font-medium text-[11px]">
                              Unpaid Vehicles
                            </div>
                            {buyerLimits.unpaid_vehicles.map((item) => (
                              <div key={`uv-${item.vehicle_id}`}>
                                Vehicle #{item.vehicle_id}: Unpaid{" "}
                                {item.unpaid_amt.toLocaleString()}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        Limits unavailable
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    disabled={placingBid}
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isAuthenticated) {
                        toast.error("You must be logged in to do this action");
                        return;
                      }
                      if (!buyerId) {
                        toast.error("Buyer not identified");
                        return;
                      }
                      setPlacingBid(true);
                      try {
                        await bidsService.placeManualBid({
                          buyer_id: buyerId,
                          vehicle_id: Number(vehicleData.vehicle_id),
                          bid_amount: Number(bidAmount || 0),
                        });
                        setPlaceBidOpen(false);
                        setBlockNextNav(true);
                        setTimeout(() => setBlockNextNav(false), 0);
                        toast.success("Bid placed");
                      } catch (e: any) {
                        const msg =
                          e?.response?.data?.message ||
                          e?.message ||
                          "Failed to place bid";
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
    </div>
  );
}
export function GroupsWithFetcher({
  initialGroups,
  onVehicles,
  businessVertical,
  onLoadMore,
}: {
  initialGroups: VehicleGroupApi[];
  onVehicles: (vehicles: VehicleApi[], pagination?: { total: number; page: number; pageSize: number; totalPages: number }) => void;
  businessVertical: "I" | "B" | "A";
  onLoadMore?: (loadMoreFn: () => void, hasMore: boolean, loading: boolean) => void;
}) {
  const [groups, setGroups] = useState<VehicleGroupApi[]>(initialGroups);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allVehicles, setAllVehicles] = useState<VehicleApi[]>([]);
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
    if (/ready.*lift/.test(title.toLowerCase()))
      return "/assets/readytolift.png";
    if (/partial.*salvage/.test(title.toLowerCase()))
      return "/assets/partialsalvage.png";
    if (/fire.*loss/.test(title.toLowerCase())) return "/assets/fireloss.png";
    return undefined;
  };
  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  useEffect(() => {
    if (!groups.length) return;
    const g = groups[0];
    setLoading(true);
    setCurrentPage(1);
    setAllVehicles([]);
    vehicleService
      .getVehiclesByGroup({ type: g.type, title: g.title, businessVertical, page: 1 })
      .then((result) => {
        setAllVehicles(result.data);
        setHasMore(result.page < result.totalPages);
        onVehicles(result.data, result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groups, businessVertical, onVehicles]);

  const loadMoreVehicles = useCallback(() => {
    if (!groups.length || loading || !hasMore) return;
    const g = groups[0];
    const nextPage = currentPage + 1;
    setLoading(true);
    vehicleService
      .getVehiclesByGroup({ type: g.type, title: g.title, businessVertical, page: nextPage })
      .then((result) => {
        const newVehicles = [...allVehicles, ...result.data];
        setAllVehicles(newVehicles);
        setCurrentPage(nextPage);
        setHasMore(result.page < result.totalPages);
        onVehicles(newVehicles, result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groups, businessVertical, onVehicles, currentPage, hasMore, loading, allVehicles]);

  // Expose loadMoreVehicles function to parent
  useEffect(() => {
    if (onLoadMore) {
      onLoadMore(loadMoreVehicles, hasMore, loading);
    }
  }, [onLoadMore, loadMoreVehicles, hasMore, loading]);

  const handleClick = async (g: VehicleGroupApi) => {
    try {
      setLoading(true);
      setCurrentPage(1);
      setAllVehicles([]);
      const result = await vehicleService.getVehiclesByGroup({ 
        type: g.type, 
        title: g.title, 
        businessVertical, 
        page: 1 
      });
      setAllVehicles(result.data);
      setHasMore(result.page < result.totalPages);
      onVehicles(result.data, result);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {groups.map((g, i) => (
        <div
          key={i}
          onClick={() => handleClick(g)}
          className="cursor-pointer select-none"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <Card className="p-2 flex items-center gap-3 flex flex-row items-center justify-between hover:shadow-sm transition-shadow outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 active:ring-0">
            <div className="h-16 w-16 bg-muted rounded overflow-hidden relative flex-shrink-0">
              {(() => {
                const src = getGroupAsset(g.title) || g.image;
                return src ? (
                  <Image
                    src={src}
                    alt={g.title}
                    fill
                    className="object-cover rounded-lg"
                  />
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
