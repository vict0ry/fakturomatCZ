import QRCode from 'qrcode';

export interface QRPaymentData {
  amount: number;
  currency: string;
  iban: string;
  variableSymbol?: string;
  constantSymbol?: string;
  specificSymbol?: string;
  recipient: string;
  message?: string;
}

export class QRGenerator {
  /**
   * Generate QR code for Czech SPAYD format (Short Payment Descriptor)
   * Standard for QR payment codes in Czech Republic
   */
  static async generatePaymentQR(data: QRPaymentData): Promise<string> {
    try {
      // SPAYD format for Czech payment QR codes
      let spaydString = `SPD*1.0*ACC:${data.iban}*AM:${data.amount.toFixed(2)}*CC:${data.currency}`;
      
      if (data.variableSymbol) {
        spaydString += `*X-VS:${data.variableSymbol}`;
      }
      
      if (data.constantSymbol) {
        spaydString += `*X-KS:${data.constantSymbol}`;
      }
      
      if (data.specificSymbol) {
        spaydString += `*X-SS:${data.specificSymbol}`;
      }
      
      // Add recipient name
      spaydString += `*RN:${data.recipient}`;
      
      // Add message if provided
      if (data.message) {
        spaydString += `*MSG:${data.message}`;
      }
      
      // Generate QR code as base64 data URL
      const qrCodeDataURL = await QRCode.toDataURL(spaydString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }
  
  /**
   * Generate simple text QR code
   */
  static async generateTextQR(text: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 256
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating text QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }
  
  /**
   * Generate QR code for invoice payment
   */
  static async generateInvoicePaymentQR(invoice: any, company: any): Promise<string> {
    try {
      const paymentData: QRPaymentData = {
        amount: parseFloat(invoice.total),
        currency: invoice.currency || 'CZK',
        iban: company.iban || company.bankAccount || 'CZ1234567890123456789012',
        variableSymbol: invoice.variableSymbol || invoice.invoiceNumber.replace(/\D/g, ''),
        constantSymbol: invoice.constantSymbol,
        specificSymbol: invoice.specificSymbol,
        recipient: company.name,
        message: `Faktura ${invoice.invoiceNumber}`
      };
      
      return await this.generatePaymentQR(paymentData);
    } catch (error) {
      console.error('Error generating invoice QR code:', error);
      throw new Error('Failed to generate invoice QR code');
    }
  }
}