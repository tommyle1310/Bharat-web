import { buyerApi } from "@/lib/http";

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  let vehicle: any = null;
  try {
    const res = await buyerApi.get(`/vehicles/${id}`);
    vehicle = res.data.data;
  } catch {}
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <h1 className="text-xl font-semibold">Vehicle #{id}</h1>
      {vehicle ? (
        <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">{JSON.stringify(vehicle, null, 2)}</pre>
      ) : (
        <p className="text-muted-foreground">Unable to load vehicle details.</p>
      )}
    </div>
  );
}


