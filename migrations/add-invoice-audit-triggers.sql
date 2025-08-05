-- Invoice Audit Triggers for Automatic History Logging
-- This ensures ALL invoice changes are captured automatically

-- Function to log invoice changes automatically
CREATE OR REPLACE FUNCTION log_invoice_changes()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields TEXT[];
    field_name TEXT;
    user_id_value INTEGER;
BEGIN
    -- Try to get current user ID from application context
    BEGIN
        user_id_value := COALESCE(
            current_setting('app.current_user_id', true)::integer, 
            1  -- fallback to user ID 1
        );
    EXCEPTION WHEN OTHERS THEN
        user_id_value := 1;
    END;

    IF TG_OP = 'UPDATE' THEN
        -- Find what fields actually changed
        changed_fields := ARRAY[]::TEXT[];
        
        -- Check each important field for changes
        IF OLD.invoice_number IS DISTINCT FROM NEW.invoice_number THEN
            changed_fields := array_append(changed_fields, 'invoice_number');
        END IF;
        
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            changed_fields := array_append(changed_fields, 'status');
        END IF;
        
        IF OLD.total IS DISTINCT FROM NEW.total THEN
            changed_fields := array_append(changed_fields, 'total');
        END IF;
        
        IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
            changed_fields := array_append(changed_fields, 'due_date');
        END IF;
        
        IF OLD.notes IS DISTINCT FROM NEW.notes THEN
            changed_fields := array_append(changed_fields, 'notes');
        END IF;

        -- Only log if something actually changed
        IF array_length(changed_fields, 1) > 0 THEN
            INSERT INTO invoice_history (
                invoice_id,
                company_id,
                user_id,
                action,
                old_value,
                new_value,
                description,
                metadata,
                created_at
            ) VALUES (
                NEW.id,
                NEW.company_id,
                user_id_value,
                'auto_updated',
                row_to_json(OLD)::text,
                row_to_json(NEW)::text,
                'Automatická změna faktury prostřednictvím database trigger - pole: ' || array_to_string(changed_fields, ', '),
                json_build_object(
                    'changed_fields', changed_fields,
                    'trigger_op', TG_OP,
                    'source', 'database_trigger',
                    'timestamp', extract(epoch from now())
                )::text,
                NOW()
            );
        END IF;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO invoice_history (
            invoice_id,
            company_id,
            user_id,
            action,
            description,
            metadata,
            created_at
        ) VALUES (
            NEW.id,
            NEW.company_id,
            user_id_value,
            'created',
            'Faktura byla vytvořena',
            json_build_object(
                'trigger_op', TG_OP,
                'source', 'database_trigger',
                'invoice_number', NEW.invoice_number,
                'total', NEW.total,
                'timestamp', extract(epoch from now())
            )::text,
            NOW()
        );
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO invoice_history (
            invoice_id,
            company_id,
            user_id,
            action,
            description,
            metadata,
            created_at
        ) VALUES (
            OLD.id,
            OLD.company_id,
            user_id_value,
            'deleted',
            'Faktura byla smazána',
            json_build_object(
                'trigger_op', TG_OP,
                'source', 'database_trigger',
                'invoice_number', OLD.invoice_number,
                'timestamp', extract(epoch from now())
            )::text,
            NOW()
        );
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on invoices table
DROP TRIGGER IF EXISTS invoice_audit_trigger ON invoices;
CREATE TRIGGER invoice_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION log_invoice_changes();

-- Function to log invoice items changes
CREATE OR REPLACE FUNCTION log_invoice_item_changes()
RETURNS TRIGGER AS $$
DECLARE
    user_id_value INTEGER;
BEGIN
    BEGIN
        user_id_value := COALESCE(
            current_setting('app.current_user_id', true)::integer, 
            1
        );
    EXCEPTION WHEN OTHERS THEN
        user_id_value := 1;
    END;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO invoice_history (
            invoice_id,
            company_id,
            user_id,
            action,
            description,
            metadata,
            created_at
        ) VALUES (
            NEW.invoice_id,
            (SELECT company_id FROM invoices WHERE id = NEW.invoice_id),
            user_id_value,
            'item_added',
            'Položka "' || NEW.description || '" byla přidána',
            json_build_object(
                'item_id', NEW.id,
                'description', NEW.description,
                'quantity', NEW.quantity,
                'unit_price', NEW.unit_price,
                'total', NEW.total,
                'source', 'database_trigger',
                'timestamp', extract(epoch from now())
            )::text,
            NOW()
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO invoice_history (
            invoice_id,
            company_id,
            user_id,
            action,
            description,
            metadata,
            created_at
        ) VALUES (
            NEW.invoice_id,
            (SELECT company_id FROM invoices WHERE id = NEW.invoice_id),
            user_id_value,
            'item_updated',
            'Položka "' || NEW.description || '" byla změněna',
            json_build_object(
                'item_id', NEW.id,
                'old_data', row_to_json(OLD),
                'new_data', row_to_json(NEW),
                'source', 'database_trigger',
                'timestamp', extract(epoch from now())
            )::text,
            NOW()
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO invoice_history (
            invoice_id,
            company_id,
            user_id,
            action,
            description,
            metadata,
            created_at
        ) VALUES (
            OLD.invoice_id,
            (SELECT company_id FROM invoices WHERE id = OLD.invoice_id),
            user_id_value,
            'item_deleted',
            'Položka "' || OLD.description || '" byla smazána',
            json_build_object(
                'item_id', OLD.id,
                'description', OLD.description,
                'source', 'database_trigger',
                'timestamp', extract(epoch from now())
            )::text,
            NOW()
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on invoice_items table
DROP TRIGGER IF EXISTS invoice_item_audit_trigger ON invoice_items;
CREATE TRIGGER invoice_item_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION log_invoice_item_changes();

-- Function to set user context (called from application)
CREATE OR REPLACE FUNCTION set_current_user(user_id INTEGER)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql;