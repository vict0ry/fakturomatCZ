import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Eye, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface PublicInvoiceData {
  id: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  total: string;
  status: string;
  currency: string;
  customer: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  company: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    ico?: string;
    dic?: string;
    phone?: string;
    email?: string;
    bankAccount?: string;
  };
  items: Array<{
    description: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    total: string;
  }>;
  subtotal: string;
  vatAmount: string;
  notes?: string;
}

interface PublicInvoicePageProps {
  token?: string;
}

export default function PublicInvoicePage({ token }: PublicInvoicePageProps) {
  const [invoice, setInvoice] = useState<PublicInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetchPublicInvoice(token);
  }, [token]);

  const fetchPublicInvoice = async (token: string) => {
    try {
      const response = await fetch(`/api/public/invoice/${token}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Faktura nebyla nalezena nebo odkaz vypršel');
        }
        throw new Error('Chyba při načítání faktury');
      }
      
      const data = await response.json();
      setInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neočekávaná chyba');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`/api/public/invoice/${token}/pdf`);
      if (!response.ok) throw new Error('Chyba při stahování PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `faktura-${invoice?.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Zaplaceno';
      case 'sent': return 'Odesláno';
      case 'overdue': return 'Po splatnosti';
      case 'draft': return 'Koncept';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Načítání faktury...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Chyba</CardTitle>
            <CardDescription>{error || 'Faktura nebyla nalezena'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Faktura</h1>
          <p className="text-gray-600 mt-2">Bezpečný přístup k faktuře</p>
        </div>

        <Card className="mb-6">
          <CardHeader className="bg-orange-50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">
                  Faktura č. {invoice.invoiceNumber}
                </CardTitle>
                <CardDescription className="text-lg mt-1">
                  {invoice.company.name}
                </CardDescription>
              </div>
              <div className="text-right">
                <Badge className={getStatusColor(invoice.status)}>
                  {getStatusText(invoice.status)}
                </Badge>
                <div className="text-3xl font-bold text-orange-600 mt-2">
                  {parseFloat(invoice.total).toLocaleString('cs-CZ')} {invoice.currency}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Company and Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Dodavatel</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="font-medium">{invoice.company.name}</div>
                  <div>{invoice.company.address}</div>
                  <div>{invoice.company.postalCode} {invoice.company.city}</div>
                  {invoice.company.ico && <div>IČO: {invoice.company.ico}</div>}
                  {invoice.company.dic && <div>DIČ: {invoice.company.dic}</div>}
                  {invoice.company.email && <div>Email: {invoice.company.email}</div>}
                  {invoice.company.phone && <div>Tel: {invoice.company.phone}</div>}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Odběratel</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="font-medium">{invoice.customer.name}</div>
                  {invoice.customer.address && <div>{invoice.customer.address}</div>}
                  {invoice.customer.city && (
                    <div>{invoice.customer.postalCode} {invoice.customer.city}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-xs text-gray-500">Datum vystavení</div>
                  <div className="font-medium">
                    {format(new Date(invoice.issueDate), 'dd.MM.yyyy', { locale: cs })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-xs text-gray-500">Datum splatnosti</div>
                  <div className="font-medium">
                    {format(new Date(invoice.dueDate), 'dd.MM.yyyy', { locale: cs })}
                  </div>
                </div>
              </div>
              {invoice.company.bankAccount && (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Bankovní účet</div>
                    <div className="font-medium text-xs">{invoice.company.bankAccount}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Položky faktury</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-sm font-medium text-gray-900">Popis</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-900">Množství</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-900">Jedn. cena</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-900">Celkem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 text-sm">{item.description}</td>
                        <td className="py-3 text-sm text-right">{item.quantity} {item.unit}</td>
                        <td className="py-3 text-sm text-right">
                          {parseFloat(item.unitPrice).toLocaleString('cs-CZ')} {invoice.currency}
                        </td>
                        <td className="py-3 text-sm text-right font-medium">
                          {parseFloat(item.total).toLocaleString('cs-CZ')} {invoice.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-6">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{parseFloat(invoice.subtotal).toLocaleString('cs-CZ')} {invoice.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>DPH (21%):</span>
                  <span>{parseFloat(invoice.vatAmount).toLocaleString('cs-CZ')} {invoice.currency}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Celkem:</span>
                  <span>{parseFloat(invoice.total).toLocaleString('cs-CZ')} {invoice.currency}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Poznámky</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <Button onClick={downloadPDF} className="bg-orange-600 hover:bg-orange-700">
                <Download className="h-4 w-4 mr-2" />
                Stáhnout PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Tato faktura byla zobrazena prostřednictvím bezpečného odkazu</p>
        </div>
      </div>
    </div>
  );
}