import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Invoices from "@/pages/invoices";
import Customers from "@/pages/customers";
import InvoiceDetail from "@/pages/invoice-detail";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AIChatWidget } from "@/components/ai-chat";
import { AuthProvider } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth/auth-guard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/invoices/:id" component={InvoiceDetail} />
      <Route path="/customers" component={Customers} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AuthGuard>
            <div className="min-h-screen bg-neutral-50">
              <Header />
              
              <div className="flex">
                <Sidebar />
                
                <main className="flex-1 overflow-hidden">
                  <div className="h-screen overflow-y-auto">
                    <Router />
                  </div>
                </main>
              </div>
              
              <AIChatWidget />
              
              {/* Mobile Navigation */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-2 z-40">
                <div className="flex justify-around">
                  <a href="/" className="flex flex-col items-center py-2 px-3 text-primary">
                    <i className="fas fa-tachometer-alt text-lg"></i>
                    <span className="text-xs mt-1">Dashboard</span>
                  </a>
                  <a href="/invoices" className="flex flex-col items-center py-2 px-3 text-neutral-500">
                    <i className="fas fa-file-invoice text-lg"></i>
                    <span className="text-xs mt-1">Faktury</span>
                  </a>
                  <a href="/customers" className="flex flex-col items-center py-2 px-3 text-neutral-500">
                    <i className="fas fa-users text-lg"></i>
                    <span className="text-xs mt-1">Zákazníci</span>
                  </a>
                  <a href="#" className="flex flex-col items-center py-2 px-3 text-neutral-500">
                    <i className="fas fa-chart-line text-lg"></i>
                    <span className="text-xs mt-1">Přehledy</span>
                  </a>
                </div>
              </div>
            </div>
          </AuthGuard>
          
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
