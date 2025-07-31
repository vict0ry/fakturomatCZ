import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send } from "lucide-react";
import type { Invoice } from "@/lib/api";

interface InvoiceEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onSend: (emailData: {
    to: string;
    subject: string;
    message: string;
  }) => void;
  isLoading?: boolean;
}

export function InvoiceEmailDialog({
  open,
  onOpenChange,
  invoice,
  onSend,
  isLoading = false,
}: InvoiceEmailDialogProps) {
  const [emailData, setEmailData] = useState({
    to: invoice.customer?.email || '',
    subject: `Faktura č. ${invoice.invoiceNumber} - splatnost ${new Date(invoice.dueDate).toLocaleDateString('cs-CZ')}`,
    message: `Dobrý den,

v příloze zasíláme fakturu č. ${invoice.invoiceNumber} k uhrazení ve výši ${invoice.total} CZK.

Detaily faktury:
• Číslo faktury: ${invoice.invoiceNumber}
• Datum vystavení: ${new Date(invoice.issueDate).toLocaleDateString('cs-CZ')}
• Datum splatnosti: ${new Date(invoice.dueDate).toLocaleDateString('cs-CZ')}
• Celková částka: ${invoice.total} CZK

Prosíme o úhradu faktury do data splatnosti.

S pozdravem,
Váš tým`
  });

  const handleSend = () => {
    if (!emailData.to || !emailData.subject) {
      return;
    }
    onSend(emailData);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Odeslat fakturu emailem
          </DialogTitle>
          <DialogDescription>
            Zkontrolujte emailovou adresu a obsah zprávy před odesláním faktury č. {invoice.invoiceNumber}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email adresa */}
          <div className="space-y-2">
            <Label htmlFor="email">Email adresa příjemce *</Label>
            <Input
              id="email"
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="email@firma.cz"
              required
            />
            {!emailData.to && (
              <p className="text-sm text-red-600">Email adresa je povinná</p>
            )}
          </div>

          {/* Předmět */}
          <div className="space-y-2">
            <Label htmlFor="subject">Předmět emailu *</Label>
            <Input
              id="subject"
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Předmět emailu"
              required
            />
            {!emailData.subject && (
              <p className="text-sm text-red-600">Předmět je povinný</p>
            )}
          </div>

          {/* Obsah zprávy */}
          <div className="space-y-2">
            <Label htmlFor="message">Obsah emailu</Label>
            <Textarea
              id="message"
              value={emailData.message}
              onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Obsah zprávy, který bude odeslán zákazníkovi..."
              rows={12}
              className="resize-none"
            />
            <p className="text-sm text-gray-500">
              Faktura bude přiložena jako PDF příloha.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Zrušit
          </Button>
          <Button
            onClick={handleSend}
            disabled={isLoading || !emailData.to || !emailData.subject}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Odesílání...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Odeslat fakturu
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}