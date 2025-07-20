import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, Link, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface InvoiceShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number;
  invoiceNumber: string;
}

interface ShareStatus {
  isActive: boolean;
  shareToken?: string;
  shareUrl?: string;
  expiresAt?: string;
  createdAt?: string;
  viewCount: number;
}

export function InvoiceShareDialog({ isOpen, onClose, invoiceId, invoiceNumber }: InvoiceShareDialogProps) {
  const [shareStatus, setShareStatus] = useState<ShareStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const { toast } = useToast();

  // Load sharing status when dialog opens
  useEffect(() => {
    if (isOpen && invoiceId) {
      loadShareStatus();
    }
  }, [isOpen, invoiceId]);

  const loadShareStatus = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/share`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionToken') || 'test-session-dev'}`
        }
      });
      
      if (response.ok) {
        const status = await response.json();
        setShareStatus(status);
      }
    } catch (error) {
      console.error('Failed to load share status:', error);
    }
  };

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionToken') || 'test-session-dev'}`
        },
        body: JSON.stringify({ expiresInDays })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Odkaz vygenerován",
          description: result.message
        });
        await loadShareStatus(); // Refresh status
      } else {
        throw new Error('Failed to generate share link');
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vygenerovat odkaz na fakturu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disableSharing = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/share`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionToken') || 'test-session-dev'}`
        }
      });

      if (response.ok) {
        toast({
          title: "Sdílení deaktivováno",
          description: "Odkaz na fakturu již není aktivní."
        });
        await loadShareStatus(); // Refresh status
      } else {
        throw new Error('Failed to disable sharing');
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se deaktivovat sdílení.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Zkopírováno",
      description: "Odkaz byl zkopírován do schránky."
    });
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const isExpired = shareStatus?.expiresAt && new Date(shareStatus.expiresAt) <= new Date();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Sdílení faktury {invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            Vygenerujte bezpečný odkaz pro sdílení faktury se zákazníky nebo partnery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {shareStatus?.isActive && !isExpired ? (
            <div className="space-y-4">
              {/* Active Link Status */}
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    Aktivní
                  </Badge>
                  <span className="text-sm text-green-700 dark:text-green-300">
                    Odkaz je funkční
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <Eye className="h-4 w-4" />
                  {shareStatus.viewCount} zobrazení
                </div>
              </div>

              {/* Share URL */}
              <div className="space-y-2">
                <Label htmlFor="shareUrl">Bezpečný odkaz</Label>
                <div className="flex gap-2">
                  <Input
                    id="shareUrl"
                    value={shareStatus.shareUrl || ''}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(shareStatus.shareUrl || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openInNewTab(shareStatus.shareUrl || '')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Expiration Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>
                  Vyprší: {shareStatus.expiresAt && format(new Date(shareStatus.expiresAt), 'dd.MM.yyyy HH:mm', { locale: cs })}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={disableSharing}
                  disabled={loading}
                >
                  Deaktivovat sdílení
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* No Active Link */}
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <Link className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Faktura není sdílena</p>
                <p className="text-sm">Vygenerujte bezpečný odkaz pro sdílení</p>
              </div>

              {/* Expiration Setting */}
              <div className="space-y-2">
                <Label htmlFor="expiresInDays">Platnost odkazu (dny)</Label>
                <Input
                  id="expiresInDays"
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 30)}
                  min={1}
                  max={365}
                />
                <p className="text-xs text-gray-500">
                  Odkaz bude aktivní po dobu {expiresInDays} dní
                </p>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateShareLink}
                disabled={loading}
                className="w-full"
              >
                <Link className="h-4 w-4 mr-2" />
                {loading ? 'Generování...' : 'Vygenerovat odkaz'}
              </Button>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Odkaz umožňuje zobrazit fakturu bez přihlášení</p>
            <p>• Zákazník může stáhnout PDF faktury</p>
            <p>• Odkaz automaticky vyprší po nastaveném čase</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}