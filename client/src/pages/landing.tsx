import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Globe,
  Send,
  Play
} from 'lucide-react';

// Interactive Demo Component
function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [currentDemo, setCurrentDemo] = useState('invoice'); // 'invoice' or 'receipt'
  
  const invoiceDemoSteps = [
    {
      type: 'user',
      text: 'Vytvořit fakturu pro Novák s.r.o. na 25 000 Kč za tvorbu webových stránek',
      delay: 0
    },
    {
      type: 'ai',
      text: 'Hledám "Novák s.r.o." v ARES registru...',
      delay: 1000
    },
    {
      type: 'ai', 
      text: '✅ Nalezen: Novák s.r.o., IČO: 12345678, Praha',
      delay: 2500
    },
    {
      type: 'ai',
      text: 'Vytvářím fakturu s následujícími údaji:\n• Zákazník: Novák s.r.o.\n• Částka: 25 000 Kč (+ 21% DPH)\n• Služba: Tvorba webových stránek',
      delay: 4000
    },
    {
      type: 'ai',
      text: '🎉 Faktura #2025001 úspěšně vytvořena a odeslána!',
      delay: 6000
    }
  ];

  const receiptDemoSteps = [
    {
      type: 'user',
      text: '📱 [Nahráno foto účtenky]',
      delay: 0
    },
    {
      type: 'ai',
      text: 'Analyzuji účtenku pomocí Vision AI...',
      delay: 1000
    },
    {
      type: 'ai',
      text: '📄 Rozpoznáno:\n• Obchod: TESCO STORES ČR\n• Datum: 23.01.2025\n• Částka: 1 847 Kč\n• DPH: 21% (321 Kč)',
      delay: 2500
    },
    {
      type: 'ai',
      text: '🔍 Detekované položky:\n• Kancelářské potřeby: 650 Kč\n• Čistící prostředky: 420 Kč\n• Káva do kanceláře: 777 Kč',
      delay: 4500
    },
    {
      type: 'ai',
      text: '✅ Náklad automaticky zaúčtován!\nKategorie: Kancelářské potřeby\nDodavatel: TESCO STORES ČR\nČástka: 1 847 Kč vč. DPH',
      delay: 6500
    }
  ];

  const demoSteps = currentDemo === 'invoice' ? invoiceDemoSteps : receiptDemoSteps;

  const invoiceCommands = [
    'Vytvořit fakturu pro Novák s.r.o. na 25 000 Kč za tvorbu webových stránek',
    'Faktura pro ABC Trading na 15 000 Kč za konzultace',
    'Nová faktura - XYZ s.r.o., 50 000 Kč, grafický design',
    'Vystavit fakturu Tech Solutions, 35 000 Kč, vývoj aplikace'
  ];

  const receiptCommands = [
    '📱 Nahrát foto účtenky z TESCO',
    '📸 Vyfotit účtenku z benzínky',
    '📄 Zpracovat účtenku z restaurace',
    '📱 Extrakce dat z účtenky Albert'
  ];

  const predefinedCommands = currentDemo === 'invoice' ? invoiceCommands : receiptCommands;

  const startDemo = (command?: string) => {
    setCurrentStep(0);
    setIsPlaying(true);
    if (command) {
      setUserInput(command);
    }
    
    // Reset and start animation
    setTimeout(() => {
      animateSteps();
    }, 100);
  };

  const switchDemo = (demoType: 'invoice' | 'receipt') => {
    setCurrentDemo(demoType);
    setCurrentStep(0);
    setIsPlaying(false);
    setUserInput('');
  };

  const animateSteps = () => {
    demoSteps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index + 1);
        if (index === demoSteps.length - 1) {
          setTimeout(() => setIsPlaying(false), 2000);
        }
      }, step.delay);
    });
  };

  return (
    <div className="space-y-6">
      {/* Demo Type Switcher */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <Button
            variant={currentDemo === 'invoice' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => switchDemo('invoice')}
            className={currentDemo === 'invoice' ? 'bg-orange-500 text-white' : ''}
          >
            <FileText className="h-4 w-4 mr-2" />
            Demo faktury
          </Button>
          <Button
            variant={currentDemo === 'receipt' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => switchDemo('receipt')}
            className={currentDemo === 'receipt' ? 'bg-orange-500 text-white' : ''}
          >
            📱
            Demo účtenky
          </Button>
        </div>
      </div>

      {/* Quick Start Commands */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {predefinedCommands.map((command, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto p-3 text-left justify-start text-sm"
            onClick={() => startDemo(command)}
            disabled={isPlaying}
          >
            <Play className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{command}</span>
          </Button>
        ))}
      </div>

      {/* Main Demo Interface */}
      <Card className="border-2 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Bot className="h-5 w-5 mr-2 text-orange-500" />
              AI Fakturační asistent
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Online
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Chat Interface */}
          <div className="h-64 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 overflow-y-auto">
            <div className="space-y-3">
              {currentStep >= 1 && (
                <div className="flex justify-end">
                  <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs text-sm">
                    {userInput || demoSteps[0].text}
                  </div>
                </div>
              )}
              
              {demoSteps.slice(1, currentStep).map((step, index) => (
                <div key={index} className="flex justify-start">
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3 rounded-lg max-w-md text-sm">
                    <div className="flex items-start">
                      <Bot className="h-4 w-4 mr-2 mt-0.5 text-orange-500 flex-shrink-0" />
                      <span className="whitespace-pre-line">{step.text}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {isPlaying && currentStep < demoSteps.length && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex space-x-2">
            <Input
              placeholder="Zkuste napsat vlastní příkaz..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isPlaying}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isPlaying && userInput.trim()) {
                  startDemo();
                }
              }}
            />
            <Button 
              onClick={() => startDemo()}
              disabled={isPlaying || !userInput.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {!isPlaying && currentStep === 0 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Klikněte na příklad výše nebo napište vlastní příkaz
            </p>
          )}
          
          {currentStep > 0 && !isPlaying && (
            <div className="text-center mt-4">
              <div className="text-sm text-gray-500 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Celková doba: 28 sekund
              </div>
              <Button onClick={() => startDemo(userInput)} variant="outline" size="sm">
                Spustit znovu
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demo Benefits */}
      <div className="grid md:grid-cols-4 gap-4 mt-6">
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
          <Zap className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <h3 className="font-semibold mb-1">Rychlost</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">30 sekund místo 10 minut</p>
        </div>
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
          <FileText className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <h3 className="font-semibold mb-1">Vision AI</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Foto účtenky → náklad</p>
        </div>
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
          <Building className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <h3 className="font-semibold mb-1">ARES integrace</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Automatické doplnění</p>
        </div>
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
          <Bot className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <h3 className="font-semibold mb-1">PDF zpracování</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Drag & drop → náklad</p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll for navbar
  window.addEventListener('scroll', () => {
    setIsScrolled(window.scrollY > 0);
  });

  const features = [
    {
      icon: <Bot className="h-6 w-6" />,
      title: "AI Asistent pro faktury i náklady",
      description: "Vytvářejte faktury i náklady pomocí AI za 30 sekund. Stačí říct co potřebujete."
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Vision AI pro účtenky",
      description: "Vyfotěte účtenku telefonem - AI automaticky vytáhne data a zaúčtuje náklad s DPH."
    },
    {
      icon: <Building className="h-6 w-6" />,
      title: "ARES integrace", 
      description: "Automatické doplnění údajů zákazníků z Czech business registru jedním klikem."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "PDF zpracování",
      description: "Nahrajte PDF fakturu - AI automaticky vytvoří náklad s přesnými údaji a kategorizací."
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Platební tracking",
      description: "Sledování plateb s automatickými upomínkami a synchronizací s bankou."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Smart analytics",
      description: "AI-powered business insights, předpovědi cash flow a automatická kategorizace nákladů."
    }
  ];

  const testimonials = [
    {
      name: "Jan Novák",
      company: "Novák Design",
      text: "Od přechodu na Doklad.ai jsem ušetřil 5 hodin týdně. AI asistent je neuvěřitelný!",
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
    { name: "Doklad.ai", price: "199 Kč", ai: true, speed: "Bleskové", ares: true, highlight: true }
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
              <span className="text-xl font-bold text-gray-900 dark:text-white">Doklad.ai</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
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
            Fakturujte a účtujte pomocí 
            <span className="text-orange-500"> umělé inteligence</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Řekněte AI co chcete fakturovat nebo vyfotěte účtenku - vytvoří fakturu či náklad za 30 sekund. 
            Žádné dlouhé formuláře, jen jednoduchý rozhovor nebo foto.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/register">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg px-8 py-4">
                <Clock className="mr-2 h-5 w-5" />
                Začít 7 dní zdarma
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4"
              onClick={() => {
                // Scroll to demo section
                document.getElementById('demo-section')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
            >
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
      <section id="demo-section" className="py-16 bg-gray-50 dark:bg-gray-800">
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
            <InteractiveDemo />
          </div>
        </div>
      </section>

      {/* Vision AI Demo Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Tak jednoduché je zpracování nákladů
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Vyfotěte účtenku nebo nahrajte PDF - AI vše zpracuje automaticky
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Vision AI for receipts */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600 dark:text-blue-400">
                  <FileText className="h-5 w-5 mr-2" />
                  Vision AI pro účtenky
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                    <strong>Krok 1:</strong> Vyfotěte účtenku telefonem 📱
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
                    <strong>AI čte:</strong> "Tesco, 1 250 Kč, kancelářské potřeby, DPH 21%"
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm">
                    <strong>Výsledek:</strong> Náklad automaticky zaúčtován ✅
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PDF Processing */}
            <Card className="border-2 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center text-green-600 dark:text-green-400">
                  <FileText className="h-5 w-5 mr-2" />
                  PDF zpracování
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                    <strong>Krok 1:</strong> Přetáhněte PDF fakturu do chatu
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm">
                    <strong>AI extrahuje:</strong> Dodavatel, částka, položky, DPH
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm">
                    <strong>Výsledek:</strong> Náklad s kompletními údaji ✅
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Proč přejít na Doklad.ai?
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
                <span className="text-xl font-bold">Doklad.ai</span>
              </div>
              <p className="text-gray-400">
                AI-powered dokladová služba pro moderní podnikatele v České republice
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
            <p>&copy; 2025 Doklad.ai. Všechna práva vyhrazena.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}