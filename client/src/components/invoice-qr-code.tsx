import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface InvoiceQRCodeProps {
  invoiceNumber: string;
  amount: number;
  currency?: string;
  variableSymbol?: string;
  iban?: string;
  recipientName?: string;
  dueDate?: string;
  size?: number;
  className?: string;
}

export function InvoiceQRCode({
  invoiceNumber,
  amount,
  currency = 'CZK',
  variableSymbol,
  iban,
  recipientName,
  dueDate,
  size = 150,
  className = "",
}: InvoiceQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current) return;

      // Czech QR payment format (SPAYD)
      let qrData = `SPD*1.0*ACC:${iban || ''}*AM:${amount.toFixed(2)}*CC:${currency}`;
      
      if (recipientName) {
        qrData += `*RN:${recipientName}`;
      }
      
      if (variableSymbol || invoiceNumber) {
        qrData += `*X-VS:${variableSymbol || invoiceNumber}`;
      }
      
      if (dueDate) {
        qrData += `*DT:${dueDate}`;
      }
      
      qrData += `*MSG:Faktura ${invoiceNumber}`;

      try {
        await QRCode.toCanvas(canvasRef.current, qrData, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [invoiceNumber, amount, currency, variableSymbol, iban, recipientName, dueDate, size]);

  return (
    <div className={`inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        className="border rounded"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}