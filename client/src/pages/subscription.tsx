import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface SubscriptionData {
  status: string;
  trialEndsAt?: string;
  subscriptionStartedAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  planType: string;
  monthlyPrice: string;
}

export default function Subscription() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await apiRequest("GET", "/api/stripe/subscription-status");
      const data = await response.json();
      setSubscriptionData(data);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst údaje o předplatném",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    
    try {
      await apiRequest("POST", "/api/stripe/cancel-subscription");
      
      toast({
        title: "Předplatné zrušeno",
        description: "Vaše předplatné bude zrušeno na konci aktuálního období",
      });
      
      fetchSubscriptionStatus();
    } catch (error) {
      console.error("Cancel subscription error:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se zrušit předplatné. Zkuste to znovu.",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'trial': return <Calendar className="w-4 h-4" />;
      case 'past_due': return <AlertCircle className="w-4 h-4" />;
      case 'canceled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktivní';
      case 'trial': return 'Zkušební období';
      case 'past_due': return 'Platba po splatnosti';
      case 'canceled': return 'Zrušeno';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Žádné předplatné</CardTitle>
            <CardDescription>
              Nemáte aktivní předplatné. Začněte se 7denním zkušebním obdobím zdarma.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/pricing">
              <Button className="w-full">Zobrazit plány</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isTrialActive = subscriptionData.status === 'trial' && subscriptionData.trialEnd;
  const trialDaysLeft = isTrialActive ? 
    Math.max(0, Math.ceil((new Date(subscriptionData.trialEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Správa předplatného</h1>
        <p className="text-gray-600">Spravujte své předplatné a fakturační údaje</p>
      </div>

      {/* Subscription Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Aktuální předplatné
            </CardTitle>
            <Badge className={getStatusColor(subscriptionData.status)}>
              {getStatusIcon(subscriptionData.status)}
              <span className="ml-1">{getStatusText(subscriptionData.status)}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Plán:</span>
              <span className="font-semibold">Pro - {subscriptionData.monthlyPrice} Kč/měsíc</span>
            </div>

            {isTrialActive && (
              <div className="flex justify-between">
                <span className="text-gray-600">Zkušební období končí:</span>
                <span className="font-semibold text-blue-600">
                  {new Date(subscriptionData.trialEnd!).toLocaleDateString('cs-CZ')} 
                  ({trialDaysLeft} {trialDaysLeft === 1 ? 'den' : trialDaysLeft < 5 ? 'dny' : 'dní'} zbývá)
                </span>
              </div>
            )}

            {subscriptionData.currentPeriodStart && subscriptionData.currentPeriodEnd && (
              <div className="flex justify-between">
                <span className="text-gray-600">Aktuální období:</span>
                <span className="font-semibold">
                  {new Date(subscriptionData.currentPeriodStart).toLocaleDateString('cs-CZ')} - {new Date(subscriptionData.currentPeriodEnd).toLocaleDateString('cs-CZ')}
                </span>
              </div>
            )}

            {subscriptionData.subscriptionStartedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Zahájeno:</span>
                <span className="font-semibold">
                  {new Date(subscriptionData.subscriptionStartedAt).toLocaleDateString('cs-CZ')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trial Warning */}
      {isTrialActive && trialDaysLeft <= 3 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">Zkušební období brzy končí</h3>
                <p className="text-sm text-yellow-700">
                  Za {trialDaysLeft} {trialDaysLeft === 1 ? 'den' : 'dny'} se automaticky aktivuje měsíční předplatné 199 Kč.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Akce</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionData.status === 'active' && (
            <Button 
              variant="destructive" 
              onClick={handleCancelSubscription}
              disabled={isCanceling}
              className="w-full"
            >
              {isCanceling ? "Ruším..." : "Zrušit předplatné"}
            </Button>
          )}

          {subscriptionData.status === 'canceled' && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Vaše předplatné je zrušeno</p>
              <Link href="/pricing">
                <Button className="w-full">Obnovit předplatné</Button>
              </Link>
            </div>
          )}

          {(subscriptionData.status === 'trial' || subscriptionData.status === 'past_due') && (
            <Link href="/pricing">
              <Button className="w-full">Spravovat předplatné</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Support */}
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>Potřebujete pomoc? <a href="mailto:podpora@doklad.ai" className="text-blue-600 hover:underline">Kontaktujte podporu</a></p>
      </div>
    </div>
  );
}