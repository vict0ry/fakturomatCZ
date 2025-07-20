import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { 
  Plus, Search, Filter, Calendar, Receipt, Building, 
  CreditCard, Eye, Edit, Trash2, CheckCircle, Clock 
} from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface Expense {
  id: number;
  expenseNumber: string;
  description: string;
  category: string | null;
  amount: string;
  vatAmount: string;
  total: string;
  status: string;
  expenseDate: string;
  receiptNumber: string | null;
  supplier: {
    id: number;
    name: string;
    email?: string;
  };
  createdAt: string;
}

const statusColors = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
};

const statusIcons = {
  draft: Clock,
  submitted: Eye,
  approved: CheckCircle,
  paid: CreditCard,
  rejected: Trash2
};

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  const filteredExpenses = expenses?.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  }) || [];

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.total), 0);
  const categories = [...new Set(expenses?.map(e => e.category).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Náklady a výdaje</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Spravujte firemní náklady, účtenky a výdaje
          </p>
        </div>
        <Link href="/expenses/new">
          <Button className="bg-orange-600 hover:bg-orange-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nový náklad
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Celkové náklady</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalExpenses.toLocaleString('cs-CZ')} Kč
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              z {filteredExpenses.length} nákladů
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tento měsíc</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expenses?.filter(e => new Date(e.expenseDate).getMonth() === new Date().getMonth()).length || 0}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              nových nákladů
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Neschválené</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {expenses?.filter(e => e.status === 'draft' || e.status === 'submitted').length || 0}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              čeká na schválení
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Vyhledat náklady..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny statusy</SelectItem>
                <SelectItem value="draft">Koncept</SelectItem>
                <SelectItem value="submitted">Odesláno</SelectItem>
                <SelectItem value="approved">Schváleno</SelectItem>
                <SelectItem value="paid">Zaplaceno</SelectItem>
                <SelectItem value="rejected">Zamítnuto</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny kategorie</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category || ''}>
                    {category || 'Nezařazeno'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
            >
              Vymazat filtry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Seznam nákladů</CardTitle>
          <CardDescription>
            {filteredExpenses.length} nákladů
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Žádné náklady
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                    ? "Nebyli nalezeni žádní náklady odpovídající vašim filtrům."
                    : "Zatím nemáte žádné zaznamenané náklady."}
                </p>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Vytvořit první náklad
                </Button>
              </div>
            ) : (
              filteredExpenses.map((expense) => {
                const StatusIcon = statusIcons[expense.status as keyof typeof statusIcons] || Clock;
                return (
                  <div key={expense.id} className="border rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {expense.description}
                          </h3>
                          <Badge 
                            className={statusColors[expense.status as keyof typeof statusColors]}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {expense.status === 'draft' && 'Koncept'}
                            {expense.status === 'submitted' && 'Odesláno'}
                            {expense.status === 'approved' && 'Schváleno'}
                            {expense.status === 'paid' && 'Zaplaceno'}
                            {expense.status === 'rejected' && 'Zamítnuto'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            <span>{expense.supplier.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(new Date(expense.expenseDate), "d. M. yyyy", { locale: cs })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4" />
                            <span>
                              {expense.receiptNumber || expense.expenseNumber}
                            </span>
                          </div>
                        </div>

                        {expense.category && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {expense.category}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {parseFloat(expense.total).toLocaleString('cs-CZ')} Kč
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          včetně DPH
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}