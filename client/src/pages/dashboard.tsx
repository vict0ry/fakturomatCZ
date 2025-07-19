import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { invoiceAPI } from "@/lib/api";
import { DraggableDashboard } from "@/components/draggable-dashboard";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Plus, AlertTriangle, BarChart3, Settings } from "lucide-react";

export default function Dashboard() {
  const [isEditMode, setIsEditMode] = useState(false);

  const { data: overdueInvoices } = useQuery({
    queryKey: ["/api/invoices", "overdue"],
    queryFn: () => invoiceAPI.getAll("overdue"),
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
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
            <ThemeToggle />
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <Settings className="mr-2 h-4 w-4" />
              {isEditMode ? 'Dokončit úpravy' : 'Upravit dashboard'}
            </Button>
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

        {/* Draggable Dashboard */}
        <DraggableDashboard 
          isEditMode={isEditMode} 
          onToggleEditMode={() => setIsEditMode(!isEditMode)} 
        />

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
