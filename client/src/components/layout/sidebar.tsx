import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-white border-r border-neutral-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-4 space-y-1">
              {/* Dashboard */}
              <a 
                href="/" 
                className={cn(
                  "sidebar-nav-item",
                  isActive("/") && "active"
                )}
              >
                <i className="fas fa-tachometer-alt mr-3 text-lg"></i>
                Dashboard
              </a>

              {/* Invoices Section */}
              <div className="mt-6">
                <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Fakturace
                </h3>
                <div className="mt-2 space-y-1">
                  <a 
                    href="/invoices" 
                    className={cn(
                      "sidebar-nav-item",
                      isActive("/invoices") && "active"
                    )}
                  >
                    <i className="fas fa-file-invoice mr-3"></i>
                    Všechny faktury
                  </a>
                  <a 
                    href="/invoices/new" 
                    className="sidebar-nav-item"
                  >
                    <i className="fas fa-plus-circle mr-3"></i>
                    Nová faktura
                  </a>
                  <a 
                    href="/invoices?type=proforma" 
                    className="sidebar-nav-item"
                  >
                    <i className="fas fa-file-contract mr-3"></i>
                    Proformy
                  </a>
                  <a 
                    href="/invoices?type=credit_note" 
                    className="sidebar-nav-item"
                  >
                    <i className="fas fa-undo mr-3"></i>
                    Dobropisy
                  </a>
                </div>
              </div>

              {/* Customers Section */}
              <div className="mt-6">
                <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Zákazníci
                </h3>
                <div className="mt-2 space-y-1">
                  <a 
                    href="/customers" 
                    className={cn(
                      "sidebar-nav-item",
                      isActive("/customers") && "active"
                    )}
                  >
                    <i className="fas fa-users mr-3"></i>
                    Všichni zákazníci
                  </a>
                  <a 
                    href="/customers/new" 
                    className="sidebar-nav-item"
                  >
                    <i className="fas fa-user-plus mr-3"></i>
                    Přidat zákazníka
                  </a>
                  <a 
                    href="/customers?filter=inactive" 
                    className="sidebar-nav-item text-destructive hover:text-destructive hover:bg-red-50"
                  >
                    <i className="fas fa-exclamation-triangle mr-3"></i>
                    Neúčtovaní klienti
                    <span className="ml-auto bg-destructive text-white text-xs px-2 py-1 rounded-full">
                      3
                    </span>
                  </a>
                </div>
              </div>

              {/* Reports Section */}
              <div className="mt-6">
                <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Přehledy
                </h3>
                <div className="mt-2 space-y-1">
                  <a href="#" className="sidebar-nav-item">
                    <i className="fas fa-chart-line mr-3"></i>
                    Příjmy & Výdaje
                  </a>
                  <a href="/invoices?status=sent,overdue" className="sidebar-nav-item">
                    <i className="fas fa-clock mr-3"></i>
                    Neuhrazené faktury
                  </a>
                  <a href="#" className="sidebar-nav-item">
                    <i className="fas fa-download mr-3"></i>
                    Export dat
                  </a>
                </div>
              </div>
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="flex-shrink-0 flex border-t border-neutral-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <i className="fas fa-robot text-white text-sm"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-700">AI Asistent</p>
                <p className="text-xs text-neutral-500">Aktivní</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
