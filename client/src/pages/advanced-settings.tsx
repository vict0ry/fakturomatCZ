import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Settings, 
  Building, 
  User, 
  Bell, 
  CreditCard,
  Mail,
  Palette,
  Shield,
  Database,
  Users,
  Banknote,
  FileImage,
  QrCode,
  Upload,
  Eye,
  Edit,
  Calculator
} from "lucide-react";

interface CompanySettings {
  id?: number;
  companyId: number;
  // Banking settings
  bankName?: string;
  bankAccount?: string;
  iban?: string;
  swift?: string;
  autoPaymentMatching: boolean;
  // Invoice appearance
  logoUrl?: string;
  stampUrl?: string;
  enableQrCode: boolean;
  invoiceTemplate: string;
  primaryColor: string;
  secondaryColor: string;
  // Email settings
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure: boolean;
  emailFromName?: string;
  emailFromAddress?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  accessLevel: string;
  isActive: boolean;
  lastLogin?: string;
}

export default function AdvancedSettings() {
  const [activeTab, setActiveTab] = useState("banking");
  const { toast } = useToast();

  // Fetch company settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/settings/company"],
    enabled: true,
  });

  // Fetch users for permissions management
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: true,
  });

  // Update company settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<CompanySettings>) =>
      fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/company"] });
      toast({
        title: "Nastavení uloženo",
        description: "Změny byly úspěšně uloženy.",
      });
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit nastavení.",
        variant: "destructive",
      });
    },
  });

  // Update user permissions mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: Partial<User> }) =>
      fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Oprávnění aktualizováno",
        description: "Uživatelská oprávnění byla úspěšně změněna.",
      });
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat oprávnění.",
        variant: "destructive",
      });
    },
  });

  const handleSettingsUpdate = (data: Partial<CompanySettings>) => {
    updateSettingsMutation.mutate(data);
  };

  const handleUserUpdate = (userId: number, data: Partial<User>) => {
    updateUserMutation.mutate({ userId, data });
  };

  const getAccessLevelBadge = (level: string) => {
    const variants = {
      read: "secondary",
      create: "default",
      accounting: "outline",
      admin: "destructive",
    } as const;

    const labels = {
      read: "Pouze čtení",
      create: "Čtení a vytváření",
      accounting: "Účetní přístup",
      admin: "Administrátor",
    };

    return (
      <Badge variant={variants[level as keyof typeof variants] || "secondary"}>
        {labels[level as keyof typeof labels] || level}
      </Badge>
    );
  };

  if (settingsLoading || usersLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center">Načítání nastavení...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl">
            Pokročilá nastavení
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Správa bankovních údajů, vzhledu faktury a uživatelských oprávnění
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="banking" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Banka a platby
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Vzhled faktury
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Oprávnění uživatelů
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-mail nastavení
            </TabsTrigger>
          </TabsList>

          <TabsContent value="banking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Bankovní údaje
                </CardTitle>
                <CardDescription>
                  Nastavte bankovní účty pro automatické párování plateb
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Název banky</Label>
                    <Input
                      id="bankName"
                      defaultValue={settings?.bankName || ""}
                      placeholder="Česká spořitelna"
                      onBlur={(e) => handleSettingsUpdate({ bankName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccount">Číslo účtu</Label>
                    <Input
                      id="bankAccount"
                      defaultValue={settings?.bankAccount || ""}
                      placeholder="123456789/0800"
                      onBlur={(e) => handleSettingsUpdate({ bankAccount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      defaultValue={settings?.iban || ""}
                      placeholder="CZ6508000000192000145399"
                      onBlur={(e) => handleSettingsUpdate({ iban: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="swift">SWIFT/BIC</Label>
                    <Input
                      id="swift"
                      defaultValue={settings?.swift || ""}
                      placeholder="GIBACZPX"
                      onBlur={(e) => handleSettingsUpdate({ swift: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatické párování plateb</Label>
                    <p className="text-sm text-muted-foreground">
                      Automaticky párovat příchozí platby s fakturami podle VS
                    </p>
                  </div>
                  <Switch
                    checked={settings?.autoPaymentMatching || false}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate({ autoPaymentMatching: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pravidla párování plateb</CardTitle>
                <CardDescription>
                  Nastavte, jak se mají automaticky párovat příchozí platby
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm">
                      <Database className="mr-2 h-4 w-4" />
                      Importovat transakce
                    </Button>
                    <Button variant="outline" size="sm">
                      Vytvořit pravidlo
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Zatím nejsou vytvořena žádná pravidla párování.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Logo a razítko
                </CardTitle>
                <CardDescription>
                  Přidejte logo a razítko pro faktury
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Logo společnosti</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {settings?.logoUrl ? (
                        <div className="space-y-2">
                          <img 
                            src={settings.logoUrl} 
                            alt="Logo" 
                            className="mx-auto max-h-16"
                          />
                          <Button variant="outline" size="sm">
                            Změnit logo
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <Button variant="outline" size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Nahrát logo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Razítko</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {settings?.stampUrl ? (
                        <div className="space-y-2">
                          <img 
                            src={settings.stampUrl} 
                            alt="Razítko" 
                            className="mx-auto max-h-16"
                          />
                          <Button variant="outline" size="sm">
                            Změnit razítko
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <Button variant="outline" size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Nahrát razítko
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR kód a šablona
                </CardTitle>
                <CardDescription>
                  Nastavte vzhled a funkcionalitu faktury
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>QR kód na faktuře</Label>
                    <p className="text-sm text-muted-foreground">
                      Zobrazit QR kód pro rychlé platby na fakturách
                    </p>
                  </div>
                  <Switch
                    checked={settings?.enableQrCode || false}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate({ enableQrCode: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Šablona faktury</Label>
                  <Select
                    value={settings?.invoiceTemplate || "default"}
                    onValueChange={(value) => 
                      handleSettingsUpdate({ invoiceTemplate: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Výchozí</SelectItem>
                      <SelectItem value="modern">Moderní</SelectItem>
                      <SelectItem value="minimal">Minimalistická</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Primární barva</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings?.primaryColor || "#2563EB"}
                        onChange={(e) => 
                          handleSettingsUpdate({ primaryColor: e.target.value })
                        }
                        className="w-16 p-1 h-10"
                      />
                      <Input
                        value={settings?.primaryColor || "#2563EB"}
                        onChange={(e) => 
                          handleSettingsUpdate({ primaryColor: e.target.value })
                        }
                        placeholder="#2563EB"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Sekundární barva</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={settings?.secondaryColor || "#64748B"}
                        onChange={(e) => 
                          handleSettingsUpdate({ secondaryColor: e.target.value })
                        }
                        className="w-16 p-1 h-10"
                      />
                      <Input
                        value={settings?.secondaryColor || "#64748B"}
                        onChange={(e) => 
                          handleSettingsUpdate({ secondaryColor: e.target.value })
                        }
                        placeholder="#64748B"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Správa oprávnění uživatelů
                </CardTitle>
                <CardDescription>
                  Nastavte přístupové úrovně pro jednotlivé uživatele
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users?.map((user: User) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.username}
                          </span>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Aktivní" : "Neaktivní"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Poslední přihlášení: {user.lastLogin 
                            ? new Date(user.lastLogin).toLocaleDateString('cs-CZ')
                            : "Nikdy"}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getAccessLevelBadge(user.accessLevel)}
                        <Select
                          value={user.accessLevel}
                          onValueChange={(value) => 
                            handleUserUpdate(user.id, { accessLevel: value })
                          }
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="read">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Pouze čtení
                              </div>
                            </SelectItem>
                            <SelectItem value="create">
                              <div className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Čtení a vytváření
                              </div>
                            </SelectItem>
                            <SelectItem value="accounting">
                              <div className="flex items-center gap-2">
                                <Calculator className="h-4 w-4" />
                                Účetní přístup
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Administrátor
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  
                  {(!users || users.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      Žádní uživatelé nebyli nalezeni.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popis přístupových úrovní</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <Badge variant="secondary">Pouze čtení</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Může prohlížet faktury, zákazníky a sestavy, ale nemůže nic upravovat.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      <Badge>Čtení a vytváření</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Může vytvářet a upravovat faktury a zákazníky.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      <Badge variant="outline">Účetní přístup</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Plný přístup k fakturám, platbám a účetním funkcím.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <Badge variant="destructive">Administrátor</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Úplná kontrola nad systémem včetně nastavení a uživatelů.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  SMTP nastavení
                </CardTitle>
                <CardDescription>
                  Nastavte e-mailový server pro odesílání faktur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost">SMTP server</Label>
                    <Input
                      id="smtpHost"
                      defaultValue={settings?.smtpHost || ""}
                      placeholder="smtp.gmail.com"
                      onBlur={(e) => handleSettingsUpdate({ smtpHost: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      defaultValue={settings?.smtpPort || 587}
                      placeholder="587"
                      onBlur={(e) => handleSettingsUpdate({ smtpPort: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpUser">Uživatelské jméno</Label>
                    <Input
                      id="smtpUser"
                      defaultValue={settings?.smtpUser || ""}
                      placeholder="your-email@gmail.com"
                      onBlur={(e) => handleSettingsUpdate({ smtpUser: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPassword">Heslo</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      defaultValue={settings?.smtpPassword || ""}
                      placeholder="••••••••"
                      onBlur={(e) => handleSettingsUpdate({ smtpPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Zabezpečené připojení (SSL/TLS)</Label>
                    <p className="text-sm text-muted-foreground">
                      Použít šifrované připojení k e-mailovému serveru
                    </p>
                  </div>
                  <Switch
                    checked={settings?.smtpSecure || false}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate({ smtpSecure: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emailFromName">Jméno odesílatele</Label>
                    <Input
                      id="emailFromName"
                      defaultValue={settings?.emailFromName || ""}
                      placeholder="Vaše firma s.r.o."
                      onBlur={(e) => handleSettingsUpdate({ emailFromName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailFromAddress">E-mail odesílatele</Label>
                    <Input
                      id="emailFromAddress"
                      type="email"
                      defaultValue={settings?.emailFromAddress || ""}
                      placeholder="faktury@vasefirma.cz"
                      onBlur={(e) => handleSettingsUpdate({ emailFromAddress: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">
                    Otestovat připojení
                  </Button>
                  <Button variant="outline">
                    Poslat testovací e-mail
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}