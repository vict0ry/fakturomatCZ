import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const data = [
  { name: 'Led', revenue: 65000, expenses: 35000, invoices: 12 },
  { name: 'Úno', revenue: 78000, expenses: 42000, invoices: 15 },
  { name: 'Bře', revenue: 85000, expenses: 38000, invoices: 18 },
  { name: 'Dub', revenue: 92000, expenses: 45000, invoices: 22 },
  { name: 'Kvě', revenue: 108000, expenses: 52000, invoices: 25 },
  { name: 'Čer', revenue: 125000, expenses: 48000, invoices: 28 },
];

export function RevenueChart() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Finanční přehled</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Přehled příjmů, výdajů a počtu faktér za posledních 6 měsíců
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue and Expenses Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Příjmy a výdaje</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Příjmy"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  name="Výdaje"
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#ef4444', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Invoice Count Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Počet faktér</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => [value, 'Faktér']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="invoices" 
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Počet faktér"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 p-4 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400">Celkový zisk</div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(data.reduce((acc, month) => acc + (month.revenue - month.expenses), 0))}
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 p-4 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400">Průměrný měsíční příjem</div>
            <div className="text-xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(data.reduce((acc, month) => acc + month.revenue, 0) / data.length)}
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 p-4 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400">Celkem faktér</div>
            <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
              {data.reduce((acc, month) => acc + month.invoices, 0)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}