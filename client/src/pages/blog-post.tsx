import { useRoute } from "wouter";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User, Share2, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Blog post data - v produkci by se načítalo z API
const blogPostData = {
  id: 1,
  title: "Jak jsme vyřešili automatické párování plateb pomocí AI a dedikovaných emailů",
  description: "Podrobný pohled do systému, který automaticky páruje bankovní platby s fakturami pomocí uměle inteligence a dedikovaných emailových adres.",
  content: `
# Jak jsme vyřešili automatické párování plateb pomocí AI a dedikovaných emailů

Představte si situaci: Každý den dostáváte desítky bankovních oznámení o platbách, ale musíte ručně párovat každou platbu s konkrétní fakturou. Časově náročné, chybové a frustrující. Právě proto jsme vytvořili systém, který tento proces kompletně automatizuje.

## 🎯 Problém, který řešíme

Tradiční systémy vyžadují od zákazníků správné zadání variabilního symbolu. V praxi však:
- 40% plateb má chybný nebo chybějící variabilní symbol
- Lidé píšou poznámky různými způsoby ("Faktura 2024/001", "F2024-001", "platba za leden")
- Bankovní systémy mají různé formáty exportu
- Manuální párování zabere hodiny práce týdně

## 🚀 Naše řešení: Chytrý email systém

### Krok 1: Dedikované emailové adresy
Pro každý bankovní účet automaticky vytváříme jedinečnou emailovou adresu:
\`\`\`
platby-a1b2c3d4@doklad.ai
\`\`\`

Tato adresa je spojena s:
- Konkrétním bankovním účtem
- Bezpečnostním tokenem
- AI párovacím algoritmem

### Krok 2: Mailcow integrace pro škálovatelnost
Používáme vlastní mailserver postavený na Mailcow platformě, který:
- Automaticky vytváří nové email adresy
- Zpracovává tisíce emailů denně
- Poskytuje profesionální doručitelnost
- Umožňuje custom domény (mail.doklad.ai)

### Krok 3: AI-powered párování
Když přijde bankovní oznámení, náš systém:

1. **Extrahuje data** z různých formátů bankovních emailů
2. **Analyzuje text** pomocí OpenAI GPT modelu
3. **Identifikuje** čísla faktur, částky, názvy firem
4. **Páruje** s existujícími fakturami v databázi
5. **Potvrdí** nebo označí k manuálnímu ověření

## 🛠️ Technická architektura

### Frontend (React + TypeScript)
\`\`\`typescript
// Komponenta pro správu bankovních účtů
const BankAccountManager = () => {
  const [accounts, setAccounts] = useState([]);
  
  const createDedicatedEmail = async (accountId) => {
    const response = await apiRequest('/api/bank-accounts', {
      method: 'POST',
      body: { accountId, enableMatching: true }
    });
    
    // Automaticky generuje: platby-xyz@doklad.ai
    return response.dedicatedEmail;
  };
};
\`\`\`

### Backend (Node.js + PostgreSQL)
\`\`\`javascript
// AI párování algoritmus
const matchPaymentToInvoice = async (paymentData) => {
  const prompt = \`
    Analyzuj tuto platbu a najdi odpovídající fakturu:
    Částka: \${paymentData.amount}
    Poznámka: \${paymentData.note}
    Odesílatel: \${paymentData.sender}
    
    Dostupné faktury: \${availableInvoices}
  \`;
  
  const match = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }]
  });
  
  return processMatchResult(match);
};
\`\`\`

### Email Processing Pipeline
1. **Příjem emailu** → Mailcow → Webhook
2. **Parser** → Extrakce strukturovaných dat
3. **AI analýza** → GPT-4 interpretace
4. **Databázové párování** → PostgreSQL queries
5. **Notifikace** → Real-time updates přes WebSocket

## 📊 Výsledky v praxi

### Před implementací:
- ⏱️ 2-3 hodiny týdně na ruční párování
- 😔 15% neidentifikovaných plateb
- 💸 Zpoždění v cash flow reportingu

### Po implementaci:
- ⚡ 95% plateb spárováno automaticky
- 🎯 5 minut týdně na kontrolu výjimek
- 📈 Real-time přehled o příjmech

## 🔒 Bezpečnost na prvním místě

### Multi-layer security:
- **Token-based authentication** pro každý email
- **AES-256 šifrování** citlivých dat
- **Rate limiting** proti spam útokům
- **Audit trail** všech operací
- **GDPR compliance** pro EU zákazníky

### Příklad bezpečnostního toku:
\`\`\`
Email → Token validace → Dekryptace → AI analýza → Zápis do DB
         ↓
   Logování akce
\`\`\`

## 💡 Proč je to revoluční?

### 1. Zero-setup pro zákazníky
Zákazníci pouze zadají email do internetbankingu. Žádné složité nastavení.

### 2. Univerzální kompatibilita
Funguje s jakoukoliv bankou, která umí posílat email oznámení:
- Česká spořitelna ✅
- Komerční banka ✅  
- ČSOB ✅
- Moneta ✅
- Fio banka ✅
- A další...

### 3. Inteligentní učení
Systém si pamatuje vzorce a zlepšuje se v čase:
- Specifické formáty poznámek zákazníků
- Typické chyby v zadávání
- Regionální rozdíly v názvech

## 🔮 Budoucnost systému

### Plánované funkce:
- **Multi-currency support** pro mezinárodní platby
- **Crypto payments** integrace
- **Advanced analytics** s prediktivním modelováním  
- **Mobile SDK** pro třetí strany
- **Blockchain audit trail** pro maximální transparentnost

### API pro integrátory:
\`\`\`javascript
// Veřejné API pro integraci
const dokladAI = new DokladClient('your-api-key');

await dokladAI.payments.processIncoming({
  email: 'raw-bank-email.eml',
  accountId: 'bank-account-123'
});

// Automaticky páruje a vrací výsledek
\`\`\`

## 🏆 Závěr

Vytvořili jsme systém, který:
- **Šetří čas** podnikatelům
- **Zvyšuje přesnost** finančního reportingu  
- **Snižuje stress** z manuální administrativy
- **Škáluje neomezeně** s růstem firmy

Chcete vyzkoušet? Registrace je zdarma a během 5 minut můžete mít první automaticky spárovanou platbu.

---

*Tento článek napsal tým Doklad.ai. Pro technické dotazy kontaktujte support@doklad.ai*
  `,
  author: "Tým Doklad.ai",
  date: "28. července 2025",
  readTime: "8 min čtení",
  tags: ["AI", "FinTech", "Automatizace", "Czech Business"]
};

export default function BlogPostPage() {
  const [, params] = useRoute("/blog/:id");
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blogPostData.title,
        text: blogPostData.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Odkaz zkopírován",
        description: "Odkaz na článek byl zkopírován do schránky",
      });
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Odebráno ze záložek" : "Přidáno do záložek",
      description: isBookmarked ? "Článek byl odebrán ze záložek" : "Článek byl přidán do záložek",
    });
  };

  // Formátování markdown obsahu pro zobrazení
  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        // Headlines
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-bold mt-10 mb-6 text-gray-900 dark:text-white">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold mt-8 mb-6 text-gray-900 dark:text-white">{line.replace('# ', '')}</h1>;
        }
        
        // Code blocks
        if (line.startsWith('```')) {
          const isClosing = line === '```';
          return isClosing ? null : <div key={index} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg my-4 overflow-x-auto"><code className="text-sm font-mono">{line.replace('```', '')}</code></div>;
        }
        
        // Lists
        if (line.startsWith('- ')) {
          return <li key={index} className="ml-6 mb-2 text-gray-700 dark:text-gray-300">{line.replace('- ', '')}</li>;
        }
        
        // Regular paragraphs
        if (line.trim() && !line.startsWith('```') && !line.startsWith('#')) {
          return <p key={index} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">{line}</p>;
        }
        
        return null;
      })
      .filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/blog">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Zpět na blog
              </Button>
            </Link>
            
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleBookmark}>
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {blogPostData.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            {blogPostData.title}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            {blogPostData.description}
          </p>
          
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {blogPostData.author}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {blogPostData.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {blogPostData.readTime}
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none dark:prose-invert">
          {formatContent(blogPostData.content)}
        </div>

        {/* Article Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Líbil se vám článek?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Vyzkoušejte si náš systém automatického párování plateb zdarma
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <Button>
                  Začít zdarma
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="outline">
                  Více článků
                </Button>
              </Link>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}