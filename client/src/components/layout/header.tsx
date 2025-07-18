import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown, User, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-receipt text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-neutral-800">FakturaAI</span>
            </div>
          </div>

          {/* Top Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-neutral-600 hover:text-primary transition-colors px-3 py-2 text-sm font-medium">
              <i className="fas fa-tachometer-alt mr-2"></i>Dashboard
            </a>
            <a href="/invoices" className="text-neutral-600 hover:text-primary transition-colors px-3 py-2 text-sm font-medium">
              <i className="fas fa-file-invoice mr-2"></i>Faktury
            </a>
            <a href="/customers" className="text-neutral-600 hover:text-primary transition-colors px-3 py-2 text-sm font-medium">
              <i className="fas fa-users mr-2"></i>Zákazníci
            </a>
            <a href="#" className="text-neutral-600 hover:text-primary transition-colors px-3 py-2 text-sm font-medium">
              <i className="fas fa-chart-line mr-2"></i>Přehledy
            </a>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-neutral-700">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Oznámení</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-neutral-300 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-neutral-600" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-neutral-700">
                    {user ? `${user.firstName} ${user.lastName}` : 'Uživatel'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Nastavení
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Odhlásit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
