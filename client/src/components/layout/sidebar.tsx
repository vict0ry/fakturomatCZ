import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  PieChart,
  Receipt,
  Calendar,
  TrendingUp,
  ChevronRight,
  Menu,
  User,
  Building2
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    {
      name: "Dashboard", 
      href: "/dashboard",
      icon: Home,
      current: location === "/" || location === "/dashboard",
    },
    {
      name: "Faktury",
      href: "/invoices",
      icon: FileText,
      current: location === "/invoices" || location.startsWith("/invoices/"),
    },
    {
      name: "Zákazníci",
      href: "/customers",
      icon: Users,
      current: location === "/customers",
    },
    {
      name: "Náklady",
      href: "/expenses",
      icon: Receipt,
      current: location === "/expenses",
    },
    {
      name: "Analýzy",
      href: "/analytics",
      icon: PieChart,
      current: location === "/analytics",
    },
    {
      name: "Bankovní účty",
      href: "/bank-accounts",
      icon: Building2,
      current: location === "/bank-accounts",
    },
    {
      name: "Profil",
      href: "/profile",
      icon: User,
      current: location === "/profile",
    },
    {
      name: "Nastavení",
      href: "/settings",
      icon: Settings,
      current: location === "/settings",
    },
  ];

  return (
    <div className={cn(
      "flex flex-col bg-white dark:bg-gray-900 border-r border-neutral-200 dark:border-neutral-700 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      "h-screen sticky top-0",
      className
    )}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Fakturoidu
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {user?.companyId ? 'Pro firmu' : 'Dashboard'}
              </span>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={item.current ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isCollapsed && "justify-center px-2",
                  item.current 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.current && (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-neutral-200">
        {!isCollapsed && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Upgrade
              </span>
            </div>
            <p className="text-xs text-blue-700 mb-2">
              Získejte pokročilé funkce a neomezený počet faktur.
            </p>
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
              Upgrade
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}