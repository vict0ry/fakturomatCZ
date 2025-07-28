# Payment Matching System - Kompletní implementace

## Přehled systému

Implementoval jsem kompletní systém pro párování plateb s automatickými email účty pro každý bankovní účet, podobný systému Fakturoid. Systém umožňuje automatické přiřazování příchozích plateb k fakturám na základě variabilního symbolu.

## Klíčové komponenty

### 1. Databázové schéma

**Bank Accounts tabulka** (`bank_accounts`):
- Základní informace o účtu (název, číslo, IBAN, banka)
- Nastavení párování plateb (příchozí, odchozí, hromadné)
- Email konfigurace pro automatické zpracování
- Unikátní email token pro generování dedikovaných emailů

**Payment Matches tabulka** (`payment_matches`):
- Detaily platby z banky (částka, datum, VS, KS, SS)
- Informace o protistraně
- Typ a spolehlivost párování
- Stav a poznámky

### 2. Backend služby

**BankAccountService** (`server/services/bank-account-service.ts`):
- CRUD operace pro bankovní účty
- Generování dedikovaných email účtů pro párování
- Integrace s Mailcow API pro vytváření skutečných emailů
- Bezpečné generování hesel a tokenů

**API Routes** (`server/routes/bank-accounts.ts`):
- RESTful API pro správu bankovních účtů
- Endpoint pro generování payment emailů
- Validace pomocí Zod schémat
- Ochrana proti duplicitním číslům účtů

### 3. Frontend komponenty

**Bank Accounts Page** (`client/src/pages/bank-accounts.tsx`):
- Přehled všech bankovních účtů
- Formulář pro přidání nového účtu
- Správa nastavení párování plateb
- Generování a zobrazení payment emailů
- Ovládání visibility hesla a kopírování do schránky

## Jak systém funguje

### 1. Vytvoření bankovního účtu
```typescript
// Uživatel vyplní formulář s detaily účtu
const bankAccount = {
  name: "Hlavní účet CZK",
  accountNumber: "219819-2602094613/2010",
  bankName: "Fio banka",
  enablePaymentMatching: true
}
```

### 2. Generování payment emailu
```typescript
// Systém vytvoří unikátní email pro každý účet
const paymentEmail = `bank.219819.b7a9415jfb@doklad.ai`
const password = generateSecurePassword()

// Email se vytvoří v Mailcow serveru
await createMailcowAccount(paymentEmail, password)
```

### 3. Konfigurace v bance
Uživatel nastaví v internetovém bankovnictví:
- **Příjemce výpisů**: `bank.219819.b7a9415jfb@doklad.ai`
- **Formát**: Text nebo CSV
- **Frekvence**: Denně nebo při každé transakci

### 4. Automatické párování
```typescript
// Když dorazí email s výpisem, systém:
1. Parsuje transakce z emailu
2. Extrahuje variabilní symbol
3. Najde odpovídající fakturu
4. Vytvoří payment match záznam
5. Označí fakturu jako zaplacenou
```

## Mailcow integrace

### Environment variables
```bash
MAILCOW_HOST=https://mail.doklad.ai
MAILCOW_API_KEY=your-mailcow-api-key
```

### Vytvoření mailboxu
```typescript
const response = await fetch(`${mailcowHost}/api/v1/add/mailbox`, {
  method: 'POST',
  headers: {
    'X-API-Key': mailcowApiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    local_part: 'bank.219819.b7a9415jfb',
    domain: 'doklad.ai',
    password: securePassword,
    quota: 1024, // 1GB
    active: 1
  })
})
```

## UI/UX Features

### Intuitivní rozhraní
- **Drag & drop formuláře** pro snadné přidávání účtů
- **Toggle switches** pro rychlé zapínání/vypínání funkcí
- **Copy-to-clipboard** tlačítka pro email a hesla
- **Password visibility toggle** pro bezpečnost
- **Status indikátory** pro stav párování

### Pokročilé funkce
- **Bulk matching** - vyrovnání více faktur jednou platbou
- **Outgoing payments** - párování i odchozích plateb
- **Confidence scoring** - hodnocení spolehlivosti párování
- **Manual override** - ruční úprava automatických párování

## Bezpečnost

### Generování hesel
```typescript
private generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
```

### Unikátní tokeny
```typescript
const emailToken = nanoid(10); // Kryptograficky bezpečný token
const email = `bank.${accountNum}.${emailToken}@doklad.ai`;
```

## Routing integrace

### Backend
```typescript
// server/routes.ts
const bankAccountRoutes = (await import('./routes/bank-accounts.js')).default;
app.use('/api/bank-accounts', bankAccountRoutes);
```

### Frontend
```typescript
// client/src/App.tsx
<Route path="/bank-accounts" component={BankAccountsPage} />

// Sidebar navigace
{
  name: "Bankovní účty",
  href: "/bank-accounts", 
  icon: Building2,
  current: location === "/bank-accounts"
}
```

## Stav implementace

✅ **Databázové schéma** - Kompletní tabulky pro bank accounts a payment matches  
✅ **Backend API** - RESTful endpointy pro všechny CRUD operace  
✅ **Mailcow integrace** - Automatické vytváření email účtů  
✅ **Frontend UI** - Kompletní stránka pro správu účtů  
✅ **Routing** - Integrace do hlavní aplikace  
✅ **Bezpečnost** - Generování bezpečných hesel a tokenů  

## Další kroky

### 1. Email parsing service
Implementace služby pro čtení a parsování bankovních výpisů z emailů.

### 2. Payment matching algoritmus  
Inteligentní párování na základě VS, částky a data.

### 3. Notifikace
Email upozornění při úspěšném/neúspěšném párování.

### 4. Reporting
Statistiky párování a přehled nezpárovaných plateb.

---

Systém je nyní připraven k použití a poskytuje solidní základ pro automatické párování plateb podobný řešení Fakturoid.