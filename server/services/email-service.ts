import nodemailer from 'nodemailer';
import type { Invoice, Customer, InvoiceItem, User } from '@shared/schema';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  dkim?: {
    domainName: string;
    keySelector: string;
    privateKey: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    // Konfigurace pro doklad.ai doménu
    const hasAmazonSES = !!(process.env.AWS_SES_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    const hasMailcow = !!(process.env.PRODUCTION_SMTP_HOST && process.env.PRODUCTION_SMTP_USER);
    
    if (hasAmazonSES) {
      this.fromEmail = process.env.SES_FROM_EMAIL || 'noreply@doklad.ai';
    } else if (hasMailcow) {
      this.fromEmail = process.env.PRODUCTION_SMTP_USER || 'noreply@doklad.ai';
    } else {
      this.fromEmail = process.env.SMTP_USER ? `${process.env.SMTP_USER}@doklad.ai` : 'noreply@doklad.ai';
    }
    this.fromName = process.env.SMTP_FROM_NAME || 'Doklad.ai';

    const config: EmailConfig = {
      host: hasAmazonSES ? `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com` : 
            hasMailcow ? process.env.PRODUCTION_SMTP_HOST! : 
            (process.env.SMTP_HOST || 'localhost'),
      port: hasAmazonSES ? 587 : 
            hasMailcow ? parseInt(process.env.PRODUCTION_SMTP_PORT || '587') : 
            parseInt(process.env.SMTP_PORT || '2525'),
      secure: hasAmazonSES ? false : 
              hasMailcow ? (process.env.PRODUCTION_SMTP_PORT === '465') : 
              false,
      auth: hasAmazonSES ? {
        user: process.env.AWS_ACCESS_KEY_ID!,
        pass: process.env.AWS_SECRET_ACCESS_KEY!,
      } : hasMailcow && process.env.PRODUCTION_SMTP_USER && process.env.PRODUCTION_SMTP_PASS ? {
        user: process.env.PRODUCTION_SMTP_USER,
        pass: process.env.PRODUCTION_SMTP_PASS,
      } : (process.env.SMTP_HOST !== 'localhost' && process.env.SMTP_USER && process.env.SMTP_PASS) ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined
    };

    // Add DKIM if configured
    if (process.env.DKIM_DOMAIN && process.env.DKIM_SELECTOR && process.env.DKIM_PRIVATE_KEY) {
      config.dkim = {
        domainName: process.env.DKIM_DOMAIN,
        keySelector: process.env.DKIM_SELECTOR,
        privateKey: process.env.DKIM_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle escaped newlines
      };
    }

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      ...(config.auth && { auth: config.auth }),
      ...(config.dkim && { dkim: config.dkim }),
      tls: {
        rejectUnauthorized: false
      }
    });

    // Log SMTP configuration status
    this.logSMTPStatus();
  }

  private logSMTPStatus() {
    const hasAmazonSES = !!(process.env.AWS_SES_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    const hasMailcow = !!(process.env.PRODUCTION_SMTP_HOST && process.env.PRODUCTION_SMTP_USER && process.env.PRODUCTION_SMTP_PASS);
    const isLocalHost = !hasAmazonSES && !hasMailcow && process.env.SMTP_HOST === 'localhost';
    const hasCredentials = hasAmazonSES || hasMailcow || !!(process.env.SMTP_HOST && (isLocalHost || (process.env.SMTP_USER && process.env.SMTP_PASS)));
    const hasDKIM = !!(process.env.DKIM_DOMAIN && process.env.DKIM_SELECTOR && process.env.DKIM_PRIVATE_KEY);
    
    console.log('📧 Email Service Status:');
    console.log(`   SMTP: ${hasCredentials ? '✅ Configured' : '❌ Missing credentials'}`);
    console.log(`   DKIM: ${hasDKIM ? '✅ Enabled' : '⚠️  Disabled'}`);
    console.log(`   From: ${this.fromEmail}`);
    
    if (hasAmazonSES) {
      console.log(`   Server: email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com:587`);
      console.log('   Mode: 🧪 Amazon SES Development');
    } else if (hasMailcow) {
      console.log(`   Server: ${process.env.PRODUCTION_SMTP_HOST}:${process.env.PRODUCTION_SMTP_PORT || '587'}`);
      console.log('   Mode: 🐄 Mailcow Production Server');
    } else {
      console.log(`   Server: ${process.env.SMTP_HOST || 'localhost'}:${process.env.SMTP_PORT || '2525'}`);
      if (isLocalHost) {
        console.log('   Mode: Local SMTP server (no auth required)');
      } else if (!hasCredentials) {
        console.log('   ℹ️  Run "node setup-smtp.js" for configuration instructions');
      }
    }
  }

  isConfigured(): boolean {
    const hasAmazonSES = !!(process.env.AWS_SES_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    const hasMailcow = !!(process.env.PRODUCTION_SMTP_HOST && process.env.PRODUCTION_SMTP_USER && process.env.PRODUCTION_SMTP_PASS);
    const isLocalHost = !hasAmazonSES && !hasMailcow && process.env.SMTP_HOST === 'localhost';
    const hasCredentials = hasAmazonSES || hasMailcow || !!(process.env.SMTP_HOST && (isLocalHost || (process.env.SMTP_USER && process.env.SMTP_PASS)));
    return !!this.transporter && hasCredentials;
  }

  async testEmailConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('❌ SMTP connection test failed:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(user: any, resetToken: string): Promise<boolean> {
    const hasAmazonSES = !!(process.env.AWS_SES_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    
    if (!this.isConfigured()) {
      console.log('🔧 Email service not configured - SMTP credentials needed');
      console.log('📧 Password reset token generated but email cannot be sent');
      console.log(`Token for ${user.email}: ${resetToken}`);
      if (hasAmazonSES) {
        console.log('⚠️  Amazon SES credentials found but transporter failed to initialize');
      } else {
        console.log('ℹ️  Run "./configure-production-smtp.sh" to set up real email sending');
      }
      return false;
    }

    try {
      const resetUrl = `${process.env.NODE_ENV === 'production' ? 'https://doklad.ai' : 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Obnovení hesla - Doklad.ai</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Doklad.ai</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Obnovení hesla</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Ahoj ${user.firstName || user.username}!</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Obdrželi jsme požadavek na obnovení hesla pro váš účet. Pokud jste tento požadavek nevytvořili, můžete tento email ignorovat.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Obnovit heslo
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              Pokud tlačítko nefunguje, zkopírujte tento odkaz do prohlížeče:<br>
              <a href="${resetUrl}" style="color: #ff6b35; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              Tento odkaz vyprší za 1 hodinu z bezpečnostních důvodů.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Tento email byl odeslán systémem Doklad.ai<br>
              Pokud máte problémy, kontaktujte podporu.
            </p>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: 'Obnovení hesla - Doklad.ai',
        html: htmlContent,
        text: `Ahoj ${user.firstName || user.username}!\n\nObdrželi jsme požadavek na obnovení hesla. Klikněte na tento odkaz pro obnovení: ${resetUrl}\n\nOdkaz vyprší za 1 hodinu.\n\nPokud jste tento požadavek nevytvořili, ignorujte tento email.\n\nDoklad.ai tým`,
        headers: {
          'X-Mailer': 'Doklad.ai Professional v1.0',
          'X-Priority': '3',
          'List-Unsubscribe': '<mailto:unsubscribe@doklad.ai>',
          'X-Entity-Ref-ID': 'password-reset-system',
          'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@doklad.ai>`
        }
      });

      console.log(`✅ Password reset email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Password reset email error:', error);
      return false;
    }
  }

  async sendEmailConfirmation(user: User, confirmationToken: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const confirmationUrl = `${process.env.NODE_ENV === 'production' ? 'https://doklad.ai' : 'http://localhost:5000'}/confirm-email?token=${confirmationToken}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Potvrzení emailu - Doklad.ai</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Doklad.ai</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Potvrzení emailu</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Vítejte v Doklad.ai!</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Děkujeme za registraci. Pro dokončení registrace prosím potvrďte svou emailovou adresu kliknutím na tlačítko níže.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" 
                 style="background: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Potvrdit email
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              Pokud tlačítko nefunguje, zkopírujte tento odkaz:<br>
              <a href="${confirmationUrl}" style="color: #ff6b35; word-break: break-all;">${confirmationUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Tento email byl odeslán systémem Doklad.ai
            </p>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email!,
        subject: 'Potvrzení emailové adresy - Doklad.ai',
        html: htmlContent,
        headers: {
          'X-Mailer': 'Doklad.ai Professional v1.0',
          'X-Priority': '3',
          'List-Unsubscribe': '<mailto:unsubscribe@doklad.ai>',
          'X-Entity-Ref-ID': 'email-confirmation-system',
          'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@doklad.ai>`
        }
      });

      console.log(`✅ Confirmation email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Email confirmation sending error:', error);
      return false;
    }
  }

  async sendInvoiceEmail(
    invoice: Invoice & { customer: Customer; items: InvoiceItem[] },
    pdfBuffer: Buffer,
    customMessage?: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const htmlContent = this.generateInvoiceEmailHTML(invoice, customMessage);
      
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: invoice.customer.email || '',
        subject: `Faktura ${invoice.invoiceNumber} - ${this.fromName}`,
        html: htmlContent,
        attachments: [
          {
            filename: `faktura-${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ],
        headers: {
          'X-Mailer': 'Doklad.ai Professional v1.0',
          'X-Priority': '3',
          'X-Invoice-Number': invoice.invoiceNumber,
          'List-Unsubscribe': '<mailto:unsubscribe@doklad.ai>',
          'X-Entity-Ref-ID': `invoice-${invoice.invoiceNumber}`,
          'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@doklad.ai>`
        }
      });

      console.log(`✅ Invoice email sent to ${invoice.customer.email}`);
      return true;
    } catch (error) {
      console.error('❌ Invoice email sending error:', error);
      return false;
    }
  }

  private generateInvoiceEmailHTML(
    invoice: Invoice & { customer: Customer; items: InvoiceItem[] },
    customMessage?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Faktura ${invoice.invoiceNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">${this.fromName}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Nová faktura</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Dobrý den ${invoice.customer.name},</h2>
          
          <p style="color: #666; line-height: 1.6;">
            ${customMessage || 'Zasíláme Vám fakturu v příloze tohoto emailu.'}
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Faktura ${invoice.invoiceNumber}</h3>
            <p><strong>Datum vystavení:</strong> ${new Date(invoice.issueDate).toLocaleDateString('cs-CZ')}</p>
            <p><strong>Datum splatnosti:</strong> ${new Date(invoice.dueDate).toLocaleDateString('cs-CZ')}</p>
            <p><strong>Celková částka:</strong> ${((invoice as any).totalAmountWithTax || (invoice as any).totalAmount || 0).toLocaleString('cs-CZ')} Kč</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Faktura je připojena jako PDF soubor. Děkujeme za spolupráci.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Tento email byl odeslán systémem Doklad.ai
          </p>
        </div>
      </body>
      </html>
    `;
  }

  async sendReminderEmail(invoice: any, type: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('🔧 Email service not configured - reminder cannot be sent');
      return false;
    }

    try {
      const reminderMessages = {
        first: {
          subject: `Připomínka úhrady faktury ${invoice.invoiceNumber}`,
          message: 'Dovolujeme si Vás zdvořile upozornit, že termín splatnosti faktury již uplynul.'
        },
        second: {
          subject: `Druhá připomínka - faktura ${invoice.invoiceNumber}`,
          message: 'Opakovaně Vás upozorňujeme na neuhrazenou fakturu. Prosíme o brzké vyrovnání.'
        },
        final: {
          subject: `Konečná výzva - faktura ${invoice.invoiceNumber}`,
          message: 'Toto je konečná výzva k úhradě faktury. V případě nezaplacení budeme nuceni podniknout další kroky.'
        }
      };

      const reminder = reminderMessages[type as keyof typeof reminderMessages];
      if (!reminder) {
        throw new Error(`Neznámý typ připomínky: ${type}`);
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${reminder.subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">${this.fromName}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Připomínka platby</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Dobrý den ${invoice.customer.name},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              ${reminder.message}
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Faktura ${invoice.invoiceNumber}</h3>
              <p><strong>Datum vystavení:</strong> ${new Date(invoice.issueDate).toLocaleDateString('cs-CZ')}</p>
              <p><strong>Datum splatnosti:</strong> ${new Date(invoice.dueDate).toLocaleDateString('cs-CZ')}</p>
              <p><strong>Částka k úhradě:</strong> ${((invoice as any).totalAmountWithTax || (invoice as any).totalAmount || 0).toLocaleString('cs-CZ')} Kč</p>
              <p><strong>Dní po splatnosti:</strong> ${Math.ceil((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))}</p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Prosíme o brzkou úhradu nebo kontaktujte nás v případě jakýchkoliv nejasností.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Tento email byl odeslán systémem Doklad.ai
            </p>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: invoice.customer.email || '',
        subject: reminder.subject,
        html: htmlContent,
        headers: {
          'X-Mailer': 'Doklad.ai Professional v1.0',
          'X-Priority': '3',
          'X-Invoice-Number': invoice.invoiceNumber,
          'List-Unsubscribe': '<mailto:unsubscribe@doklad.ai>',
          'X-Entity-Ref-ID': `reminder-${invoice.invoiceNumber}`,
          'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@doklad.ai>`
        }
      });

      console.log(`✅ ${type} reminder sent to ${invoice.customer.email} for invoice ${invoice.invoiceNumber}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending ${type} reminder:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(user: User, company: any): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('📧 Email service not configured - skipping welcome email');
      return false;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Vítejte v Doklad.ai - Revoluce ve fakturaci!</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 40px 30px; text-align: center; color: white; border-radius: 15px 15px 0 0;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700;">🎉 Vítejte v Doklad.ai!</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Jste připraveni na revoluci ve fakturaci?</p>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 24px;">Ahoj ${user.firstName}! 👋</h2>
            
            <p style="color: #4a5568; line-height: 1.7; font-size: 16px; margin-bottom: 25px;">
              <strong>Gratuluji k skvělému rozhodnutí!</strong> Právě jste se připojili k revoluci v českém finteku. 
              Připravte se ušetřit <strong>desítky hodin měsíčně</strong> a zvýšit efektivitu o <strong>300%</strong>!
            </p>

            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ff6b35;">
              <h3 style="color: #2d3748; margin-top: 0; font-size: 18px;">🚀 Co vás čeká v následujících dnech:</h3>
              <ul style="color: #4a5568; line-height: 1.6; padding-left: 20px;">
                <li><strong>AI Asistent</strong> - Vytvořte faktury pouhým poklenutím s dokumenty</li>
                <li><strong>ARES Integrace</strong> - Automatické doplnění firemních údajů</li>
                <li><strong>Smart Email Matching</strong> - Párování plateb přímo z banky</li>
                <li><strong>PDF Export</strong> - Profesionální faktury jedním klikem</li>
                <li><strong>Dashboard Analytics</strong> - Přehled cash flow v real-time</li>
              </ul>
            </div>

            <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 20px; border-radius: 10px; color: white; text-align: center; margin: 30px 0;">
              <h3 style="margin: 0 0 10px 0; font-size: 20px;">💰 Vaše úspory s Doklad.ai</h3>
              <div style="display: flex; justify-content: space-around; flex-wrap: wrap; margin-top: 15px;">
                <div style="text-align: center; margin: 10px;">
                  <div style="font-size: 24px; font-weight: bold;">40+ hodin</div>
                  <div style="font-size: 14px; opacity: 0.9;">ušetřených měsíčně</div>
                </div>
                <div style="text-align: center; margin: 10px;">
                  <div style="font-size: 24px; font-weight: bold;">15 000 Kč</div>
                  <div style="font-size: 14px; opacity: 0.9;">hodnota ušetřeného času</div>
                </div>
                <div style="text-align: center; margin: 10px;">
                  <div style="font-size: 24px; font-weight: bold;">99%</div>
                  <div style="font-size: 14px; opacity: 0.9;">snížení chybovosti</div>
                </div>
              </div>
            </div>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${process.env.NODE_ENV === 'production' ? 'https://doklad.ai' : 'http://localhost:5000'}/dashboard" 
                 style="background: #ff6b35; color: white; padding: 18px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);">
                🚀 Začít hned teď
              </a>
            </div>

            <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="color: #2d3748; margin-top: 0; font-size: 16px;">📞 Potřebujete pomoc?</h4>
              <p style="color: #4a5568; line-height: 1.6; margin: 10px 0 0 0; font-size: 14px;">
                Náš tým je tu pro vás! Kontaktujte nás kdykoliv na <a href="mailto:podpora@doklad.ai" style="color: #ff6b35;">podpora@doklad.ai</a>
                nebo prostřednictvím AI chatu přímo v aplikaci.
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #718096; font-size: 12px; text-align: center; line-height: 1.5;">
              Tento email byl odeslán systémem <strong>Doklad.ai</strong><br>
              Děkujeme, že jste si vybrali budoucnost fakturace! 🎯<br>
              <a href="mailto:unsubscribe@doklad.ai" style="color: #a0aec0;">Odhlásit odběr</a>
            </p>
          </div>
        </body>
        </html>
      `;

      const textContent = `
Vítejte v Doklad.ai! 🎉

Ahoj ${user.firstName}!

Gratuluji k skvělému rozhodnutí! Právě jste se připojili k revoluci v českém finteku.

Co vás čeká:
• AI Asistent pro vytváření faktur
• ARES Integrace pro firemní údaje
• Smart Email Matching pro párování plateb
• PDF Export profesionálních faktur
• Dashboard Analytics s real-time přehledem

Vaše úspory s Doklad.ai:
• 40+ hodin ušetřených měsíčně
• 15 000 Kč hodnota ušetřeného času
• 99% snížení chybovosti

Začněte hned teď: ${process.env.NODE_ENV === 'production' ? 'https://doklad.ai' : 'http://localhost:5000'}/dashboard

Potřebujete pomoc? Kontaktujte nás na podpora@doklad.ai

Děkujeme, že jste si vybrali budoucnost fakturace!
Doklad.ai tým
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email!,
        subject: '🎉 Vítejte v Doklad.ai - Ušetříte desítky hodin měsíčně!',
        html: htmlContent,
        text: textContent,
        headers: {
          'X-Mailer': 'Doklad.ai Professional v1.0',
          'X-Priority': '3',
          'List-Unsubscribe': '<mailto:unsubscribe@doklad.ai>',
          'X-Entity-Ref-ID': 'welcome-email-system',
          'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@doklad.ai>`
        }
      });

      console.log(`✅ Welcome email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Welcome email error:', error);
      return false;
    }
  }

  async sendAccountDeactivationEmail(user: any, company: any, reason?: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('📧 Email service not configured - skipping deactivation email');
      return false;
    }

    try {
      const feedbackUrl = `${process.env.NODE_ENV === 'production' ? 'https://doklad.ai' : 'http://localhost:5000'}/feedback?type=deactivation&email=${encodeURIComponent(user.email)}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Mrzí nás, že odcházíte - Doklad.ai</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #e53e3e 0%, #fc8181 100%); padding: 40px 30px; text-align: center; color: white; border-radius: 15px 15px 0 0;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700;">😢 Mrzí nás, že odcházíte</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Vaše zpětná vazba je pro nás velmi důležitá</p>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 24px;">Ahoj ${user.firstName || user.username}! 👋</h2>
            
            <p style="color: #4a5568; line-height: 1.7; font-size: 16px; margin-bottom: 25px;">
              <strong>Velmi nás mrzí, že jste se rozhodli opustit Doklad.ai.</strong> 
              Váš účet byl úspěšně deaktivován a všechna předplatná zrušena.
            </p>

            <div style="background: #fff5f5; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #e53e3e;">
              <h3 style="color: #2d3748; margin-top: 0; font-size: 18px;">💔 Co se stalo:</h3>
              <ul style="color: #4a5568; line-height: 1.6; padding-left: 20px;">
                <li><strong>✅ Účet deaktivován</strong> - ${user.email}</li>
                <li><strong>💳 Předplatné zrušeno</strong> - Žádné další platby</li>
                <li><strong>🔒 Data zachována</strong> - Po dobu 30 dní pro případné obnovení</li>
                <li><strong>📧 Komunikace ukončena</strong> - Žádné další marketingové emaily</li>
              </ul>
            </div>

            ${reason ? `
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #2d3748; margin-top: 0;">📝 Váš důvod odchodu:</h4>
              <p style="color: #4a5568; font-style: italic; margin: 0;">"${reason}"</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${feedbackUrl}" 
                 style="background: #e53e3e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; margin-bottom: 15px;">
                💬 Napište nám důvod odchodu
              </a>
              <br>
              <a href="mailto:podpora@doklad.ai?subject=Žádost o obnovení účtu&body=Dobrý den, chtěl bych obnovit svůj deaktivovaný účet." 
                 style="background: #48bb78; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">
                🔄 Obnovit účet
              </a>
            </div>
            
            <div style="background: #e6fffa; border: 1px solid #81e6d9; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="color: #234e52; margin-top: 0;">🎁 Něco hezkého na cestu:</h4>
              <p style="color: #234e52; margin: 0; line-height: 1.6;">
                Děkujeme za důvěru, kterou jste nám věnovali. Pokud se někdy rozhodnete vrátit, 
                budeme se těšit! Do té doby vám přejeme hodně úspěchů v podnikání. 
                <strong>Zachovejte si pozitivní energii!</strong> ✨
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              Máte-li jakékoliv dotazy nebo potřebujete pomoc s daty, neváhejte nás kontaktovat na 
              <a href="mailto:podpora@doklad.ai" style="color: #e53e3e;">podpora@doklad.ai</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              S pozdravem a přáním všeho dobrého,<br>
              <strong>Tým Doklad.ai</strong> 💙
            </p>
          </div>
        </body>
        </html>
      `;

      const textContent = `
Mrzí nás, že odcházíte - Doklad.ai

Ahoj ${user.firstName || user.username}!

Velmi nás mrzí, že jste se rozhodli opustit Doklad.ai.
Váš účet byl úspěšně deaktivován a všechna předplatná zrušena.

Co se stalo:
• Účet deaktivován: ${user.email}
• Předplatné zrušeno: Žádné další platby
• Data zachována: Po dobu 30 dní pro případné obnovení
• Komunikace ukončena: Žádné další marketingové emaily

${reason ? `Váš důvod odchodu: "${reason}"` : ''}

Něco hezkého na cestu:
Děkujeme za důvěru, kterou jste nám věnovali. Pokud se někdy rozhodnete vrátit, 
budeme se těšit! Do té doby vám přejeme hodně úspěchů v podnikání.

Napište nám důvod: ${feedbackUrl}
Obnovit účet: podpora@doklad.ai

S pozdravem a přáním všeho dobrého,
Tým Doklad.ai
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email!,
        subject: '😢 Mrzí nás, že odcházíte - Doklad.ai',
        html: htmlContent,
        text: textContent,
        headers: {
          'X-Mailer': 'Doklad.ai Professional v1.0',
          'X-Priority': '3',
          'List-Unsubscribe': '<mailto:unsubscribe@doklad.ai>',
          'X-Entity-Ref-ID': 'account-deactivation',
          'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@doklad.ai>`
        }
      });

      console.log(`✅ Deactivation email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Deactivation email error:', error);
      return false;
    }
  }

  async sendUserInvitationEmail(invitation: any, company: any): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('📧 Email service not configured - skipping invitation email');
      return false;
    }

    try {
      const invitationUrl = `${process.env.NODE_ENV === 'production' ? 'https://doklad.ai' : 'http://localhost:5000'}/accept-invitation?token=${invitation.invitationToken}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Pozvánka do týmu - Doklad.ai</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; border-radius: 15px 15px 0 0;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700;">👥 Pozvánka do týmu</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Doklad.ai - Váš nový finanční asistent</p>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 24px;">Ahoj ${invitation.firstName}! 👋</h2>
            
            <p style="color: #4a5568; line-height: 1.7; font-size: 16px; margin-bottom: 25px;">
              Byli jste pozváni do týmu společnosti <strong>${company?.name || 'Neznámá společnost'}</strong> 
              v systému Doklad.ai pro správu fakturace a účetnictví.
            </p>

            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #2d3748; margin-top: 0; font-size: 18px;">📋 Detaily pozvánky:</h3>
              <ul style="color: #4a5568; line-height: 1.6; padding-left: 20px; list-style: none;">
                <li style="margin-bottom: 8px;"><strong>📧 Email:</strong> ${invitation.email}</li>
                <li style="margin-bottom: 8px;"><strong>👤 Jméno:</strong> ${invitation.firstName} ${invitation.lastName}</li>
                <li style="margin-bottom: 8px;"><strong>🏢 Společnost:</strong> ${company?.name || 'Neznámá společnost'}</li>
                <li style="margin-bottom: 8px;"><strong>🔑 Role:</strong> ${invitation.role}</li>
                <li style="margin-bottom: 8px;"><strong>📅 Platnost do:</strong> ${new Date(invitation.expiresAt).toLocaleDateString('cs-CZ')}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                🚀 Přijmout pozvánku
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              Pokud tlačítko nefunguje, zkopírujte tento odkaz do prohlížeče:<br>
              <a href="${invitationUrl}" style="color: #667eea; word-break: break-all;">${invitationUrl}</a>
            </p>
            
            <div style="background: #fff5f5; border: 1px solid #fed7d7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #c53030; margin: 0; font-size: 14px;">
                <strong>⚠️ Důležité:</strong> Tento odkaz vyprší ${new Date(invitation.expiresAt).toLocaleDateString('cs-CZ')} v ${new Date(invitation.expiresAt).toLocaleTimeString('cs-CZ')}. 
                Pro dokončení registrace klikněte na odkaz co nejdříve.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Tento email byl odeslán systémem Doklad.ai<br>
              Pokud jste tuto pozvánku neočekávali, ignorujte tento email.
            </p>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: invitation.email,
        subject: `Pozvánka do týmu ${company?.name || 'Doklad.ai'} - Doklad.ai`,
        html: htmlContent,
        text: `Ahoj ${invitation.firstName}!\n\nByli jste pozváni do týmu společnosti ${company?.name || 'Neznámá společnost'} v systému Doklad.ai.\n\nPro přijetí pozvánky klikněte na tento odkaz: ${invitationUrl}\n\nOdkaz vyprší ${new Date(invitation.expiresAt).toLocaleDateString('cs-CZ')}.\n\nDoklad.ai tým`,
        headers: {
          'X-Mailer': 'Doklad.ai Professional v1.0',
          'X-Priority': '3',
          'List-Unsubscribe': '<mailto:unsubscribe@doklad.ai>',
          'X-Entity-Ref-ID': `invitation-${invitation.invitationToken}`,
          'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@doklad.ai>`
        }
      });

      console.log(`✅ User invitation email sent to ${invitation.email} for company ${company?.name || company?.id}`);
      return true;
    } catch (error) {
      console.error('❌ User invitation email error:', error);
      return false;
    }
  }

  // PRIORITY EMAIL IMPLEMENTATIONS

  async sendPaymentFailedEmail(user: any, paymentDetails: { amount: number, last4: string, reason: string }): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('📧 Email service not configured - skipping payment failed email');
      return false;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Neúspěšná platba - Doklad.ai</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #e53e3e 0%, #fc8181 100%); padding: 40px 30px; text-align: center; color: white; border-radius: 15px 15px 0 0;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700;">💳 Problém s platbou</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Platba nebyla úspěšně zpracována</p>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 24px;">Ahoj ${user.firstName}! 👋</h2>
            
            <p style="color: #4a5568; line-height: 1.7; font-size: 16px; margin-bottom: 25px;">
              <strong>Nepodařilo se nám zpracovat vaši platbu.</strong> 
              Nejedná se o vážný problém a můžeme to rychle vyřešit.
            </p>

            <div style="background: #fff5f5; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #e53e3e;">
              <h3 style="color: #2d3748; margin-top: 0; font-size: 18px;">💳 Detaily platby:</h3>
              <ul style="color: #4a5568; line-height: 1.6; padding-left: 20px;">
                <li><strong>Částka:</strong> ${paymentDetails.amount} Kč</li>
                <li><strong>Karta:</strong> **** **** **** ${paymentDetails.last4}</li>
                <li><strong>Důvod selhání:</strong> ${paymentDetails.reason}</li>
                <li><strong>Datum:</strong> ${new Date().toLocaleDateString('cs-CZ')}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NODE_ENV === 'production' ? 'https://doklad.ai' : 'http://localhost:5000'}/settings/billing" 
                 style="background: #e53e3e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                💳 Aktualizovat platební metodu
              </a>
            </div>
            
            <div style="background: #e6fffa; border: 1px solid #81e6d9; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="color: #234e52; margin-top: 0;">🚀 Žádné obavy!</h4>
              <p style="color: #234e52; margin: 0; line-height: 1.6;">
                Váš účet zůstává aktivní. Máte 7 dní na vyřešení platby. 
                Při jakýchkoliv otázkách nás kontaktujte na podpora@doklad.ai
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Tým Doklad.ai - Pomáháme s českým podnikáním 💙
            </p>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email!,
        subject: '💳 Neúspěšná platba - Doklad.ai',
        html: htmlContent,
        headers: {
          'X-Mailer': 'Doklad.ai Professional v1.0',
          'X-Priority': '1', // High priority
          'X-Entity-Ref-ID': 'payment-failed',
          'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@doklad.ai>`
        }
      });

      console.log(`✅ Payment failed email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Payment failed email error:', error);
      return false;
    }
  }

  async sendTrialExpiringEmail(user: any, daysLeft: number): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('📧 Email service not configured - skipping trial expiring email');
      return false;
    }

    const urgency = daysLeft === 1 ? 'ZÍTRA' : `za ${daysLeft} dny`;
    const bgColor = daysLeft === 1 ? '#e53e3e' : '#f56500';

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Trial končí ${urgency} - Doklad.ai</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, ${bgColor} 0%, #fc8181 100%); padding: 40px 30px; text-align: center; color: white; border-radius: 15px 15px 0 0;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700;">⏰ Trial končí ${urgency}!</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Neztraťte přístup k revolučním funkcím</p>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 24px;">Ahoj ${user.firstName}! 👋</h2>
            
            <p style="color: #4a5568; line-height: 1.7; font-size: 16px; margin-bottom: 25px;">
              <strong>Váš 7denní trial Doklad.ai končí ${urgency}!</strong> 
              Už brzy ztratíte přístup k úspoře 40+ hodin měsíčně.
            </p>

            <div style="background: #fff3cd; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0; font-size: 18px;">🎯 Co ztratíte bez předplatného:</h3>
              <ul style="color: #92400e; line-height: 1.6; padding-left: 20px;">
                <li><strong>AI asistent</strong> - Vytváření faktur hlasem za 30 sekund</li>
                <li><strong>ARES integrace</strong> - Automatické načítání firemních údajů</li>
                <li><strong>Smart analytics</strong> - Predikce cash flow a platební rizika</li>
                <li><strong>Email automaty</strong> - Připomínky a follow-up kampaně</li>
                <li><strong>PDF export</strong> - Profesionální faktury s vaším branding</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NODE_ENV === 'production' ? 'https://doklad.ai' : 'http://localhost:5000'}/settings/billing" 
                 style="background: ${bgColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; margin-bottom: 15px;">
                🚀 Aktivovat za 199 Kč/měsíc
              </a>
              <br>
              <span style="color: #666; font-size: 14px;">Méně než 7 Kč denně za revoluci ve fakturaci!</span>
            </div>
            
            <div style="background: #e6fffa; border: 1px solid #81e6d9; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="color: #234e52; margin-top: 0;">💰 Úspora vs. cena:</h4>
              <p style="color: #234e52; margin: 0; line-height: 1.6;">
                <strong>Ušetříte: 40+ hodin × 500 Kč/hod = 20,000+ Kč měsíčně</strong><br>
                <strong>Zaplatíte: pouze 199 Kč měsíčně</strong><br>
                <strong>ROI: 10,000% návratnost investice!</strong>
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Nezmeškejte revoluci v českém podnikání! 🇨🇿
            </p>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email!,
        subject: `⏰ Trial končí ${urgency} - Doklad.ai`,
        html: htmlContent,
        headers: {
          'X-Mailer': 'Doklad.ai Professional v1.0',
          'X-Priority': daysLeft === 1 ? '1' : '2',
          'X-Entity-Ref-ID': `trial-expiring-${daysLeft}d`,
          'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@doklad.ai>`
        }
      });

      console.log(`✅ Trial expiring email sent to ${user.email} (${daysLeft} days left)`);
      return true;
    } catch (error) {
      console.error('❌ Trial expiring email error:', error);
      return false;
    }
  }

  async sendEmailConfirmationEmail(user: any, confirmationToken: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('📧 Email service not configured - skipping email confirmation');
      return false;
    }

    try {
      const confirmationUrl = `${process.env.NODE_ENV === 'production' ? 'https://doklad.ai' : 'http://localhost:5000'}/confirm-email?token=${confirmationToken}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Potvrďte emailovou adresu - Doklad.ai</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 30px; text-align: center; color: white; border-radius: 15px 15px 0 0;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700;">📧 Potvrďte email</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Zabezpečte svůj účet jedním kliknutím</p>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 24px;">Ahoj ${user.firstName}! 👋</h2>
            
            <p style="color: #4a5568; line-height: 1.7; font-size: 16px; margin-bottom: 25px;">
              <strong>Vítejte v Doklad.ai!</strong> 
              Pro dokončení registrace prosím potvrďte svou emailovou adresu.
            </p>

            <div style="background: #f0fff4; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #48bb78;">
              <h3 style="color: #2d3748; margin-top: 0; font-size: 18px;">🔒 Proč potvrdit email?</h3>
              <ul style="color: #4a5568; line-height: 1.6; padding-left: 20px;">
                <li><strong>Zabezpečení účtu</strong> - Ochrana před neoprávněným přístupem</li>
                <li><strong>Důležité notifikace</strong> - Platby, faktury, připomínky</li>
                <li><strong>Obnovení hesla</strong> - Možnost resetovat heslo při ztrátě</li>
                <li><strong>Plný přístup</strong> - Všechny funkce bez omezení</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" 
                 style="background: #48bb78; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                ✅ Potvrdit emailovou adresu
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              Pokud tlačítko nefunguje, zkopírujte tento odkaz do prohlížeče:<br>
              <a href="${confirmationUrl}" style="color: #48bb78; word-break: break-all;">${confirmationUrl}</a>
            </p>
            
            <div style="background: #fff5f5; border: 1px solid #fed7d7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #c53030; margin: 0; font-size: 14px;">
                <strong>⚠️ Důležité:</strong> Tento odkaz vyprší za 24 hodin z bezpečnostních důvodů.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Pokud jste se neregistrovali, ignorujte tento email.<br>
              Tým Doklad.ai 💙
            </p>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email!,
        subject: '📧 Potvrďte emailovou adresu - Doklad.ai',
        html: htmlContent,
        headers: {
          'X-Mailer': 'Doklad.ai Professional v1.0',
          'X-Priority': '2',
          'X-Entity-Ref-ID': 'email-confirmation',
          'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@doklad.ai>`
        }
      });

      console.log(`✅ Email confirmation sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Email confirmation error:', error);
      return false;
    }
  }

  async sendMonthlyReportEmail(user: any, company: any, reportData: any): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('📧 Email service not configured - skipping monthly report');
      return false;
    }

    try {
      const month = new Date().toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Měsíční report ${month} - Doklad.ai</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; border-radius: 15px 15px 0 0;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700;">📊 Měsíční report</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">${month} - ${company.name}</p>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 24px;">Ahoj ${user.firstName}! 👋</h2>
            
            <p style="color: #4a5568; line-height: 1.7; font-size: 16px; margin-bottom: 25px;">
              <strong>Zde je váš měsíční přehled výkonnosti.</strong> 
              Podívejte se, jak se vám dařilo v ${month.toLowerCase()}.
            </p>

            <div style="display: flex; gap: 20px; margin: 25px 0;">
              <div style="flex: 1; background: #f0fff4; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #48bb78;">
                <h3 style="margin: 0; color: #2d3748; font-size: 24px;">${reportData.totalInvoices || 0}</h3>
                <p style="margin: 5px 0 0 0; color: #4a5568; font-size: 14px;">Vystavené faktury</p>
              </div>
              <div style="flex: 1; background: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #3b82f6;">
                <h3 style="margin: 0; color: #2d3748; font-size: 24px;">${(reportData.totalRevenue || 0).toLocaleString('cs-CZ')} Kč</h3>
                <p style="margin: 5px 0 0 0; color: #4a5568; font-size: 14px;">Tržby</p>
              </div>
            </div>

            <div style="display: flex; gap: 20px; margin: 25px 0;">
              <div style="flex: 1; background: #fffbeb; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0; color: #2d3748; font-size: 24px;">${reportData.paidInvoices || 0}</h3>
                <p style="margin: 5px 0 0 0; color: #4a5568; font-size: 14px;">Zaplacené faktury</p>
              </div>
              <div style="flex: 1; background: #fef2f2; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #ef4444;">
                <h3 style="margin: 0; color: #2d3748; font-size: 24px;">${reportData.overdueInvoices || 0}</h3>
                <p style="margin: 5px 0 0 0; color: #4a5568; font-size: 14px;">Po splatnosti</p>
              </div>
            </div>
            
            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin: 25px 0;">
              <h3 style="color: #2d3748; margin-top: 0; font-size: 18px;">💡 Tipy pro příští měsíc:</h3>
              <ul style="color: #4a5568; line-height: 1.6; padding-left: 20px;">
                <li>Nastavte automatické připomínky pro rychlejší inkaso</li>
                <li>Použijte AI asistenta pro rychlejší vytváření faktur</li>
                <li>Sledujte trendy plateb pomocí analytics</li>
                <li>Pravidelně aktualizujte kontaktní údaje zákazníků</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NODE_ENV === 'production' ? 'https://doklad.ai' : 'http://localhost:5000'}/dashboard" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                📊 Zobrazit detailní analytics
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Děkujeme, že používáte Doklad.ai pro růst vašeho podnikání! 🚀
            </p>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email!,
        subject: `📊 Měsíční report ${month} - Doklad.ai`,
        html: htmlContent,
        headers: {
          'X-Mailer': 'Doklad.ai Professional v1.0',
          'X-Priority': '3',
          'X-Entity-Ref-ID': 'monthly-report',
          'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@doklad.ai>`
        }
      });

      console.log(`✅ Monthly report email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Monthly report email error:', error);
      return false;
    }
  }

  async sendOnboardingEmail(user: any, day: number): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('📧 Email service not configured - skipping onboarding email');
      return false;
    }

    const onboardingData = {
      1: {
        subject: '🚀 Den 1: Vítejte v revoluci fakturace!',
        title: 'Začněme společně!',
        tip: 'Vytvořte svou první fakturu pomocí AI asistenta - stačí říct "Vytvoř fakturu pro ABC s.r.o. za 10 000 Kč"',
        cta: 'Vytvořit první fakturu',
        link: '/invoices/new'
      },
      2: {
        subject: '📋 Den 2: ARES integrace šetří hodiny práce',
        title: 'Automatické načítání firem',
        tip: 'Při vytváření zákazníka stačí zadat IČO a Doklad.ai automaticky načte všechny údaje z ARES registru',
        cta: 'Přidat zákazníka',
        link: '/customers/new'
      },
      3: {
        subject: '⚡ Den 3: AI asistent rozumí vašemu hlasu',
        title: 'Hlasové ovládání',
        tip: 'Můžete diktovat faktury, přidávat poznámky nebo ptát se na analytics - AI rozumí přirozenému češtinému',
        cta: 'Vyzkoušet AI chat',
        link: '/dashboard'
      },
      4: {
        subject: '📊 Den 4: Analytics předpovídají budoucnost',
        title: 'Chytré analýzy',
        tip: 'AI predikuje platební rizika zákazníků a doporučuje optimální termíny splatnosti',
        cta: 'Zobrazit analytics',
        link: '/analytics'
      },
      5: {
        subject: '💌 Den 5: Automatické připomínky = rychlejší platby',
        title: 'Email automaty',
        tip: 'Nastavte si automatické připomínky a zvyšte rychlost inkasa o 300%',
        cta: 'Nastavit připomínky',
        link: '/settings'
      },
      6: {
        subject: '🎨 Den 6: Profesionální PDF s vaším branding',
        title: 'Vlastní design faktur',
        tip: 'Přizpůsobte si faktury vašemu brandingu - logo, barvy, layout podle vašich představ',
        cta: 'Upravit design',
        link: '/settings/branding'
      },
      7: {
        subject: '🏆 Den 7: Gratuluji! Jste power user Doklad.ai',
        title: 'Úspěšně dokončeno!',
        tip: 'Nyní ovládáte všechny pokročilé funkce. Pokračujte v úspoře desítek hodin měsíčně!',
        cta: 'Pokračovat v práci',
        link: '/dashboard'
      }
    };

    const dayData = onboardingData[day as keyof typeof onboardingData];
    if (!dayData) return false;

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${dayData.subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 40px 30px; text-align: center; color: white; border-radius: 15px 15px 0 0;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700;">${dayData.title}</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Den ${day} z 7 - Onboarding série</p>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 24px;">Ahoj ${user.firstName}! 👋</h2>
            
            <div style="background: #fff7ed; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ff6b35;">
              <h3 style="color: #c2410c; margin-top: 0; font-size: 18px;">💡 Tip dne:</h3>
              <p style="color: #9a3412; margin: 0; line-height: 1.6; font-size: 16px;">
                ${dayData.tip}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NODE_ENV === 'production' ? 'https://doklad.ai' : 'http://localhost:5000'}${dayData.link}" 
                 style="background: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                ${dayData.cta}
              </a>
            </div>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <p style="color: #1e40af; margin: 0; text-align: center; font-size: 14px;">
                <strong>Pokrok:</strong> ${day}/7 dokončeno • ${Math.round((day/7)*100)}% kompletní
              </p>
              <div style="background: #e5e7eb; height: 8px; border-radius: 4px; margin: 10px 0;">
                <div style="background: #ff6b35; height: 8px; border-radius: 4px; width: ${Math.round((day/7)*100)}%;"></div>
              </div>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Tým Doklad.ai - Vaši partneři v růstu podnikání 🚀
            </p>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email!,
        subject: dayData.subject,
        html: htmlContent,
        headers: {
          'X-Mailer': 'Doklad.ai Professional v1.0',
          'X-Priority': '3',
          'X-Entity-Ref-ID': `onboarding-day-${day}`,
          'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@doklad.ai>`
        }
      });

      console.log(`✅ Onboarding day ${day} email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Onboarding email error:', error); 
      return false;
    }
  }
}

export const emailService = new EmailService();