import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, User, ChevronDown, LogOut, Settings } from "lucide-react";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-neutral-200 px-4 sm:px-6 md:px-8 sticky top-0 z-50">
      <div className="flex justify-between items-center h-16">
        {/* Left side - Navigation for larger screens */}
        <div className="hidden lg:block">
          <nav className="flex space-x-1">
            <a href="/" className="text-neutral-600 hover:text-primary transition-colors px-3 py-2 text-sm font-medium">
              Dashboard
            </a>
            <a href="/invoices" className="text-neutral-600 hover:text-primary transition-colors px-3 py-2 text-sm font-medium">
              Faktury
            </a>
            <a href="/customers" className="text-neutral-600 hover:text-primary transition-colors px-3 py-2 text-sm font-medium">
              Zákazníci
            </a>
            <a href="/analytics" className="text-neutral-600 hover:text-primary transition-colors px-3 py-2 text-sm font-medium">
              Analýzy
            </a>
          </nav>
        </div>

        {/* Center - Search (hidden on small screens) */}
        <div className="hidden md:block flex-1 max-w-lg mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Hledat faktury, zákazníky..."
              className="w-full pl-4 pr-10 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-neutral-500 bg-neutral-100 border border-neutral-300 rounded">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right side - User menu */}
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
                Odhlásit se
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}