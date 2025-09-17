"use client";
import { useCallback, useEffect, useState } from "react";
import { GroupsWithFetcher, VehicleGroupGrid, VehicleList } from "@/components/vehicles";
import { buyerApi } from "@/lib/http";
import type { VehicleApi, VehicleGroupApi } from "@/lib/types";

export default function Home() {
  const [groups, setGroups] = useState<VehicleGroupApi[]>([]);
  const [vehicles, setVehicles] = useState<VehicleApi[]>([]);
  const loadGroups = useCallback(async () => {
    try {
      const res = await buyerApi.get('/vehicles/groups', { params: { businessVertical: 'I' } });
      setGroups(res.data.data as VehicleGroupApi[]);
    } catch {}
  }, []);
  useEffect(() => { loadGroups(); }, [loadGroups]);
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3">Vehicle Groups</h2>
        {groups.length ? (
          <GroupsWithFetcher initialGroups={groups} onVehicles={setVehicles} businessVertical={'I'} />
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
