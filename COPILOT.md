# COPILOT.md

Centrální instrukce pro AI asistenty (GitHub Copilot Chat, Copilot Agent, Cursor, atd.) v tomto repozitáři. Cílem je minimalizovat zásah do kódu, generovat recenzovatelné patche a nerozbíjet existující chování.

## 🔒 Základní pravidla

**Minimal-change policy**: Dělej jen nejmenší nutnou změnu pro splnění úkolu. Neprováděj refaktor mimo uvedený rozsah.

**Žádné změny mimo rozsah**: Pokud je zadán rozsah řádků/souborů, mimo něj nic NEUPRAVUJ ani NEMAŽ.

**Zachovej chování a API**: Veřejné API, signatury funkcí a side‑effects musí zůstat stejné, pokud není explicitně řečeno jinak.

**Reverzibilita**: Vracení výstupu jako unified diff (git patch), aby šla změna snadno zkontrolovat a revertovat.

**Bezpečné mazání**: Před smazáním kódu nejdřív napiš jednou větou důvod. Pokud si nejsi jistý dopady, navrhni alternativu s komentářem TODO.

## 🧭 Rozsah a kontext

- Pokud zadání obsahuje rozsah řádků (např. 120–160), upravuj pouze tento rozsah.
- Pokud je uveden seznam souborů, upravuj pouze tyto soubory.
- Pokud rozsah není uveden, požádej o upřesnění nebo navrhni plán s minimálním zásahem.

Kritické bloky lze chránit komentáři:
```javascript
// DO NOT MODIFY BELOW THIS LINE
// … chráněný kód …
// END DO NOT MODIFY
```

## 🧪 Akceptační kritéria

Předložená změna musí splnit:

- **Build prochází**: `npm run build`
- **Jednotkové testy**: `npm test` projdou bez nových selhání
- **Žádné nevyžádané změny** v souborech mimo definovaný rozsah
- **Bez změn veřejných signatur**, schema kontraktů, generovaných API klientů a migrací (pokud není explicitně povoleno)

## 🧾 Požadovaný formát výstupu

**Primární režim (PATCH ONLY)**: Vrať pouze unified diff (git patch). Žádný další text ani vysvětlení.

**Režim „nejdřív plán" (PLAN → PATCH)**:
1. Nejprve krátký plán v 3–5 bodech bez kódu
2. Po potvrzení vrať pouze unified diff
3. Pokud diff pokrývá více souborů, zahrň je všechny do jednoho patch bloku

## 🧹 Neprováděj

- Hromadné refaktory (přejmenování, přesuny souborů, formátování) mimo rozsah
- Změny stylu kódu, linteru či formatteru (Prettier/ESLint/EditorConfig) bez explicitního zadání
- Úpravy CI/CD, verzování balíčků, generovaných souborů a lockfile (pokud není výslovně povoleno)

## 🧑‍⚖️ Kodérské standardy

- Respektuj existující coding style a linter pravidla (viz `.editorconfig`, `eslint`, apod.)
- Preferuj explicitní typy a defenzivní programování u veřejných hranic
- Komentuj jen tam, kde je to nutné; nezasahuj do hlavičkových bannerů, licencí a copyright notice

## 🧰 Příkazy pro tento projekt

```bash
# Build
npm run build

# Testy
npm test --silent

# Lint (jen ověř, neupravuj)
npm run lint --silent -- --max-warnings=0

# Database
npm run db:push
npm run db:studio

# Development
npm run dev
```

## 📁 Souborové a doménové výjimky

- `**/node_modules/**`, `**/dist/**`, `**/build/**` – NEUPRAVUJ ručně
- `**/migrations/**` – měň pouze, pokud je to výslovně součástí úkolu
- `.github/workflows/*` – neměň bez výslovného souhlasu
- `package-lock.json`, `*.lock` – neupravuj bez explicitního zadání
- `drizzle.config.ts` – chráněný konfigurační soubor
- `server/vite.ts`, `vite.config.ts` – chráněné Vite nastavení

## 🧷 Bezpečnostní mantinely

- Při práci s přihlašovacími údaji a tajemstvími nikdy nepřidávej hodnoty do repa (respektuj `.env` a secrets)
- Neodstraňuj kontroly oprávnění, validace vstupu, logování audit trailu
- **KRITICKÁ BEZPEČNOSTNÍ PREFERENCE**: Před smazáním jakékoliv funkcionality (databázové sloupce, API endpointy, kód) VŽDY nejprve upozornit uživatele a počkat na jeho souhlas

## 🗂️ Šablony zadání (pro uživatele)

### Patch v přesném rozsahu řádků:
```
ÚKOL: Oprav [popis problému] v [cesta/k/souboru] v rozsahu řádků [od–do].
PRAVIDLA:
- Měň výhradně uvedený rozsah. Mimo něj nic nemeň ani nemaž.
- Zachovej veřejné API a chování.
VÝSTUP: POUZE unified diff (git patch). Žádný jiný text.
AKCEPTAČNÍ KRITÉRIA: npm run build && npm test projdou; žádné změny mimo rozsah.
```

### Nejdřív plán, pak patch:
```
Nejdřív napiš plán v 3–5 bodech bez kódu. Po mém „OK" pošli JEN unified diff pro [cesta] [řádky].
```

### Dotaz na potvrzení před smazáním:
```
Pokud navrhuješ smazat řádky, nejdřív napiš 1 větu „DŮVOD SMAZÁNÍ:" a čekej na potvrzení.
```

## 🧩 Příklad unified diff

```diff
--- a/src/utils/validation.ts
+++ b/src/utils/validation.ts
@@ -12,7 +12,9 @@ export function validateEmail(email: string): boolean {
-  return email.includes('@')
+  // Rozšířená validace emailu, zachování původního chování pro základní případy
+  if (!email || typeof email !== 'string') return false
+  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
 }
```

## 🚨 Běžné pasti

- Vracení volného textu místo patch formátu
- Úpravy formatteru/lint konfigurace, které „překreslí" celý soubor
- Optimalizace „pro jistotu", které mění časování/side‑effects
- Změny v `package.json` nebo lockfile bez explicitního zadání

## 📄 Poznámka pro agenty

- Plánuj kroky, ale nerealizuj změny mimo explicitní rozsah
- Pokud krok vyžaduje širší zásah, zastav se a požádej o potvrzení
- Vždy respektuj preferencie v `replit.md`
- Používej database triggers místo application-level logging pro audit trail