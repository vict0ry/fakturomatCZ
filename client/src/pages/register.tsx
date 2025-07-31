import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  User, 
  Building, 
  CreditCard, 
  Shield, 
  Clock,
  CheckCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Personal info
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Step 2: Company info  
  const [companyData, setCompanyData] = useState({
    companyName: '',
    ico: '',
    dic: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    bankAccount: ''
  });

  const [aresLoading, setAresLoading] = useState(false);

  // Step 3: Trial & Payment
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (personalData.password !== personalData.confirmPassword) {
      toast({
        title: "Chyba",
        description: "Hesla se neshodují",
        variant: "destructive",
      });
      return;
    }

    if (personalData.password.length < 6) {
      toast({
        title: "Chyba", 
        description: "Heslo musí mít alespoň 6 znaků",
        variant: "destructive",
      });
      return;
    }

    setStep(2);
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create account with 7-day trial
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            firstName: personalData.firstName,
            lastName: personalData.lastName,
            email: personalData.email,
            password: personalData.password,
            username: personalData.email // Používáme email jako username
          },
          company: {
            name: companyData.companyName,
            ico: companyData.ico,
            dic: companyData.dic,
            address: companyData.address,
            city: companyData.city,
            postalCode: companyData.postalCode,
            phone: companyData.phone,
            email: companyData.companyName ? personalData.email : personalData.email,
            bankAccount: companyData.bankAccount
          },
          payment: paymentData,
          trialDays: 7
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Registration successful:', result);
        toast({
          title: "Účet vytvořen!",
          description: "Máte 7 dní zdarma. Přihlaste se a začněte fakturovat.",
        });
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Registration failed:', response.status, errorData);
        throw new Error(errorData.message || 'Registrace selhala');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      toast({
        title: "Chyba při registraci",
        description: error instanceof Error ? error.message : "Zkuste to prosím znovu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const trialFeatures = [
    "Neomezené faktury po dobu 7 dní",
    "AI asistent pro rychlou fakturaci", 
    "ARES integrace pro zákazníky",
    "PDF generování a email odesílání",
    "Mobilní aplikace",
    "24/7 podpora"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zpět na hlavní stránku
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Začněte 7 dní zdarma
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Žádné skryté poplatky • Zrušitelné kdykoliv
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Progress Steps */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step >= stepNum 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {step > stepNum ? <CheckCircle className="h-5 w-5" /> : stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step > stepNum ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-orange-500" />
                    Osobní údaje
                  </CardTitle>
                  <CardDescription>
                    Vytvořte si účet pro přístup k systému
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePersonalSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Jméno</Label>
                        <Input
                          id="firstName"
                          value={personalData.firstName}
                          onChange={(e) => setPersonalData(prev => ({...prev, firstName: e.target.value}))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Příjmení</Label>
                        <Input
                          id="lastName"
                          value={personalData.lastName}
                          onChange={(e) => setPersonalData(prev => ({...prev, lastName: e.target.value}))}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={personalData.email}
                        onChange={(e) => setPersonalData(prev => ({...prev, email: e.target.value}))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="password">Heslo</Label>
                      <Input
                        id="password"
                        type="password"
                        value={personalData.password}
                        onChange={(e) => setPersonalData(prev => ({...prev, password: e.target.value}))}
                        required
                        minLength={6}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword">Potvrzení hesla</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={personalData.confirmPassword}
                        onChange={(e) => setPersonalData(prev => ({...prev, confirmPassword: e.target.value}))}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                      Pokračovat
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Company Info */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2 text-orange-500" />
                    Údaje o firmě
                  </CardTitle>
                  <CardDescription>
                    Tyto údaje se budou zobrazovat na vašich fakturách
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCompanySubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Název firmy</Label>
                      <Input
                        id="companyName"
                        value={companyData.companyName}
                        onChange={(e) => setCompanyData(prev => ({...prev, companyName: e.target.value}))}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ico">IČO</Label>
                        <Input
                          id="ico"
                          value={companyData.ico}
                          onChange={async (e) => {
                            const ico = e.target.value;
                            setCompanyData(prev => ({...prev, ico}));
                            
                            // Auto-fill from ARES if IČO is 8 digits
                            if (ico.length === 8 && /^\d{8}$/.test(ico)) {
                              setAresLoading(true);
                              try {
                                const response = await fetch(`/api/test/ares/${ico}`);
                                if (response.ok) {
                                  const data = await response.json();
                                  if (data.data) {
                                    setCompanyData(prev => ({
                                      ...prev,
                                      companyName: data.data.name || prev.companyName,
                                      dic: data.data.dic || prev.dic,
                                      address: data.data.address || prev.address,
                                      city: data.data.city || prev.city,
                                      postalCode: data.data.postalCode || prev.postalCode
                                    }));
                                    toast({
                                      title: "ARES",
                                      description: `Údaje načteny pro: ${data.data.name}`,
                                    });
                                  }
                                }
                              } catch (error) {
                                console.error('ARES lookup failed:', error);
                              } finally {
                                setAresLoading(false);
                              }
                            }
                          }}
                          disabled={aresLoading}
                        />
                        {aresLoading && (
                          <p className="text-sm text-gray-500 mt-1">
                            📡 Načítám údaje z ARES...
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="dic">DIČ</Label>
                        <Input
                          id="dic"
                          value={companyData.dic}
                          onChange={(e) => setCompanyData(prev => ({...prev, dic: e.target.value}))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="address">Adresa</Label>
                      <Input
                        id="address"
                        value={companyData.address}
                        onChange={(e) => setCompanyData(prev => ({...prev, address: e.target.value}))}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Město</Label>
                        <Input
                          id="city"
                          value={companyData.city}
                          onChange={(e) => setCompanyData(prev => ({...prev, city: e.target.value}))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode">PSČ</Label>
                        <Input
                          id="postalCode"
                          value={companyData.postalCode}
                          onChange={(e) => setCompanyData(prev => ({...prev, postalCode: e.target.value}))}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={() => setStep(1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Zpět
                      </Button>
                      <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
                        Pokračovat
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Trial & Payment */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-orange-500" />
                    Platební údaje
                  </CardTitle>
                  <CardDescription>
                    Karta bude naúčtována až po skončení 7denního trial období
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center text-orange-800 dark:text-orange-200 mb-2">
                      <Shield className="h-4 w-4 mr-2" />
                      <span className="font-semibold">Bezpečná 7denní zkušební doba</span>
                    </div>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Vaše karta nebude zatížena po dobu 7 dní. Můžete zrušit kdykoliv bez poplatku.
                    </p>
                  </div>

                  <form onSubmit={handleFinalSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Číslo karty</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={paymentData.cardNumber}
                        onChange={(e) => setPaymentData(prev => ({...prev, cardNumber: e.target.value}))}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Platnost</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/RR"
                          value={paymentData.expiryDate}
                          onChange={(e) => setPaymentData(prev => ({...prev, expiryDate: e.target.value}))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={paymentData.cvv}
                          onChange={(e) => setPaymentData(prev => ({...prev, cvv: e.target.value}))}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="cardName">Jméno na kartě</Label>
                      <Input
                        id="cardName"
                        value={paymentData.cardName}
                        onChange={(e) => setPaymentData(prev => ({...prev, cardName: e.target.value}))}
                        required
                      />
                    </div>

                    <Separator />

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Registrací souhlasíte s našimi <Link href="/terms" className="text-orange-500 hover:underline">podmínkami použití</Link> a <Link href="/privacy" className="text-orange-500 hover:underline">zásadami ochrany soukromí</Link>.</p>
                    </div>

                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={() => setStep(2)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Zpět
                      </Button>
                      <Button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600">
                        {loading ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Vytváří se účet...
                          </>
                        ) : (
                          <>
                            <Clock className="mr-2 h-4 w-4" />
                            Začít 7 dní zdarma
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Trial Benefits Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Co získáte zdarma</CardTitle>
                <Badge className="w-fit bg-orange-100 text-orange-800 border-orange-200">
                  7 dní trial
                </Badge>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {trialFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Separator className="my-4" />
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">199 Kč</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">měsíčně po trial období</div>
                  <div className="text-xs text-gray-500 mt-1">Zrušitelné kdykoliv</div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="text-gray-600 dark:text-gray-400">
            Už máte účet?{' '}
            <Link href="/login" className="text-orange-500 hover:underline font-semibold">
              Přihlaste se zde
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}