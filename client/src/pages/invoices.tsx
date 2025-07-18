import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Download, Eye, Edit, Trash2 } from "lucide-react";

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices", statusFilter],
    queryFn: () => invoiceAPI.getAll(statusFilter || undefined),
  });

  const downloadPDFMutation = useMutation({
    mutationFn: (invoiceId: number) => invoiceAPI.downloadPDF(invoiceId),
    onSuccess: (pdfBlob, invoiceId) => {
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `faktura-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: "PDF staženo",
        description: "Faktura byla úspěšně stažena.",
      });
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se stáhnout PDF faktury.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      invoiceAPI.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Stav aktualizován",
        description: "Stav faktury byl úspěšně změněn.",
      });
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat stav faktury.",
        variant: "destructive",
      });
    },
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
        return <Badge className="invoice-status-badge sent">Odeslána</Badge>;
      case 'overdue':
        return <Badge className="invoice-status-badge overdue">Po splatnosti</Badge>;
      case 'draft':
        return <Badge className="invoice-status-badge draft">Koncept</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'Faktura';
      case 'proforma':
        return 'Proforma';
      case 'credit_note':
        return 'Dobropis';
      default:
        return type;
    }
  };

  const filteredInvoices = invoices?.filter(invoice => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      invoice.customer?.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
              Faktury
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Správa všech vašich faktur, proform a dobropisů
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button asChild>
              <a href="/invoices/new">
                <Plus className="mr-2 h-4 w-4" />
                Nová faktura
              </a>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input
                  placeholder="Hledat podle čísla faktury nebo zákazníka..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrovat podle stavu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Všechny stavy</SelectItem>
                  <SelectItem value="draft">Koncepty</SelectItem>
                  <SelectItem value="sent">Odeslané</SelectItem>
                  <SelectItem value="paid">Uhrazené</SelectItem>
                  <SelectItem value="overdue">Po splatnosti</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Typ dokumentu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny typy</SelectItem>
                  <SelectItem value="invoice">Faktury</SelectItem>
                  <SelectItem value="proforma">Proformy</SelectItem>
                  <SelectItem value="credit_note">Dobropisy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {filteredInvoices ? `${filteredInvoices.length} faktur` : 'Faktury'}
              </h3>
              {statusFilter && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStatusFilter("")}
                >
                  Zrušit filtr
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32 flex-1" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                ))}
              </div>
            ) : filteredInvoices && filteredInvoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Číslo</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Zákazník</TableHead>
                    <TableHead>Datum vystavení</TableHead>
                    <TableHead>Datum splatnosti</TableHead>
                    <TableHead>Částka</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead>Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="invoice-table-row">
                      <TableCell className="font-medium">
                        <a 
                          href={`/invoices/${invoice.id}`}
                          className="text-primary hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </a>
                      </TableCell>
                      <TableCell>{getTypeLabel(invoice.type)}</TableCell>
                      <TableCell>{invoice.customer?.name}</TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            asChild
                          >
                            <a href={`/invoices/${invoice.id}`}>
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => downloadPDFMutation.mutate(invoice.id)}
                            disabled={downloadPDFMutation.isPending}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Select
                            value={invoice.status}
                            onValueChange={(status) => 
                              updateStatusMutation.mutate({ id: invoice.id, status })
                            }
                          >
                            <SelectTrigger className="w-auto h-8 text-xs">
                              <Edit className="h-3 w-3" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Koncept</SelectItem>
                              <SelectItem value="sent">Odeslána</SelectItem>
                              <SelectItem value="paid">Uhrazena</SelectItem>
                              <SelectItem value="overdue">Po splatnosti</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-neutral-500">
                <i className="fas fa-file-invoice text-6xl mb-4 text-neutral-300"></i>
                <h3 className="text-lg font-medium mb-2">Žádné faktury</h3>
                <p className="mb-6">
                  {searchQuery || statusFilter 
                    ? "Podle zadaných kritérií nebyly nalezeny žádné faktury."
                    : "Zatím nemáte vytvořené žádné faktury."
                  }
                </p>
                {!searchQuery && !statusFilter && (
                  <Button asChild>
                    <a href="/invoices/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Vytvořit první fakturu
                    </a>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
