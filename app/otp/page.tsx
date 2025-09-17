import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function OtpPage() {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-xl font-semibold mb-4">Enter OTP</h1>
      <div className="space-y-3">
        <Input placeholder="One-time password" />
        <Button className="w-full">Verify</Button>
      </div>
    </div>
  );
}


