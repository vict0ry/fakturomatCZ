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
import { Link, useLocation } from "wouter";
import { PlusMenu } from "./plus-menu";
import { TopNavigation } from "./top-navigation";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-neutral-200 dark:border-neutral-700 px-4 sm:px-6 md:px-8 sticky top-0 z-50 w-full overflow-x-hidden">
      <div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
        {/* Left side - Plus button and Navigation */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          <PlusMenu />
          <TopNavigation />
        </div>

        {/* Center - Search (hidden on small screens) */}
        <div className="hidden md:flex flex-1 max-w-lg mx-4">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Hledat faktury, zákazníky..."
              className="w-full pl-4 pr-10 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-neutral-500 bg-neutral-100 border border-neutral-300 rounded">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center space-x-4 flex-shrink-0">
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
                <span className="hidden sm:block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.username !== user.email ? user.username : user.email.split('@')[0])) : 'Uživatel'}
                </span>
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <div className="flex items-center w-full">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <div className="flex items-center w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Nastavení
                  </div>
                </Link>
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