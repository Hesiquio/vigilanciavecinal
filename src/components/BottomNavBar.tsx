
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Grupo", icon: Home },
  { href: "/chat", label: "Chats", icon: MessageSquare },
  { href: "/family", label: "Familia", icon: Users },
  { href: "/settings", label: "Perfil", icon: User },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <nav className="grid h-16 grid-cols-4 items-center">
        {navItems.map((item) => {
          // Special handling for /chat or /family route to match sub-routes
          const isActive = (item.href === "/chat" && pathname.includes("/chat")) || 
                           (item.href === "/family" && pathname.includes("/family")) ||
                           (pathname === item.href) || 
                           (item.href === '/' && (pathname.startsWith('/neighborhood-chat') || pathname.startsWith('/family-chat')) ? false : pathname === '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
