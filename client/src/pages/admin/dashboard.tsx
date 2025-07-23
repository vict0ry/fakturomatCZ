import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Users,
  CreditCard,
  TrendingUp,
  DollarSign,
  Calendar,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Key,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  trialUsers: number;
  paidUsers: number;
  newUsersThisMonth: number;
  churnRate: number;
}

interface RevenueStats {
  monthlyRevenue: number;
  yearlyRevenue: number;
  averageRevenuePerUser: number;
  growthRate: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  // User statistics
  const { data: userStats, isLoading: userStatsLoading } = useQuery<UserStats>({
    queryKey: ['/api/admin/users/stats', selectedTimeframe],
  });

  // Revenue statistics  
  const { data: revenueStats, isLoading: revenueStatsLoading } = useQuery<RevenueStats>({
    queryKey: ['/api/admin/revenue/stats', selectedTimeframe],
  });

  // System health
  const { data: systemHealth, isLoading: systemHealthLoading } = useQuery<SystemHealth>({
    queryKey: ['/api/admin/system/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Recent users
  const { data: recentUsers, isLoading: recentUsersLoading } = useQuery({
    queryKey: ['/api/admin/users/recent'],
  });

  // Admin settings
  const [monthlyPrice, setMonthlyPrice] = useState('199');
  const [trialDays, setTrialDays] = useState('7');

  // API Tokens state
  const [apiTokens, setApiTokens] = useState([
    { id: 1, name: 'OpenAI API Key', key: 'OPENAI_API_KEY', value: '****', visible: false, description: 'Pro AI funkce a chat asistenta' },
    { id: 2, name: 'Stripe Secret Key', key: 'STRIPE_SECRET_KEY', value: '****', visible: false, description: 'Pro platební brány a předplatné' },
    { id: 3, name: 'Stripe Public Key', key: 'VITE_STRIPE_PUBLIC_KEY', value: '****', visible: false, description: 'Veřejný klíč pro frontend' },
    { id: 4, name: 'SendGrid API Key', key: 'SENDGRID_API_KEY', value: '****', visible: false, description: 'Pro odesílání emailů' },
    { id: 5, name: 'Database URL', key: 'DATABASE_URL', value: '****', visible: false, description: 'Připojení k databázi' }
  ]);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenKey, setNewTokenKey] = useState('');
  const [newTokenValue, setNewTokenValue] = useState('');
  const [newTokenDescription, setNewTokenDescription] = useState('');
  const [isAddingToken, setIsAddingToken] = useState(false);

  // API Token management functions
  const toggleTokenVisibility = (id: number) => {
    setApiTokens(prev => prev.map(token => 
      token.id === id ? { ...token, visible: !token.visible } : token
    ));
  };

  const deleteToken = (id: number) => {
    setApiTokens(prev => prev.filter(token => token.id !== id));
    toast({
      title: "Token smazán",
      description: "API token byl úspěšně odstraněn"
    });
  };

  const addNewToken = () => {
    if (!newTokenName || !newTokenKey || !newTokenValue) {
      toast({
        title: "Chyba",
        description: "Vyplňte všechna povinná pole",
        variant: "destructive"
      });
      return;
    }

    const newToken = {
      id: Math.max(...apiTokens.map(t => t.id)) + 1,
      name: newTokenName,
      key: newTokenKey,
      value: newTokenValue,
      visible: false,
      description: newTokenDescription
    };

    setApiTokens(prev => [...prev, newToken]);
    setNewTokenName('');
    setNewTokenKey('');
    setNewTokenValue('');
    setNewTokenDescription('');
    setIsAddingToken(false);

    toast({
      title: "Token přidán",
      description: "Nový API token byl úspěšně vytvořen"
    });
  };

  const handleUpdatePricing = async () => {
    try {
      const response = await apiRequest('POST', '/api/admin/settings/pricing', {
        monthlyPrice: parseFloat(monthlyPrice),
        trialDays: parseInt(trialDays)
      });

      if (response.ok) {
        toast({
          title: "Nastavení uloženo",
          description: "Nové ceny budou platit pro nové uživatele",
        });
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit nastavení",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case 'trial':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Trial</Badge>;
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-200">Aktivní</Badge>;
      case 'past_due':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Nezaplaceno</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="text-red-600 border-red-200">Zrušeno</Badge>;
      default:
        return <Badge variant="outline">Neznámý</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🔧 Admin Panel - Doklad.ai</h1>
          <p className="text-gray-600 dark:text-gray-300">Administrace SaaS systému - uživatelé, příjmy, konfigurace</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            Admin Role
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { 
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
                  }
                });
                localStorage.removeItem('sessionId');
                window.location.href = '/';
              } catch (error) {
                console.error('Logout failed:', error);
                // Fallback - clear session and redirect anyway
                localStorage.removeItem('sessionId');
                window.location.href = '/';
              }
            }}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Odhlásit se
          </Button>
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="7d">Posledních 7 dní</option>
            <option value="30d">Posledních 30 dní</option>
            <option value="90d">Posledních 90 dní</option>
            <option value="1y">Poslední rok</option>
          </select>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800 dark:text-blue-200">Administrátorský přístup</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Jste přihlášeni jako admin. Toto rozhraní slouží pouze pro správu systému. 
              Běžné funkce (faktury, zákazníci) jsou dostupné pouze pro klientské účty.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Přehled</TabsTrigger>
          <TabsTrigger value="users">Uživatelé</TabsTrigger>
          <TabsTrigger value="revenue">Příjmy</TabsTrigger>
          <TabsTrigger value="api-tokens">API Tokeny</TabsTrigger>
          <TabsTrigger value="settings">Nastavení</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Celkem uživatelů</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userStatsLoading ? '...' : userStats?.totalUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{userStats?.newUsersThisMonth || 0} tento měsíc
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktivní uživatelé</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userStatsLoading ? '...' : userStats?.activeUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {userStats?.paidUsers || 0} platících, {userStats?.trialUsers || 0} trial
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Měsíční příjem</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {revenueStatsLoading ? '...' : `${revenueStats?.monthlyRevenue?.toLocaleString() || 0} Kč`}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{revenueStats?.growthRate || 0}% růst
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                {systemHealth && getStatusIcon(systemHealth.status)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {systemHealthLoading ? '...' : systemHealth?.status || 'Unknown'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {systemHealth?.uptime || 0}% uptime
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Health Details */}
          <Card>
            <CardHeader>
              <CardTitle>Stav systému</CardTitle>
              <CardDescription>Aktuální stav infrastruktury a výkon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dostupnost</span>
                  <span className="font-semibold">{systemHealth?.uptime || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Doba odezvy</span>
                  <span className="font-semibold">{systemHealth?.responseTime || 0}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Chybovost</span>
                  <span className="font-semibold">{systemHealth?.errorRate || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nedávno registrovaní uživatelé</CardTitle>
              <CardDescription>Přehled nových registrací</CardDescription>
            </CardHeader>
            <CardContent>
              {recentUsersLoading ? (
                <div className="text-center py-4">Načítám...</div>
              ) : (
                <div className="space-y-4">
                  {recentUsers?.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-semibold">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">
                            Registrován: {new Date(user.createdAt).toLocaleDateString('cs-CZ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getSubscriptionStatusBadge(user.subscriptionStatus)}
                        <span className="text-sm text-gray-500">
                          {user.subscriptionStatus === 'trial' 
                            ? `Trial do ${new Date(user.trialEndsAt).toLocaleDateString('cs-CZ')}`
                            : `${user.monthlyPrice} Kč/měsíc`
                          }
                        </span>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      Žádní noví uživatelé
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Příjmy podle období</CardTitle>
                <CardDescription>Finanční výsledky za vybrané období</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Měsíční příjem</span>
                  <span className="font-semibold">
                    {revenueStats?.monthlyRevenue?.toLocaleString() || 0} Kč
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Roční příjem</span>
                  <span className="font-semibold">
                    {revenueStats?.yearlyRevenue?.toLocaleString() || 0} Kč
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>ARPU (průměrný příjem na uživatele)</span>
                  <span className="font-semibold">
                    {revenueStats?.averageRevenuePerUser?.toLocaleString() || 0} Kč
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Růst</span>
                  <span className={`font-semibold ${
                    (revenueStats?.growthRate || 0) > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {revenueStats?.growthRate || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analýza churn rate</CardTitle>
                <CardDescription>Míra odchodů uživatelů</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">
                    {userStats?.churnRate || 0}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Měsíční churn rate
                  </p>
                  <div className="mt-4 text-sm">
                    {(userStats?.churnRate || 0) < 5 ? (
                      <div className="text-green-600">Vynikající retence uživatelů</div>
                    ) : (userStats?.churnRate || 0) < 10 ? (
                      <div className="text-yellow-600">Dobrá retence uživatelů</div>
                    ) : (
                      <div className="text-red-600">Vysoká míra odchodů - vyžaduje pozornost</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Tokens Tab */}
        <TabsContent value="api-tokens" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Správa API tokenů
              </CardTitle>
              <CardDescription>
                Spravujte API klíče pro externí služby jako OpenAI, Stripe, SendGrid
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add New Token Button */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Současné API tokeny</h3>
                  <Button 
                    onClick={() => setIsAddingToken(true)}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Přidat token
                  </Button>
                </div>

                {/* Add New Token Form */}
                {isAddingToken && (
                  <Card className="border-2 border-orange-200">
                    <CardHeader>
                      <CardTitle className="text-base">Přidat nový API token</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tokenName">Název tokenu *</Label>
                          <Input
                            id="tokenName"
                            value={newTokenName}
                            onChange={(e) => setNewTokenName(e.target.value)}
                            placeholder="např. OpenAI API Key"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tokenKey">Environment key *</Label>
                          <Input
                            id="tokenKey"
                            value={newTokenKey}
                            onChange={(e) => setNewTokenKey(e.target.value)}
                            placeholder="např. OPENAI_API_KEY"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="tokenValue">Hodnota tokenu *</Label>
                        <Input
                          id="tokenValue"
                          type="password"
                          value={newTokenValue}
                          onChange={(e) => setNewTokenValue(e.target.value)}
                          placeholder="Zadejte API klíč"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tokenDescription">Popis (volitelné)</Label>
                        <Input
                          id="tokenDescription"
                          value={newTokenDescription}
                          onChange={(e) => setNewTokenDescription(e.target.value)}
                          placeholder="Stručný popis použití tokenu"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={addNewToken} className="bg-green-500 hover:bg-green-600">
                          Uložit token
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsAddingToken(false);
                            setNewTokenName('');
                            setNewTokenKey('');
                            setNewTokenValue('');
                            setNewTokenDescription('');
                          }}
                        >
                          Zrušit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Existing Tokens List */}
                <div className="space-y-3">
                  {apiTokens.map((token) => (
                    <Card key={token.id} className="border">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <Key className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-semibold">{token.name}</div>
                                <div className="text-sm text-gray-500">{token.key}</div>
                                {token.description && (
                                  <div className="text-xs text-gray-400 mt-1">{token.description}</div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            {/* Token Value */}
                            <div className="flex items-center space-x-2">
                              <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                                {token.visible ? token.value : '••••••••••••••••'}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleTokenVisibility(token.id)}
                              >
                                {token.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteToken(token.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Warning Notice */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-yellow-800 dark:text-yellow-200">Bezpečnostní upozornění</p>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                        API tokeny jsou citlivé údaje. Ujistěte se, že je ukládáte bezpečně a nesdílíte je s neautorizovanými osobami.
                        V produkci se doporučuje používat Environment Variables místo uložení v databázi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Cenové nastavení
              </CardTitle>
              <CardDescription>
                Upravte ceny a délku trial období pro nové uživatele
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyPrice">Měsíční cena (Kč)</Label>
                  <Input
                    id="monthlyPrice"
                    type="number"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="trialDays">Délka trial (dny)</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                  />
                </div>
              </div>
              
              <Button onClick={handleUpdatePricing} className="bg-orange-500 hover:bg-orange-600">
                Uložit nastavení
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Systémové informace</CardTitle>
              <CardDescription>Aktuální stav a konfigurace systému</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Verze aplikace:</span>
                    <span className="font-semibold">v2.1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Databáze:</span>
                    <span className="font-semibold">PostgreSQL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hosting:</span>
                    <span className="font-semibold">Replit</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Platební brána:</span>
                    <span className="font-semibold">Stripe</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email služba:</span>
                    <span className="font-semibold">Amazon SES</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI služba:</span>
                    <span className="font-semibold">OpenAI GPT-4o</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}