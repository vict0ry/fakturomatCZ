import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  customers: {
    total: number;
    active: number;
    inactive: number;
  };
  monthlyData: {
    month: string;
    revenue: number;
    invoices: number;
  }[];
}

export default function Analytics() {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['/api/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
      });
      if (!response.ok) throw new Error('Nepodařilo se načíst analytické data');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Načítání analytických dat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Nepodařilo se načíst analytické data</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mockAnalytics: AnalyticsData = {
    revenue: {
      current: 148500,
      previous: 132400,
      growth: 12.2,
    },
    invoices: {
      total: 156,
      paid: 128,
      pending: 18,
      overdue: 10,
    },
    customers: {
      total: 67,
      active: 58,
      inactive: 9,
    },
    monthlyData: [
      { month: 'Led', revenue: 95000, invoices: 28 },
      { month: 'Úno', revenue: 108000, invoices: 32 },
      { month: 'Bře', revenue: 125000, invoices: 35 },
      { month: 'Dub', revenue: 142000, invoices: 38 },
      { month: 'Kvě', revenue: 155000, invoices: 42 },
      { month: 'Čer', revenue: 148500, invoices: 39 },
    ],
  };

  const data = analytics || mockAnalytics;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analýzy a přehledy</h1>
        <p className="text-gray-600 mt-2">
          Podrobné statistiky vašeho podnikání a výkonnosti
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkové tržby</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.revenue.current.toLocaleString('cs-CZ')} Kč
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {data.revenue.growth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={data.revenue.growth > 0 ? 'text-green-500' : 'text-red-500'}>
                {data.revenue.growth > 0 ? '+' : ''}{data.revenue.growth}%
              </span>
              <span>oproti minulému měsíci</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faktury celkem</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.invoices.total}</div>
            <div className="text-xs text-muted-foreground">
              {data.invoices.paid} zaplacených, {data.invoices.pending} čekající
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivní zákazníci</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.customers.active}</div>
            <div className="text-xs text-muted-foreground">
              z {data.customers.total} celkem
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Úspěšnost plateb</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((data.invoices.paid / data.invoices.total) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {data.invoices.overdue} po splatnosti
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Stav faktur</span>
            </CardTitle>
            <CardDescription>
              Přehled stavu všech vystavených faktur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Zaplacené</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{data.invoices.paid}</span>
                  <Badge variant="secondary">
                    {Math.round((data.invoices.paid / data.invoices.total) * 100)}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={(data.invoices.paid / data.invoices.total) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Čekající na platbu</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{data.invoices.pending}</span>
                  <Badge variant="outline">
                    {Math.round((data.invoices.pending / data.invoices.total) * 100)}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={(data.invoices.pending / data.invoices.total) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Po splatnosti</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{data.invoices.overdue}</span>
                  <Badge variant="destructive">
                    {Math.round((data.invoices.overdue / data.invoices.total) * 100)}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={(data.invoices.overdue / data.invoices.total) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Měsíční trendy</span>
            </CardTitle>
            <CardDescription>
              Vývoj tržeb za posledních 6 měsíců
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.monthlyData.map((month, index) => (
                <div key={month.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 text-sm font-medium text-gray-500">
                      {month.month}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {month.revenue.toLocaleString('cs-CZ')} Kč
                        </span>
                        <span className="text-xs text-gray-500">
                          {month.invoices} faktur
                        </span>
                      </div>
                      <Progress 
                        value={(month.revenue / Math.max(...data.monthlyData.map(m => m.revenue))) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Přehledy zákazníků</span>
          </CardTitle>
          <CardDescription>
            Analýza zákaznické základny a jejich aktivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{data.customers.total}</div>
              <div className="text-sm text-gray-500 mt-1">Celkem zákazníků</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{data.customers.active}</div>
              <div className="text-sm text-gray-500 mt-1">Aktivní zákazníci</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {Math.round(data.revenue.current / data.customers.active).toLocaleString('cs-CZ')} Kč
              </div>
              <div className="text-sm text-gray-500 mt-1">Průměrné tržby na zákazníka</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}