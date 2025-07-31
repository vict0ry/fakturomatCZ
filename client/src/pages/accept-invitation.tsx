import { useState, useEffect } from 'react';
import { useSearch, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, Mail, User, Shield } from 'lucide-react';

interface InvitationDetails {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  company: { name: string } | null;
  expiresAt: string;
}

export default function AcceptInvitation() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const token = searchParams.get('token');
  
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setIsLoading(false);
      return;
    }

    // Fetch invitation details
    fetch(`/api/invitations/${token}`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load invitation');
        }
        return response.json();
      })
      .then((data) => {
        setInvitation(data);
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setIsLoading(false);
      });
  }, [token]);

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter a password');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsAccepting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept invitation');
      }
      
      toast({
        title: 'Pozvánka přijata',
        description: 'Váš účet byl úspěšně vytvořen. Nyní se můžete přihlásit.',
      });
      
      // Redirect to login page
      setTimeout(() => {
        setLocation('/auth/login');
      }, 2000);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Chyba</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Zpět na hlavní stránku
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Pozvánka nenalezena</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Tato pozvánka nebyla nalezena nebo již není platná.</p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Zpět na hlavní stránku
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Přijmout pozvánku</CardTitle>
          <CardDescription>
            Dokončete vytvoření vašeho účtu
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{invitation.company?.name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-600" />
              <span>{invitation.firstName} {invitation.lastName}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">{invitation.email}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">Role: {invitation.role}</span>
            </div>
          </div>

          {/* Password Form */}
          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Zadejte heslo (min. 6 znaků)"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potvrdit heslo</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Zadejte heslo znovu"
                required
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={isAccepting}
            >
              {isAccepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vytvářím účet...
                </>
              ) : (
                'Přijmout pozvánku'
              )}
            </Button>
          </form>
          
          <div className="text-xs text-gray-500 text-center">
            Pozvánka vyprší: {new Date(invitation.expiresAt).toLocaleDateString('cs-CZ')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}