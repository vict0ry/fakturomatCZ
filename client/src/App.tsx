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
import BankAccountsPage from "@/pages/bank-accounts";
import ProfilePage from "@/pages/ProfilePage";
import EmailSettings from "@/pages/EmailSettings";
import BlogPage from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";
import RecurringInvoicesPage from "@/pages/recurring-invoices";
import AcceptInvitation from "@/pages/accept-invitation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import Landing from "@/pages/landing";
import Register from "@/pages/register";
import { Login } from "@/components/auth/login";
import AdminDashboard from "@/pages/admin/dashboard";
import { AdminRouteGuard } from "@/components/admin-route-guard";

import { AuthProvider, useAuth } from "@/contexts/auth-context";
import PublicInvoicePage from "@/pages/public-invoice";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

function PublicRouter() {
  return (
    <Switch>
      <Route path="/public/invoice/:token">
        {(params: any) => <PublicInvoicePage token={params.token} />}
      </Route>
      <Route path="/blog/:id" component={BlogPostPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/auth/accept-invitation" component={AcceptInvitation} />
      {/* BEZPEČNOSTNÍ BLOKACE - Admin panel vyžaduje přihlášení */}
      <Route path="/admin">
        {() => (
          <div className="min-h-screen flex items-center justify-center">
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4 text-red-600">🚫 Přístup odepřen</h1>
              <p className="text-gray-600 mb-4">Pro přístup do admin panelu se musíte nejprve přihlásit.</p>
              <a href="/login" className="text-blue-600 hover:underline">Přihlásit se</a>
            </div>
          </div>
        )}
      </Route>
      <Route path="/" component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedRouter() {
  const { user } = useAuth();
  
  // Admin dashboard má svoji vlastní route - POUZE pro ověřené admin uživatele
  if (user?.role === 'admin') {
    return (
      <div className="min-h-screen">
        <Switch>
          <Route path="/admin">
            {() => (
              <AdminRouteGuard>
                <AdminDashboard />
              </AdminRouteGuard>
            )}
          </Route>
          <Route path="/" component={AdminDashboard} />
          <Route component={NotFound} />
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
      <Route path="/recurring-invoices" component={RecurringInvoicesPage} />
      <Route path="/customers" component={Customers} />
      <Route path="/expenses/new">
        {() => <ExpenseCreatePage />}
      </Route>
      <Route path="/expenses/:id/edit">
        {(params: any) => <ExpenseCreatePage key={`edit-${params.id}`} {...params} />}
      </Route>
      <Route path="/expenses/:id">
        {(params: any) => <ExpenseDetail key={`detail-${params.id}`} expenseId={parseInt(params.id)} />}
      </Route>
      <Route path="/expenses" component={ExpensesPage} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/email-settings" component={EmailSettings} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/bank-accounts" component={BankAccountsPage} />
      {/* BEZPEČNOSTNÍ BLOKACE - Admin panel je zakázán pro běžné uživatele */}
      <Route path="/admin">
        {() => (
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-600">🚫 Přístup odepřen</h1>
            <p className="text-gray-600 mb-4">Nemáte oprávnění k přístupu do admin panelu.</p>
            <a href="/dashboard" className="text-blue-600 hover:underline">Zpět na dashboard</a>
          </div>
        )}
      </Route>
      <Route path="/" component={Dashboard} />
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

  // Pokud je uživatel přihlášený, zobrazí autentifikované routes
  if (isAuthenticated) {
    
    // Admin má vlastní layout bez sidebar a header
    if (user?.role === 'admin') {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <AuthenticatedRouter />
        </div>
      );
    }
    
    // Běžní uživatelé mají standardní layout
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <Sidebar />
        <main className="lg:ml-72 min-h-screen">
          <div className="px-4 pt-4 lg:px-8">
            <AuthenticatedRouter />
          </div>
        </main>
        <BottomAIChat />
      </div>
    );
  }

  // Pokud není přihlášený, zobrazí veřejné routes
  return <PublicRouter />;
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