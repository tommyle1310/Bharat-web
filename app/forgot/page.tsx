import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-xl font-semibold mb-4">Forgot Password</h1>
      <div className="space-y-3">
        <Input placeholder="Email" type="email" />
        <Button className="w-full">Send reset link</Button>
      </div>
    </div>
  );
}


