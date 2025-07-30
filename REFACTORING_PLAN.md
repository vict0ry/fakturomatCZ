# Plán Refactoringu Doklad.ai - Zrychlení Vývoje

## Aktuální Problémy
1. **Monolitické komponenty** - storage.ts má 1000+ řádků s vším
2. **Duplicitní kód** - stejná logika v routes, storage, tests
3. **Pomalé debugování** - restart celého serveru kvůli každé změně
4. **Složité testování** - spouštění kompletního systému pro jednu funkci
5. **Obrovské soubory** - těžké hledání a editace kódu

## Navrhovaná Architektura

### 1. Modulární Backend (Mikroservisy v monorepu)
```
server/
├── core/                  # Sdílené utility
│   ├── database.ts       # Pouze DB connection
│   ├── auth.ts          # Auth middleware
│   └── validation.ts    # Zod schemas
├── modules/
│   ├── users/
│   │   ├── user.service.ts
│   │   ├── user.routes.ts
│   │   └── user.test.ts
│   ├── invoices/
│   │   ├── invoice.service.ts
│   │   ├── invoice.routes.ts
│   │   └── invoice.test.ts
│   ├── payments/
│   │   ├── payment.service.ts
│   │   └── payment.routes.ts
│   └── admin/
│       ├── admin.service.ts
│       └── admin.routes.ts
└── app.ts               # Pouze orchestrace
```

### 2. Rozdělené Frontend Komponenty
```
client/src/
├── core/                 # Shared components
│   ├── ui/              # shadcn components
│   ├── hooks/           # React hooks
│   └── utils/           # Helpers
├── features/
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── hooks/
│   │   └── components/
│   ├── invoices/
│   │   ├── InvoiceList.tsx
│   │   ├── InvoiceForm.tsx
│   │   └── hooks/
│   ├── admin/
│   │   ├── AdminPanel.tsx
│   │   └── UserManagement.tsx
│   └── auth/
│       ├── Login.tsx
│       └── Register.tsx
└── app/
    ├── App.tsx
    └── router.tsx
```

### 3. Nezávislé Testování
```
tests/
├── unit/
│   ├── users.test.js
│   ├── invoices.test.js
│   └── payments.test.js
├── integration/
│   ├── auth-flow.test.js
│   └── payment-flow.test.js
└── e2e/
    ├── admin-panel.test.js
    └── invoice-creation.test.js
```

### 4. Development Workflow Zrychlení

#### Hot Module Replacement pro Moduly
- Změna v `user.service.ts` → restart pouze user modulu
- Změna v `invoice.routes.ts` → restart pouze invoice endpointů
- Frontend komponenty se hot-reloadují nezávisle

#### Paralelní Vývoj
- User management oddělený od invoice systému
- Admin panel izolovaný od běžných funkcí
- Email systém jako samostatný modul

#### Faster Testing
- Test pouze změněného modulu
- Mock ostatní služby
- Rychlé unit testy bez DB

## Implementace v Krocích

### Fáze 1: Backend Modularity (1-2 hodiny)
1. Rozdělit `storage.ts` na service třídy
2. Rozdělit `routes.ts` na feature-based routes
3. Vytvořit sdílené core moduly

### Fáze 2: Frontend Restructure (1 hodina)  
1. Přesunout komponenty do feature složek
2. Rozdělit velké komponenty na menší
3. Vyextraktovat business logiku do hooks

### Fáze 3: Development Tools (30 minut)
1. Setup hot reload pro moduly
2. Rychlé test skripty pro jednotlivé funkce
3. Development helper nástroje

### Fáze 4: Performance Optimization (30 minut)
1. Lazy loading pro admin panel
2. Code splitting pro velké funkce
3. Optimalizované buildání

## Výhody Nového Přístupu

### Pro Vývoj:
- **5x rychlejší debugging** - restart jen potřebné části
- **Paralelní práce** - admin panel nezávisle na fakturách
- **Rychlé testování** - test jen změn
- **Snadné hledání** - malé, specializované soubory

### Pro Údržbu:
- **Jasná struktura** - každá funkce má své místo
- **Nezávislé nasazení** - updaty jen částí systému
- **Snadné rozšíření** - přidání nového modulu bez konfliktů
- **Team práce** - více lidí může pracovat současně

### Pro Performance:
- **Rychlejší loading** - načítání jen potřebných částí
- **Menší bundle** - code splitting
- **Lepší caching** - nezávislé moduly

## Okamžité Akce

1. **Rozdělit storage.ts** → user.service.ts, invoice.service.ts, admin.service.ts
2. **Rozdělit routes.ts** → feature-based routing
3. **Modulární testy** → rychlé unit testy
4. **Hot reload setup** → rychlejší development

Chcete začít implementaci? Navrhuju začít s rozdělením storage.ts, protože to je největší bottleneck.