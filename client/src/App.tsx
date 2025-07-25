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
import { Login } from "@/components/auth/login";
import AdminDashboard from "@/pages/admin/dashboard";

import { AuthProvider } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/hooks/useAuth";
import PublicInvoicePage from "@/pages/public-invoice";

function PublicRouter() {
  return (
    <Switch>
      <Route path="/public/invoice/:token">
        {(params: any) => <PublicInvoicePage token={params.token} />}
      </Route>
      <Route path="/register" component={Register} />
      <Route path="/" component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedRouter() {
  const { user } = useAuth();
  
  console.log('AuthenticatedRouter user:', user); // Debug log
  
  // Admin uživatelé mají pouze přístup k admin dashboardu
  if (user?.user?.role === 'admin') {
    console.log('Rendering admin routes'); // Debug log
    return (
      <div className="min-h-screen">
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/dashboard" component={AdminDashboard} />
          <Route>
            <AdminDashboard />
          </Route>
        </Switch>
      </div>
    );
  }
  
  // Běžní uživatelé mají přístup ke klientským funkcím
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
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
      <Route path="/dashboard" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Landing page je vždy dostupná
  return (
    <Switch>
      <Route path="/public/invoice/:token">
        {(params: any) => <PublicInvoicePage token={params.token} />}
      </Route>
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/" component={Landing} />
      {isAuthenticated && (
        <Route path="/dashboard">
          {user?.user?.role === 'admin' ? (
            <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
              <AdminDashboard />
            </div>
          ) : (
            <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 overflow-hidden">
                  <div className="h-screen overflow-y-auto pb-20">
                    <Dashboard />
                  </div>
                </main>
              </div>
              <BottomAIChat />
            </div>
          )}
        </Route>
      )}
      {isAuthenticated && user?.user?.role === 'admin' && (
        <Route path="/admin">
          <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
            <AdminDashboard />
          </div>
        </Route>
      )}
      {isAuthenticated && user?.user?.role !== 'admin' && (
        <>
          <Route path="/invoices/:id/edit">
            <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 overflow-hidden">
                  <div className="h-screen overflow-y-auto pb-20">
                    <InvoiceEdit />
                  </div>
                </main>
              </div>
              <BottomAIChat />
            </div>
          </Route>
          <Route path="/invoices/:id">
            <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 overflow-hidden">
                  <div className="h-screen overflow-y-auto pb-20">
                    <InvoiceDetail />
                  </div>
                </main>
              </div>
              <BottomAIChat />
            </div>
          </Route>
          <Route path="/invoices">
            <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 overflow-hidden">
                  <div className="h-screen overflow-y-auto pb-20">
                    <Invoices />
                  </div>
                </main>
              </div>
              <BottomAIChat />
            </div>
          </Route>
          <Route path="/customers">
            <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 overflow-hidden">
                  <div className="h-screen overflow-y-auto pb-20">
                    <Customers />
                  </div>
                </main>
              </div>
              <BottomAIChat />
            </div>
          </Route>
          <Route path="/expenses/new">
            <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 overflow-hidden">
                  <div className="h-screen overflow-y-auto pb-20">
                    <ExpenseCreatePage />
                  </div>
                </main>
              </div>
              <BottomAIChat />
            </div>
          </Route>
          <Route path="/expenses/:id/edit">
            {(params: any) => (
              <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
                <Header />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 overflow-hidden">
                    <div className="h-screen overflow-y-auto pb-20">
                      <ExpenseCreatePage key={`edit-${params.id}`} id={params.id} />
                    </div>
                  </main>
                </div>
                <BottomAIChat />
              </div>
            )}
          </Route>
          <Route path="/expenses/:id">
            {(params: any) => (
              <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
                <Header />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 overflow-hidden">
                    <div className="h-screen overflow-y-auto pb-20">
                      <ExpenseDetail key={`detail-${params.id}`} expenseId={parseInt(params.id)} />
                    </div>
                  </main>
                </div>
                <BottomAIChat />
              </div>
            )}
          </Route>
          <Route path="/expenses">
            <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 overflow-hidden">
                  <div className="h-screen overflow-y-auto pb-20">
                    <ExpensesPage />
                  </div>
                </main>
              </div>
              <BottomAIChat />
            </div>
          </Route>
          <Route path="/analytics">
            <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 overflow-hidden">
                  <div className="h-screen overflow-y-auto pb-20">
                    <Analytics />
                  </div>
                </main>
              </div>
              <BottomAIChat />
            </div>
          </Route>
          <Route path="/settings">
            <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 overflow-hidden">
                  <div className="h-screen overflow-y-auto pb-20">
                    <SettingsPage />
                  </div>
                </main>
              </div>
              <BottomAIChat />
            </div>
          </Route>
          <Route path="/profile">
            <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 overflow-hidden">
                  <div className="h-screen overflow-y-auto pb-20">
                    <ProfilePage />
                  </div>
                </main>
              </div>
              <BottomAIChat />
            </div>
          </Route>
        </>
      )}
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
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
