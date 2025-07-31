import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  FileText, 
  Users, 
  PieChart,
  Receipt,
  Calendar,
  Building2,
  Settings,
  User
} from "lucide-react";

export function TopNavigation() {
  const [location] = useLocation();
  
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
      name: "Opakované faktury",
      href: "/recurring-invoices",
      icon: Calendar,
      current: location === "/recurring-invoices",
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
    <nav className="hidden lg:flex items-center space-x-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant={item.current ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
                item.current
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden xl:block">{item.name}</span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}