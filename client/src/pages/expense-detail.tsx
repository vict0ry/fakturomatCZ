import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, FileText, Calendar, DollarSign, Building2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: number;
  expenseNumber: string;
  description: string;
  category: string;
  amount: string;
  vatAmount: string;
  total: string;
  vatRate: string;
  expenseDate: string;
  receiptNumber?: string;
  status: string;
  supplier?: {
    id: number;
    name: string;
    ico?: string;
    dic?: string;
    address?: string;
  };
  items?: Array<{
    id: number;
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }>;
}

interface ExpenseDetailProps {
  expenseId: number;
}

export default function ExpenseDetail({ expenseId }: ExpenseDetailProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: expense, isLoading, error } = useQuery<Expense>({
    queryKey: ['/api/expenses', expenseId],
    enabled: !!expenseId
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Náklad nenalezen
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Požadovaný náklad neexistuje nebo k němu nemáte přístup.
          </p>
          <Button onClick={() => setLocation('/expenses')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět na náklady
          </Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
    }).format(Number(amount));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { label: 'Koncept', variant: 'secondary' as const },
      submitted: { label: 'Odesláno', variant: 'default' as const },
      approved: { label: 'Schváleno', variant: 'default' as const },
      paid: { label: 'Zaplaceno', variant: 'default' as const },
      rejected: { label: 'Zamítnuto', variant: 'destructive' as const },
    };
    
    const config = variants[status as keyof typeof variants] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/expenses')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Náklad {expense.expenseNumber}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Detail nákladu
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusBadge(expense.status)}
          <Button 
            onClick={() => setLocation(`/expenses/${expenseId}/edit`)}
            className="ml-4"
          >
            <Edit className="w-4 h-4 mr-2" />
            Upravit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Základní informace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Číslo nákladu
                  </label>
                  <p className="font-medium">{expense.expenseNumber}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Kategorie
                  </label>
                  <div className="flex items-center mt-1">
                    <Tag className="w-4 h-4 mr-1 text-gray-500" />
                    <span>{expense.category}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Datum nákladu
                  </label>
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                    <span>{new Date(expense.expenseDate).toLocaleDateString('cs-CZ')}</span>
                  </div>
                </div>
                
                {expense.receiptNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Číslo účtenky
                    </label>
                    <p className="font-medium">{expense.receiptNumber}</p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Popis
                </label>
                <p className="mt-1">{expense.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Info */}
          {expense.supplier && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Dodavatel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium text-lg">{expense.supplier.name}</p>
                  {expense.supplier.ico && (
                    <p className="text-gray-600 dark:text-gray-400">
                      IČO: {expense.supplier.ico}
                    </p>
                  )}
                  {expense.supplier.dic && (
                    <p className="text-gray-600 dark:text-gray-400">
                      DIČ: {expense.supplier.dic}
                    </p>
                  )}
                  {expense.supplier.address && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {expense.supplier.address}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Financial Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Finanční údaje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Částka bez DPH:</span>
                  <span className="font-medium">{formatCurrency(expense.amount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">DPH ({expense.vatRate}%):</span>
                  <span className="font-medium">{formatCurrency(expense.vatAmount)}</span>
                </div>
                
                <hr className="my-2" />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Celkem:</span>
                  <span>{formatCurrency(expense.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expense Items */}
          {expense.items && expense.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Položky nákladu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expense.items.map((item: any, index: number) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.quantity} × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}