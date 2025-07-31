import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { insertEmailSettingSchema } from "@shared/schema";
import { z } from "zod";

export function registerEmailSettingsRoutes(app: Express) {
  console.log('🔗 Registering /api/email-settings routes...');
  
  // Get all email settings for company
  app.get("/api/email-settings", requireAuth, async (req: any, res) => {
    console.log('📧 GET /api/email-settings called with user:', req.user);
    try {
      const companyId = req.user.companyId;
      const settings = await storage.getEmailSettings(companyId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ message: "Failed to fetch email settings" });
    }
  });

  // Get specific email setting
  app.get("/api/email-settings/:emailType", requireAuth, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      const { emailType } = req.params;
      
      let setting = await storage.getEmailSetting(companyId, emailType);
      if (!setting) {
        // Create and return default settings for this email type
        const defaultSettings = getDefaultEmailSetting(emailType, companyId);
        setting = await storage.createEmailSetting(defaultSettings);
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error fetching email setting:", error);
      res.status(500).json({ message: "Failed to fetch email setting" });
    }
  });

  // Create or update email setting
  app.post("/api/email-settings", requireAuth, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      const role = req.user.role;
      
      // Only company owners can manage email settings
      if (role !== 'owner' && role !== 'admin') {
        return res.status(403).json({ message: "Only company owners can manage email settings" });
      }

      const validatedData = insertEmailSettingSchema.parse({
        ...req.body,
        companyId
      });

      // Check if setting already exists
      const existing = await storage.getEmailSetting(companyId, validatedData.emailType!);
      
      let setting;
      if (existing) {
        setting = await storage.updateEmailSetting(existing.id, validatedData);
      } else {
        setting = await storage.createEmailSetting(validatedData);
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error saving email setting:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save email setting" });
    }
  });

  // Update email setting
  app.patch("/api/email-settings/:id", requireAuth, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      const role = req.user.role;
      const { id } = req.params;
      
      // Only company owners can manage email settings
      if (role !== 'owner' && role !== 'admin') {
        return res.status(403).json({ message: "Only company owners can manage email settings" });
      }

      const setting = await storage.updateEmailSetting(parseInt(id), req.body);
      res.json(setting);
    } catch (error) {
      console.error("Error updating email setting:", error);
      res.status(500).json({ message: "Failed to update email setting" });
    }
  });

  // Delete email setting
  app.delete("/api/email-settings/:id", requireAuth, async (req: any, res) => {
    try {
      const role = req.user.role;
      const { id } = req.params;
      
      // Only company owners can manage email settings
      if (role !== 'owner' && role !== 'admin') {
        return res.status(403).json({ message: "Only company owners can manage email settings" });
      }

      await storage.deleteEmailSetting(parseInt(id));
      res.json({ message: "Email setting deleted successfully" });
    } catch (error) {
      console.error("Error deleting email setting:", error);
      res.status(500).json({ message: "Failed to delete email setting" });
    }
  });

  // Initialize default email settings for company
  app.post("/api/email-settings/initialize", requireAuth, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      const role = req.user.role;
      
      // Only company owners can initialize email settings
      if (role !== 'owner' && role !== 'admin') {
        return res.status(403).json({ message: "Only company owners can initialize email settings" });
      }

      const emailTypes = [
        'payment_failed',
        'trial_expiring_3d', 
        'trial_expiring_1d',
        'email_confirmation',
        'monthly_report',
        'onboarding_day_1',
        'onboarding_day_2',
        'onboarding_day_3',
        'onboarding_day_4',
        'onboarding_day_5',
        'onboarding_day_6',
        'onboarding_day_7'
      ];

      const createdSettings = [];
      for (const emailType of emailTypes) {
        const existing = await storage.getEmailSetting(companyId, emailType);
        if (!existing) {
          const defaultSetting = getDefaultEmailSetting(emailType, companyId);
          const created = await storage.createEmailSetting(defaultSetting);
          createdSettings.push(created);
        }
      }

      res.json({ 
        message: `Initialized ${createdSettings.length} email settings`,
        settings: createdSettings 
      });
    } catch (error) {
      console.error("Error initializing email settings:", error);
      res.status(500).json({ message: "Failed to initialize email settings" });
    }
  });
}

function getDefaultEmailSetting(emailType: string, companyId: number) {
  const defaults: Record<string, any> = {
    payment_failed: {
      companyId,
      emailType: 'payment_failed',
      isEnabled: true,
      subject: '💳 Neúspěšná platba - Doklad.ai',
      htmlContent: `<h1>Problém s platbou</h1><p>Nepodařilo se nám zpracovat vaši platbu. Nejedná se o vážný problém a můžeme to rychle vyřešit.</p>`,
      textContent: 'Nepodařilo se nám zpracovat vaši platbu. Prosím aktualizujte platební metodu.',
      triggerConditions: { priority: 'high', retryAfterHours: 24 }
    },
    trial_expiring_3d: {
      companyId,
      emailType: 'trial_expiring_3d',
      isEnabled: true,
      subject: '⏰ Trial končí za 3 dny - Doklad.ai',
      htmlContent: `<h1>Trial končí za 3 dny!</h1><p>Neztraťte přístup k revolučním funkcím Doklad.ai.</p>`,
      textContent: 'Váš trial končí za 3 dny. Aktivujte předplatné pro pokračování.',
      triggerConditions: { daysBeforeExpiry: 3 }
    },
    trial_expiring_1d: {
      companyId,
      emailType: 'trial_expiring_1d',
      isEnabled: true,
      subject: '🚨 Trial končí ZÍTRA - Doklad.ai',
      htmlContent: `<h1>Trial končí ZÍTRA!</h1><p>Poslední šance aktivovat předplatné a zachovat si přístup.</p>`,
      textContent: 'Váš trial končí zítra! Aktivujte předplatné ihned.',
      triggerConditions: { daysBeforeExpiry: 1, priority: 'urgent' }
    },
    email_confirmation: {
      companyId,
      emailType: 'email_confirmation',
      isEnabled: true,
      subject: '📧 Potvrďte emailovou adresu - Doklad.ai',
      htmlContent: `<h1>Potvrďte email</h1><p>Pro dokončení registrace prosím potvrďte svou emailovou adresu.</p>`,
      textContent: 'Potvrďte svou emailovou adresu kliknutím na odkaz.',
      triggerConditions: { expiryHours: 24 }
    },
    monthly_report: {
      companyId,
      emailType: 'monthly_report',
      isEnabled: true,
      subject: '📊 Měsíční report - Doklad.ai',
      htmlContent: `<h1>Měsíční report</h1><p>Zde je váš měsíční přehled výkonnosti.</p>`,
      textContent: 'Váš měsíční přehled výkonnosti je připraven.',
      triggerConditions: { dayOfMonth: 1, hour: 9 }
    },
    onboarding_day_1: {
      companyId,
      emailType: 'onboarding_day_1',
      isEnabled: true,
      subject: '🚀 Den 1: Vítejte v revoluci fakturace!',
      htmlContent: `<h1>Začněme společně!</h1><p>Vytvořte svou první fakturu pomocí AI asistenta.</p>`,
      textContent: 'Vítejte v Doklad.ai! Začněte vytvořením první faktury.',
      triggerConditions: { dayAfterSignup: 1 }
    },
    onboarding_day_2: {
      companyId,
      emailType: 'onboarding_day_2',
      isEnabled: true,
      subject: '📋 Den 2: ARES integrace šetří hodiny práce',
      htmlContent: `<h1>Automatické načítání firem</h1><p>Při vytváření zákazníka stačí zadat IČO.</p>`,
      textContent: 'Využijte ARES integraci pro automatické načítání firemních údajů.',
      triggerConditions: { dayAfterSignup: 2 }
    },
    onboarding_day_3: {
      companyId,
      emailType: 'onboarding_day_3',
      isEnabled: true,
      subject: '⚡ Den 3: AI asistent rozumí vašemu hlasu',
      htmlContent: `<h1>Hlasové ovládání</h1><p>Můžete diktovat faktury a přidávat poznámky.</p>`,
      textContent: 'Vyzkoušejte hlasové ovládání AI asistenta.',
      triggerConditions: { dayAfterSignup: 3 }
    },
    onboarding_day_4: {
      companyId,
      emailType: 'onboarding_day_4',
      isEnabled: true,
      subject: '📊 Den 4: Analytics předpovídají budoucnost',
      htmlContent: `<h1>Chytré analýzy</h1><p>AI predikuje platební rizika zákazníků.</p>`,
      textContent: 'Prohlédněte si chytré analýzy a predikce.',
      triggerConditions: { dayAfterSignup: 4 }
    },
    onboarding_day_5: {
      companyId,
      emailType: 'onboarding_day_5',
      isEnabled: true,
      subject: '💌 Den 5: Automatické připomínky = rychlejší platby',
      htmlContent: `<h1>Email automaty</h1><p>Nastavte si automatické připomínky.</p>`,
      textContent: 'Nastavte automatické připomínky pro rychlejší inkaso.',
      triggerConditions: { dayAfterSignup: 5 }
    },
    onboarding_day_6: {
      companyId,
      emailType: 'onboarding_day_6',
      isEnabled: true,
      subject: '🎨 Den 6: Profesionální PDF s vaším branding',
      htmlContent: `<h1>Vlastní design faktur</h1><p>Přizpůsobte si faktury vašemu brandingu.</p>`,
      textContent: 'Upravte design faktur podle vašeho brandingu.',
      triggerConditions: { dayAfterSignup: 6 }
    },
    onboarding_day_7: {
      companyId,
      emailType: 'onboarding_day_7',
      isEnabled: true,
      subject: '🏆 Den 7: Gratuluji! Jste power user Doklad.ai',
      htmlContent: `<h1>Úspěšně dokončeno!</h1><p>Nyní ovládáte všechny pokročilé funkce.</p>`,
      textContent: 'Gratulujeme! Dokončili jste onboarding proces.',
      triggerConditions: { dayAfterSignup: 7 }
    }
  };

  return defaults[emailType] || {
    companyId,
    emailType,
    isEnabled: true,
    subject: `Email - ${emailType}`,
    htmlContent: `<p>Default content for ${emailType}</p>`,
    textContent: `Default content for ${emailType}`
  };
}