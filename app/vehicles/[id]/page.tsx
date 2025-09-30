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
import { Star, Settings, Hand, Trash2, Save, ZoomIn, Zap } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/lib/stores/userStore";
import { watchlistService } from "@/lib/services/watchlist";
import { socketService, normalizeAuctionEnd } from "@/lib/socket";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { Header } from "@/components/header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { isAuthenticated, buyerId } = useUserStore();
  const [vehicle, setVehicle] = useState<VehicleApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
  const [bidHistoryError, setBidHistoryError] = useState<string | null>(null);
  const [bidHistoryPage, setBidHistoryPage] = useState(1);
  const [bidHistoryHasMore, setBidHistoryHasMore] = useState(true);
  const [bidHistoryLoading, setBidHistoryLoading] = useState(false);

  console.log('check vevhicle', vehicle)

  const [autoBidOpen, setAutoBidOpen] = useState(false);
  const [autoBidData, setAutoBidData] = useState<AutoBidData | null>(null);
  const [buyerLimits, setBuyerLimits] = useState<BuyerLimits | null>(null);
  const [autoBidLoading, setAutoBidLoading] = useState(false);
  const [setAutoBidSubmitting, setSetAutoBidSubmitting] = useState(false);
  const [formStartAmt, setFormStartAmt] = useState<string>("");
  const [formMaxPrice, setFormMaxPrice] = useState<string>("");
  const [formStepAmt, setFormStepAmt] = useState<string>("");
  const [placeBidOpen, setPlaceBidOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [placingBid, setPlacingBid] = useState(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [placeBidLimitsLoading, setPlaceBidLimitsLoading] = useState(false);
  const [placeBidBuyerLimits, setPlaceBidBuyerLimits] = useState<BuyerLimits | null>(null);
  const [imageCarouselOpen, setImageCarouselOpen] = useState(false);
  const [vehicleImages, setVehicleImages] = useState<{ vehicle_image_id: number; vehicle_id: number; img_extension: string }[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [hasAutoBid, setHasAutoBid] = useState(false);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!buyerId || !vehicle) return;

    // Set buyer ID for socket connection
    socketService.setBuyerId(buyerId);

    // Listen for bidding status updates
    const disposers: (() => void)[] = [];

    // Handle winning status
    const winningDisposer = socketService.onIsWinning((payload) => {
      if (payload.vehicleId === Number(vehicle.vehicle_id)) {
        setVehicle(prev => prev ? {
          ...prev,
          bidding_status: "Winning",
          has_bidded: true
        } : null);
      }
    });

    // Handle losing status
    const losingDisposer = socketService.onIsLosing((payload) => {
      if (payload.vehicleId === Number(vehicle.vehicle_id)) {
        setVehicle(prev => prev ? {
          ...prev,
          bidding_status: "Losing",
          has_bidded: true
        } : null);
      }
    });

    // Handle winner updates
    const winnerDisposer = socketService.onVehicleWinnerUpdate((payload) => {
      if (payload.vehicleId === Number(vehicle.vehicle_id)) {
        if (payload.winnerBuyerId === buyerId) {
          setVehicle(prev => prev ? {
            ...prev,
            bidding_status: "Won",
            has_bidded: true
          } : null);
        } else {
          setVehicle(prev => prev ? {
            ...prev,
            bidding_status: "Lost",
            has_bidded: true
          } : null);
        }
        // Refresh bid history when winner is determined
        if (buyerId) {
          loadBidHistory(1, false);
        }
        // Update end time if provided in winner update
        if (payload.auctionEndDttm) {
          const normalizedTime = normalizeAuctionEnd(payload.auctionEndDttm);
          const endMs = new Date(normalizedTime).getTime();
          const newRemaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
          setRemaining(newRemaining);
          setVehicle(prev => prev ? {
            ...prev,
            end_time: payload.auctionEndDttm
          } : null as any);
        }
      }
    });

    // Handle endtime updates
    const endtimeDisposer = socketService.onVehicleEndtimeUpdate((payload) => {
      if (Number(payload.vehicleId) === Number(vehicle.vehicle_id)) {
        console.log('Processing endtime update for vehicle:', vehicle.vehicle_id, 'payload:', payload);
        const normalizedTime = normalizeAuctionEnd(payload.auctionEndDttm);
        console.log('Normalized time:', normalizedTime);
        const endMs = new Date(normalizedTime).getTime();
        console.log('End time in ms:', endMs, 'Current time:', Date.now());
        const newRemaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
        console.log('New remaining seconds:', newRemaining);
        setRemaining(newRemaining);
        setVehicle(prev => prev ? {
          ...prev,
          end_time: payload.auctionEndDttm
        } : null);
      }
    });

    disposers.push(winningDisposer, losingDisposer, winnerDisposer, endtimeDisposer);

    return () => {
      disposers.forEach(dispose => dispose());
    };
  }, [buyerId, vehicle?.vehicle_id]);

  useEffect(() => {
    let mounted = true;
    vehicleService
      .getVehicleById(id)
      .then((v) => {
        if (mounted) {
          setVehicle(v);
          setIsFavorite(Boolean((v as any).is_favorite));
        }
      })
      .catch(() => {
        if (mounted) setError("Unable to load vehicle details.");
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  // Check for existing auto bid when vehicle loads
  useEffect(() => {
    if (!vehicle?.vehicle_id || !buyerId) return;
    
    bidsService.getAutoBid(Number(vehicle.vehicle_id))
      .then((autoData) => {
        if (autoData && (autoData as any).vehicle_id) {
          setHasAutoBid(true);
        } else {
          setHasAutoBid(false);
        }
      })
      .catch(() => {
        setHasAutoBid(false);
      });
  }, [vehicle?.vehicle_id, buyerId]);
  if (typeof window !== "undefined") {
    try {
      console.log('cehck bueyr id', localStorage.getItem("buyer-id"));
    } catch {}
  }
  // Fetch bid history when buyerId available
  const loadBidHistory = React.useCallback(async (page: number, append = false) => {
    if (!vehicle?.vehicle_id || !buyerId || bidHistoryLoading) return;
    setBidHistoryLoading(true);
    setBidHistoryError(null);
    try {
      const result = await bidsService.getHistoryByVehicle(buyerId, Number(vehicle.vehicle_id), page);
      if (append) {
        setBidHistory(prev => [...prev, ...result.data]);
      } else {
        setBidHistory(result.data);
      }
      setBidHistoryPage(result.page);
      setBidHistoryHasMore(result.page < result.totalPages);
    } catch (err) {
      if (!append) {
        setBidHistoryError("Unable to load bid history.");
      }
    } finally {
      setBidHistoryLoading(false);
    }
  }, [vehicle?.vehicle_id, buyerId]);

  // SAFE: Load bid history ONCE when vehicle or buyerId changes
  useEffect(() => {
    if (vehicle?.vehicle_id && buyerId) {
      loadBidHistory(1, false);
    }
  }, [vehicle?.vehicle_id, buyerId]); // REMOVED loadBidHistory from dependencies

  const handleLoadMoreBidHistory = React.useCallback(async () => {
    if (!bidHistoryHasMore || bidHistoryLoading || !vehicle?.vehicle_id || !buyerId) return;
    
    setBidHistoryLoading(true);
    try {
      const result = await bidsService.getHistoryByVehicle(buyerId, Number(vehicle.vehicle_id), bidHistoryPage + 1);
      setBidHistory(prev => [...prev, ...result.data]);
      setBidHistoryPage(result.page);
      setBidHistoryHasMore(result.page < result.totalPages);
    } catch (err) {
      console.error('Failed to load more bid history:', err);
    } finally {
      setBidHistoryLoading(false);
    }
  }, [bidHistoryHasMore, bidHistoryLoading, bidHistoryPage, vehicle?.vehicle_id, buyerId]);

  const loadVehicleImages = React.useCallback(async () => {
    if (!vehicle?.vehicle_id) return;
    setImagesLoading(true);
    try {
      const images = await vehicleService.getVehicleImages(vehicle.vehicle_id);
      setVehicleImages(images);
    } catch (error) {
      console.error('Failed to load vehicle images:', error);
      setVehicleImages([]);
    } finally {
      setImagesLoading(false);
    }
  }, [vehicle?.vehicle_id]);

  const handleImageClick = () => {
    setImageCarouselOpen(true);
    if (vehicleImages.length === 0) {
      loadVehicleImages();
    }
  };

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
    if (!vehicle?.vehicle_id || !buyerId) return;
    setAutoBidLoading(true);
    
    // Make API calls independent - don't let one failure affect the other
    const autoBidPromise = bidsService.getAutoBid(Number(vehicle.vehicle_id))
      .then((autoData) => {
        console.log('getAutoBid success:', autoData);
        if (autoData && (autoData as any).vehicle_id) {
          const d = autoData as AutoBidData;
          setAutoBidData(d);
          setFormStartAmt(String(d.bid_start_amt ?? ""));
          setFormMaxPrice(String(d.max_price ?? d.max_bid_amt ?? ""));
          setFormStepAmt(String(d.step_amt ?? ""));
          setHasAutoBid(true);
        } else {
          setAutoBidData(null);
          setFormStartAmt("");
          setFormMaxPrice("");
          setFormStepAmt("");
          setHasAutoBid(false);
        }
      })
      .catch((error) => {
        console.log('getAutoBid failed (expected if no auto bid exists):', error);
        setAutoBidData(null);
        setFormStartAmt("");
        setFormMaxPrice("");
        setFormStepAmt("");
        setHasAutoBid(false);
      });

    const buyerLimitsPromise = bidsService.getBuyerLimits(buyerId)
      .then((limits) => {
        console.log('getBuyerLimits success:', limits);
        setBuyerLimits(limits);
      })
      .catch((error) => {
        console.error('getBuyerLimits failed:', error);
        setBuyerLimits(null);
      });

    // Wait for both to complete (regardless of success/failure)
    Promise.allSettled([autoBidPromise, buyerLimitsPromise])
      .finally(() => setAutoBidLoading(false));
  };

  const onSubmitSetAutoBid = async () => {
    if (!vehicle?.vehicle_id || !buyerId) return;
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
      setHasAutoBid(true);
      toast.success("Auto bid set");
    } catch (e) {
      const msg = (e as any)?.response?.data?.message || (e as any)?.message || "Failed to set auto bid";
      toast.error(msg);
    } finally {
      setSetAutoBidSubmitting(false);
    }
  };

  const onUpdateAutoBid = async () => {
    if (!vehicle?.vehicle_id || !buyerId) return;
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
      setHasAutoBid(true);
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
      setHasAutoBid(false);
      toast.success("Auto bid deleted");
    } catch (e) {
      const msg = (e as any)?.response?.data?.message || (e as any)?.message || "Failed to delete auto bid";
      toast.error(msg);
    } finally {
      setSetAutoBidSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="mb-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Vehicles</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Vehicle #{vehicle?.vehicle_id || ''}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      {!vehicle ? (
        <p className="text-muted-foreground">{error || "Loading..."}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div 
            className="relative aspect-video bg-muted rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleImageClick}
          >
            {imageUrl && (
              <Image 
                src={imageUrl} 
                alt={`${vehicle.make} ${vehicle.model}`} 
                fill 
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/assets/logo.jpg') {
                    target.src = '/assets/logo.jpg';
                  }
                }}
              />
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                <ZoomIn className="h-6 w-6 text-black" />
              </div>
            </div>
            <div className="absolute top-2 right-2 z-10">
              <button
                className="rounded-full bg-white/90 p-1 shadow hover:bg-white"
                onClick={async () => {
                  if (!isAuthenticated) {
                    toast.error("You must be logged in to do this action");
                    return;
                  }
                  // Prevent removing from watchlist while bidding
                  if (vehicle.has_bidded === true && isFavorite === true) {
                    toast.error("You can't remove this from watchlist while bidding it.");
                    return;
                  }
                  try {
                    const res = await watchlistService.toggle(Number(vehicle.vehicle_id));
                    setIsFavorite(Boolean(res.is_favorite));
                  } catch (err: any) {
                    const msg = err?.response?.data?.message || err?.message || "Failed to toggle watchlist";
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold">
                {vehicle.make} {vehicle.model} {vehicle.variant} ({vehicle.manufacture_year})
              </div>
              {vehicle.has_bidded !== false && (
                <Badge variant={vehicle.bidding_status === "Winning" ? "default" : "destructive"}>
                  {vehicle.bidding_status || vehicle.status}
                </Badge>
              )}
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

            <div className="text-[13px] font-semibold text-sky-600 flex flex-wrap items-center gap-2">
              <span>{owner || "-"}</span>
              <span>{(vehicle as any).region || "-"}</span>
              <span>{vehicle.fuel || "-"}</span>
              <span>{vehicle.odometer ? `${vehicle.odometer} km` : "-"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>RC Available: <span className="text-sky-600 font-medium">{((vehicle as any).rc_availability !== undefined ? String((vehicle as any).rc_availability) === 'true' ? 'Yes' : 'No' : '-') }</span></div>
              <div>Registration No: <span className="text-sky-600 font-medium">{vehicle.regs_no || '-'}</span></div>
              <div>Repo Date: <span className="text-sky-600 font-medium">{vehicle.repo_date ? new Date(vehicle.repo_date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\//g, '-') : '-'}</span></div>
              <div>Transmission: <span className="text-sky-600 font-medium">{vehicle.transmissionType || '-'}</span></div>
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
            {(vehicle.manager_name && vehicle.manager_phone) ? (
              <div className="flex items-center justify-between text-sm border rounded-md px-2 py-1">
                <div className="flex items-center gap-2 text-sky-600">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                  <div className="font-medium">{vehicle.manager_name}</div>
                </div>
                <div className="text-sky-600">{vehicle.manager_phone}</div>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Dialog open={placeBidOpen} onOpenChange={(open) => {
                setPlaceBidOpen(open);
                if (open && buyerId) {
                  setPlaceBidLimitsLoading(true);
                  bidsService.getBuyerLimits(buyerId)
                    .then((limits) => setPlaceBidBuyerLimits(limits))
                    .catch(() => setPlaceBidBuyerLimits(null))
                    .finally(() => setPlaceBidLimitsLoading(false));
                }
              }}>
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
                      {placeBidLimitsLoading ? (
                        <div className="text-muted-foreground">Loading limits...</div>
                      ) : placeBidBuyerLimits ? (
                        <div className="space-y-1">
                          <div>Security Deposit: {placeBidBuyerLimits.security_deposit.toLocaleString()}</div>
                          <div>Bid Limit: {placeBidBuyerLimits.bid_limit.toLocaleString()}</div>
                          <div>Limit Used: {placeBidBuyerLimits.limit_used.toLocaleString()}</div>
                          <div>Pending Limit: {placeBidBuyerLimits.pending_limit.toLocaleString()}</div>
                          {placeBidBuyerLimits.active_vehicle_bids?.length ? (
                            <div className="mt-2">
                              <div className="font-medium text-[11px]">Active Vehicle Bids</div>
                              {placeBidBuyerLimits.active_vehicle_bids.map((item) => (
                                <div key={`avb-${item.vehicle_id}`}>Vehicle #{item.vehicle_id}: Max Bidded {item.max_bidded.toLocaleString()}</div>
                              ))}
                            </div>
                          ) : null}
                          {placeBidBuyerLimits.unpaid_vehicles?.length ? (
                            <div className="mt-2">
                              <div className="font-medium text-[11px]">Unpaid Vehicles</div>
                              {placeBidBuyerLimits.unpaid_vehicles.map((item) => (
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
                        if (!buyerId) {
                          toast.error("Buyer not identified");
                          return;
                        }
                        setPlacingBid(true);
                        try {
                          await bidsService.placeManualBid({
                            buyer_id: buyerId,
                            vehicle_id: Number(vehicle.vehicle_id),
                            bid_amount: Number(bidAmount || 0),
                          });
                          setPlaceBidOpen(false);
                          toast.success("Bid placed");
                          // Force refresh vehicle details & bid history
                          try {
                            const [freshVehicle, freshHistory] = await Promise.all([
                              vehicleService.getVehicleById(id),
                              bidsService.getHistoryByVehicle(buyerId, Number(vehicle.vehicle_id)),
                            ]);
                            setVehicle(freshVehicle);
                            setBidHistory(freshHistory as any);
                          } catch {}
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
              <Dialog open={autoBidOpen} onOpenChange={onOpenAutoBid}>
                <DialogTrigger asChild>
                  <Button 
                    variant="secondary" 
                    className={`w-full relative overflow-hidden ${hasAutoBid ? 'border-2 border-primary' : ''}`}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Auto Bid
                    {hasAutoBid && (
                      <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30 animate-pulse"></div>
                    )}
                  </Button>
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
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Mode</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bidHistory.map((item) => (
                    <TableRow key={item.bid_id}>
                      <TableCell>
                        {item.bid_mode === "A" ? (
                          <Settings className="h-4 w-4" />
                        ) : (
                          <Hand className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.bid_amt}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{new Date(item.created_dttm as any).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).replace(/\//g, '-').replace(',', '')}</TableCell>
                    </TableRow>
                  ))}
                  {bidHistory.length === 0 && !bidHistoryLoading && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">No bids yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {bidHistoryHasMore && (
                <div className="flex justify-center py-2">
                  {bidHistoryLoading ? (
                    <div className="text-xs text-muted-foreground">Loading more bids...</div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleLoadMoreBidHistory}
                    >
                      Load More Bids
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Image Carousel Dialog */}
      <ImageCarousel
        open={imageCarouselOpen}
        onOpenChange={setImageCarouselOpen}
        vehicleId={vehicle?.vehicle_id || 0 as any}
        images={vehicleImages}
        loading={imagesLoading}
      />
      </div>
    </div>
  );
}


