import { useQuery } from "@tanstack/react-query";
import { invoiceAPI } from "@/lib/api";
import { StatsCards } from "@/components/stats-cards";
import { RevenueChart } from "@/components/revenue-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Plus, ExternalLink, AlertTriangle, BarChart3, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices/recent"],
    queryFn: () => invoiceAPI.getRecent(5),
  });

  const { data: overdueInvoices } = useQuery({
    queryKey: ["/api/invoices", "overdue"],
    queryFn: () => invoiceAPI.getAll("overdue"),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="invoice-status-badge paid">Uhrazena</Badge>;
      case 'sent':
        return <Badge className="invoice-status-badge sent">Čeká na platbu</Badge>;
      case 'overdue':
        return <Badge className="invoice-status-badge overdue">Po splatnosti</Badge>;
      case 'draft':
        return <Badge className="invoice-status-badge draft">Koncept</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const overdueAmount = overdueInvoices?.reduce((sum, invoice) => sum + Number(invoice.total), 0) || 0;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Přehled vašeho podnikání za <span className="font-medium">
                {new Date().toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}
              </span>
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Button variant="outline" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analýzy
            </Button>
            <Button variant="outline" className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <a href="/invoices/new" className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Nová faktura
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards />
        </div>

        {/* Revenue Chart */}
        <div className="mb-8">
          <RevenueChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Invoices - Larger column */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <h3 className="text-lg font-medium">Nejnovější faktury</h3>
                <p className="text-sm text-gray-500 mt-1">Posledních 5 vytvořených faktér</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href="/invoices" className="text-primary hover:text-blue-700 text-sm font-medium">
                  Zobrazit vše
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-32 flex-1" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : recentInvoices && recentInvoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Číslo</TableHead>
                      <TableHead>Zákazník</TableHead>
                      <TableHead>Částka</TableHead>
                      <TableHead>Stav</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="invoice-table-row">
                        <TableCell className="font-medium">
                          <a 
                            href={`/invoices/${invoice.id}`}
                            className="text-primary hover:underline"
                          >
                            {invoice.invoiceNumber}
                          </a>
                        </TableCell>
                        <TableCell>{invoice.customer?.name}</TableCell>
                        <TableCell>{formatCurrency(invoice.total)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <i className="fas fa-file-invoice text-4xl mb-4 text-neutral-300"></i>
                  <p>Zatím nemáte žádné faktury</p>
                  <Button asChild className="mt-4">
                    <a href="/invoices/new">Vytvořit první fakturu</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions - Smaller column */}
          <div className="space-y-6">
            {/* Quick Invoice Creation */}
            <Card className="border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Rychlé vytvoření</h3>
                    <p className="text-sm text-gray-500">Nová faktura za 30 sekund</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Zákazník
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Začněte psát název nebo IČO..." 
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm form-input"
                      />
                      <div className="absolute right-3 top-2">
                        <i className="fas fa-search text-neutral-400"></i>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      ARES integrace pro automatické předvyplnění
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Položka
                      </label>
                      <input 
                        type="text" 
                        placeholder="Konzultace, Květy..."
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Částka
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="0"
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 pr-8 text-sm form-input"
                        />
                        <span className="absolute right-3 top-2 text-sm text-neutral-500">Kč</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <a href="/invoices/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Vytvořit fakturu
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Customer Quick Add */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <i className="fas fa-user-plus text-green-600"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Přidat zákazníka</h3>
                    <p className="text-sm text-gray-500">S ARES integrací</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Název nebo IČO
                    </label>
                    <input 
                      type="text" 
                      placeholder="CreativeLand s.r.o. nebo 12345678"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm form-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Email
                      </label>
                      <input 
                        type="email" 
                        placeholder="info@company.cz"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Telefon
                      </label>
                      <input 
                        type="tel" 
                        placeholder="+420 123 456 789"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm form-input"
                      />
                    </div>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                    <a href="/customers/new">
                      <i className="fas fa-user-plus mr-2"></i>
                      Přidat zákazníka
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <i className="fas fa-robot text-purple-600"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">AI Asistent</h3>
                    <p className="text-sm text-gray-500">Chytrá pomoc s faktérami</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Zkuste: "Vytvoř fakturu pro ABC s.r.o. za konzultace 5000 Kč"
                  </p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                      💬 Vytvořit fakturu
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                      📊 Analýza
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
              <CardHeader>
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Rychlé akce</h3>
                    <p className="text-sm text-gray-500">Často používané</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <a href="/invoices?status=overdue">
                      <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                      Faktury po splatnosti
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <a href="/customers">
                      <i className="fas fa-users w-4 h-4 mr-2 text-blue-500"></i>
                      Správa zákazníků
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <a href="/settings">
                      <i className="fas fa-cog w-4 h-4 mr-2 text-gray-500"></i>
                      Nastavení
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Unpaid Invoices Alert */}
        {overdueInvoices && overdueInvoices.length > 0 && (
          <div className="mt-8">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-800">
                <h3 className="font-medium mb-2">
                  Upozornění na neuhrazené faktury
                </h3>
                <p className="mb-4">
                  Máte <strong>{overdueInvoices.length} faktury po splatnosti</strong> v celkové výši{" "}
                  <strong>{formatCurrency(overdueAmount.toString())}</strong>. Doporučujeme odeslat připomínku.
                </p>
                <div className="flex space-x-3">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="bg-red-100 border-red-200 text-red-800 hover:bg-red-200"
                    asChild
                  >
                    <a href="/invoices?status=overdue">
                      Zobrazit faktury
                    </a>
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="bg-red-100 border-red-200 text-red-800 hover:bg-red-200"
                  >
                    Odeslat připomínky
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
