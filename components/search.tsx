"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VehicleList } from "@/components/vehicles";
import { vehicleService } from "@/lib/services/vehicles";
import type { VehicleApi } from "@/lib/types";

interface SearchComponentProps {
  onClose?: () => void;
  showResults?: boolean;
  className?: string;
}

export function SearchComponent({ onClose, showResults = true, className = "" }: SearchComponentProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VehicleApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (searchQuery: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (searchQuery.trim()) {
            setLoading(true);
            try {
              const searchResults = await vehicleService.searchVehicles(searchQuery);
              setResults(searchResults.data);
              setHasSearched(true);
            } catch (error) {
              console.error("Search failed:", error);
              setResults([]);
            } finally {
              setLoading(false);
            }
          } else {
            setResults([]);
            setHasSearched(false);
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
  };

  return (
    <div className={`relative ${className}`}>
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

      {showResults && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : hasSearched ? (
            results.length > 0 ? (
              <div className="p-4">
                <div className="text-sm text-muted-foreground mb-3">
                  Found {results.length} result{results.length !== 1 ? 's' : ''}
                </div>
                <VehicleList 
                  vehicles={results} 
                  onLoadMore={undefined}
                  hasMore={false}
                  loading={false}
                />
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
