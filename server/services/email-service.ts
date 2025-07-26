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
  dkim: {
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
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@doklad.ai';
    this.fromName = process.env.SMTP_FROM_NAME || 'Doklad.ai';

    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.doklad.ai',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || this.fromEmail,
        pass: process.env.SMTP_PASSWORD || '',
      },
      dkim: {
        domainName: 'doklad.ai',
        keySelector: process.env.DKIM_SELECTOR || 'default',
        privateKey: process.env.DKIM_PRIVATE_KEY || '',
      }
    };

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      dkim: config.dkim.privateKey ? config.dkim : undefined,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendEmailConfirmation(user: User, confirmationToken: string): Promise<boolean> {
    try {
      const confirmationUrl = `${process.env.FRONTEND_URL || 'https://doklad.ai'}/confirm-email?token=${confirmationToken}`;
      
      const emailContent = this.generateEmailConfirmationHTML(user, confirmationUrl);
      
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email || '',
        subject: 'Potvrzení emailové adresy - Doklad.ai',
        html: emailContent,
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
    try {
      const emailContent = this.generateInvoiceEmailHTML(invoice, customMessage);
      
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: invoice.customer.email,
        subject: `Faktura ${invoice.invoiceNumber} - ${this.fromName}`,
        html: emailContent,
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

  async sendReminderEmail(
    invoice: Invoice & { customer: Customer },
    reminderType: 'first' | 'second' | 'final'
  ): Promise<boolean> {
    try {
      const emailContent = this.generateReminderEmailHTML(invoice, reminderType);
      const subjects = {
        first: 'Připomínka platby faktury',
        second: 'Druhá připomínka platby faktury',
        final: 'Konečná výzva k úhradě faktury'
      };
      
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: invoice.customer.email,
        subject: `${subjects[reminderType]} ${invoice.invoiceNumber}`,
        html: emailContent,
        headers: {
          'X-Mailer': 'Doklad.ai',
          'X-Invoice-Number': invoice.invoiceNumber,
          'X-Reminder-Type': reminderType,
        }
      });

      console.log(`✅ Reminder email (${reminderType}) sent to ${invoice.customer.email}`);
      return true;
    } catch (error) {
      console.error('❌ Reminder email sending error:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(user: User, resetToken: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'https://doklad.ai'}/reset-password?token=${resetToken}`;
      
      const emailContent = this.generatePasswordResetHTML(user, resetUrl);
      
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email || '',
        subject: 'Obnovení hesla - Doklad.ai',
        html: emailContent,
        headers: {
          'X-Mailer': 'Doklad.ai',
          'X-Priority': '1',
        }
      });

      console.log(`✅ Password reset email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Password reset email sending error:', error);
      return false;
    }
  }

  async sendInvoiceEmail(invoice: any, pdfBuffer: Buffer, customMessage?: string): Promise<boolean> {
    try {
      if (!invoice.customer.email) {
        console.error('Customer has no email address');
        return false;
      }

      const emailContent = this.generateInvoiceEmailHTML(invoice, customMessage);
      
      const result = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: invoice.customer.email,
        subject: `Faktura č. ${invoice.invoiceNumber} - ${invoice.total} ${invoice.currency}`,
        html: emailContent,
        attachments: [
          {
            filename: `Faktura_${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });

      console.log('Invoice email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending invoice email:', error);
      return false;
    }
  }

  async sendReminderEmail(invoice: any, type: 'first' | 'second' | 'final'): Promise<boolean> {
    try {
      if (!invoice.customer.email) {
        console.error('Customer has no email address');
        return false;
      }

      const reminderTypes = {
        first: 'První připomínka',
        second: 'Druhá připomínka', 
        final: 'Konečná výzva'
      };

      const reminderSubject = `${reminderTypes[type]} - nezaplacená faktura č. ${invoice.invoiceNumber}`;
      const emailContent = this.generateReminderEmailHTML(invoice, type);
      
      const result = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: invoice.customer.email,
        subject: reminderSubject,
        html: emailContent
      });

      console.log('Reminder email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending reminder email:', error);
      return false;
    }
  }

  async testEmailConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }

  private generateEmailConfirmationHTML(user: User, confirmationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="cs">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Potvrzení emailové adresy</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3182ce; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Doklad.ai</h1>
          <p>Profesionální fakturace s AI</p>
        </div>
        <div class="content">
          <h2>Vítejte v Doklad.ai!</h2>
          <p>Dobrý den ${user.username},</p>
          <p>děkujeme za registraci v našem systému pro správu faktur. Pro dokončení registrace prosím potvrďte svou emailovou adresu kliknutím na tlačítko níže:</p>
          
          <div style="text-align: center;">
            <a href="${confirmationUrl}" class="button">Potvrdit emailovou adresu</a>
          </div>
          
          <p>Pokud tlačítko nefunguje, zkopírujte a vložte následující odkaz do prohlížeče:</p>
          <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px;">${confirmationUrl}</p>
          
          <p>Tento odkaz vyprší za 24 hodin.</p>
          <p>Pokud jste se neregistrovali, ignorujte tento email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Doklad.ai - Všechna práva vyhrazena</p>
          <p>Tento email byl odeslán na ${user.email}</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateReminderEmailHTML(invoice: any, type: 'first' | 'second' | 'final'): string {
    const formatCurrency = (amount: string | number) => {
      return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK'
      }).format(Number(amount));
    };

    const formatDate = (date: Date | string) => {
      return new Date(date).toLocaleDateString('cs-CZ');
    };

    const daysPastDue = Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));

    const reminderTexts = {
      first: {
        title: 'První připomínka',
        message: 'Dovolujeme si Vás zdvořile upozornit na nezaplacenou fakturu. Prosíme o úhradu v nejkratším možném termínu.'
      },
      second: {
        title: 'Druhá připomínka', 
        message: 'Opakovaně si Vás dovolujeme upozornit na nezaplacenou fakturu. Žádáme o okamžitou úhradu.'
      },
      final: {
        title: 'Konečná výzva',
        message: 'Toto je konečná výzva k úhradě. V případě neuhrazení do 7 dnů budeme nuceni přistoupit k dalším krokům.'
      }
    };

    return `
      <!DOCTYPE html>
      <html lang="cs">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reminderTexts[type].title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .invoice-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reminderTexts[type].title}</h1>
          <p>Nezaplacená faktura č. ${invoice.invoiceNumber}</p>
        </div>
        <div class="content">
          <p>Vážený zákazníku,</p>
          <p>${reminderTexts[type].message}</p>
          
          <div class="invoice-details">
            <h3>Údaje faktury</h3>
            <p><strong>Číslo faktury:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Celková částka:</strong> ${formatCurrency(invoice.total)}</p>
            <p><strong>Datum splatnosti:</strong> ${formatDate(invoice.dueDate)}</p>
            <p><strong>Dní po splatnosti:</strong> ${daysPastDue}</p>
          </div>
          
          ${type === 'final' ? `
          <div class="alert">
            <strong>⚠️ Upozornění:</strong> V případě neuhrazení do 7 dnů budeme nuceni přistoupit k vymáhání pohledávky.
          </div>
          ` : ''}
          
          <p>Děkujeme za pochopení a rychlé vyřízení.</p>
          <p>S pozdravem,<br>${invoice.companyName || 'Váš dodavatel'}</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Doklad.ai - Automatická připomínka</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateInvoiceEmailHTML(
    invoice: any,
    customMessage?: string
  ): string {
    const formatCurrency = (amount: string | number) => {
      return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK'
      }).format(Number(amount));
    };

    const formatDate = (date: Date | string) => {
      return new Date(date).toLocaleDateString('cs-CZ');
    };

    return `
      <!DOCTYPE html>
      <html lang="cs">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Faktura ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3182ce; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .invoice-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; color: #3182ce; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .attachment-note { background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Doklad.ai</h1>
          <p>Faktura ${invoice.invoiceNumber}</p>
        </div>
        <div class="content">
          <p>Dobrý den ${invoice.customer.name},</p>
          
          ${customMessage ? `<p>${customMessage}</p>` : `
            <p>zasíláme vám fakturu číslo <strong>${invoice.invoiceNumber}</strong> k úhradě.</p>
          `}
          
          <div class="invoice-details">
            <h3>Detaily faktury:</h3>
            <div class="detail-row">
              <span>Číslo faktury:</span>
              <span><strong>${invoice.invoiceNumber}</strong></span>
            </div>
            <div class="detail-row">
              <span>Datum vystavení:</span>
              <span>${formatDate(invoice.issueDate)}</span>
            </div>
            <div class="detail-row">
              <span>Datum splatnosti:</span>
              <span><strong>${formatDate(invoice.dueDate)}</strong></span>
            </div>
            <div class="detail-row total">
              <span>Celkem k úhradě:</span>
              <span>${formatCurrency(invoice.total)}</span>
            </div>
          </div>

          <div class="attachment-note">
            <strong>📎 Příloha:</strong> Kompletní faktura je přiložena jako PDF soubor.
          </div>

          <p>Pro rychlou úhradu můžete použít QR kód uvedený na faktuře.</p>
          
          <p>V případě dotazů nás neváhejte kontaktovat.</p>
          
          <p>Děkujeme za vaši důvěru!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Doklad.ai - Všechna práva vyhrazena</p>
          <p>Tento email byl odeslán na ${invoice.customer.email}</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateReminderEmailHTML(
    invoice: Invoice & { customer: Customer },
    reminderType: 'first' | 'second' | 'final'
  ): string {
    const formatCurrency = (amount: string | number) => {
      return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK'
      }).format(Number(amount));
    };

    const formatDate = (date: Date | string) => {
      return new Date(date).toLocaleDateString('cs-CZ');
    };

    const messages = {
      first: {
        title: 'Připomínka platby',
        text: 'rádi bychom vás upozornili, že se blíží nebo již uplynul termín splatnosti následující faktury:',
        tone: 'zdvořilá'
      },
      second: {
        title: 'Druhá připomínka platby',
        text: 'dosud jsme neobdrželi úhradu následující faktury. Prosíme o rychlou úhradu:',
        tone: 'naléhavá'
      },
      final: {
        title: 'Konečná výzva k úhradě',
        text: 'toto je konečná výzva k úhradě následující faktury. V případě neuhrazení budeme nuceni podniknout další kroky:',
        tone: 'konečná'
      }
    };

    const currentMessage = messages[reminderType];

    return `
      <!DOCTYPE html>
      <html lang="cs">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${currentMessage.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .invoice-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc3545; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; color: #dc3545; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .urgent { background: #f8d7da; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #f5c6cb; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚠️ ${currentMessage.title}</h1>
          <p>Faktura ${invoice.invoiceNumber}</p>
        </div>
        <div class="content">
          <p>Dobrý den ${invoice.customer.name},</p>
          <p>${currentMessage.text}</p>
          
          <div class="invoice-details">
            <h3>Faktura k úhradě:</h3>
            <div class="detail-row">
              <span>Číslo faktury:</span>
              <span><strong>${invoice.invoiceNumber}</strong></span>
            </div>
            <div class="detail-row">
              <span>Datum splatnosti:</span>
              <span><strong>${formatDate(invoice.dueDate)}</strong></span>
            </div>
            <div class="detail-row total">
              <span>Dlužná částka:</span>
              <span>${formatCurrency(invoice.total)}</span>
            </div>
          </div>

          ${reminderType === 'final' ? `
            <div class="urgent">
              <strong>🚨 Konečná výzva:</strong> Pokud neobdržíme úhradu do 7 dnů, budeme nuceni postoupit pohledávku k vymáhání.
            </div>
          ` : ''}

          <p>Prosíme o co nejrychlejší uhrazení faktury. V případě jakýchkoli problémů nebo dotazů nás neváhejte kontaktovat.</p>
          
          <p>Děkujeme za pochopení.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Doklad.ai - Všechna práva vyhrazena</p>
          <p>Tento email byl odeslán na ${invoice.customer.email}</p>
        </div>
      </body>
      </html>
    `;
  }

  private generatePasswordResetHTML(user: User, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="cs">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Obnovení hesla</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3182ce; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .security-note { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #ffeeba; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Obnovení hesla</h1>
          <p>Doklad.ai</p>
        </div>
        <div class="content">
          <p>Dobrý den ${user.username},</p>
          <p>obdrželi jsme žádost o obnovení hesla k vašemu účtu.</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Obnovit heslo</a>
          </div>
          
          <p>Pokud tlačítko nefunguje, zkopírujte a vložte následující odkaz do prohlížeče:</p>
          <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          
          <div class="security-note">
            <strong>🛡️ Bezpečnostní upozornění:</strong>
            <ul>
              <li>Tento odkaz vyprší za 1 hodinu</li>
              <li>Pokud jste nežádali o obnovení hesla, ignorujte tento email</li>
              <li>Nikdy nesdílejte tento odkaz s nikým jiným</li>
            </ul>
          </div>
          
          <p>Po kliknutí budete přesměrováni na stránku pro nastavení nového hesla.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Doklad.ai - Všechna práva vyhrazena</p>
          <p>Tento email byl odeslán na ${user.email}</p>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();