import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { customerAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, Mail, Phone, MapPin, Hash, Edit, FileText, Calendar, DollarSign } from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('cs-CZ');
}

export default function CustomerDetail() {
  const [, params] = useRoute("/customers/:id");
  const [, setLocation] = useLocation();
  const customerId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ["/api/customers", customerId],
    queryFn: () => fetch(`/api/customers/${customerId}`).then(res => res.json()),
    enabled: !!customerId,
  });

  // Get customer invoices
  const { data: customerInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices", "customer", customerId],
    queryFn: () => fetch(`/api/invoices?customerId=${customerId}`).then(res => res.json()),
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-48" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Zákazník nenalezen</h1>
            <p className="text-gray-600 mb-6">Zákazník s ID {customerId} neexistuje nebo nemáte oprávnění k jeho zobrazení.</p>
            <Button onClick={() => setLocation("/customers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zpět na zákazníky
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Button variant="ghost" onClick={() => setLocation("/customers")} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zpět na zákazníky
            </Button>
          </div>
          
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">
                    {customer.name}
                  </h1>
                  <div className="flex items-center space-x-2">
                    {customer.source === 'ares' && (
                      <Badge variant="secondary" className="text-xs">
                        ARES
                      </Badge>
                    )}
                    <Badge variant={customer.isActive ? "default" : "secondary"}>
                      {customer.isActive ? "Aktivní" : "Neaktivní"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Upravit
              </Button>
              
              <Button onClick={() => setLocation("/invoices/new")}>
                <FileText className="mr-2 h-4 w-4" />
                Nová faktura
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Základní informace
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Název společnosti</label>
                      <p className="text-lg font-semibold">{customer.name}</p>
                    </div>
                    
                    {customer.ico && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">IČO</label>
                        <p className="flex items-center">
                          <Hash className="mr-1 h-4 w-4 text-gray-400" />
                          {customer.ico}
                        </p>
                      </div>
                    )}
                    
                    {customer.dic && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">DIČ</label>
                        <p className="flex items-center">
                          <Hash className="mr-1 h-4 w-4 text-gray-400" />
                          {customer.dic}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {customer.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="flex items-center">
                          <Mail className="mr-1 h-4 w-4 text-gray-400" />
                          <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                            {customer.email}
                          </a>
                        </p>
                      </div>
                    )}
                    
                    {customer.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Telefon</label>
                        <p className="flex items-center">
                          <Phone className="mr-1 h-4 w-4 text-gray-400" />
                          <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                            {customer.phone}
                          </a>
                        </p>
                      </div>
                    )}
                    
                    {(customer.address || customer.city) && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Adresa</label>
                        <p className="flex items-start">
                          <MapPin className="mr-1 h-4 w-4 text-gray-400 mt-0.5" />
                          <span>
                            {customer.address && <>{customer.address}<br /></>}
                            {customer.city && customer.postalCode && `${customer.postalCode} ${customer.city}`}
                            {customer.country && <><br />{customer.country}</>}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Historie faktur ({customerInvoices?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : customerInvoices && customerInvoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Číslo faktury</TableHead>
                        <TableHead>Datum vystavení</TableHead>
                        <TableHead>Splatnost</TableHead>
                        <TableHead>Částka</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerInvoices.slice(0, 10).map((invoice: any) => (
                        <TableRow key={invoice.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell className="font-medium">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3 text-gray-400" />
                              {formatDate(invoice.issueDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(invoice.dueDate)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <DollarSign className="mr-1 h-3 w-3 text-gray-400" />
                              {formatCurrency(parseFloat(invoice.total))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              invoice.status === 'paid' ? 'default' : 
                              invoice.status === 'sent' ? 'secondary' : 
                              invoice.status === 'overdue' ? 'destructive' : 
                              'outline'
                            }>
                              {invoice.status === 'paid' ? 'Uhrazeno' :
                               invoice.status === 'sent' ? 'Odesláno' :
                               invoice.status === 'overdue' ? 'Po splatnosti' :
                               'Koncept'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setLocation(`/invoices/${invoice.id}`)}
                            >
                              Zobrazit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Žádné faktury pro tohoto zákazníka</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setLocation("/invoices/new")}
                    >
                      Vytvořit první fakturu
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistiky</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Celkem faktur</span>
                    <span className="font-semibold">{customerInvoices?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Uhrazené faktury</span>
                    <span className="font-semibold">
                      {customerInvoices?.filter((inv: any) => inv.status === 'paid').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Celkový obrat</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        customerInvoices?.reduce((sum: number, inv: any) => 
                          sum + parseFloat(inv.total), 0) || 0
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Meta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Vytvořeno</span>
                    <p className="text-sm">{formatDate(customer.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Naposledy upraveno</span>
                    <p className="text-sm">{formatDate(customer.updatedAt)}</p>
                  </div>
                  {customer.source && (
                    <div>
                      <span className="text-sm text-gray-500">Zdroj</span>
                      <p className="text-sm capitalize">{customer.source}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}