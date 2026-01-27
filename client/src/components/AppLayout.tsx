import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  CreditCard,
  Menu,
  X,
  User as UserIcon
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold font-display text-primary flex items-center gap-2">
          <span className="bg-primary text-white rounded-lg p-1">€</span>
          FairShare
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <Link href="/">
          <Button 
            variant={isActive("/") ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3 text-base h-12"
            onClick={() => setIsMobileOpen(false)}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Button>
        </Link>
        <Link href="/subscription">
          <Button 
            variant={isActive("/subscription") ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3 text-base h-12"
            onClick={() => setIsMobileOpen(false)}
          >
            <CreditCard className="h-5 w-5" />
            Subscription
          </Button>
        </Link>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.firstName || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/30"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-border bg-card fixed inset-y-0 z-30">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/80 backdrop-blur-md z-30 px-4 flex items-center justify-between">
        <h1 className="text-xl font-bold font-display text-primary">FairShare</h1>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 pt-16 md:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
