# 🔧 AMAZON SES SMTP CREDENTIALS - PŘIPRAVENO K OPRAVĚ

## Současný stav credentials

**SMTP_USER**: `noreply` ❌ (nesprávné)  
**SMTP_PASS**: `dokla...` ❌ (možná nekompatibilní)  
**AWS_SES_REGION**: `eu-north-1` ✅ (správné)

## Problém

SMTP_USER má hodnotu "noreply", ale Amazon SES vyžaduje specifický SMTP username vygenerovaný v AWS Console.

## Jak opravit

### 1. AWS Console → SES
```
1. Otevřít AWS Console
2. Simple Email Service
3. Region: eu-north-1 (Stockholm)
4. Kliknout "SMTP Settings" v levém menu
```

### 2. Vytvořit SMTP Credentials
```
5. Kliknout "Create SMTP Credentials"  
6. Zadat IAM User Name (např. "doklad-ai-smtp")
7. Kliknout "Create"
8. STÁHNOUT credentials soubor!
```

### 3. Nové credentials budou vypadat:
```
SMTP Username: AKIA3AIIBQEXAMPLE  (začíná AKIA...)
SMTP Password: BFhK8gF5Y2V3ExAmPlE... (dlouhý string)
```

### 4. Aktualizovat environment variables
Nahradit současné hodnoty:
```bash
SMTP_USER=AKIA3AIIBQEXAMPLE
SMTP_PASS=BFhK8gF5Y2V3ExAmPlE...
```

## Po opravě

Email systém začne fungovat okamžitě pro:
- ✅ Verified email adresy (v sandbox módu)
- ✅ Všechny adresy (po opuštění sandbox módu)

## Test po opravě

```bash
node send-test-email.js
```

Měl by vrátit:
```
✅ Email úspěšně odeslán!
📧 Message ID: 010001...
🎯 Amazon SES email systém JE FUNKČNÍ!
```

---

**Status**: Připraveno k opravě - potřeba pouze aktualizovat SMTP credentials z AWS Console.