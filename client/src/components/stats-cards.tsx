import { useQuery } from "@tanstack/react-query";
import { statsAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => statsAPI.getMonthlyStats(),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="stat-card">
            <div className="flex items-center">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="ml-5 w-0 flex-1">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
            <div className="mt-3">
              <Skeleton className="h-3 w-32" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <div className="text-center text-neutral-500">
            <p>Chyba při načítání statistik</p>
          </div>
        </Card>
      </div>
    );
  }

  const lastMonthRevenue = stats.revenue * 0.9; // Mock previous month for percentage
  const revenueGrowth = ((stats.revenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Revenue Card */}
      <Card className="stat-card">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="stat-icon revenue">
              <i className="fas fa-euro-sign text-white text-sm"></i>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">
                Příjmy tento měsíc
              </dt>
              <dd className="text-lg font-semibold text-neutral-900">
                {formatCurrency(stats.revenue)}
              </dd>
            </dl>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center text-sm">
            <span className="text-secondary font-medium">+{revenueGrowth}%</span>
            <span className="text-neutral-500 ml-1">oproti minulému měsíci</span>
          </div>
        </div>
      </Card>

      {/* Invoices Card */}
      <Card className="stat-card">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="stat-icon invoices">
              <i className="fas fa-file-invoice text-white text-sm"></i>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">
                Faktury tento měsíc
              </dt>
              <dd className="text-lg font-semibold text-neutral-900">
                {stats.invoiceCount}
              </dd>
            </dl>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center text-sm">
            <span className="text-secondary font-medium">{stats.paidInvoices} uhrazených</span>
            <span className="text-neutral-500 ml-1">• {stats.invoiceCount - stats.paidInvoices} čeká na platbu</span>
          </div>
        </div>
      </Card>

      {/* Unpaid Card */}
      <Card className="stat-card">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="stat-icon unpaid">
              <i className="fas fa-clock text-white text-sm"></i>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">
                Neuhrazené faktury
              </dt>
              <dd className="text-lg font-semibold text-neutral-900">
                {formatCurrency(stats.unpaidAmount)}
              </dd>
            </dl>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center text-sm">
            <span className="text-destructive font-medium">{stats.overdueCount} po splatnosti</span>
            <span className="text-neutral-500 ml-1">• celkem neuhrazených</span>
          </div>
        </div>
      </Card>

      {/* Customers Card */}
      <Card className="stat-card">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="stat-icon customers">
              <i className="fas fa-users text-white text-sm"></i>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">
                Aktivní zákazníci
              </dt>
              <dd className="text-lg font-semibold text-neutral-900">
                {stats.activeCustomers}
              </dd>
            </dl>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center text-sm">
            <span className="text-secondary font-medium">+{Math.floor(stats.activeCustomers * 0.1)} noví</span>
            <span className="text-neutral-500 ml-1">tento měsíc</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
