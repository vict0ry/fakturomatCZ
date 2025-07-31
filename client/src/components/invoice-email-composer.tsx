import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';

const emailSchema = z.object({
  to: z.string().email('Neplatná emailová adresa'),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, 'Předmět je povinný'),
  message: z.string().min(1, 'Zpráva je povinná'),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface InvoiceEmailComposerProps {
  invoice: {
    id: number;
    invoiceNumber: string;
    customer: {
      name: string;
      email?: string;
    };
    totalAmount: number;
    dueDate: string;
  };
  companyName: string;
  onSent: () => void;
  onCancel: () => void;
}

export function InvoiceEmailComposer({
  invoice,
  companyName,
  onSent,
  onCancel,
}: InvoiceEmailComposerProps) {
  const { toast } = useToast();

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      to: invoice.customer.email || '',
      cc: '',
      bcc: '',
      subject: `Faktura ${invoice.invoiceNumber} - ${companyName}`,
      message: `Dobrý den,

posíláme Vám fakturu ${invoice.invoiceNumber} na částku ${invoice.totalAmount.toLocaleString('cs-CZ')} Kč.

Splatnost faktury je: ${new Date(invoice.dueDate).toLocaleDateString('cs-CZ')}

V příloze najdete PDF s kompletními údaji o factuře.

Děkujeme za Vaši důvěru a těšíme se na další spolupráci.

S pozdravem,
${companyName}`,
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const response = await fetch('/api/invoices/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          ...data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Nepodařilo se odeslat email');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Email odeslán',
        description: `Faktura ${invoice.invoiceNumber} byla úspěšně odeslána na ${form.getValues('to')}`,
      });
      onSent();
    },
    onError: (error: Error) => {
      toast({
        title: 'Chyba při odesílání',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: EmailFormData) => {
    sendEmailMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Odeslat fakturu emailem
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Recipient */}
          <div className="space-y-2">
            <Label htmlFor="to">Příjemce *</Label>
            <Input
              id="to"
              type="email"
              {...form.register('to')}
              placeholder="email@recipient.cz"
            />
            {form.formState.errors.to && (
              <p className="text-sm text-red-600">{form.formState.errors.to.message}</p>
            )}
          </div>

          {/* CC/BCC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cc">Kopie (CC)</Label>
              <Input
                id="cc"
                type="email"
                {...form.register('cc')}
                placeholder="email@kopie.cz"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bcc">Skrytá kopie (BCC)</Label>
              <Input
                id="bcc"
                type="email"
                {...form.register('bcc')}
                placeholder="email@skryta.cz"
              />
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Předmět *</Label>
            <Input
              id="subject"
              {...form.register('subject')}
              placeholder="Předmět emailu"
            />
            {form.formState.errors.subject && (
              <p className="text-sm text-red-600">{form.formState.errors.subject.message}</p>
            )}
          </div>

          <Separator />

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Zpráva *</Label>
            <Textarea
              id="message"
              {...form.register('message')}
              rows={8}
              placeholder="Text emailové zprávy..."
              className="min-h-[200px]"
            />
            {form.formState.errors.message && (
              <p className="text-sm text-red-600">{form.formState.errors.message.message}</p>
            )}
          </div>

          {/* Invoice Info */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Informace o faktuře</h4>
            <div className="text-sm space-y-1">
              <p><strong>Číslo:</strong> {invoice.invoiceNumber}</p>
              <p><strong>Zákazník:</strong> {invoice.customer.name}</p>
              <p><strong>Částka:</strong> {invoice.totalAmount.toLocaleString('cs-CZ')} Kč</p>
              <p><strong>Splatnost:</strong> {new Date(invoice.dueDate).toLocaleDateString('cs-CZ')}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={sendEmailMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={sendEmailMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {sendEmailMutation.isPending ? 'Odesílá se...' : 'Odeslat'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}