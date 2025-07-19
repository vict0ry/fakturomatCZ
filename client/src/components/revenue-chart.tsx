import { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';

// Mock data pro demo - v produkci by se načítalo z API
const monthlyData = [
  {
    month: 'Leden',
    shortMonth: 'Led',
    revenue: 150000,
    expenses: 80000,
    profit: 70000,
    invoiceCount: 12,
    paidInvoices: 10,
    unpaidInvoices: 2,
  },
  {
    month: 'Únor', 
    shortMonth: 'Úno',
    revenue: 220000,
    expenses: 95000,
    profit: 125000,
    invoiceCount: 18,
    paidInvoices: 16,
    unpaidInvoices: 2,
  },
  {
    month: 'Březen',
    shortMonth: 'Bře',
    revenue: 180000,
    expenses: 90000,
    profit: 90000,
    invoiceCount: 15,
    paidInvoices: 13,
    unpaidInvoices: 2,
  },
  {
    month: 'Duben',
    shortMonth: 'Dub',
    revenue: 320000,
    expenses: 120000,
    profit: 200000,
    invoiceCount: 24,
    paidInvoices: 22,
    unpaidInvoices: 2,
  },
  {
    month: 'Květen',
    shortMonth: 'Kvě',
    revenue: 280000,
    expenses: 110000,
    profit: 170000,
    invoiceCount: 20,
    paidInvoices: 18,
    unpaidInvoices: 2,
  },
  {
    month: 'Červen',
    shortMonth: 'Čer',
    revenue: 350000,
    expenses: 140000,
    profit: 210000,
    invoiceCount: 26,
    paidInvoices: 24,
    unpaidInvoices: 2,
  },
];

const yearlyData = [
  { year: '2022', revenue: 2100000, profit: 1200000 },
  { year: '2023', revenue: 2800000, profit: 1650000 },
  { year: '2024', revenue: 3200000, profit: 1890000 },
];

export function RevenueChart() {
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');
  const [viewType, setViewType] = useState<'revenue' | 'invoices'>('revenue');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M Kč`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K Kč`;
    }
    return formatCurrency(value);
  };

  const currentData = activeTab === 'monthly' ? monthlyData : yearlyData;
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  const revenueGrowth = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium text-gray-900">
                {entry.name.includes('počet') ? entry.value : formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Přehled výkonnosti
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Analýza příjmů a faktér za posledních 6 měsíců
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewType === 'revenue' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('revenue')}
                className="text-xs"
              >
                <DollarSign className="w-3 h-3 mr-1" />
                Příjmy
              </Button>
              <Button
                variant={viewType === 'invoices' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('invoices')}
                className="text-xs"
              >
                <Calendar className="w-3 h-3 mr-1" />
                Faktury
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-700">Příjmy tento měsíc</p>
                <p className="text-lg font-bold text-blue-900">
                  {formatShortCurrency(currentMonth.revenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-700">Zisk tento měsíc</p>
                <p className="text-lg font-bold text-green-900">
                  {formatShortCurrency(currentMonth.profit)}
                </p>
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-r p-4 rounded-lg ${
            revenueGrowth >= 0 
              ? 'from-emerald-50 to-emerald-100' 
              : 'from-red-50 to-red-100'
          }`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${
                revenueGrowth >= 0 ? 'bg-emerald-500' : 'bg-red-500'
              }`}>
                {revenueGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-white" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  revenueGrowth >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  Růst MoM
                </p>
                <p className={`text-lg font-bold ${
                  revenueGrowth >= 0 ? 'text-emerald-900' : 'text-red-900'
                }`}>
                  {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-700">Faktury tento měsíc</p>
                <p className="text-lg font-bold text-purple-900">
                  {currentMonth.invoiceCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {viewType === 'revenue' ? (
              <ComposedChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="shortMonth" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#D1D5DB' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#D1D5DB' }}
                  tickFormatter={formatShortCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#revenueGradient)"
                  name="Příjmy"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="expenses" 
                  fill="url(#expenseGradient)"
                  name="Výdaje"
                  radius={[4, 4, 0, 0]}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  name="Zisk"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2, fill: '#ffffff' }}
                />
              </ComposedChart>
            ) : (
              <ComposedChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="shortMonth" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#D1D5DB' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#D1D5DB' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="paidInvoices" 
                  fill="#22C55E"
                  name="Uhrazené faktury"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="unpaidInvoices" 
                  fill="#EF4444"
                  name="Neuhrazené faktury"
                  radius={[4, 4, 0, 0]}
                />
                <Line 
                  type="monotone" 
                  dataKey="invoiceCount" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  name="Celkový počet faktér"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2, fill: '#ffffff' }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-500">Nezaplacené</p>
            <div className="flex items-center mt-1">
              <p className="text-lg font-bold text-red-600">
                {formatShortCurrency(currentMonth.revenue * 0.15)}
              </p>
              <span className="ml-2 text-sm text-red-500">
                {currentMonth.unpaidInvoices} faktér
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Po splatnosti</p>
            <div className="flex items-center mt-1">
              <p className="text-lg font-bold text-orange-600">
                {formatShortCurrency(currentMonth.revenue * 0.08)}
              </p>
              <span className="ml-2 text-sm text-orange-500">
                1 faktura
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Průměrná faktura</p>
            <div className="flex items-center mt-1">
              <p className="text-lg font-bold text-blue-600">
                {formatShortCurrency(currentMonth.revenue / currentMonth.invoiceCount)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Úspěšnost plateb</p>
            <div className="flex items-center mt-1">
              <p className="text-lg font-bold text-green-600">
                {Math.round((currentMonth.paidInvoices / currentMonth.invoiceCount) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}