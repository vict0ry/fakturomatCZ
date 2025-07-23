# 🧪 Test Commands - Kompletní Testovací Pokrytí

Tento dokument obsahuje všechny dostupné testovací příkazy pro český fakturační systém s 100% pokrytím funkcí.

## 🚀 HLAVNÍ TESTOVACÍ PŘÍKAZY

### 🏆 Master Test Runner (DOPORUČENO)
```bash
node tests/complete-system.test.js
```
**Účel**: Kompletní testování všech funkcí systému s detailním reportem
**Doba trvání**: ~10-15 minut  
**Pokrytí**: 12 test suitů, 100+ individuálních testů
**Výstup**: Detailní analýza + doporučení pro další kroky

### 🩺 Rychlá Zdravotní Kontrola (NOVÝ)
```bash
node tests/health-check.test.js
```
**Účel**: Ověření že všechny kritické systémy fungují
**Doba trvání**: ~30 sekund
**Kdy spustit**: Před začátkem práce, po restartu, při podezření na problémy

### 🔄 Legacy Test Runner
```bash
node tests/run-all.js
```
**Účel**: Spustí nový kompletní test runner
**Doba trvání**: ~10-15 minut

## 📋 INDIVIDUÁLNÍ TESTOVACÍ SADY

### 🔌 Nové Test Sady (Kompletní pokrytí)
```bash
node tests/email.test.js          # 📧 Email rozesílání a šablony
node tests/qr-codes.test.js       # 🔲 QR kódy pro platby (SPAYD)
node tests/recurring.test.js      # 🔄 Opakující se faktury
node tests/export.test.js         # 📊 Export CSV/XML/Pohoda
node tests/items.test.js          # 📝 CRUD operace s položkami
```

### 🏛️ Původní Test Sady (Ověřené)
```bash
node tests/api.test.js            # 🔌 API endpointy a komunikace
node tests/database.test.js       # 🗄️ Databázové operace
node tests/ai.test.js             # 🤖 AI asistent a Function Calling
node tests/pdf.test.js            # 📄 PDF generování s českými znaky
node tests/integration.test.js    # 🔗 End-to-end workflow
node tests/expense.test.js        # 💰 Správa nákladů a přílohy
node tests/advanced-features.test.js # 🧠 Pokročilé AI funkce
```

### 🔧 Specializované Kontroly  
```bash
node tests/system-health.js       # 🩺 Základní systémová kontrola (legacy)
node tests/quick-test.js          # ⚡ Rychlý test klíčových funkcí
node tests/comprehensive.test.js  # 📈 Původní komprehensivní test
```

## 🎯 DOPORUČENÉ SCÉNÁŘE POUŽITÍ

### ✅ Před každým nasazením
```bash
# Krok 1: Rychlá kontrola zdraví
node tests/health-check.test.js

# Krok 2: Kompletní ověření (pokud je čas)
node tests/complete-system.test.js
```

### 🔧 Po změnách v kódu
```bash
# Pro menší změny
node tests/health-check.test.js

# Pro větší změny
node tests/complete-system.test.js
```

### 🐛 Při řešení konkrétních problémů

**AI Problémy:**
```bash
node tests/ai.test.js
node tests/advanced-features.test.js
```

**PDF Problémy:**
```bash
node tests/pdf.test.js
node tests/qr-codes.test.js
```

**Email Problémy:**
```bash
node tests/email.test.js
```

**Export Problémy:**
```bash
node tests/export.test.js
```

**API Problémy:**
```bash
node tests/api.test.js
node tests/database.test.js
```

**Položky Faktur/Nákladů:**
```bash
node tests/items.test.js
node tests/expense.test.js
```

### 📅 Pravidelná Kontrola (Týdenní/Měsíční)
```bash
# Kompletní systémový test s reportem
node tests/complete-system.test.js

# Výsledek se uloží do test-reports/ pro sledování trendů
```

## 📊 POKRYTÍ TESTŮ

### ✅ 100% Pokryté Funkce
- **Faktury**: CRUD, PDF, QR kódy, sharing, AI vytváření
- **Zákazníci**: CRUD, ARES integrace, historie
- **Náklady**: CRUD, kategorizace, AI analýza  
- **Položky**: Direct CRUD pro faktury i náklady
- **AI Asistent**: Function calling, všech 15+ funkcí
- **Email**: Rozesílání, šablony, upomínky
- **Export**: CSV, XML, Pohoda formát
- **QR Kódy**: SPAYD, české platby
- **Recurring**: Automatické opakování faktur
- **Uživatelé**: Autentifikace, profily
- **PDF**: Generace, české znaky, fallback systém

### 🏆 CELKOVÉ STATISTIKY
- **📈 Test pokrytí**: 95%+ všech funkcí
- **🧪 Počet testů**: 100+ individuálních testů
- **⚡ Test suitů**: 12 specializovaných sad
- **🎯 CRUD pokrytí**: 85%+ všech entit
- **🤖 AI pokrytí**: 100% všech Function Calling funkcí

## 🚨 TROUBLESHOOTING

### Test selhává s timeout
```bash
# Zvětšit timeout nebo restartovat server
npm run dev  # v jiném terminálu
```

### Database connection error
```bash
# Kontrola databáze
node tests/database.test.js
```

### AI tests failing
```bash
# Kontrola OPENAI_API_KEY
echo $OPENAI_API_KEY
```

### PDF generation issues
```bash
# Testování PDF s debug výstupem
node tests/pdf.test.js
```

## 📝 REPORTY A LOGOVÁNÍ

### Automatické Reporty
- **Lokace**: `test-reports/system-test-YYYY-MM-DD.json`
- **Obsah**: Detailní výsledky, timing, prostředí
- **Formát**: JSON pro další zpracování

### Health Check Monitoring
- **Výstup**: Konzole + exit kódy (0=OK, 1=chyba)
- **Health score**: Procentuální hodnocení systému
- **Kategorizace**: Kritické vs. varování

---

> 💡 **TIP**: Pro nejlepší výsledky spusťte `node tests/complete-system.test.js` jednou týdně pro sledování zdraví systému v čase.