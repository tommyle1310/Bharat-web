"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { vehicleService } from "@/lib/services/vehicles";
import { wishlistService, type WishlistConfiguration } from "@/lib/services/wishlist";

interface WishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

interface LookupData {
  vehicleTypes: { id: number; vehicle_type: string }[];
  makes: { id: number; make_name: string }[];
  subcategories: { sub_category_id: number; category_id: number; sub_category: string }[];
  states: { id: number; state: string; region: string }[];
  sellers: { seller_id: number; name: string; contact_person: string | null; email: string; phone: string; address: string; city_name: string; state_name: string; pincode: string; gst_number: string; is_dummy: number; created_at: string }[];
}

interface WishlistState {
  vehicleTypes: number[];
  makes: number[];
  subcategories: number[];
  states: number[];
  sellers: number[];
}

export function WishlistDialog({ open, onOpenChange, onUpdate }: WishlistDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookupData, setLookupData] = useState<LookupData>({
    vehicleTypes: [],
    makes: [],
    subcategories: [],
    states: [],
    sellers: [],
  });
  const [originalConfig, setOriginalConfig] = useState<WishlistConfiguration | null>(null);
  const [currentConfig, setCurrentConfig] = useState<WishlistState>({
    vehicleTypes: [],
    makes: [],
    subcategories: [],
    states: [],
    sellers: [],
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehicleTypesResponse, makesResponse, subcategoriesResponse, statesResponse, sellersResponse, configResponse] = await Promise.all([
        vehicleService.getVehicleTypes(),
        vehicleService.getVehicleMakes(),
        vehicleService.getVehicleSubcategories(),
        vehicleService.getStates(),
        vehicleService.getSellers(),
        wishlistService.getConfiguration(),
      ]);

      setLookupData({
        vehicleTypes: vehicleTypesResponse,
        makes: makesResponse,
        subcategories: subcategoriesResponse,
        states: statesResponse,
        sellers: sellersResponse,
      });

      setOriginalConfig(configResponse);
      setCurrentConfig({
        vehicleTypes: configResponse.configuration.vehicleType,
        makes: configResponse.configuration.make,
        subcategories: configResponse.configuration.subcategory,
        states: configResponse.configuration.state,
        sellers: configResponse.configuration.seller,
      });
    } catch (error) {
      console.error("Failed to load wishlist data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleTypeChange = (id: number, checked: boolean) => {
    setCurrentConfig(prev => ({
      ...prev,
      vehicleTypes: checked 
        ? [...prev.vehicleTypes, id]
        : prev.vehicleTypes.filter(typeId => typeId !== id)
    }));
  };

  const handleMakeChange = (id: number, checked: boolean) => {
    setCurrentConfig(prev => ({
      ...prev,
      makes: checked 
        ? [...prev.makes, id]
        : prev.makes.filter(makeId => makeId !== id)
    }));
  };

  const handleSubcategoryChange = (id: number, checked: boolean) => {
    setCurrentConfig(prev => ({
      ...prev,
      subcategories: checked 
        ? [...prev.subcategories, id]
        : prev.subcategories.filter(subId => subId !== id)
    }));
  };

  const handleStateChange = (id: number, checked: boolean) => {
    setCurrentConfig(prev => ({
      ...prev,
      states: checked 
        ? [...prev.states, id]
        : prev.states.filter(stateId => stateId !== id)
    }));
  };

  const handleSellerChange = (id: number, checked: boolean) => {
    setCurrentConfig(prev => ({
      ...prev,
      sellers: checked 
        ? [...prev.sellers, id]
        : prev.sellers.filter(sellerId => sellerId !== id)
    }));
  };

  const resetConfiguration = () => {
    if (originalConfig) {
      setCurrentConfig({
        vehicleTypes: originalConfig.configuration.vehicleType,
        makes: originalConfig.configuration.make,
        subcategories: originalConfig.configuration.subcategory,
        states: originalConfig.configuration.state,
        sellers: originalConfig.configuration.seller,
      });
    }
  };

  const clearAll = () => {
    setCurrentConfig({
      vehicleTypes: [],
      makes: [],
      subcategories: [],
      states: [],
      sellers: [],
    });
  };

  const updateWishlist = async () => {
    if (!originalConfig) return;

    setSaving(true);
    try {
      const params: any = {};

      // Compare vehicle types
      const vehicleTypeChanges = getChanges(originalConfig.configuration.vehicleType, currentConfig.vehicleTypes);
      if (vehicleTypeChanges.length > 0) {
        params.vehicle_type = vehicleTypeChanges.join(',');
      }

      // Compare makes
      const makeChanges = getChanges(originalConfig.configuration.make, currentConfig.makes);
      if (makeChanges.length > 0) {
        params.make = makeChanges.join(',');
      }

      // Compare subcategories
      const subcategoryChanges = getChanges(originalConfig.configuration.subcategory, currentConfig.subcategories);
      if (subcategoryChanges.length > 0) {
        params.subcategoryIds = subcategoryChanges.join(',');
      }

      // Compare states
      const stateChanges = getChanges(originalConfig.configuration.state, currentConfig.states);
      if (stateChanges.length > 0) {
        params.stateIds = stateChanges.join(',');
      }

      // Compare sellers
      const sellerChanges = getChanges(originalConfig.configuration.seller, currentConfig.sellers);
      if (sellerChanges.length > 0) {
        params.sellerId = sellerChanges.join(',');
      }

      if (Object.keys(params).length > 0) {
        await wishlistService.updateWishlist(params);
        onOpenChange(false);
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error("Failed to update wishlist:", error);
    } finally {
      setSaving(false);
    }
  };

  const getChanges = (original: number[], current: number[]): number[] => {
    const added = current.filter(id => !original.includes(id));
    const removed = original.filter(id => !current.includes(id));
    return [...added, ...removed];
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Wishlist</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">Loading configuration...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Wishlist</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vehicle Types */}
          <div>
            <Label className="text-base font-medium">Vehicle Types</Label>
            <div className="grid grid-cols-1 gap-2 mt-2 max-h-32 overflow-y-auto">
              {lookupData.vehicleTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`wishlist-vehicle-type-${type.id}`}
                    checked={currentConfig.vehicleTypes.includes(type.id)}
                    onCheckedChange={(checked) => handleVehicleTypeChange(type.id, checked as boolean)}
                  />
                  <Label htmlFor={`wishlist-vehicle-type-${type.id}`} className="text-sm">
                    {type.vehicle_type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle Makes */}
          <div>
            <Label className="text-base font-medium">Vehicle Makes</Label>
            <div className="grid grid-cols-1 gap-2 mt-2 max-h-32 overflow-y-auto">
              {lookupData.makes.map((make) => (
                <div key={make.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`wishlist-make-${make.id}`}
                    checked={currentConfig.makes.includes(make.id)}
                    onCheckedChange={(checked) => handleMakeChange(make.id, checked as boolean)}
                  />
                  <Label htmlFor={`wishlist-make-${make.id}`} className="text-sm">
                    {make.make_name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Subcategories */}
          <div>
            <Label className="text-base font-medium">Subcategories</Label>
            <div className="grid grid-cols-1 gap-2 mt-2 max-h-32 overflow-y-auto">
              {lookupData.subcategories.map((sub) => (
                <div key={sub.sub_category_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`wishlist-subcategory-${sub.sub_category_id}`}
                    checked={currentConfig.subcategories.includes(sub.sub_category_id)}
                    onCheckedChange={(checked) => handleSubcategoryChange(sub.sub_category_id, checked as boolean)}
                  />
                  <Label htmlFor={`wishlist-subcategory-${sub.sub_category_id}`} className="text-sm">
                    {sub.sub_category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* States */}
          <div>
            <Label className="text-base font-medium">States</Label>
            <div className="grid grid-cols-1 gap-2 mt-2 max-h-32 overflow-y-auto">
              {lookupData.states.map((state) => (
                <div key={state.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`wishlist-state-${state.id}`}
                    checked={currentConfig.states.includes(state.id)}
                    onCheckedChange={(checked) => handleStateChange(state.id, checked as boolean)}
                  />
                  <Label htmlFor={`wishlist-state-${state.id}`} className="text-sm">
                    {state.state}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Sellers */}
          <div className="md:col-span-2">
            <Label className="text-base font-medium">Sellers</Label>
            <div className="grid grid-cols-1 gap-2 mt-2 max-h-32 overflow-y-auto">
              {lookupData.sellers.map((seller) => (
                <div key={seller.seller_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`wishlist-seller-${seller.seller_id}`}
                    checked={currentConfig.sellers.includes(seller.seller_id)}
                    onCheckedChange={(checked) => handleSellerChange(seller.seller_id, checked as boolean)}
                  />
                  <Label htmlFor={`wishlist-seller-${seller.seller_id}`} className="text-sm">
                    {seller.name} ({seller.city_name}, {seller.state_name})
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetConfiguration}>
              Reset
            </Button>
            <Button variant="outline" onClick={clearAll}>
              Clear All
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={updateWishlist} disabled={saving}>
              {saving ? "Updating..." : "Update Wishlist"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
