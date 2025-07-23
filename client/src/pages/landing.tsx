import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Zap, 
  Users, 
  Clock, 
  BarChart3, 
  CreditCard,
  Shield,
  ArrowRight,
  Bot,
  FileText,
  Building,
  Star,
  Globe
} from 'lucide-react';

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll for navbar
  window.addEventListener('scroll', () => {
    setIsScrolled(window.scrollY > 0);
  });

  const features = [
    {
      icon: <Bot className="h-6 w-6" />,
      title: "AI Asistent",
      description: "Vytvářejte faktury pouze hlasem - 'Vytvořit fakturu pro Novák s.r.o. na 25 000 Kč za webové stránky'"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Rychlá fakturace",
      description: "Vytvoření faktury do 30 sekund s automatickým výpočtem DPH a professional designem"
    },
    {
      icon: <Building className="h-6 w-6" />,
      title: "ARES integrace",
      description: "Automatické doplnění údajů zákazníků z Czech business registru"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Smart analytics",
      description: "Pokročilé přehledy příjmů, výdajů a predikce cash flow pomocí AI"
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Platební tracking",
      description: "Sledování plateb s automatickými upomínkami a synchronizací s bankou"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Bezpečnost",
      description: "Enterprise úroveň zabezpečení s šifrováním a backup v cloudu"
    }
  ];

  const testimonials = [
    {
      name: "Jan Novák",
      company: "Novák Design",
      text: "Od přechodu na NašeFakturace jsem ušetřil 5 hodin týdně. AI asistent je neuvěřitelný!",
      rating: 5
    },
    {
      name: "Marie Svobodová", 
      company: "Svoboda Consulting",
      text: "Nejrychlejší systém na fakturaci v Česku. Zákazníci dostávají faktury do minuty.",
      rating: 5
    },
    {
      name: "Tomáš Procházka",
      company: "Procházka IT",
      text: "ARES integrace šetří čas při zadávání zákazníků. Doporučuji všem podnikatelům.",
      rating: 5
    }
  ];

  const competitors = [
    { name: "Fakturoidu", price: "299 Kč", ai: false, speed: "Pomalé", ares: true },
    { name: "iDoklad", price: "349 Kč", ai: false, speed: "Střední", ares: true },
    { name: "NašeFakturace", price: "199 Kč", ai: true, speed: "Bleskové", ares: true, highlight: true }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-200 ${
        isScrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">NašeFakturace</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost">Přihlášení</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Začít zdarma
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-orange-100 text-orange-800 border-orange-200">
            🚀 #1 AI-powered fakturace v ČR
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Fakturujte pomocí 
            <span className="text-orange-500"> umělé inteligence</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Řekněte AI co chcete fakturovat a ona vytvoří profesionální fakturu za 30 sekund. 
            Žádné dlouhé formuláře, jen jednoduchý rozhovor.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/register">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg px-8 py-4">
                <Clock className="mr-2 h-5 w-5" />
                Začít 7 dní zdarma
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4">
              <Globe className="mr-2 h-5 w-5" />
              Živá ukázka
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Žádné skryté poplatky
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Zrušitelné kdykoliv
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Czech GDPR compliant
            </div>
          </div>
        </div>
      </section>

      {/* AI Demo Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Takto jednoduché to je
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Stačí říct AI co chcete a ona vše vyřídí za vás
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-orange-500" />
                  AI Fakturační asistent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200">
                      <strong>Vy:</strong> "Vytvořit fakturu pro Novák s.r.o. na 25 000 Kč za tvorbu webových stránek"
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <p className="text-orange-800 dark:text-orange-200">
                      <strong>AI:</strong> "Nalezl jsem Novák s.r.o. v ARES registru. Vytvářím fakturu na 25 000 Kč za tvorbu webových stránek. Hotovo! ✅"
                    </p>
                  </div>
                  <div className="text-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Celková doba: 28 sekund
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Proč přejít na NašeFakturace?
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Moderní funkcionalita, kterou u konkurence nenajdete
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-4 text-orange-500">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Porovnání s konkurencí
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Proč si zákazníci vybírají právě nás
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left">Poskytovatel</th>
                    <th className="px-6 py-4 text-center">Cena/měsíc</th>
                    <th className="px-6 py-4 text-center">AI asistent</th>
                    <th className="px-6 py-4 text-center">Rychlost</th>
                    <th className="px-6 py-4 text-center">ARES</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((comp, index) => (
                    <tr key={index} className={comp.highlight ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800' : ''}>
                      <td className="px-6 py-4 font-semibold">
                        {comp.name}
                        {comp.highlight && <Badge className="ml-2 bg-orange-500 text-white">Doporučujeme</Badge>}
                      </td>
                      <td className="px-6 py-4 text-center">{comp.price}</td>
                      <td className="px-6 py-4 text-center">
                        {comp.ai ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : '❌'}
                      </td>
                      <td className="px-6 py-4 text-center">{comp.speed}</td>
                      <td className="px-6 py-4 text-center">
                        {comp.ares ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : '❌'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Co říkají naši zákazníci
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Přes 2000+ spokojených podnikatelů
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <CardDescription>{testimonial.company}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 italic">
                    "{testimonial.text}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-orange-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Připraveni revoluci ve fakturaci?
          </h2>
          <p className="text-orange-100 mb-8 text-lg">
            Přidejte se k 2000+ podnikatelům, kteří už ušetřili stovky hodin
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-orange-500 hover:bg-gray-100 text-lg px-8 py-4">
                <Zap className="mr-2 h-5 w-5" />
                Začít ihned zdarma
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          
          <p className="text-orange-100 text-sm mt-4">
            7 dní zdarma • Žádné skryté poplatky • Zrušitelné kdykoliv
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">NašeFakturace</span>
              </div>
              <p className="text-gray-400">
                AI-powered fakturace pro moderní podnikatele v České republice
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produkt</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Funkce</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Ceny</Link></li>
                <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Podpora</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Nápověda</Link></li>
                <li><Link href="/contact" className="hover:text-white">Kontakt</Link></li>
                <li><Link href="/api" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Právní</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Ochrana soukromí</Link></li>
                <li><Link href="/terms" className="hover:text-white">Podmínky</Link></li>
                <li><Link href="/gdpr" className="hover:text-white">GDPR</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 NašeFakturace. Všechna práva vyhrazena.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}