import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, Search, Edit, Ban, CheckCircle, XCircle, Eye, 
  Building, CreditCard, FileText, Mail, Calendar,
  UserX, UserCheck, Crown, Shield, AlertTriangle
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  emailConfirmed: boolean;
  subscriptionStatus?: 'trial' | 'active' | 'expired' | 'canceled';
  subscriptionEnds?: string;
  lastLogin?: string;
  createdAt: string;
  companyId: number;
  company?: {
    id: number;
    name: string;
    ico?: string;
    dic?: string;
  };
  stats?: {
    invoiceCount: number;
    totalRevenue: number;
    expenseCount: number;
    lastActivity: string;
  };
}

interface UserFilters {
  search: string;
  role?: string;
  status?: string;
  subscription?: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserFilters>({ search: '' });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch all users with stats
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users', filters],
  });

  // User actions mutations
  const banUserMutation = useMutation({
    mutationFn: async ({ userId, banned }: { userId: number; banned: boolean }) => {
      return apiRequest(`/api/admin/users/${userId}/ban`, {
        method: 'PATCH',
        body: JSON.stringify({ banned }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Uživatel aktualizován",
        description: "Status uživatele byl úspěšně změněn",
      });
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat uživatele",
        variant: "destructive",
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: Partial<User> }) => {
      return apiRequest(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Uživatel aktualizován",
        description: "Údaje uživatele byly úspěšně změněny",
      });
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat uživatele",
        variant: "destructive",
      });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (response: any) => {
      toast({
        title: "Heslo resetováno",
        description: `Nové heslo: ${response.temporaryPassword}`,
      });
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se resetovat heslo",
        variant: "destructive",
      });
    }
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = !filters.search || 
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.company?.name?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesRole = !filters.role || user.role === filters.role;
    const matchesStatus = !filters.status || 
      (filters.status === 'active' && user.isActive) ||
      (filters.status === 'banned' && !user.isActive);
    const matchesSubscription = !filters.subscription || 
      user.subscriptionStatus === filters.subscription;

    return matchesSearch && matchesRole && matchesStatus && matchesSubscription;
  });

  const getStatusBadge = (user: User) => {
    if (!user.isActive) {
      return <Badge variant="destructive">Zabanován</Badge>;
    }
    if (!user.emailConfirmed) {
      return <Badge variant="outline">Neověřen</Badge>;
    }
    return <Badge variant="default">Aktivní</Badge>;
  };

  const getSubscriptionBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Předplaceno</Badge>;
      case 'trial':
        return <Badge variant="secondary">Zkušební</Badge>;
      case 'expired':
        return <Badge variant="destructive">Vypršelo</Badge>;
      case 'canceled':
        return <Badge variant="outline">Zrušeno</Badge>;
      default:
        return <Badge variant="outline">Neznámé</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Načítám uživatele...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-orange-500" />
            Správa uživatelů
          </h1>
          <p className="text-gray-600 mt-2">
            Kompletní přehled a správa všech uživatelů systému
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600">
          {filteredUsers?.length || 0} uživatelů
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtry a vyhledávání</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Hledat email, jméno, firmu..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.role} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, role: value === 'all' ? undefined : value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny role</SelectItem>
                <SelectItem value="admin">Administrátor</SelectItem>
                <SelectItem value="user">Uživatel</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny stavy</SelectItem>
                <SelectItem value="active">Aktivní</SelectItem>
                <SelectItem value="banned">Zabanovaní</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.subscription} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, subscription: value === 'all' ? undefined : value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Předplatné" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechna předplatná</SelectItem>
                <SelectItem value="trial">Zkušební</SelectItem>
                <SelectItem value="active">Aktivní</SelectItem>
                <SelectItem value="expired">Vypršelé</SelectItem>
                <SelectItem value="canceled">Zrušené</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => setFilters({ search: '' })}
            >
              Vymazat filtry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers?.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* User Info */}
                <div className="lg:col-span-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-600 font-semibold">
                        {user.firstName?.charAt(0) || user.username.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.username
                        }
                        {user.role === 'admin' && (
                          <Crown className="inline h-4 w-4 text-yellow-500 ml-1" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </div>
                </div>

                {/* Company Info */}
                <div className="lg:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-sm">
                        {user.company?.name || 'Neznámá firma'}
                      </div>
                      {user.company?.ico && (
                        <div className="text-xs text-gray-500">IČO: {user.company.ico}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="lg:col-span-2">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-3 w-3 text-gray-400" />
                      <span>{user.stats?.invoiceCount || 0} faktur</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-3 w-3 text-gray-400" />
                      <span>{(user.stats?.totalRevenue || 0).toLocaleString()} Kč</span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="lg:col-span-2">
                  <div className="space-y-1">
                    {getStatusBadge(user)}
                    {getSubscriptionBadge(user.subscriptionStatus)}
                  </div>
                </div>

                {/* Last Activity */}
                <div className="lg:col-span-2">
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString('cs-CZ')
                          : 'Nikdy'
                        }
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Registrace: {new Date(user.createdAt).toLocaleDateString('cs-CZ')}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="lg:col-span-1">
                  <div className="flex space-x-2">
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Editace uživatele</DialogTitle>
                        </DialogHeader>
                        {selectedUser && (
                          <UserEditForm 
                            user={selectedUser}
                            onSave={(data) => updateUserMutation.mutate({ userId: selectedUser.id, data })}
                            onResetPassword={() => resetPasswordMutation.mutate(selectedUser.id)}
                            isLoading={updateUserMutation.isPending}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant={user.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => banUserMutation.mutate({ 
                        userId: user.id, 
                        banned: user.isActive 
                      })}
                      disabled={banUserMutation.isPending}
                    >
                      {user.isActive ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Žádní uživatelé nenalezeni
            </h3>
            <p className="text-gray-600">
              Zkuste změnit vyhledávací kritéria nebo filtry.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface UserEditFormProps {
  user: User;
  onSave: (data: Partial<User>) => void;
  onResetPassword: () => void;
  isLoading: boolean;
}

function UserEditForm({ user, onSave, onResetPassword, isLoading }: UserEditFormProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    emailConfirmed: user.emailConfirmed,
    subscriptionStatus: user.subscriptionStatus || 'trial'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Křestní jméno</label>
          <Input
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            placeholder="Křestní jméno"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Příjmení</label>
          <Input
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            placeholder="Příjmení"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Email"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Role</label>
        <Select value={formData.role} onValueChange={(value: 'admin' | 'user') => 
          setFormData(prev => ({ ...prev, role: value }))
        }>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Uživatel</SelectItem>
            <SelectItem value="admin">Administrátor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Předplatné</label>
        <Select value={formData.subscriptionStatus} onValueChange={(value) => 
          setFormData(prev => ({ ...prev, subscriptionStatus: value as 'trial' | 'active' | 'expired' | 'canceled' }))
        }>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trial">Zkušební</SelectItem>
            <SelectItem value="active">Aktivní</SelectItem>
            <SelectItem value="expired">Vypršelé</SelectItem>
            <SelectItem value="canceled">Zrušené</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <label className="text-sm font-medium">Aktivní účet</label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.emailConfirmed}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailConfirmed: checked }))}
          />
          <label className="text-sm font-medium">Ověřený email</label>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onResetPassword}
          className="text-red-600"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Resetovat heslo
        </Button>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Ukládám...' : 'Uložit změny'}
        </Button>
      </div>
    </form>
  );
}