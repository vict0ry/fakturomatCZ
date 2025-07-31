import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, CreditCard, Palette, QrCode, FileImage, Stamp } from 'lucide-react';

const brandingSchema = z.object({
  // Banking details
  bankAccount: z.string().optional(),
  iban: z.string().optional(),
  swift: z.string().optional(),
  
  // Branding assets
  logoUrl: z.string().optional(),
  stampUrl: z.string().optional(),
  signature: z.string().optional(),
  
  // Appearance settings
  enableQrCode: z.boolean().default(true),
  invoiceTemplate: z.string().default('standard'),
  primaryColor: z.string().default('#f97316'),
  secondaryColor: z.string().default('#0f172a'),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

export function CompanyBrandingSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      enableQrCode: true,
      invoiceTemplate: 'standard',
      primaryColor: '#f97316',
      secondaryColor: '#0f172a',
    },
  });

  // Fetch current company data
  const { data: company, isLoading } = useQuery({
    queryKey: ['/api/companies/current'],
  });

  // Reset form when company data loads
  React.useEffect(() => {
    if (company) {
      form.reset({
        bankAccount: company.bankAccount || '',
        iban: company.iban || '',
        swift: company.swift || '',
        logoUrl: company.logoUrl || '',
        stampUrl: company.stampUrl || '',
        signature: company.signature || '',
        enableQrCode: company.enableQrCode ?? true,
        invoiceTemplate: company.invoiceTemplate || 'standard',
        primaryColor: company.primaryColor || '#f97316',
        secondaryColor: company.secondaryColor || '#0f172a',
      });
    }
  }, [company, form]);

  const updateBrandingMutation = useMutation({
    mutationFn: async (data: BrandingFormData) => {
      const response = await fetch('/api/companies/branding', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Nepodařilo se aktualizovat nastavení');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Nastavení uloženo',
        description: 'Branding společnosti byl úspěšně aktualizován.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies/current'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Chyba při ukládání',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const uploadAssetMutation = useMutation({
    mutationFn: async ({ type, file }: { type: 'logo' | 'stamp'; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/companies/upload/company-assets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se nahrát soubor');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      const fieldName = variables.type === 'logo' ? 'logoUrl' : 'stampUrl';
      form.setValue(fieldName, data.url);
      toast({
        title: 'Soubor nahrán',
        description: `${variables.type === 'logo' ? 'Logo' : 'Razítko'} bylo úspěšně nahráno.`,
      });
    },
    onError: () => {
      toast({
        title: 'Chyba při nahrávání',
        description: 'Nepodařilo se nahrát soubor.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: BrandingFormData) => {
    updateBrandingMutation.mutate(data);
  };

  const handleFileUpload = (type: 'logo' | 'stamp', file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'Soubor příliš velký',
        description: 'Maximální velikost souboru je 5MB.',
        variant: 'destructive',
      });
      return;
    }

    uploadAssetMutation.mutate({ type, file });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Branding a vzhled
        </CardTitle>
        <CardDescription>
          Nastavte vzhled faktur, bankovní údaje a firemní identitu
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Banking Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-4 w-4" />
                <h3 className="text-lg font-medium">Bankovní údaje</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IBAN</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="CZ6508000000192000145399" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="swift"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SWIFT/BIC</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="GIBACZPX" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Company Assets */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <FileImage className="h-4 w-4" />
                <h3 className="text-lg font-medium">Firemní materiály</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Logo společnosti</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {form.watch('logoUrl') ? (
                      <div className="space-y-2">
                        <img
                          src={form.watch('logoUrl')}
                          alt="Logo"
                          className="mx-auto max-h-16 object-contain"
                        />
                        <p className="text-sm text-muted-foreground">Logo nahráno</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="text-sm text-muted-foreground">Nahrajte logo</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('logo', file);
                      }}
                      className="sr-only"
                      id="logo-upload"
                    />
                    <Label
                      htmlFor="logo-upload"
                      className="mt-2 cursor-pointer inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Vybrat soubor
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Razítko/Podpis</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {form.watch('stampUrl') ? (
                      <div className="space-y-2">
                        <img
                          src={form.watch('stampUrl')}
                          alt="Razítko"
                          className="mx-auto max-h-16 object-contain"
                        />
                        <p className="text-sm text-muted-foreground">Razítko nahráno</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Stamp className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="text-sm text-muted-foreground">Nahrajte razítko</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('stamp', file);
                      }}
                      className="sr-only"
                      id="stamp-upload"
                    />
                    <Label
                      htmlFor="stamp-upload"
                      className="mt-2 cursor-pointer inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Vybrat soubor
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Appearance Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="h-4 w-4" />
                <h3 className="text-lg font-medium">Vzhled faktur</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="enableQrCode"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>QR kód platby</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Zobrazí QR kód pro rychlou platbu na faktuře
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

                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hlavní barva</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            {...field}
                            type="color"
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <Input
                            {...field}
                            placeholder="#f97316"
                            className="flex-1"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateBrandingMutation.isPending}
              >
                {updateBrandingMutation.isPending ? 'Ukládá se...' : 'Uložit nastavení'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}