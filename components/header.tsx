"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, User, Home, Heart, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/wins", label: "Wins", icon: Trophy },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Main Menu</SheetTitle>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage alt="User" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">Account</div>
                  </div>
                </div>
                <Separator />
                <nav className="p-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-primary)]"
                            : "hover:bg-[var(--sidebar-accent)]"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" className="font-semibold">KMSG</Link>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-muted text-[var(--sidebar-primary)]"
                    : "hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account">
                <Avatar className="h-8 w-8">
                  <AvatarImage alt="User" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56">
              <div className="text-sm font-medium mb-2">Settings</div>
              <div className="space-y-1">
                <Link href="/login" className="block rounded px-2 py-1 hover:bg-muted">Login</Link>
                <Link href="/register" className="block rounded px-2 py-1 hover:bg-muted">Register</Link>
                <Link href="/forgot" className="block rounded px-2 py-1 hover:bg-muted">Forgot Password</Link>
                <Link href="/otp" className="block rounded px-2 py-1 hover:bg-muted">OTP</Link>
                <Separator className="my-1" />
                <Link href="/terms" className="block rounded px-2 py-1 hover:bg-muted">Terms & Conditions</Link>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}


