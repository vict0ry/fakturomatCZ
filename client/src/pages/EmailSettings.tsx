import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Settings } from 'lucide-react';

export default function EmailSettings() {
  const [settings, setSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    smtpSecure: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/email/settings', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/email/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: 'Nastavení uloženo',
          description: 'SMTP nastavení bylo úspěšně uloženo.',
        });
      } else {
        throw new Error('Chyba při ukládání');
      }
    } catch (error) {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se uložit nastavení.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Test úspěšný',
          description: data.message,
        });
      } else {
        toast({
          title: 'Test selhal',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se otestovat připojení.',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email nastavení</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Nastavte SMTP server pro odesílání emailů (faktury, připomínky, reset hesla)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            SMTP konfigurace
          </CardTitle>
          <CardDescription>
            Zadejte údaje vašeho SMTP serveru pro odesílání emailů
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtpHost">SMTP Server</Label>
              <Input
                id="smtpHost"
                placeholder="smtp.gmail.com"
                value={settings.smtpHost}
                onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="smtpPort">Port</Label>
              <Input
                id="smtpPort"
                type="number"
                placeholder="587"
                value={settings.smtpPort}
                onChange={(e) => setSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 587 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtpUser">Uživatelské jméno</Label>
              <Input
                id="smtpUser"
                placeholder="vas-email@gmail.com"
                value={settings.smtpUser}
                onChange={(e) => setSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="smtpPassword">Heslo / App Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                placeholder="••••••••"
                value={settings.smtpPassword}
                onChange={(e) => setSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromEmail">Email odesílatele</Label>
              <Input
                id="fromEmail"
                placeholder="faktury@vase-firma.cz"
                value={settings.fromEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="fromName">Jméno odesílatele</Label>
              <Input
                id="fromName"
                placeholder="Vaše firma s.r.o."
                value={settings.fromName}
                onChange={(e) => setSettings(prev => ({ ...prev, fromName: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="smtpSecure"
              checked={settings.smtpSecure}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smtpSecure: checked }))}
            />
            <Label htmlFor="smtpSecure">Použít TLS/SSL zabezpečení</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              {isLoading ? 'Ukládám...' : 'Uložit nastavení'}
            </Button>
            
            <Button 
              onClick={handleTest} 
              disabled={isTesting || !settings.smtpHost}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isTesting ? 'Testuji...' : 'Test připojení'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Návod k nastavení</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Gmail:</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>SMTP Server: smtp.gmail.com, Port: 587</li>
              <li>Zapněte 2FA a vytvořte App Password</li>
              <li>Použijte App Password místo běžného hesla</li>
            </ul>
          </div>
          
          <div>
            <strong>Seznam.cz:</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>SMTP Server: smtp.seznam.cz, Port: 587</li>
              <li>Uživatelské jméno: celý email</li>
            </ul>
          </div>
          
          <div>
            <strong>O2:</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>SMTP Server: smtp.email.cz, Port: 587</li>
              <li>Uživatelské jméno: celý email</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}