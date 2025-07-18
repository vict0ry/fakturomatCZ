import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Settings, Users, Building2, Save, UserPlus, Shield, Trash2 } from 'lucide-react';

const companySettingsSchema = z.object({
  name: z.string().min(1, 'Název firmy je povinný'),
  ico: z.string().min(8, 'IČO musí mít alespoň 8 znaků'),
  dic: z.string().optional(),
  address: z.string().min(1, 'Adresa je povinná'),
  city: z.string().min(1, 'Město je povinné'),
  postalCode: z.string().min(1, 'PSČ je povinné'),
  phone: z.string().optional(),
  email: z.string().email('Neplatný email'),
  website: z.string().url('Neplatná URL').optional().or(z.literal('')),
  bankAccount: z.string().optional(),
  iban: z.string().optional()
});

const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP server je povinný'),
  smtpPort: z.number().min(1, 'Port je povinný'),
  smtpUser: z.string().min(1, 'Uživatelské jméno je povinné'),
  smtpPassword: z.string().min(1, 'Heslo je povinné'),
  fromEmail: z.string().email('Neplatný email'),
  fromName: z.string().min(1, 'Jméno odesílatele je povinné'),
  smtpSecure: z.boolean()
});

const userInviteSchema = z.object({
  email: z.string().email('Neplatný email'),
  role: z.enum(['admin', 'user'], { required_error: 'Vyberte roli' }),
  firstName: z.string().min(1, 'Jméno je povinné'),
  lastName: z.string().min(1, 'Příjmení je povinné')
});

type CompanySettings = z.infer<typeof companySettingsSchema>;
type EmailSettings = z.infer<typeof emailSettingsSchema>;
type UserInvite = z.infer<typeof userInviteSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('company');

  // Company settings form
  const companyForm = useForm<CompanySettings>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: '',
      ico: '',
      dic: '',
      address: '',
      city: '',
      postalCode: '',
      phone: '',
      email: '',
      website: '',
      bankAccount: '',
      iban: ''
    }
  });

  // Email settings form
  const emailForm = useForm<EmailSettings>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: '',
      smtpSecure: true
    }
  });

  // User invite form
  const userInviteForm = useForm<UserInvite>({
    resolver: zodResolver(userInviteSchema),
    defaultValues: {
      email: '',
      role: 'user',
      firstName: '',
      lastName: ''
    }
  });

  // Fetch company settings
  const { data: companySettings } = useQuery({
    queryKey: ['/api/company/settings'],
    onSuccess: (data) => {
      companyForm.reset(data);
    }
  });

  // Fetch email settings
  const { data: emailSettings } = useQuery({
    queryKey: ['/api/email/settings'],
    onSuccess: (data) => {
      emailForm.reset(data);
    }
  });

  // Fetch company users
  const { data: companyUsers } = useQuery({
    queryKey: ['/api/company/users']
  });

  // Save company settings
  const saveCompanyMutation = useMutation({
    mutationFn: async (data: CompanySettings) => {
      const response = await fetch('/api/company/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to save company settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Nastavení uloženo',
        description: 'Údaje firmy byly úspěšně aktualizovány.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company/settings'] });
    },
    onError: () => {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se uložit nastavení firmy.',
        variant: 'destructive'
      });
    }
  });

  // Save email settings
  const saveEmailMutation = useMutation({
    mutationFn: async (data: EmailSettings) => {
      const response = await fetch('/api/email/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to save email settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Email nastavení uloženo',
        description: 'SMTP konfigurace byla úspěšně aktualizována.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email/settings'] });
    },
    onError: () => {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se uložit email nastavení.',
        variant: 'destructive'
      });
    }
  });

  // Test email settings
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        }
      });
      if (!response.ok) throw new Error('Failed to test email');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Email test úspěšný',
        description: 'Testovací email byl úspěšně odeslán.'
      });
    },
    onError: () => {
      toast({
        title: 'Email test neúspěšný',
        description: 'Nepodařilo se odeslat testovací email. Zkontrolujte nastavení.',
        variant: 'destructive'
      });
    }
  });

  // Invite user
  const inviteUserMutation = useMutation({
    mutationFn: async (data: UserInvite) => {
      const response = await fetch('/api/company/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to invite user');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Pozvánka odeslána',
        description: 'Pozvánka byla úspěšně odeslána na email.'
      });
      userInviteForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/company/users'] });
    },
    onError: () => {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se odeslat pozvánku.',
        variant: 'destructive'
      });
    }
  });

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nastavení</h1>
        <p className="text-muted-foreground mt-2">
          Správa firemních údajů, email konfigurace a uživatelů
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Firma
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Uživatelé
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Údaje firmy</CardTitle>
              <CardDescription>
                Tyto údaje se zobrazují na fakturách a dalších dokumentech.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...companyForm}>
                <form onSubmit={companyForm.handleSubmit((data) => saveCompanyMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={companyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Název firmy</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Název s.r.o." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="ico"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IČO</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="12345678" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="dic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>DIČ</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="CZ12345678" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="info@firma.cz" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+420 123 456 789" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Webové stránky</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://www.firma.cz" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={companyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresa</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ulice 123" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Město</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Praha" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PSČ</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="110 00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={companyForm.control}
                      name="bankAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Číslo účtu</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123456789/0100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="iban"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IBAN</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="CZ65 0100 0000 0123 4567 89" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={saveCompanyMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {saveCompanyMutation.isPending ? 'Ukládám...' : 'Uložit nastavení'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email nastavení</CardTitle>
              <CardDescription>
                Konfigurace SMTP serveru pro odesílání faktur a připomínek.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit((data) => saveEmailMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={emailForm.control}
                      name="smtpHost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Server</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="smtp.gmail.com" />
                          </FormControl>
                          <FormDescription>
                            Adresa SMTP serveru pro odesílání emailů
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailForm.control}
                      name="smtpPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="587"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Port SMTP serveru (obvykle 587 nebo 465)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailForm.control}
                      name="smtpUser"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Uživatelské jméno</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="vas-email@gmail.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailForm.control}
                      name="smtpPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heslo</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="••••••••" />
                          </FormControl>
                          <FormDescription>
                            Heslo nebo aplikační token
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={emailForm.control}
                      name="fromEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email odesílatele</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="faktury@firma.cz" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailForm.control}
                      name="fromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jméno odesílatele</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Firma s.r.o." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={emailForm.control}
                    name="smtpSecure"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Zabezpečené připojení</FormLabel>
                          <FormDescription>
                            Použít SSL/TLS pro zabezpečené připojení
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-4">
                    <Button type="submit" disabled={saveEmailMutation.isPending}>
                      <Save className="mr-2 h-4 w-4" />
                      {saveEmailMutation.isPending ? 'Ukládám...' : 'Uložit nastavení'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => testEmailMutation.mutate()}
                      disabled={testEmailMutation.isPending}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {testEmailMutation.isPending ? 'Testování...' : 'Test email'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pozvat uživatele</CardTitle>
                <CardDescription>
                  Pozván nového uživatele do vaší firmy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...userInviteForm}>
                  <form onSubmit={userInviteForm.handleSubmit((data) => inviteUserMutation.mutate(data))} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={userInviteForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jméno</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Jan" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userInviteForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Příjmení</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Novák" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userInviteForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="jan.novak@email.cz" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userInviteForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <FormControl>
                              <select {...field} className="w-full border rounded-md p-2">
                                <option value="user">Uživatel</option>
                                <option value="admin">Administrátor</option>
                              </select>
                            </FormControl>
                            <FormDescription>
                              Administrátor má přístup k nastavením
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" disabled={inviteUserMutation.isPending}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {inviteUserMutation.isPending ? 'Odesílám...' : 'Poslat pozvánku'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uživatelé firmy</CardTitle>
                <CardDescription>
                  Seznam všech uživatelů ve vaší firmě.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companyUsers?.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Administrátor' : 'Uživatel'}
                        </Badge>
                        {user.role !== 'admin' && (
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}