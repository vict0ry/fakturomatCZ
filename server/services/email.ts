import { createTransport } from 'nodemailer';
import { Invoice, Customer, InvoiceItem } from '@shared/schema';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export class EmailService {
  private transporter: any;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password
      }
    });
  }

  async sendInvoiceEmail(
    invoice: Invoice & { customer: Customer; items: InvoiceItem[] },
    pdfBuffer: Buffer
  ): Promise<boolean> {
    try {
      const emailContent = this.generateInvoiceEmailHTML(invoice);
      
      await this.transporter.sendMail({
        from: this.config.from,
        to: invoice.customer.email,
        subject: `Faktura ${invoice.invoiceNumber}`,
        html: emailContent,
        attachments: [
          {
            filename: `faktura-${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });

      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  async sendReminderEmail(
    invoice: Invoice & { customer: Customer; items: InvoiceItem[] },
    reminderType: 'first' | 'second' | 'final'
  ): Promise<boolean> {
    try {
      const emailContent = this.generateReminderEmailHTML(invoice, reminderType);
      
      await this.transporter.sendMail({
        from: this.config.from,
        to: invoice.customer.email,
        subject: `Připomínka platby - Faktura ${invoice.invoiceNumber}`,
        html: emailContent
      });

      return true;
    } catch (error) {
      console.error('Reminder email sending error:', error);
      return false;
    }
  }

  private generateInvoiceEmailHTML(invoice: Invoice & { customer: Customer; items: InvoiceItem[] }): string {
    const formatDate = (date: Date | string) => {
      return new Date(date).toLocaleDateString('cs-CZ');
    };

    const formatCurrency = (amount: string | number) => {
      return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK'
      }).format(Number(amount));
    };

    return `
      <!DOCTYPE html>
      <html lang="cs">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Faktura ${invoice.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2563EB;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .invoice-details {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .payment-info {
            background-color: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
          }
          .highlight {
            color: #2563EB;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Nová faktura</h1>
          <p>Faktura č. ${invoice.invoiceNumber}</p>
        </div>

        <p>Dobrý den,</p>
        
        <p>zasíláme Vám fakturu č. <strong>${invoice.invoiceNumber}</strong> v příloze tohoto emailu.</p>

        <div class="invoice-details">
          <h3>Detaily faktury</h3>
          <p><strong>Číslo faktury:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Datum vystavení:</strong> ${formatDate(invoice.issueDate)}</p>
          <p><strong>Datum splatnosti:</strong> ${formatDate(invoice.dueDate)}</p>
          <p><strong>Celková částka:</strong> <span class="highlight">${formatCurrency(invoice.total)}</span></p>
        </div>

        <div class="payment-info">
          <h3>Platební údaje</h3>
          <p><strong>Číslo účtu:</strong> 123456789/0100</p>
          <p><strong>Variabilní symbol:</strong> ${invoice.invoiceNumber.replace(/\D/g, '')}</p>
          <p><strong>Částka k úhradě:</strong> ${formatCurrency(invoice.total)}</p>
        </div>

        <p>Platbu prosím proveďte do <strong>${formatDate(invoice.dueDate)}</strong>.</p>
        
        <p>V případě jakýchkoli dotazů nás neváhejte kontaktovat.</p>

        <p>Děkujeme za spolupráci!</p>

        <div class="footer">
          <p>Tento email byl vygenerován automaticky.</p>
          <p>Test s.r.o. | Testovací 123 | 110 00 Praha 1</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateReminderEmailHTML(
    invoice: Invoice & { customer: Customer; items: InvoiceItem[] },
    reminderType: 'first' | 'second' | 'final'
  ): string {
    const formatDate = (date: Date | string) => {
      return new Date(date).toLocaleDateString('cs-CZ');
    };

    const formatCurrency = (amount: string | number) => {
      return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK'
      }).format(Number(amount));
    };

    const reminderTexts = {
      first: {
        title: 'Upozornění na blížící se splatnost faktury',
        message: 'dovolujeme si Vás upozornit na blížící se splatnost faktury',
        urgency: 'Doporučujeme platbu provést co nejdříve.'
      },
      second: {
        title: 'Připomínka platby po splatnosti',
        message: 'upozorňujeme Vás, že následující faktura je po splatnosti',
        urgency: 'Prosíme o uhrazení v nejkratším možném termínu.'
      },
      final: {
        title: 'Poslední upozornění - neuhrazená faktura',
        message: 'toto je poslední upozornění na neuhrazenou fakturu',
        urgency: 'Pokud nebude faktura uhrazena do 7 dnů, budeme nuceni postoupit pohledávku k vymáhání.'
      }
    };

    const reminder = reminderTexts[reminderType];

    return `
      <!DOCTYPE html>
      <html lang="cs">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reminder.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: ${reminderType === 'final' ? '#dc2626' : '#f59e0b'};
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .invoice-details {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .payment-info {
            background-color: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .urgency {
            background-color: ${reminderType === 'final' ? '#fee2e2' : '#fef3c7'};
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
          }
          .highlight {
            color: #dc2626;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reminder.title}</h1>
          <p>Faktura č. ${invoice.invoiceNumber}</p>
        </div>

        <p>Dobrý den,</p>
        
        <p>${reminder.message} č. <strong>${invoice.invoiceNumber}</strong>.</p>

        <div class="invoice-details">
          <h3>Detaily faktury</h3>
          <p><strong>Číslo faktury:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Datum vystavení:</strong> ${formatDate(invoice.issueDate)}</p>
          <p><strong>Datum splatnosti:</strong> <span class="highlight">${formatDate(invoice.dueDate)}</span></p>
          <p><strong>Celková částka:</strong> <span class="highlight">${formatCurrency(invoice.total)}</span></p>
        </div>

        <div class="urgency">
          ${reminder.urgency}
        </div>

        <div class="payment-info">
          <h3>Platební údaje</h3>
          <p><strong>Číslo účtu:</strong> 123456789/0100</p>
          <p><strong>Variabilní symbol:</strong> ${invoice.invoiceNumber.replace(/\D/g, '')}</p>
          <p><strong>Částka k úhradě:</strong> ${formatCurrency(invoice.total)}</p>
        </div>

        <p>Pokud jste platbu již provedli, považujte tento email za bezpředmětný.</p>
        
        <p>V případě jakýchkoli dotazů nás neváhejte kontaktovat.</p>

        <p>Děkujeme za pochopení.</p>

        <div class="footer">
          <p>Tento email byl vygenerován automaticky.</p>
          <p>Test s.r.o. | Testovací 123 | 110 00 Praha 1</p>
        </div>
      </body>
      </html>
    `;
  }
}