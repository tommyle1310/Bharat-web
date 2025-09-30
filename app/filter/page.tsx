"use client";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { VehicleList } from "@/components/vehicles";
import { vehicleService } from "@/lib/services/vehicles";
import type { VehicleApi } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface FilterState {
  vehicleTypes: number[];
  fuelTypes: number[];
  ownershipTypes: number[];
  rcAvailable: string | null;
  states: number[];
}

export default function FilterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [lookupData, setLookupData] = useState({
    vehicleTypes: [] as { id: number; vehicle_type: string }[],
    fuelTypes: [] as { id: number; fuel_type: string }[],
    ownershipTypes: [] as { ownership_id: number; ownership: string }[],
    states: [] as { id: number; state: string; region: string }[],
  });
  const [filters, setFilters] = useState<FilterState>({
    vehicleTypes: [],
    fuelTypes: [],
    ownershipTypes: [],
    rcAvailable: null,
    states: [],
  });
  const [results, setResults] = useState<VehicleApi[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadLookupData();
  }, []);

  const loadLookupData = async () => {
    setLoading(true);
    try {
      const [fuelResponse, ownershipResponse, vehicleTypesResponse, statesResponse] = await Promise.all([
        vehicleService.getFuelTypes(),
        vehicleService.getOwnershipTypes(),
        vehicleService.getVehicleTypes(),
        vehicleService.getStates(),
      ]);

      setLookupData({
        vehicleTypes: vehicleTypesResponse,
        fuelTypes: fuelResponse,
        ownershipTypes: ownershipResponse,
        states: statesResponse,
      });
    } catch (error) {
      console.error("Failed to load filter data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleTypeChange = (id: number, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      vehicleTypes: checked 
        ? [...prev.vehicleTypes, id]
        : prev.vehicleTypes.filter(typeId => typeId !== id)
    }));
  };

  const handleFuelTypeChange = (id: number, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      fuelTypes: checked 
        ? [...prev.fuelTypes, id]
        : prev.fuelTypes.filter(fuelId => fuelId !== id)
    }));
  };

  const handleOwnershipChange = (id: number, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      ownershipTypes: checked 
        ? [...prev.ownershipTypes, id]
        : prev.ownershipTypes.filter(ownerId => ownerId !== id)
    }));
  };

  const handleStateChange = (id: number, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      states: checked 
        ? [...prev.states, id]
        : prev.states.filter(stateId => stateId !== id)
    }));
  };

  const handleRcAvailableChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      rcAvailable: prev.rcAvailable === value ? null : value
    }));
  };

  const clearFilters = () => {
    setFilters({
      vehicleTypes: [],
      fuelTypes: [],
      ownershipTypes: [],
      rcAvailable: null,
      states: [],
    });
  };

  const applyFilters = async () => {
    setApplying(true);
    try {
      const params: any = {};
      
      if (filters.vehicleTypes.length > 0) {
        params.vehicle_type = filters.vehicleTypes.join(',');
      }
      if (filters.fuelTypes.length > 0) {
        params.fuel = filters.fuelTypes.join(',');
      }
      if (filters.ownershipTypes.length > 0) {
        params.ownership = filters.ownershipTypes.join(',');
      }
      if (filters.rcAvailable) {
        params.rc_available = filters.rcAvailable;
      }
      if (filters.states.length > 0) {
        params.state = filters.states.join(',');
      }

      const result = await vehicleService.filterVehicles(params);
      setResults(result.data);
      setHasSearched(true);
    } catch (error) {
      console.error("Failed to apply filters:", error);
    } finally {
      setApplying(false);
    }
  };

  const hasActiveFilters = filters.vehicleTypes.length > 0 || 
    filters.fuelTypes.length > 0 || 
    filters.ownershipTypes.length > 0 || 
    filters.rcAvailable || 
    filters.states.length > 0;

  if (loading) {
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
          <h1 className="text-xl font-semibold">Filter Vehicles</h1>
        </div>
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Filter</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="p-4 text-center">Loading filter options...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
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
          <h1 className="text-xl font-semibold">Filter Vehicles</h1>
        </div>
      
      <div className="space-y-6">
        <Collapsible defaultOpen>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">Filters</h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Show/Hide
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-6 mt-2">
        {/* Vehicle Types */}
        <div>
          <Label className="text-base font-medium">Vehicle Types</Label>
          <div className="flex items-center gap-3 mt-2 mb-1">
            <Checkbox id="vehicle-types-all" checked={filters.vehicleTypes.length === lookupData.vehicleTypes.length && lookupData.vehicleTypes.length > 0} onCheckedChange={(checked) => {
              if (checked) {
                setFilters(prev => ({ ...prev, vehicleTypes: lookupData.vehicleTypes.map(v => v.id) }));
              } else {
                setFilters(prev => ({ ...prev, vehicleTypes: [] }));
              }
            }} />
            <Label htmlFor="vehicle-types-all" className="text-sm">Select All</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {lookupData.vehicleTypes.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`vehicle-type-${type.id}`}
                  checked={filters.vehicleTypes.includes(type.id)}
                  onCheckedChange={(checked) => handleVehicleTypeChange(type.id, checked as boolean)}
                />
                <Label htmlFor={`vehicle-type-${type.id}`} className="text-sm">
                  {type.vehicle_type}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Fuel Types */}
        <div>
          <Label className="text-base font-medium">Fuel Types</Label>
          <div className="flex items-center gap-3 mt-2 mb-1">
            <Checkbox id="fuel-types-all" checked={filters.fuelTypes.length === lookupData.fuelTypes.length && lookupData.fuelTypes.length > 0} onCheckedChange={(checked) => {
              if (checked) {
                setFilters(prev => ({ ...prev, fuelTypes: lookupData.fuelTypes.map(v => v.id) }));
              } else {
                setFilters(prev => ({ ...prev, fuelTypes: [] }));
              }
            }} />
            <Label htmlFor="fuel-types-all" className="text-sm">Select All</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {lookupData.fuelTypes.map((fuel) => (
              <div key={fuel.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`fuel-${fuel.id}`}
                  checked={filters.fuelTypes.includes(fuel.id)}
                  onCheckedChange={(checked) => handleFuelTypeChange(fuel.id, checked as boolean)}
                />
                <Label htmlFor={`fuel-${fuel.id}`} className="text-sm">
                  {fuel.fuel_type}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Ownership Types */}
        <div>
          <Label className="text-base font-medium">Ownership</Label>
          <div className="flex items-center gap-3 mt-2 mb-1">
            <Checkbox id="ownership-all" checked={filters.ownershipTypes.length === lookupData.ownershipTypes.length && lookupData.ownershipTypes.length > 0} onCheckedChange={(checked) => {
              if (checked) {
                setFilters(prev => ({ ...prev, ownershipTypes: lookupData.ownershipTypes.map(v => v.ownership_id) }));
              } else {
                setFilters(prev => ({ ...prev, ownershipTypes: [] }));
              }
            }} />
            <Label htmlFor="ownership-all" className="text-sm">Select All</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {lookupData.ownershipTypes.map((ownership) => (
              <div key={ownership.ownership_id} className="flex items-center space-x-2">
                <Checkbox
                  id={`ownership-${ownership.ownership_id}`}
                  checked={filters.ownershipTypes.includes(ownership.ownership_id)}
                  onCheckedChange={(checked) => handleOwnershipChange(ownership.ownership_id, checked as boolean)}
                />
                <Label htmlFor={`ownership-${ownership.ownership_id}`} className="text-sm">
                  {ownership.ownership}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* RC Available */}
        <div>
          <Label className="text-base font-medium">RC Available</Label>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="rc-yes"
                name="rcAvailable"
                checked={filters.rcAvailable === "true"}
                onChange={() => handleRcAvailableChange("true")}
                className="h-4 w-4"
              />
              <Label htmlFor="rc-yes" className="text-sm">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="rc-no"
                name="rcAvailable"
                checked={filters.rcAvailable === "false"}
                onChange={() => handleRcAvailableChange("false")}
                className="h-4 w-4"
              />
              <Label htmlFor="rc-no" className="text-sm">No</Label>
            </div>
          </div>
        </div>

        {/* States */}
        <div>
          <Label className="text-base font-medium">States</Label>
          <div className="flex items-center gap-3 mt-2 mb-1">
            <Checkbox id="states-all" checked={filters.states.length === lookupData.states.length && lookupData.states.length > 0} onCheckedChange={(checked) => {
              if (checked) {
                setFilters(prev => ({ ...prev, states: lookupData.states.map(v => v.id) }));
              } else {
                setFilters(prev => ({ ...prev, states: [] }));
              }
            }} />
            <Label htmlFor="states-all" className="text-sm">Select All</Label>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {lookupData.states.map((state) => (
              <div key={state.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`state-${state.id}`}
                  checked={filters.states.includes(state.id)}
                  onCheckedChange={(checked) => handleStateChange(state.id, checked as boolean)}
                />
                <Label htmlFor={`state-${state.id}`} className="text-sm">
                  {state.state}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearFilters} className="flex-1">
            Clear Filters
          </Button>
          <Button 
            onClick={applyFilters} 
            disabled={applying || !hasActiveFilters}
            className="flex-1"
          >
            {applying ? "Applying..." : "Apply Filters"}
          </Button>
        </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Results */}
        {hasSearched && (
          <div>
            {applying ? (
              <div className="text-center py-8 text-muted-foreground">
                Applying filters...
              </div>
            ) : results.length > 0 ? (
              <div>
                <div className="text-sm text-muted-foreground mb-4">
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
              <div className="text-center py-8 text-muted-foreground">
                No vehicles match your filters.
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
