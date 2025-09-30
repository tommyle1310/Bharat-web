"use client";
import { Header } from "@/components/header";
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useEffect, useState } from "react";
import { winsService, type WinVehicle } from "@/lib/services/wins";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleCard } from "@/components/vehicles";

export default function WinsPage() {
  const [tab, setTab] = useState("approval");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<WinVehicle[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (tab !== "approval") return;
    setLoading(true);
    winsService
      .getApprovalPending(1)
      .then((d) => {
        setItems(d.data || []);
        setTotal(d.total || 0);
      })
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Wins</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <h1 className="text-xl font-semibold mb-4">Wins</h1>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full flex flex-wrap gap-2 max-sm:h-12 sm:gap-3 sm:flex-nowrap  sm:overflow-x-auto sm:[-ms-overflow-style:none] sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="approval" className="whitespace-normal break-words text-sm max-sm:h-10 max-sm:leading-5   sm:text-base sm:min-w-max py-2 px-3">Approval Pending</TabsTrigger>
            <TabsTrigger value="payment" className="whitespace-normal break-words text-sm  max-sm:h-10 max-sm:leading-5  sm:text-base sm:min-w-max py-2 px-3">Payment Pending</TabsTrigger>
            <TabsTrigger value="completed" className="whitespace-normal break-words text-sm max-sm:h-10 max-sm:leading-5   sm:text-base sm:min-w-max py-2 px-3">Completed</TabsTrigger>
          </TabsList>
          <TabsContent value="approval" className="mt-4">
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : items.length === 0 ? (
              <div className="text-muted-foreground">No approval pending wins.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((v) => {
                  const adapted: any = {
                    vehicle_id: v.vehicle_id,
                    vehicleId: v.vehicleId,
                    imgIndex: v.imgIndex,
                    img_extension: v.img_extension,
                    make: v.make,
                    model: v.model,
                    variant: v.variant,
                    manufacture_year: v.manufacture_year,
                    owner_serial: v.owner_serial,
                    fuel: v.fuel,
                    odometer: v.odometer,
                    regs_no: v.regs_no,
                    has_bidded: v.has_bidded,
                    bidding_status: v.bidding_status,
                    end_time: v.end_time,
                    is_favorite: v.is_favorite,
                    manager_name: v.manager_name,
                    manager_phone: v.manager_phone,
                  };
                  return <VehicleCard key={v.vehicle_id} v={adapted} />;
                })}
              </div>
            )}
          </TabsContent>
          <TabsContent value="payment" className="mt-4">
            <div className="text-muted-foreground">Coming soon.</div>
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            <div className="text-muted-foreground">Coming soon.</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


