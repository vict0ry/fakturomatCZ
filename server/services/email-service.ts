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
    this.fromEmail = process.env.SMTP_USER || 'noreply@doklad.ai';
    this.fromName = process.env.SMTP_FROM_NAME || 'Doklad.ai';

    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      }
    };

    // Add DKIM if configured
    if (process.env.DKIM_DOMAIN && process.env.DKIM_SELECTOR && process.env.DKIM_PRIVATE_KEY) {
      config.dkim = {
        domainName: process.env.DKIM_DOMAIN,
        keySelector: process.env.DKIM_SELECTOR,
        privateKey: process.env.DKIM_PRIVATE_KEY,
      };
    }

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      dkim: config.dkim,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  isConfigured(): boolean {
    const hasCredentials = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
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
    if (!this.isConfigured()) {
      console.log('🔧 Email service not configured - SMTP credentials needed');
      console.log('📧 Password reset token generated but email cannot be sent');
      console.log(`Token for ${user.email}: ${resetToken}`);
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
          'X-Mailer': 'Doklad.ai',
          'X-Priority': '1',
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
          'X-Mailer': 'Doklad.ai',
          'X-Priority': '1',
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
        to: invoice.customer.email,
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
          'X-Mailer': 'Doklad.ai',
          'X-Invoice-Number': invoice.invoiceNumber,
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
            <p><strong>Celková částka:</strong> ${(invoice.totalAmountWithTax || invoice.totalAmount || 0).toLocaleString('cs-CZ')} Kč</p>
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
              <p><strong>Částka k úhradě:</strong> ${(invoice.totalAmountWithTax || invoice.totalAmount || 0).toLocaleString('cs-CZ')} Kč</p>
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
        to: invoice.customer.email,
        subject: reminder.subject,
        html: htmlContent,
        headers: {
          'X-Mailer': 'Doklad.ai',
          'X-Invoice-Number': invoice.invoiceNumber,
        }
      });

      console.log(`✅ ${type} reminder sent to ${invoice.customer.email} for invoice ${invoice.invoiceNumber}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending ${type} reminder:`, error);
      return false;
    }
  }
}

export const emailService = new EmailService();