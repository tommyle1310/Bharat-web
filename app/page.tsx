"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GroupsWithFetcher, VehicleList } from "@/components/vehicles";
import { buyerApi } from "@/lib/http";
import type { VehicleApi, VehicleGroupApi } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/services/auth";
import { useUserStore } from "@/lib/stores/userStore";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";

export default function Home() {
  const router = useRouter();
  const [groups, setGroups] = useState<VehicleGroupApi[]>([]);
  const [groupsI, setGroupsI] = useState<VehicleGroupApi[]>([]);
  const [groupsB, setGroupsB] = useState<VehicleGroupApi[]>([]);
  const [vehicles, setVehicles] = useState<VehicleApi[]>([]);
  const [vehiclesPagination, setVehiclesPagination] = useState<{ total: number; page: number; pageSize: number; totalPages: number } | null>(null);
  const [loadMoreVehicles, setLoadMoreVehicles] = useState<(() => void) | null>(null);
  const [vehiclesHasMore, setVehiclesHasMore] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const { businessVertical, setUserProfile, setAuthTokens, username, isAuthenticated } = useUserStore();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<"I" | "B">("I");
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleApi[]>([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const loadGroups = useCallback(async (bv: "I" | "B") => {
    try {
      const res = await buyerApi.get('/vehicles/groups', { params: { businessVertical: bv } });
      const groupsData = res.data.data as VehicleGroupApi[];
      setGroups(groupsData);
      if (bv === "I") {
        setGroupsI(groupsData);
      } else if (bv === "B") {
        setGroupsB(groupsData);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load groups";
      toast.error(msg);
    }
  }, []);

  const handleVehiclesUpdate = useCallback((newVehicles: VehicleApi[], pagination?: { total: number; page: number; pageSize: number; totalPages: number }) => {
    setVehicles(newVehicles);
    if (pagination) {
      setVehiclesPagination(pagination);
    }
  }, []);

  const handleLoadMoreUpdate = useCallback((loadMoreFn: () => void, hasMore: boolean, loading: boolean) => {
    setLoadMoreVehicles(() => loadMoreFn);
    setVehiclesHasMore(hasMore);
    setVehiclesLoading(loading);
  }, []);

  const handleFilterResults = useCallback((vehicles: VehicleApi[]) => {
    setFilteredVehicles(vehicles);
    setHasActiveFilters(true);
  }, []);

  const clearFilters = useCallback(() => {
    setFilteredVehicles([]);
    setHasActiveFilters(false);
    // Reset to initial state by reloading groups
    if (businessVertical === "A") {
      loadGroups("I");
    } else if (businessVertical === "I" || businessVertical === "B") {
      loadGroups(businessVertical);
    } else {
      loadGroups("I");
    }
  }, [businessVertical, loadGroups]);

  const handleTabChange = useCallback((value: string) => {
    const bv = value as "I" | "B";
    setCurrentTab(bv);
    loadGroups(bv);
  }, []);

  // Load groups on mount and when businessVertical changes
  useEffect(() => {
    if (businessVertical === "A") {
      loadGroups("I");
    } else if (businessVertical === "I" || businessVertical === "B") {
      loadGroups(businessVertical);
    } else {
      loadGroups("I");
    }
  }, [businessVertical]); // Keep loadGroups out of dependencies to avoid infinite loop

  // Also load groups on component mount regardless of authentication status
  useEffect(() => {
    loadGroups("I");
  }, []); // Run once on mount

  useEffect(() => {
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
    } else {
      setLoginPromptOpen(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = () => setLoginPromptOpen(true);
    if (typeof window !== "undefined") {
      window.addEventListener("auth:login-required", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("auth:login-required", handler);
      }
    };
  }, []);
  return (
    <div className="min-h-screen">
      <Header 
        onFilterResults={handleFilterResults} 
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {hasActiveFilters && (
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Filtered Results</h2>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
        
        {hasActiveFilters ? (
          <section>
            {filteredVehicles.length > 0 ? (
              <VehicleList 
                vehicles={filteredVehicles} 
                onLoadMore={undefined}
                hasMore={false}
                loading={false}
              />
            ) : (
              <div className="text-sm text-muted-foreground">No vehicles match your filters.</div>
            )}
          </section>
        ) : (
          <>
            <section>
              <h2 className="text-lg font-semibold mb-3">Vehicle Groups</h2>
        {businessVertical === "A" ? (
          <Tabs defaultValue="I" onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="I">Insurance</TabsTrigger>
              <TabsTrigger value="B">Bank</TabsTrigger>
            </TabsList>
            <TabsContent value="I">
              <GroupsWithFetcher 
                initialGroups={groupsI} 
                onVehicles={handleVehiclesUpdate} 
                onLoadMore={handleLoadMoreUpdate}
                businessVertical={'I'}
                isActive={currentTab === 'I'}
              />
            </TabsContent>
            <TabsContent value="B">
              <GroupsWithFetcher 
                initialGroups={groupsB} 
                onVehicles={handleVehiclesUpdate} 
                onLoadMore={handleLoadMoreUpdate}
                businessVertical={'B'}
                isActive={currentTab === 'B'}
              />
            </TabsContent>
          </Tabs>
        ) : groups.length ? (
          <GroupsWithFetcher 
            initialGroups={groups} 
            onVehicles={handleVehiclesUpdate} 
            onLoadMore={handleLoadMoreUpdate}
            businessVertical={businessVertical}
            isActive={true}
          />
              ) : (
                <div className="text-sm text-muted-foreground">Loading groups...</div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">Vehicles</h2>
              {vehicles.length ? (
                <VehicleList 
                  vehicles={vehicles} 
                  onLoadMore={loadMoreVehicles || undefined}
                  hasMore={vehiclesHasMore}
                  loading={vehiclesLoading}
                />
              ) : (
                <div className="text-sm text-muted-foreground">This group has no vehicles.</div>
              )}
            </section>
          </>
        )}

      <Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>You must login to do this action.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setLoginPromptOpen(false);
                router.replace("/login");
              }}
            >
              Go to Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
