# Analýza súčasných funkcií aplikácie

## 📋 UI Funkcie (kompletne implementované)

### 🏢 Zákazníci (customers.tsx)
- ✅ Zobrazenie zoznamu zákazníkov  
- ✅ Vyhľadávanie podľa názvu, IČO, emailu
- ✅ Vytvorenie nového zákazníka
- ✅ Úprava existujúceho zákazníka
- ✅ ARES integrácia pre automatické načítanie firemných údajov

### 📊 Dashboard (dashboard.tsx)
- ✅ Prehľad štatistík (príjmy, faktúry, zákazníci)
- ✅ Zobrazenie faktúr po splatnosti
- ✅ Prispôsobiteľné widgety (drag & drop)
- ✅ Témy (tmavá/svetlá)
- ✅ Tlačidlá: Analýzy, Export, Nová faktúra

### 📄 Faktúry (invoices.tsx, invoice-detail.tsx)
- ✅ Zobrazenie zoznamu faktúr
- ✅ Filtrovanie podľa stavu, zákazníka, dátumu
- ✅ Detail faktúry s kompletným formulárom
- ✅ Pridávanie/úprava položiek faktúry
- ✅ Zmena stavu faktúry (koncept→odoslané→zaplatené)
- ✅ PDF export faktúr
- ✅ História zmien faktúry
- ✅ Zdieľanie faktúr (verejné odkazy)
- ✅ Email odosielanie faktúr

### 💰 Náklady (expenses.tsx, expense-create.tsx)  
- ✅ Zobrazenie zoznamu nákladov
- ✅ Vytvorenie nového nákladu
- ✅ Kategorizácia nákladov
- ✅ Nahrávanie príloh (účtenky)
- ✅ DPH kalkulácie

### ⚙️ Nastavenia (settings.tsx)
- ✅ Firemné údaje
- ✅ Email konfigurácia (SMTP/SendGrid)
- ✅ Šablóny emailov pre upomienky
- ✅ Automatické upomienky
- ✅ Správa používateľov

### 📈 Pokročilé funkcie
- ✅ Bankové transakcie
- ✅ Párowanie platieb
- ✅ Verejné zdieľanie faktúr
- ✅ Automatické upomienky
- ✅ Multi-company podpora
- ✅ Session management

---

## 🤖 AI Funkcie (aktuálne implementované)

### ✅ Faktúry
- Vytvorenie faktúry z textu (`"vytvoř fakturu pro ABC s.r.o. za konzultace 5000 kč"`)
- Pridanie položky do faktúry (`"pridaj 5kg květy za 500 kč"`)
- Aktualizácia cien faktúr (`"nastav cenu položky na 1000 kč"`)
- Navigácia (`"choď na faktúry"`, `"zobraz detail faktúry"`)

### ✅ Zákazníci  
- Vytvorenie zákazníka (`"vytvoř zákazníka ABC s.r.o. IČO 12345678"`)
- ARES integrácia (`"nájdi firmu ABC s.r.o."`)
- Vyhľadávanie zákazníkov

### ✅ Náklady
- Vytvorenie nákladu (`"vytvoř náklad ČEZ elektřina 3500 kč"`)
- Zobrazenie nákladov (`"zobraz náklady tento měsíc"`)
- **🔥 ChatGPT Vision API** - čítanie účteniek z obrázkov

### ✅ Všeobecné AI funkcie
- OpenAI Function Calling architektúra
- Intelligent command recognition 
- Context-aware responses
- Multi-action commands
- Chat história v localStorage

---

## ❌ CHÝBAJÚCE AI FUNKCIE (potrebné implementovať)

### 🚫 Dashboard AI funkcie
- **Analytics AI**: Inteligentné analýzy trendov, predpovede príjmov
- **Smart Alerts**: AI upozornenia na anomálie, riziká
- **Export AI**: Inteligentný export s odporúčaniami

### 🚫 Pokročilé faktúry AI
- **Smart Templates**: AI návrhy šablón podľa histórie
- **Price Suggestions**: Odporúčanie cien na základe podobných faktúr  
- **Payment Predictions**: Predpoveď pravdepodobnosti úhrady
- **Auto-reminders**: Inteligentné načasovanie upomienok

### 🚫 Pokročilé zákazníci AI
- **Customer Insights**: Analýza správania zákazníkov
- **Risk Scoring**: Hodnotenie rizika neplatenia
- **Segmentation**: Automatická kategorizácia zákazníkov

### 🚫 Pokročilé náklady AI  
- **Category Auto-detection**: Automatická kategorizácia nákladov
- **Duplicate Detection**: Detekcia duplicitných nákladov
- **Tax Optimization**: Odporúčania pre daňové optimalizácie

### 🚫 Email AI funkcie
- **Smart Subject Lines**: Optimalizácia subject lines pre lepšie otvorenie
- **Personalized Content**: Personalizované email templaty
- **Send Time Optimization**: Optimálny čas odoslania

### 🚫 Reporting AI
- **Smart Reports**: Automatické generovanie reportov s insights
- **Trend Analysis**: Analýza trendov a predpovedí
- **Benchmark Comparisons**: Porovnanie s priemerom odvetvia

### 🚫 Workflow AI
- **Process Automation**: Automatizácia rutinných úloh
- **Smart Notifications**: Inteligentné notifikácie podľa kontextu
- **Workflow Optimization**: Návrhy na zlepšenie procesov

---

## 🎯 PRIORITA IMPLEMENTÁCIE

### 🔥 Vysoká priorita (implementovať teraz)
1. **Analytics AI** - Dashboard inteligentné analýzy
2. **Smart Customer Insights** - Analýza zákazníkov  
3. **Payment Predictions** - Predpovede platieb faktúr
4. **Advanced Vision** - Kompletná integrácia Vision API do UI

### 🔸 Stredná priorita  
1. **Email AI** - Optimalizácia emailových kampání
2. **Report Generation AI** - Automatické reporty
3. **Process Automation** - Workflow automatizácia

### 🔹 Nízka priorita
1. **Advanced ML Features** - Pokročilé machine learning funkcie
2. **Industry Benchmarks** - Porovnanie s konkurenciou