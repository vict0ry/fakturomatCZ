# Testovací Sada - Czech Invoice Management System

Kompletní automatizované testy pro ověření všech klíčových funkcí fakturačního systému.

## 🚀 Rychlé spuštění

```bash
# Spustit všechny testy najednou
node tests/run-all.js

# Spustit jednotlivé testovací sady
node tests/api.test.js      # API endpointy
node tests/database.test.js # Databázové operace
node tests/ai.test.js       # AI asistent
node tests/pdf.test.js      # PDF generování
node tests/integration.test.js # End-to-end workflow
```

## 📋 Testované Funkce

### 1. API Tests (`api.test.js`)
- ✅ Autentizace uživatele
- ✅ Dashboard statistiky
- ✅ Seznam faktur a zákazníků
- ✅ AI chat komunikace
- ✅ ARES integrace
- ✅ Vytváření faktur přes AI

### 2. Database Tests (`database.test.js`)
- ✅ CRUD operace pro zákazníky
- ✅ CRUD operace pro faktury
- ✅ Správa položek faktur
- ✅ Komplexní databázové dotazy
- ✅ Databázové constraints
- ✅ Relace mezi tabulkami

### 3. AI Tests (`ai.test.js`)
- ✅ Základní komunikace
- ✅ Navigace mezi stránkami
- ✅ Vytváření jednoduchých faktur
- ✅ Multi-item faktury
- ✅ Faktury bez částky
- ✅ Vyhledávání podle zákazníka
- ✅ Filtrování podle statusu
- ✅ Zpracování češtiny s diakritikou
- ✅ Krátké formáty částek (25k = 25000)
- ✅ Error handling

### 4. PDF Tests (`pdf.test.js`)
- ✅ Generování PDF pro různé faktury
- ✅ Validace PDF struktury
- ✅ Performance testování
- ✅ Czech character encoding
- ✅ Error handling pro neplatné ID
- ✅ HTTP headers validace

### 5. Integration Tests (`integration.test.js`)
- ✅ Kompletní workflow vytvoření faktury
- ✅ Změny statusu faktur
- ✅ PDF generování a download
- ✅ Vyhledávání a filtrování
- ✅ Multi-item faktury s ARES
- ✅ Error recovery
- ✅ Konzistence statistik
- ✅ UI state persistence

## 🎯 Kdy spouštět testy

### Při každé změně kódu:
```bash
node tests/run-all.js
```

### Po přidání nových funkcí:
```bash
node tests/integration.test.js
```

### Při problémech s AI:
```bash
node tests/ai.test.js
```

### Při problémech s PDF:
```bash
node tests/pdf.test.js
```

### Při změnách databáze:
```bash
node tests/database.test.js
```

## 📊 Interpretace výsledků

### ✅ Všechny testy prošly
Aplikace je připravena pro produkci nebo deployment.

### ❌ Některé testy selhaly
1. Zkontrolujte chybové zprávy
2. Opravte problematický kód
3. Spusťte testy znovu
4. Nespouštějte do produkce dokud všechny testy neprošly

### 🔧 Časté problémy

**Server není spuštěný:**
```bash
npm run dev  # Spusťte server před testy
```

**Chybí test data:**
```bash
# Vytvořte alespoň jednu fakturu v aplikaci
```

**OpenAI API problém:**
```
Error: AI should return content string
# Zkontrolujte OPENAI_API_KEY v environment
```

**PDF generování selhává:**
```
Error: PDF generation failed
# Zkontrolujte Puppeteer instalaci
```

## 🛠️ Maintenance

### Přidání nového testu:
1. Upravte příslušný `.test.js` soubor
2. Přidejte test case pomocí `await tester.test('název', async () => { ... })`
3. Aktualizujte tento README

### Změna test dat:
- Testy používají session `test-session-dev`
- Všechny testy automaticky čistí test data
- Neovlivňují produkční data

## 📁 Struktura souborů

```
tests/
├── README.md              # Tato dokumentace
├── run-all.js            # Spouštěč všech testů
├── api.test.js           # API endpoint testy
├── database.test.js      # Databázové testy
├── ai.test.js           # AI functionality testy
├── pdf.test.js          # PDF generování testy
├── integration.test.js  # End-to-end workflow testy
└── pdf-outputs/         # Výstupy PDF testů
```

## ⚡ Performance

Očekávané časy spuštění:
- API Tests: ~5s
- Database Tests: ~10s  
- AI Tests: ~30s (závisí na OpenAI API)
- PDF Tests: ~15s
- Integration Tests: ~45s
- **Celkem: ~2 minuty**

## 🔐 Bezpečnost

- Testy používají izolovaný test session
- Automatické čištění test dat
- Neovlivňují produkční databázi
- Neobsahují citlivé údaje v kódu