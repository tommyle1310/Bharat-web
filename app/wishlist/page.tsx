"use client";
import { useEffect, useState, useCallback } from "react";
import { VehicleList } from "@/components/vehicles";
import type { VehicleApi } from "@/lib/types";
import { wishlistService } from "@/lib/services/wishlist";
import { Header } from "@/components/header";

export default function WishlistPage() {
  const [vehicles, setVehicles] = useState<VehicleApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadVehicles = useCallback(async (page: number, append = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await wishlistService.getWishlist(page);
      if (append) {
        setVehicles(prev => [...prev, ...result.data]);
      } else {
        setVehicles(result.data);
      }
      setCurrentPage(result.page);
      setHasMore(result.page < result.totalPages);
    } catch (err) {
      if (!append) {
        setError("Unable to load wishlist.");
      }
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // SAFE: Load vehicles ONCE when component mounts
  useEffect(() => {
    loadVehicles(1, false);
  }, []); // Empty dependency array - runs only once

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const result = await wishlistService.getWishlist(currentPage + 1);
      setVehicles(prev => [...prev, ...result.data]);
      setCurrentPage(result.page);
      setHasMore(result.page < result.totalPages);
    } catch (err) {
      console.error('Failed to load more wishlist items:', err);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, currentPage]);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-xl font-semibold mb-4">Wishlist</h1>
        {error ? (
          <p className="text-muted-foreground">{error}</p>
        ) : vehicles.length === 0 && !loading ? (
          <p className="text-muted-foreground">No vehicles in wishlist.</p>
        ) : (
          <VehicleList 
            vehicles={vehicles} 
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}


