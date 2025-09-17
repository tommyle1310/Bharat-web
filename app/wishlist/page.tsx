"use client";
import { useEffect, useState } from "react";
import { VehicleCard } from "@/components/vehicles";
import type { VehicleApi } from "@/lib/types";
import { wishlistService } from "@/lib/services/wishlist";

export default function WishlistPage() {
  const [vehicles, setVehicles] = useState<VehicleApi[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    wishlistService
      .getWishlist()
      .then((list) => {
        if (!cancelled) setVehicles(list);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load wishlist.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-xl font-semibold mb-4">Wishlist</h1>
      {error ? (
        <p className="text-muted-foreground">{error}</p>
      ) : !vehicles ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : vehicles.length === 0 ? (
        <p className="text-muted-foreground">No vehicles in wishlist.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <VehicleCard key={v.vehicle_id} v={v} />
          ))}
        </div>
      )}
    </div>
  );
}


