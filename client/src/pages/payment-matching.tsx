import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { 
  Activity, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Download,
  Upload,
  Settings,
  BarChart3
} from 'lucide-react';

interface PaymentStats {
  totalPayments: number;
  matchedPayments: number;
  unmatchedPayments: number;
  matchRate: number;
  lastProcessed: string | null;
}

interface BankTransaction {
  id: number;
  amount: number;
  currency: string;
  description: string;
  variableSymbol: string;
  counterpartyName: string;
  transactionDate: string;
  isMatched: boolean;
  matchedInvoiceId: number | null;
}

interface PaymentMatch {
  id: number;
  paymentAmount: number;
  paymentDate: string;
  variableSymbol: string;
  counterpartyName: string;
  matchType: string;
  matchConfidence: number;
  status: string;
  notes: string;
  matchedAt: string;
}

export default function PaymentMatchingPage() {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [matches, setMatches] = useState<PaymentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const statsResponse = await apiRequest('/api/payment-matching/stats');
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      
      // Load transactions
      const transactionsResponse = await apiRequest('/api/payment-matching/transactions?limit=20');
      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.data);
      }
      
      // Load matches
      const matchesResponse = await apiRequest('/api/payment-matching/matches?limit=20');
      if (matchesResponse.success) {
        setMatches(matchesResponse.data);
      }
      
    } catch (error) {
      console.error('Error loading payment matching data:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst data o párování plateb",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestProcessing = async () => {
    try {
      setProcessing(true);
      
      // Get first bank account for testing
      const bankAccountsResponse = await apiRequest('/api/bank-accounts');
      if (!bankAccountsResponse.success || bankAccountsResponse.data.length === 0) {
        toast({
          title: "Chyba",
          description: "Nemáte žádný bankovní účet pro testování",
          variant: "destructive"
        });
        return;
      }
      
      const bankAccount = bankAccountsResponse.data[0];
      
      const response = await apiRequest('/api/payment-matching/test', {
        method: 'POST',
        body: { bankAccountId: bankAccount.id }
      });
      
      if (response.success) {
        toast({
          title: "Úspěch",
          description: response.message
        });
        loadData(); // Reload data
      } else {
        toast({
          title: "Chyba",
          description: response.message,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Error testing payment processing:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se otestovat zpracování plateb",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'CZK') => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'automatic': return 'bg-green-100 text-green-800';
      case 'manual': return 'bg-blue-100 text-blue-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched': return 'bg-green-100 text-green-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Párování plateb</h1>
          <p className="text-muted-foreground">
            Automatické přiřazování příchozích plateb k fakturám
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleTestProcessing} 
            disabled={processing}
            variant="outline"
          >
            {processing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Test zpracování
          </Button>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Obnovit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Celkem plateb</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayments}</div>
              <p className="text-xs text-muted-foreground">
                Všechny zpracované platby
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spárováno</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.matchedPayments}</div>
              <p className="text-xs text-muted-foreground">
                Úspěšně spárované platby
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nespárováno</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.unmatchedPayments}</div>
              <p className="text-xs text-muted-foreground">
                Platby k manuálnímu zpracování
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Úspěšnost</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.matchRate}%</div>
              <Progress value={stats.matchRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Automatické párování
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Last processed info */}
      {stats?.lastProcessed && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Poslední zpracování: {formatDate(stats.lastProcessed)}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Bankovní transakce</TabsTrigger>
          <TabsTrigger value="matches">Spárované platby</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Poslední transakce</CardTitle>
              <CardDescription>
                Přehled všech bankovních transakcí a jejich stav párování
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Částka</TableHead>
                    <TableHead>Protistrana</TableHead>
                    <TableHead>VS</TableHead>
                    <TableHead>Popis</TableHead>
                    <TableHead>Stav</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </TableCell>
                      <TableCell>{transaction.counterpartyName || '-'}</TableCell>
                      <TableCell>{transaction.variableSymbol || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.isMatched ? "default" : "secondary"}
                          className={transaction.isMatched ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {transaction.isMatched ? 'Spárováno' : 'Nespárováno'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {transactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Žádné transakce k zobrazení
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spárované platby</CardTitle>
              <CardDescription>
                Historie úspěšně spárovaných plateb s fakturami
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum platby</TableHead>
                    <TableHead>Částka</TableHead>
                    <TableHead>Protistrana</TableHead>
                    <TableHead>VS</TableHead>
                    <TableHead>Typ párování</TableHead>
                    <TableHead>Spolehlivost</TableHead>
                    <TableHead>Stav</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>{formatDate(match.paymentDate)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(match.paymentAmount)}
                      </TableCell>
                      <TableCell>{match.counterpartyName || '-'}</TableCell>
                      <TableCell>{match.variableSymbol || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getMatchTypeColor(match.matchType)}>
                          {match.matchType === 'automatic' && 'Automatické'}
                          {match.matchType === 'manual' && 'Ruční'}
                          {match.matchType === 'partial' && 'Částečné'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={match.matchConfidence} className="w-16" />
                          <span className="text-sm">{match.matchConfidence}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(match.status)}>
                          {match.status === 'matched' && 'Spárováno'}
                          {match.status === 'disputed' && 'Sporné'}
                          {match.status === 'cancelled' && 'Zrušeno'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {matches.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Žádné spárované platby k zobrazení
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
