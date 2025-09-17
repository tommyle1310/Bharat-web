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

export default function Home() {
  const [groups, setGroups] = useState<VehicleGroupApi[]>([]);
  const [vehicles, setVehicles] = useState<VehicleApi[]>([]);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const { businessVertical, setUserProfile, setAuthTokens, username } = useUserStore();

  const loadGroups = useCallback(async (bv: "I" | "B") => {
    try {
      const res = await buyerApi.get('/vehicles/groups', { params: { businessVertical: bv } });
      setGroups(res.data.data as VehicleGroupApi[]);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load groups";
      toast.error(msg);
    }
  }, []);

  useEffect(() => {
    if (businessVertical === "A") {
      loadGroups("I");
    } else {
      loadGroups(businessVertical);
    }
  }, [businessVertical, loadGroups]);
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      

      <section>
        <h2 className="text-lg font-semibold mb-3">Vehicle Groups</h2>
        {businessVertical === "A" ? (
          <Tabs defaultValue="I" onValueChange={(v) => loadGroups(v as any)}>
            <TabsList>
              <TabsTrigger value="I">Insurance</TabsTrigger>
              <TabsTrigger value="B">Bank</TabsTrigger>
            </TabsList>
            <TabsContent value="I">
              <GroupsWithFetcher initialGroups={groups} onVehicles={setVehicles} businessVertical={'I'} />
            </TabsContent>
            <TabsContent value="B">
              <GroupsWithFetcher initialGroups={groups} onVehicles={setVehicles} businessVertical={'B'} />
            </TabsContent>
          </Tabs>
        ) : groups.length ? (
          <GroupsWithFetcher initialGroups={groups} onVehicles={setVehicles} businessVertical={businessVertical} />
        ) : (
          <div className="text-sm text-muted-foreground">Loading groups...</div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Vehicles</h2>
        {vehicles.length ? (
          <VehicleList vehicles={vehicles} />
        ) : (
          <div className="text-sm text-muted-foreground">Select a group to view vehicles.</div>
        )}
      </section>
    </div>
  );
}
