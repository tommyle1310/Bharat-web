"use client";
import { useEffect, useState, useCallback } from "react";
import { VehicleList } from "@/components/vehicles";
import type { VehicleApi } from "@/lib/types";
import { watchlistService } from "@/lib/services/watchlist";

export default function WatchlistPage() {
  const [vehicles, setVehicles] = useState<VehicleApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadVehicles = useCallback(async (page: number, append = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await watchlistService.getWatchlist(page);
      if (append) {
        setVehicles(prev => [...prev, ...result.data]);
      } else {
        setVehicles(result.data);
      }
      setCurrentPage(result.page);
      setHasMore(result.page < result.totalPages);
    } catch (err) {
      if (!append) {
        setError("Unable to load watchlist.");
      }
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    loadVehicles(1, false);
  }, [loadVehicles]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadVehicles(currentPage + 1, true);
    }
  }, [hasMore, loading, currentPage, loadVehicles]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-xl font-semibold mb-4">Watchlist</h1>
      {error ? (
        <p className="text-muted-foreground">{error}</p>
      ) : vehicles.length === 0 && !loading ? (
        <p className="text-muted-foreground">No vehicles in watchlist.</p>
      ) : (
        <VehicleList 
          vehicles={vehicles} 
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loading={loading}
        />
      )}
    </div>
  );
}


