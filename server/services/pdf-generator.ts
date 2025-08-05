import puppeteer from 'puppeteer';
import { generateInvoiceHTML } from './pdf-fallback';

export async function generateInvoicePDF(invoice: any, company: any): Promise<Buffer> {
  try {
    // Use the HTML generator from pdf-fallback
    const html = generateInvoiceHTML({
      ...invoice,
      company: company
    });

    // Try Puppeteer first
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      });

      await browser.close();
      return Buffer.from(pdf);

    } catch (puppeteerError) {
      console.warn('Puppeteer failed, using fallback PDF generation:', puppeteerError);
      
      // Fallback to simple HTML-to-text conversion
      const simpleContent = `
FAKTURA ${invoice.invoiceNumber}

Dodavatel:
${company.name || 'Název společnosti'}
${company.address || ''}
${company.city || ''} ${company.zipCode || ''}
IČO: ${company.companyId || ''}
DIČ: ${company.vatNumber || ''}

Odběratel:
${invoice.customer?.name || 'Název zákazníka'}
${invoice.customer?.address || ''}
${invoice.customer?.city || ''} ${invoice.customer?.zipCode || ''}
IČO: ${invoice.customer?.companyId || ''}
DIČ: ${invoice.customer?.vatNumber || ''}

Datum vystavení: ${new Date(invoice.issueDate).toLocaleDateString('cs-CZ')}
Datum splatnosti: ${new Date(invoice.dueDate).toLocaleDateString('cs-CZ')}

Položky faktury:
${(invoice.items || []).map((item: any) => 
  `${item.description} - ${item.quantity}x ${parseFloat(item.unitPrice || 0).toLocaleString('cs-CZ')} Kč = ${parseFloat(item.total || 0).toLocaleString('cs-CZ')} Kč`
).join('\n')}

Celkem bez DPH: ${parseFloat(invoice.subtotal || 0).toLocaleString('cs-CZ')} Kč
DPH: ${parseFloat(invoice.vatAmount || 0).toLocaleString('cs-CZ')} Kč
Celkem s DPH: ${parseFloat(invoice.total || 0).toLocaleString('cs-CZ')} Kč
      `;

      return Buffer.from(simpleContent, 'utf-8');
    }

  } catch (error) {
    console.error('PDF generation failed completely:', error);
    
    // Emergency fallback - basic text content
    const emergencyContent = `Faktura ${invoice.invoiceNumber} - ${new Date().toLocaleDateString('cs-CZ')}`;
    return Buffer.from(emergencyContent, 'utf-8');
  }
}