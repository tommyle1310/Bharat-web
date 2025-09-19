"use client";
import { useState, useCallback } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VehicleList } from "@/components/vehicles";
import { vehicleService } from "@/lib/services/vehicles";
import type { VehicleApi } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VehicleApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const searchResults = await vehicleService.searchVehicles(query);
      setResults(searchResults.data);
      setHasSearched(true);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Search Vehicles</h1>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search vehicles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>

        {hasSearched && (
          <div>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div>
                <div className="text-sm text-muted-foreground mb-4">
                  Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                </div>
                <VehicleList 
                  vehicles={results} 
                  onLoadMore={undefined}
                  hasMore={false}
                  loading={false}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No vehicles found for "{query}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
