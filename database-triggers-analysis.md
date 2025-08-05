# Historie Logování - Současný stav vs Database Triggers

## Současný přístup (Application-level logging)

### Výhody:
- ✅ Kontrola nad tím, co se loguje
- ✅ Strukturované metadata (JSON)
- ✅ Možnost přidat business logic
- ✅ Snadné testování

### Nevýhody:
- ❌ Musí se pamatovat na každé místo
- ❌ Může se zapomenout zavolat
- ❌ Nepolapí přímé SQL UPDATE
- ❌ Více kódu k údržbě

## Database Triggers přístup

### Výhody:
- ✅ Automatické - nikdy se nezapomene
- ✅ Polapí VŠECHNY změny (i přímé SQL)
- ✅ Konzistentní napříč aplikací
- ✅ Méně kódu k údržbě

### Nevýhody:
- ❌ Těžší debugování
- ❌ Méně flexibility pro business logic
- ❌ Komplexnější pro specifické případy
- ❌ Database-specific (PostgreSQL)

## Doporučení pro doklad.ai

Ideální by bylo **hybridní přístup**:

1. **Database triggers** pro základní audit trail (kdo, kdy, co)
2. **Application logging** pro business eventi (email odeslán, status změněn)

## Implementace triggers

```sql
-- Trigger funkce pro automatické logování změn
CREATE OR REPLACE FUNCTION log_invoice_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO invoice_history (
            invoice_id,
            company_id,
            user_id,
            action,
            old_value,
            new_value,
            description,
            created_at
        ) VALUES (
            NEW.id,
            NEW.company_id,
            COALESCE(current_setting('app.current_user_id', true)::integer, 1),
            'updated_by_trigger',
            row_to_json(OLD),
            row_to_json(NEW),
            'Automatická změna faktury prostřednictvím database trigger',
            NOW()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplikace triggeru na invoices tabulku
CREATE TRIGGER invoice_audit_trigger
    AFTER UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION log_invoice_changes();
```

Tento přístup zajistí, že se NIKDY nezapomene zalogovat změna.