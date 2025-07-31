import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Star } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Pricing() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubscribe = async () => {
    if (!user) {
      setLocation("/login?returnTo=" + encodeURIComponent("/pricing"));
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/stripe/create-checkout-session");
      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit předplatné. Zkuste to znovu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Neomezené faktury a zákazníci",
    "AI asistent pro rychlé vytváření",
    "ARES integrace pro české firmy", 
    "Automatické PDF generování",
    "Email odesílání faktur",
    "Platební upomínky",
    "Export do CSV/Excel",
    "Mobilní aplikace",
    "24/7 podpora",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Star className="w-4 h-4 mr-2" />
            7 dní zdarma
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Jednoduchý <span className="text-blue-600">pricing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Zkuste doklad.ai 7 dní zdarma. Žádné poplatky za nastavení, můžete kdykoli zrušit.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-2xl border-2 border-blue-200 relative overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 text-sm font-semibold transform rotate-12 translate-x-6 -translate-y-2">
              Nejpopulárnější
            </div>
            
            <CardHeader className="text-center pb-8 pt-12">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600">
                <Crown className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold">Pro</CardTitle>
              <CardDescription className="text-lg">
                Vše co potřebujete pro vaše podnikání
              </CardDescription>
              
              <div className="mt-6">
                <div className="flex items-center justify-center">
                  <span className="text-5xl font-bold">199</span>
                  <div className="ml-2">
                    <div className="text-sm text-gray-500">Kč</div>
                    <div className="text-sm text-gray-500">/měsíc</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-green-600 font-semibold">7 dní zdarma</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-8">
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="px-8 pb-8">
              <Button 
                onClick={handleSubscribe}
                disabled={isLoading || user?.subscriptionStatus === 'active'}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg py-6"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Vytváření...
                  </div>
                ) : user?.subscriptionStatus === 'active' ? (
                  "Již máte aktivní předplatné"
                ) : (
                  "Začít 7denní zkušební období"
                )}
              </Button>
              
              {!user && (
                <p className="text-sm text-gray-500 text-center mt-4">
                  Musíte se přihlásit pro zahájení zkušebního období
                </p>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Často kladené otázky</h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Jak funguje zkušební období?</h4>
              <p className="text-gray-600">
                7 dní máte přístup ke všem funkcím zdarma. Po uplynutí zkušebního období se automaticky aktivuje měsíční předplatné.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Můžu kdykoli zrušit?</h4>
              <p className="text-gray-600">
                Ano, předplatné můžete zrušit kdykoli. Budete mít přístup do konce aktuálního fakturačního období.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Jaké jsou platební možnosti?</h4>
              <p className="text-gray-600">
                Přijímáme všechny hlavní kreditní a debetní karty prostřednictvím zabezpečené Stripe platby.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Je možné změnit plán?</h4>
              <p className="text-gray-600">
                Momentálně nabízíme jeden univerzální plán se všemi funkcemi. V budoucnu plánujeme více možností.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}