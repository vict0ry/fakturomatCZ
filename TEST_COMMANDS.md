# 🧪 Testovací Příkazy - Fakturační Systém

## Rychlé testování (doporučeno)
```bash
# Zdravotní check systému (10 sekund) - spustit VŽDY jako první
node tests/system-health.js

# Základní test všech klíčových funkcí (30 sekund)
node tests/quick-test.js

# Kompletní testování všech funkcí (3-5 minut)
node tests/comprehensive.test.js
```

## Detailní testování
```bash
# Kompletní test všech funkcí (2-3 minuty)
node tests/run-all.js

# Jednotlivé testovací sady
node tests/api.test.js        # API endpointy a komunikace
node tests/ai.test.js         # AI asistent a vytváření faktur
node tests/expense.test.js    # Správa nákladů a přílohy
node tests/advanced-features.test.js # Pokročilé AI funkce
node tests/pdf.test.js        # PDF generování
node tests/integration.test.js # End-to-end workflow
```

## Kdy spustit testy

### ✅ Před každým nasazením
```bash
node tests/quick-test.js
```

### 🔧 Po změnách v kódu
```bash
node tests/run-all.js
```

### 🤖 Problémy s AI asistentem
```bash
node tests/ai.test.js
```

### 📄 Problémy s PDF
```bash
node tests/pdf.test.js
```

### 🔌 Problémy s API
```bash
node tests/api.test.js
```

### 💰 Problémy s náklady
```bash
node tests/expense.test.js
```

### 🚀 Problémy s pokročilými funkcemi
```bash
node tests/advanced-features.test.js
```

## Očekávané výsledky

### ✅ Všechny testy prošly
```
📊 Výsledek: 5✅ / 0❌
🎉 Všechny klíčové funkce fungují!
```
➡️ **Aplikace je připravena k použití**

### ❌ Nějaké testy selhaly
```
📊 Výsledek: 3✅ / 2❌
⚠️ Některé funkce nefungují
```
➡️ **Zkontrolujte chybové zprávy a opravte problémy**

## Testované funkce

### Core API (tests/api.test.js)
- ✅ Autentizace uživatele
- ✅ Dashboard statistiky  
- ✅ CRUD operace (faktury, zákazníci)
- ✅ AI chat komunikace
- ✅ Vytváření faktur přes AI

### AI Asistent (tests/ai.test.js)
- ✅ Základní konverzace v češtině
- ✅ Navigace mezi stránkami
- ✅ Vytváření jednoduchých faktur
- ✅ Vytváření multi-item faktur
- ✅ Vyhledávání a filtrování
- ✅ Error handling

### PDF Generování (tests/pdf.test.js)
- ✅ Generování validních PDF souborů
- ✅ České znaky a formátování
- ✅ Performance testování
- ✅ Error handling

### Kompletní Workflow (tests/integration.test.js)
- ✅ End-to-end vytvoření faktury
- ✅ Změny statusu faktur
- ✅ PDF download
- ✅ Vyhledávání a filtrování
- ✅ Konzistence dat

## Troubleshooting

### Server neběží
```bash
npm run dev  # Spusťte server nejdříve
```

### Chybí testovací data
```bash
# Vytvořte alespoň jednu fakturu v aplikaci
```

### AI nefunguje
```bash
# Zkontrolujte OPENAI_API_KEY v .env nebo secrets
```

### Testy padají
```bash
# Počkejte 10 sekund po spuštění serveru a zkuste znovu
```

## Ukázkové AI příkazy pro manuální testování

### Vytváření faktur
```
vytvoř fakturu ABC Company za služby 15000 Kč
vytvoř fakturu XYZ: 5kg produktu A, 3ks produktu B za 25000 Kč  
vytvoř fakturu Test za konzultace
```

### Navigace
```
přejdi na zákazníky
zobraz faktury
přejdi na dashboard
```

### Vyhledávání
```
najdi faktury pro ABC Company
zobraz neplacené faktury
najdi zaplacené faktury
```

### Status změny
```
označ fakturu 20250001 jako zaplacenou
změň fakturu 20250002 na odeslanou
```