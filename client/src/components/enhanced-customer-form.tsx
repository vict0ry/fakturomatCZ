import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Building2, User, Phone, Mail, Globe, MapPin, Star, AlertTriangle } from 'lucide-react';

const enhancedCustomerSchema = z.object({
  // Basic company info
  name: z.string().min(1, 'Název je povinný'),
  ico: z.string().optional(),
  dic: z.string().optional(),
  
  // Contact information
  email: z.string().email('Neplatná emailová adresa').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Neplatná URL').optional().or(z.literal('')),
  
  // Contact person
  contactPerson: z.string().optional(),
  contactPersonEmail: z.string().email('Neplatná emailová adresa').optional().or(z.literal('')),
  contactPersonPhone: z.string().optional(),
  
  // Address
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('Česká republika'),
  
  // Business details
  category: z.enum(['standard', 'vip', 'problematic']).default('standard'),
  paymentTerms: z.number().min(1).max(365).default(14),
  notes: z.string().optional(),
  
  // Status
  isActive: z.boolean().default(true),
});

type EnhancedCustomerFormData = z.infer<typeof enhancedCustomerSchema>;

interface EnhancedCustomerFormProps {
  initialData?: Partial<EnhancedCustomerFormData>;
  onSubmit: (data: EnhancedCustomerFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EnhancedCustomerForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: EnhancedCustomerFormProps) {
  const { toast } = useToast();

  const form = useForm<EnhancedCustomerFormData>({
    resolver: zodResolver(enhancedCustomerSchema),
    defaultValues: {
      name: initialData?.name || '',
      ico: initialData?.ico || '',
      dic: initialData?.dic || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      website: initialData?.website || '',
      contactPerson: initialData?.contactPerson || '',
      contactPersonEmail: initialData?.contactPersonEmail || '',
      contactPersonPhone: initialData?.contactPersonPhone || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      postalCode: initialData?.postalCode || '',
      country: initialData?.country || 'Česká republika',
      category: initialData?.category || 'standard',
      paymentTerms: initialData?.paymentTerms || 14,
      notes: initialData?.notes || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  // Auto-fill ARES data when ICO is entered
  const handleIcoBlur = async () => {
    const ico = form.getValues('ico');
    if (ico && ico.length === 8) {
      try {
        const response = await fetch(`/api/test/ares/${ico}`);
        if (response.ok) {
          const aresData = await response.json();
          if (aresData.found) {
            form.setValue('name', aresData.nazev || '');
            form.setValue('dic', aresData.dic || '');
            form.setValue('address', aresData.adresa || '');
            form.setValue('city', aresData.mesto || '');
            form.setValue('postalCode', aresData.psc || '');
            
            toast({
              title: 'ARES data načtena',
              description: 'Údaje byly automaticky vyplněny z ARES registru.',
            });
          }
        }
      } catch (error) {
        // Silently fail - ARES is not critical
      }
    }
  };

  const handleSubmit = (data: EnhancedCustomerFormData) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        
        {/* Basic Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Základní údaje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Název firmy *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Název s.r.o."
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ico">IČO</Label>
                <Input
                  id="ico"
                  {...form.register('ico')}
                  placeholder="12345678"
                  onBlur={handleIcoBlur}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dic">DIČ</Label>
                <Input
                  id="dic"
                  {...form.register('dic')}
                  placeholder="CZ12345678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie zákazníka</Label>
                <Select value={form.watch('category')} onValueChange={(value) => form.setValue('category', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte kategorii" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Standardní
                      </div>
                    </SelectItem>
                    <SelectItem value="vip">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        VIP zákazník
                      </div>
                    </SelectItem>
                    <SelectItem value="problematic">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Problematický
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Kontaktní údaje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="info@firma.cz"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="+420 123 456 789"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">Webové stránky</Label>
                <Input
                  id="website"
                  type="url"
                  {...form.register('website')}
                  placeholder="https://www.firma.cz"
                />
                {form.formState.errors.website && (
                  <p className="text-sm text-red-600">{form.formState.errors.website.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Person */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Kontaktní osoba
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Jméno a příjmení</Label>
                <Input
                  id="contactPerson"
                  {...form.register('contactPerson')}
                  placeholder="Jan Novák"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactPersonPhone">Telefon</Label>
                <Input
                  id="contactPersonPhone"
                  {...form.register('contactPersonPhone')}
                  placeholder="+420 123 456 789"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="contactPersonEmail">Email</Label>
                <Input
                  id="contactPersonEmail"
                  type="email"
                  {...form.register('contactPersonEmail')}
                  placeholder="jan.novak@firma.cz"
                />
                {form.formState.errors.contactPersonEmail && (
                  <p className="text-sm text-red-600">{form.formState.errors.contactPersonEmail.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Adresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Ulice a číslo popisné</Label>
                <Input
                  id="address"
                  {...form.register('address')}
                  placeholder="Václavské náměstí 1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Město</Label>
                <Input
                  id="city"
                  {...form.register('city')}
                  placeholder="Praha"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postalCode">PSČ</Label>
                <Input
                  id="postalCode"
                  {...form.register('postalCode')}
                  placeholder="11000"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="country">Země</Label>
                <Input
                  id="country"
                  {...form.register('country')}
                  placeholder="Česká republika"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Obchodní nastavení
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Splatnost faktur (dny)</Label>
                <Input
                  id="paymentTerms"
                  type="number"
                  min="1"
                  max="365"
                  {...form.register('paymentTerms', { valueAsNumber: true })}
                  placeholder="14"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">Aktivní zákazník</Label>
                  <p className="text-sm text-muted-foreground">
                    Neaktivní zákazníci se nezobrazují v seznamech
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) => form.setValue('isActive', checked)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Poznámky</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Interní poznámky o zákazníkovi..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Zrušit
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Ukládá se...' : (initialData ? 'Uložit změny' : 'Vytvořit zákazníka')}
          </Button>
        </div>
      </form>
    </div>
  );
}