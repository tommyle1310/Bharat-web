"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { vehicleService } from "@/lib/services/vehicles";
import { VehicleList } from "@/components/vehicles";
import type { VehicleApi } from "@/lib/types";

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilter: (vehicles: VehicleApi[]) => void;
}

interface FilterState {
  vehicleTypes: number[];
  fuelTypes: number[];
  ownershipTypes: number[];
  rcAvailable: string | null;
  states: number[];
}

export function FilterDialog({ open, onOpenChange, onFilter }: FilterDialogProps) {
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

  useEffect(() => {
    if (open) {
      loadLookupData();
    }
  }, [open]);

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
      onFilter(result.data);
      onOpenChange(false);
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filter Vehicles</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">Loading filter options...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Vehicles</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Vehicle Types */}
          <div>
            <Label className="text-base font-medium">Vehicle Types</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
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
            <div className="grid grid-cols-2 gap-2 mt-2">
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
            <div className="grid grid-cols-2 gap-2 mt-2">
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
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
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
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={applyFilters} disabled={applying}>
              {applying ? "Applying..." : "Apply Filters"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
