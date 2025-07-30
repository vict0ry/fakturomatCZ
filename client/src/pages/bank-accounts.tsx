import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Mail, Settings, Eye, EyeOff, Copy, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

const bankAccountSchema = z.object({
  name: z.string().min(1, "Název je povinný"),
  accountNumber: z.string().min(1, "Číslo účtu je povinné"),
  iban: z.string().optional(),
  swift: z.string().optional(),
  currency: z.string().default("CZK"),
  bankName: z.string().min(1, "Název banky je povinný"),
  bankCode: z.string().optional(),
  enablePaymentMatching: z.boolean().default(false),
  enableOutgoingPaymentMatching: z.boolean().default(false),
  enableBulkMatching: z.boolean().default(false),
  displayInOverview: z.boolean().default(true),
});

type BankAccountForm = z.infer<typeof bankAccountSchema>;

interface BankAccount {
  id: number;
  name: string;
  accountNumber: string;
  iban?: string;
  swift?: string;
  currency: string;
  bankName: string;
  bankCode?: string;
  enablePaymentMatching: boolean;
  enableOutgoingPaymentMatching: boolean;
  enableBulkMatching: boolean;
  paymentEmail?: string;
  paymentEmailPassword?: string;
  emailToken?: string;
  displayInOverview: boolean;
  isActive: boolean;
  lastProcessedPayment?: string;
  createdAt: string;
}

export default function BankAccountsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{[key: number]: boolean}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bank accounts
  const { data: bankAccounts = [], isLoading } = useQuery({
    queryKey: ["/api/bank-accounts"],
  });

  // Create bank account mutation
  const createMutation = useMutation({
    mutationFn: async (data: BankAccountForm) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionId}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Bankovní účet vytvořen",
        description: "Nový bankovní účet byl úspěšně přidán.",
      });
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit bankovní účet.",
        variant: "destructive",
      });
    },
  });

  // Generate payment email mutation
  const generateEmailMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/bank-accounts/${accountId}/generate-email`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sessionId}`
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: "Email vygenerován",
        description: "Email pro párování plateb byl úspěšně vytvořen.",
      });
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vygenerovat email.",
        variant: "destructive",
      });
    },
  });

  // Update bank account mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BankAccount> }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/bank-accounts/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionId}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: "Nastavení uloženo",
        description: "Nastavení bankovního účtu bylo aktualizováno.",
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

  const form = useForm<BankAccountForm>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      name: "",
      accountNumber: "",
      iban: "",
      swift: "",
      currency: "CZK",
      bankName: "",
      bankCode: "",
      enablePaymentMatching: false,
      enableOutgoingPaymentMatching: false,
      enableBulkMatching: false,
      displayInOverview: true,
    },
  });

  const onSubmit = (data: BankAccountForm) => {
    createMutation.mutate(data);
  };

  const handleSettingUpdate = (accountId: number, field: keyof BankAccount, value: any) => {
    updateMutation.mutate({ id: accountId, data: { [field]: value } });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Zkopírováno",
      description: "Text byl zkopírován do schránky.",
    });
  };

  const togglePasswordVisibility = (accountId: number) => {
    setShowPasswords(prev => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center">Načítání bankovních účtů...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl">
              Bankovní účty a párování plateb
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Spravujte bankovní účty a nastavte automatické párování plateb
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Přidat účet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nový bankovní účet</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Název účtu</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Hlavní účet CZK" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="accountNumber"
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
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Měna</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CZK">CZK</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Název banky</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Česká spořitelna" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN (volitelné)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="CZ65 0100 0000 0123 4567 89" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="enablePaymentMatching"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Automatické párování</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Zapnout párování příchozích plateb
                            </p>
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
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      Zrušit
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Vytváření..." : "Vytvořit"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {bankAccounts.map((account: BankAccount) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {account.name}
                      <Badge variant="outline">{account.currency}</Badge>
                      {account.enablePaymentMatching && (
                        <Badge variant="default">
                          <Mail className="h-3 w-3 mr-1" />
                          Párování aktivní
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {account.bankName} • {account.accountNumber}
                      {account.iban && ` • ${account.iban}`}
                    </CardDescription>
                  </div>
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Email Section */}
                {account.enablePaymentMatching && (
                  <div className="rounded-lg border p-4 bg-yellow-50 dark:bg-yellow-950/20">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">
                        Email pro párování plateb
                      </Label>
                      {!account.paymentEmail && (
                        <Button
                          size="sm"
                          onClick={() => generateEmailMutation.mutate(account.id)}
                          disabled={generateEmailMutation.isPending}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {generateEmailMutation.isPending ? "Vytváření..." : "Vygenerovat email"}
                        </Button>
                      )}
                    </div>
                    
                    {account.paymentEmail ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={account.paymentEmail}
                            readOnly
                            className="flex-1"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => copyToClipboard(account.paymentEmail!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {account.paymentEmailPassword && (
                          <div className="flex items-center gap-2">
                            <Input
                              type={showPasswords[account.id] ? "text" : "password"}
                              value={account.paymentEmailPassword}
                              readOnly
                              className="flex-1"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => togglePasswordVisibility(account.id)}
                            >
                              {showPasswords[account.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => copyToClipboard(account.paymentEmailPassword!)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                        <div className="text-sm text-muted-foreground">
                          <p>📧 Nastavte v bance odesílání výpisů na tento email</p>
                          <p>🔄 Platby se automaticky spárují s fakturami podle VS</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Klikněte na "Vygenerovat email" pro vytvoření dedikovaného emailu pro párování plateb.
                      </p>
                    )}
                  </div>
                )}

                <Separator />

                {/* Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Párování plateb</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatické přiřazování příchozích plateb
                      </p>
                    </div>
                    <Switch
                      checked={account.enablePaymentMatching}
                      onCheckedChange={(checked) => 
                        handleSettingUpdate(account.id, 'enablePaymentMatching', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Odchozí platby</Label>
                      <p className="text-xs text-muted-foreground">
                        Párování i odchozích plateb
                      </p>
                    </div>
                    <Switch
                      checked={account.enableOutgoingPaymentMatching}
                      onCheckedChange={(checked) => 
                        handleSettingUpdate(account.id, 'enableOutgoingPaymentMatching', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Hromadné vyrovnání</Label>
                      <p className="text-xs text-muted-foreground">
                        Vyrovnání více faktur jednou platbou
                      </p>
                    </div>
                    <Switch
                      checked={account.enableBulkMatching}
                      onCheckedChange={(checked) => 
                        handleSettingUpdate(account.id, 'enableBulkMatching', checked)
                      }
                    />
                  </div>
                </div>

                <Separator />

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Poslední zpracování</Label>
                    <p className="font-medium">
                      {account.lastProcessedPayment 
                        ? new Date(account.lastProcessedPayment).toLocaleDateString('cs-CZ')
                        : 'Nikdy'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Stav</Label>
                    <p className="font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Aktivní
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Vytvořeno</Label>
                    <p className="font-medium">
                      {new Date(account.createdAt).toLocaleDateString('cs-CZ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {bankAccounts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Žádné bankovní účty</h3>
              <p className="text-muted-foreground mb-4">
                Začněte přidáním vašeho prvního bankovního účtu pro automatické párování plateb.
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Přidat první účet
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}