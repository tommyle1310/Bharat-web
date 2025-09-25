"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { vehicleService } from "@/lib/services/vehicles";
import type { VehicleApi } from "@/lib/types";
import { useRouter } from "next/navigation";

interface SearchComponentProps {
  onClose?: () => void;
  showResults?: boolean;
  className?: string;
}

export function SearchComponent({ onClose, showResults = true, className = "" }: SearchComponentProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VehicleApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (searchQuery: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (searchQuery.trim()) {
            setLoading(true);
            setCurrentPage(1);
            try {
              const searchResults = await vehicleService.searchVehicles(searchQuery, 1);
              setResults(searchResults.data);
              setHasMore(searchResults.page < searchResults.totalPages);
              setHasSearched(true);
              setShowDropdown(true);
            } catch (error) {
              console.error("Search failed:", error);
              setResults([]);
              setHasMore(false);
            } finally {
              setLoading(false);
            }
          } else {
            setResults([]);
            setHasSearched(false);
            setHasMore(false);
            setCurrentPage(1);
            setShowDropdown(false);
          }
        }, 300);
      };
    })(),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setHasMore(false);
    setCurrentPage(1);
    setShowDropdown(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !query.trim()) return;
    
    setLoadingMore(true);
    try {
      const searchResults = await vehicleService.searchVehicles(query, currentPage + 1);
      setResults(prev => [...prev, ...searchResults.data]);
      setCurrentPage(searchResults.page);
      setHasMore(searchResults.page < searchResults.totalPages);
    } catch (error) {
      console.error("Load more failed:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleVehicleClick = (vehicleId: string | number) => {
    router.push(`/vehicles/${vehicleId}`);
    setShowDropdown(false);
    if (onClose) onClose();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search vehicles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showResults && query && showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : hasSearched ? (
            results.length > 0 ? (
              <div className="p-4 pr-0">
                <div className="text-sm text-muted-foreground mb-3">
                  Found {results.length} result{results.length !== 1 ? 's' : ''}
                </div>
                <div className="space-y-2">
                  {results.map((vehicle) => (
                    <div 
                      key={vehicle.vehicle_id} 
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleVehicleClick(vehicle.vehicle_id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {vehicle.make} {vehicle.model} {vehicle.variant}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {vehicle.manufacture_year} • {vehicle.odometer} km • {vehicle.fuel}
                          </div>
                        </div>
                        {vehicle.bidding_status && 
                        <div className="bg-red-400 rounded-md px-2 py-1 text-xs text-white ml-2">
                          {vehicle.bidding_status}
                        </div>
                        }
                      </div>
                    </div>
                  ))}
                  
                  {hasMore && (
                    <div className="flex justify-center py-2">
                      {loadingMore ? (
                        <div className="text-xs text-muted-foreground">Loading more...</div>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleLoadMore}
                          className="text-xs"
                        >
                          Load More
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">No vehicles found</div>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}
