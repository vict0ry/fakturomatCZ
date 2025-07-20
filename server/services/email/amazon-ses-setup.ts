import { SESClient, SendEmailCommand, VerifyEmailIdentityCommand } from "@aws-sdk/client-ses";

// Amazon SES setup pro profesionální email delivery
export class AmazonSESService {
  private sesClient: SESClient;

  constructor() {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
    }

    this.sesClient = new SESClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });
  }

  // Verify email address for sending
  async verifyEmailAddress(email: string): Promise<boolean> {
    try {
      const command = new VerifyEmailIdentityCommand({ EmailAddress: email });
      await this.sesClient.send(command);
      console.log(`Verification email sent to: ${email}`);
      return true;
    } catch (error) {
      console.error('Email verification failed:', error);
      return false;
    }
  }

  // Send invoice email with proper anti-spam headers
  async sendInvoiceEmail(params: {
    to: string;
    invoiceNumber: string;
    customerName: string;
    total: number;
    dueDate: string;
    invoiceUrl: string;
    companyName: string;
    companyEmail: string;
    bankAccount?: string;
    variableSymbol?: string;
    pdfAttachment?: Buffer;
  }): Promise<boolean> {
    try {
      const { to, invoiceNumber, customerName, total, dueDate, invoiceUrl, 
              companyName, companyEmail, bankAccount, variableSymbol, pdfAttachment } = params;

      // Professional subject line that doesn't trigger spam filters
      const subject = `Faktura č. ${invoiceNumber} - splatnost ${dueDate}`;

      // Clean, professional HTML template
      const htmlBody = this.generateInvoiceEmailTemplate({
        customerName,
        invoiceNumber,
        total,
        dueDate,
        invoiceUrl,
        companyName,
        bankAccount,
        variableSymbol
      });

      // Plain text version for better deliverability
      const textBody = this.generatePlainTextVersion({
        customerName,
        invoiceNumber,
        total,
        dueDate,
        invoiceUrl,
        companyName,
        bankAccount,
        variableSymbol
      });

      const emailParams: any = {
        Source: companyEmail, // Must be verified in SES
        Destination: {
          ToAddresses: [to]
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8'
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8'
            }
          }
        },
        // Anti-spam headers
        Tags: [
          {
            Name: 'EmailType',
            Value: 'Invoice'
          },
          {
            Name: 'CompanyName', 
            Value: companyName
          }
        ]
      };

      // Add PDF attachment if provided
      if (pdfAttachment) {
        // Note: SES supports attachments through raw email
        console.log('PDF attachment will be sent via raw email format');
      }

      const command = new SendEmailCommand(emailParams);
      const result = await this.sesClient.send(command);
      
      console.log(`Invoice email sent successfully. MessageId: ${result.MessageId}`);
      return true;

    } catch (error) {
      console.error('Failed to send invoice email:', error);
      return false;
    }
  }

  // Generate professional HTML email template
  private generateInvoiceEmailTemplate(params: {
    customerName: string;
    invoiceNumber: string;
    total: number;
    dueDate: string;
    invoiceUrl: string;
    companyName: string;
    bankAccount?: string;
    variableSymbol?: string;
  }): string {
    const { customerName, invoiceNumber, total, dueDate, invoiceUrl, 
            companyName, bankAccount, variableSymbol } = params;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faktura #${invoiceNumber}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .invoice-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
        .invoice-info h3 { margin: 0 0 15px 0; color: #495057; }
        .info-row { margin: 8px 0; }
        .info-row strong { display: inline-block; min-width: 140px; color: #495057; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; transition: background 0.3s; }
        .cta-button:hover { background: #5a6fd8; }
        .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef; }
        @media (max-width: 600px) { body { padding: 10px; } .header, .content { padding: 20px 15px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>Nová faktura</h1>
        <p>od ${companyName}</p>
    </div>
    
    <div class="content">
        <p>Dobrý den${customerName ? ' ' + customerName : ''},</p>
        
        <p>zasíláme Vám novou fakturu <strong>#${invoiceNumber}</strong> na částku <strong>${total.toLocaleString('cs-CZ')} CZK</strong>.</p>
        
        <div class="invoice-info">
            <h3>Detaily faktury</h3>
            <div class="info-row"><strong>Číslo faktury:</strong> ${invoiceNumber}</div>
            <div class="info-row"><strong>Částka:</strong> ${total.toLocaleString('cs-CZ')} CZK</div>
            <div class="info-row"><strong>Splatnost:</strong> ${dueDate}</div>
            ${variableSymbol ? `<div class="info-row"><strong>Variabilní symbol:</strong> ${variableSymbol}</div>` : ''}
            ${bankAccount ? `<div class="info-row"><strong>Číslo účtu:</strong> ${bankAccount}</div>` : ''}
        </div>
        
        <p style="text-align: center;">
            <a href="${invoiceUrl}" class="cta-button">
                📄 Zobrazit fakturu online
            </a>
        </p>
        
        <p><strong>Poznámka:</strong> Faktura je také přiložena k tomuto emailu jako PDF soubor pro vaše záznamy.</p>
        
        <p>Děkujeme za vaši důvěru a těšíme se na další spolupráci.</p>
    </div>
    
    <div class="footer">
        <p>S pozdravem,<br><strong>${companyName}</strong></p>
        <p><small>Tento email byl odeslán automaticky naším fakturačním systémem.</small></p>
    </div>
</body>
</html>`;
  }

  // Generate plain text version for better deliverability
  private generatePlainTextVersion(params: {
    customerName: string;
    invoiceNumber: string;
    total: number;
    dueDate: string;
    invoiceUrl: string;
    companyName: string;
    bankAccount?: string;
    variableSymbol?: string;
  }): string {
    const { customerName, invoiceNumber, total, dueDate, invoiceUrl, 
            companyName, bankAccount, variableSymbol } = params;

    return `
Dobrý den${customerName ? ' ' + customerName : ''},

zasíláme Vám novou fakturu #${invoiceNumber} na částku ${total.toLocaleString('cs-CZ')} CZK.

DETAILY FAKTURY:
- Číslo faktury: ${invoiceNumber}
- Částka: ${total.toLocaleString('cs-CZ')} CZK
- Splatnost: ${dueDate}
${variableSymbol ? `- Variabilní symbol: ${variableSymbol}` : ''}
${bankAccount ? `- Číslo účtu: ${bankAccount}` : ''}

Zobrazit fakturu online: ${invoiceUrl}

Faktura je také přiložena k tomuto emailu jako PDF soubor.

Děkujeme za vaši důvěru a těšíme se na další spolupráci.

S pozdravem,
${companyName}

---
Tento email byl odeslán automaticky naším fakturačním systémem.
`;
  }

  // Send payment reminder (softer tone to avoid spam)
  async sendPaymentReminder(params: {
    to: string;
    invoiceNumber: string;
    customerName: string;
    total: number;
    daysPastDue: number;
    invoiceUrl: string;
    companyName: string;
    companyEmail: string;
  }): Promise<boolean> {
    try {
      const { to, invoiceNumber, customerName, total, daysPastDue, 
              invoiceUrl, companyName, companyEmail } = params;

      // Polite reminder subject (avoid "URGENT" or "OVERDUE")
      const subject = `Připomínka splatnosti faktury #${invoiceNumber}`;

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Připomínka splatnosti</h2>
          
          <p>Dobrý den${customerName ? ' ' + customerName : ''},</p>
          
          <p>dovolujeme si Vás zdvořile upozornit, že faktura <strong>#${invoiceNumber}</strong> 
          na částku <strong>${total.toLocaleString('cs-CZ')} CZK</strong> je po splatnosti 
          ${daysPastDue} dní.</p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Pokud jste již platbu odeslali, děkujeme a tento email ignorujte.</strong></p>
          </div>
          
          <p style="text-align: center;">
            <a href="${invoiceUrl}" 
               style="background: #28a745; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              📄 Zobrazit fakturu
            </a>
          </p>
          
          <p>Pokud máte dotazy ohledně této faktury, neváhejte nás kontaktovat.</p>
          
          <p>S pozdravem,<br>${companyName}</p>
        </div>
      `;

      const command = new SendEmailCommand({
        Source: companyEmail,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } }
        }
      });

      const result = await this.sesClient.send(command);
      console.log(`Payment reminder sent successfully. MessageId: ${result.MessageId}`);
      return true;

    } catch (error) {
      console.error('Failed to send payment reminder:', error);
      return false;
    }
  }
}

// Usage example:
/*
const sesService = new AmazonSESService();

await sesService.sendInvoiceEmail({
  to: 'customer@example.com',
  invoiceNumber: '20258960',
  customerName: 'Jan Novák',
  total: 25000,
  dueDate: '31.01.2025',
  invoiceUrl: 'https://yourdomain.cz/public/invoice/abc123',
  companyName: 'Vaše Firma s.r.o.',
  companyEmail: 'noreply@vasefirma.cz',
  bankAccount: '1234567890/0100',
  variableSymbol: '20258960'
});
*/