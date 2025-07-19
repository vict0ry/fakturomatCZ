import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { invoiceAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Download, Edit, ArrowLeft, Send, Check, Clock, AlertTriangle, Plus, History, User, Mail } from "lucide-react";
import type { Invoice } from "@/lib/api";
import { InvoiceForm } from "@/components/invoice-form";
import { useState } from "react";

export default function InvoiceDetail() {
  const [, params] = useRoute("/invoices/:id");
  const [location, setLocation] = useLocation();
  const isNew = params?.id === "new";
  const invoiceId = params?.id && !isNew ? parseInt(params.id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showHistory, setShowHistory] = useState(false);

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: () => invoiceAPI.getById(invoiceId!),
    enabled: !!invoiceId,
  });

  const { data: invoiceHistory } = useQuery({
    queryKey: ["/api/invoices", invoiceId, "history"],
    queryFn: () => fetch(`/api/invoices/${invoiceId}/history`).then(res => res.json()),
    enabled: !!invoiceId && showHistory,
  });

  const downloadPDFMutation = useMutation({
    mutationFn: () => invoiceAPI.downloadPDF(invoiceId!),
    onSuccess: (pdfBlob) => {
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `faktura-${invoice?.invoiceNumber}.pdf`;
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
    mutationFn: (status: string) => invoiceAPI.update(invoiceId!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId] });
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

  const formatCurrency = (amount: string | number) => {
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
        return (
          <Badge className="invoice-status-badge paid">
            <Check className="mr-1 h-3 w-3" />
            Uhrazena
          </Badge>
        );
      case 'sent':
        return (
          <Badge className="invoice-status-badge sent">
            <Clock className="mr-1 h-3 w-3" />
            Odeslána
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="invoice-status-badge overdue">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Po splatnosti
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="invoice-status-badge draft">
            <Edit className="mr-1 h-3 w-3" />
            Koncept
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'Faktura';
      case 'proforma':
        return 'Proforma faktura';
      case 'credit_note':
        return 'Dobropis';
      default:
        return type;
    }
  };

  const createInvoiceMutation = useMutation({
    mutationFn: invoiceAPI.create,
    onSuccess: (newInvoice) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Faktura vytvořena",
        description: "Nová faktura byla úspěšně vytvořena.",
      });
      setLocation(`/invoices/${newInvoice.id}`);
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit fakturu.",
        variant: "destructive",
      });
    },
  });

  // Handle creating new invoice
  if (isNew) {

    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/invoices")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zpět na faktury
            </Button>
            <h1 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl">
              Nová faktura
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Vytvořte novou fakturu, proformu nebo dobropis
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                <Plus className="mr-2 h-5 w-5 inline" />
                Vytvořit dokument
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceForm
                onSubmit={createInvoiceMutation.mutate}
                isLoading={createInvoiceMutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!invoiceId) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Neplatné ID faktury</h3>
            <p className="text-neutral-500 mb-6">ID faktury není validní.</p>
            <Button asChild>
              <a href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zpět na faktury
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Faktura nenalezena</h3>
            <p className="text-neutral-500 mb-6">Požadovaná faktura neexistuje nebo byla smazána.</p>
            <Button asChild>
              <a href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zpět na faktury
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
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
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button variant="ghost" asChild className="mr-4">
              <a href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zpět na faktury
              </a>
            </Button>
          </div>
          
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-neutral-900">
                  {getTypeLabel(invoice!.type)} {invoice!.invoiceNumber}
                </h1>
                {getStatusBadge(invoice!.status)}
              </div>
              <p className="text-sm text-neutral-500">
                Vystaveno {formatDate(invoice!.issueDate)} • Splatnost {formatDate(invoice!.dueDate)}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Button
                variant="outline"
                onClick={() => downloadPDFMutation.mutate()}
                disabled={downloadPDFMutation.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                {downloadPDFMutation.isPending ? 'Stahování...' : 'Stáhnout PDF'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="mr-2 h-4 w-4" />
                Historie
              </Button>
              
              <Select
                value={invoice!.status}
                onValueChange={(status) => updateStatusMutation.mutate(status)}
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Koncept</SelectItem>
                  <SelectItem value="sent">Odeslána</SelectItem>
                  <SelectItem value="paid">Uhrazena</SelectItem>
                  <SelectItem value="overdue">Po splatnosti</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Zákazník</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{invoice!.customer?.name}</h3>
                  {invoice!.customer?.address && (
                    <p className="text-neutral-600">{invoice!.customer.address}</p>
                  )}
                  {(invoice!.customer?.city || invoice!.customer?.postalCode) && (
                    <p className="text-neutral-600">
                      {invoice!.customer.postalCode} {invoice!.customer.city}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 pt-2">
                    {invoice!.customer?.ico && (
                      <span className="text-sm text-neutral-500">
                        <strong>IČO:</strong> {invoice!.customer.ico}
                      </span>
                    )}
                    {invoice!.customer?.dic && (
                      <span className="text-sm text-neutral-500">
                        <strong>DIČ:</strong> {invoice!.customer.dic}
                      </span>
                    )}
                    {invoice!.customer?.email && (
                      <span className="text-sm text-neutral-500">
                        <strong>Email:</strong> {invoice!.customer.email}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <CardTitle>Položky faktury</CardTitle>
              </CardHeader>
              <CardContent>
                {invoice!.items && invoice!.items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Popis</TableHead>
                        <TableHead>Množství</TableHead>
                        <TableHead>Jednotková cena</TableHead>
                        <TableHead>DPH %</TableHead>
                        <TableHead className="text-right">Celkem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice!.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell>{item.vatRate}%</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <p>Tato faktura neobsahuje žádné položky.</p>
                  </div>
                )}

                <Separator className="my-4" />
                
                {/* Invoice History Section */}
                {showHistory && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <History className="mr-2 h-5 w-5" />
                      Historie změn faktury
                    </h3>
                    {invoiceHistory && invoiceHistory.length > 0 ? (
                      <div className="space-y-4">
                        {invoiceHistory.map((entry: any) => (
                          <div key={entry.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="font-medium text-sm capitalize">
                                    {entry.action === 'created' && '📄 Vytvoření'}
                                    {entry.action === 'updated' && '✏️ Úprava'}
                                    {entry.action === 'sent' && '📧 Odeslání'}
                                    {entry.action === 'paid' && '💰 Uhrazení'}
                                    {entry.action === 'reminder_sent' && '⏰ Upomínka'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(entry.createdAt).toLocaleString('cs-CZ')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{entry.description}</p>
                                {entry.recipientEmail && (
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Mail className="mr-1 h-3 w-3" />
                                    {entry.recipientEmail}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center text-xs text-gray-500 ml-4">
                                <User className="mr-1 h-3 w-3" />
                                {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : 'Systém'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>Zatím žádná historie změn</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Celkem bez DPH:</span>
                    <span>{formatCurrency(invoice!.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>DPH:</span>
                    <span>{formatCurrency(invoice!.vatAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Celkem k úhradě:</span>
                    <span className="text-primary">{formatCurrency(invoice!.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {invoice!.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Poznámky</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600">{invoice!.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Přehled faktury</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Typ:</span>
                  <span className="font-medium">{getTypeLabel(invoice!.type)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Číslo:</span>
                  <span className="font-medium">{invoice!.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Datum vystavení:</span>
                  <span className="font-medium">{formatDate(invoice!.issueDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Datum splatnosti:</span>
                  <span className="font-medium">{formatDate(invoice!.dueDate)}</span>
                </div>
                {invoice!.paidAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Datum úhrady:</span>
                    <span className="font-medium text-secondary">
                      {formatDate(invoice!.paidAt)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-neutral-500">Stav:</span>
                  {getStatusBadge(invoice!.status)}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Akce</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  asChild
                >
                  <a href={`/invoices/${invoice!.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Upravit fakturu
                  </a>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => downloadPDFMutation.mutate()}
                  disabled={downloadPDFMutation.isPending}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadPDFMutation.isPending ? 'Stahování...' : 'Stáhnout PDF'}
                </Button>
                
                {invoice!.status !== 'sent' && (
                  <Button 
                    className="w-full"
                    onClick={() => updateStatusMutation.mutate('sent')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Označit jako odeslanou
                  </Button>
                )}
                
                {invoice!.status === 'sent' && (
                  <Button 
                    className="w-full bg-secondary hover:bg-green-700"
                    onClick={() => updateStatusMutation.mutate('paid')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Označit jako uhrazenou
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
