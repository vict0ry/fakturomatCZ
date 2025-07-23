import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomAIChat } from "@/components/bottom-ai-chat";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Invoices from "@/pages/invoices";
import Customers from "@/pages/customers";
import Analytics from "@/pages/analytics";
import InvoiceDetail from "@/pages/invoice-detail";
import InvoiceEdit from "@/pages/invoice-edit";
import SettingsPage from "@/pages/settings";
import ExpensesPage from "@/pages/expenses";
import ExpenseCreatePage from "@/pages/expense-create";
import ExpenseDetail from "./pages/expense-detail";
import ProfilePage from "@/pages/ProfilePage";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import Landing from "@/pages/landing";
import Register from "@/pages/register";
import AdminDashboard from "@/pages/admin/dashboard";

import { AuthProvider } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth/auth-guard";
import PublicInvoicePage from "@/pages/public-invoice";

function Router() {
  return (
    <Switch>
      <Route path="/public/invoice/:token">
        {(params: any) => <PublicInvoicePage token={params.token} />}
      </Route>
      <Route path="/" component={Dashboard} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/invoices/:id/edit" component={InvoiceEdit} />
      <Route path="/invoices/:id" component={InvoiceDetail} />
      <Route path="/customers" component={Customers} />
      <Route path="/expenses/new" component={ExpenseCreatePage} />
      <Route path="/expenses/:id/edit">
        {(params: any) => <ExpenseCreatePage key={`edit-${params.id}`} {...params} />}
      </Route>
      <Route path="/expenses/:id">
        {(params: any) => <ExpenseDetail key={`detail-${params.id}`} expenseId={parseInt(params.id)} />}
      </Route>
      <Route path="/expenses" component={ExpensesPage} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/landing" component={Landing} />
      <Route path="/register" component={Register} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <TooltipProvider>
          <AuthGuard>
            <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
              <Header />
              
              <div className="flex">
                <Sidebar />
                
                <main className="flex-1 overflow-hidden">
                  <div className="h-screen overflow-y-auto pb-20">
                    <Router />
                  </div>
                </main>
              </div>
              
              <BottomAIChat />
              

            </div>
          </AuthGuard>
          
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
