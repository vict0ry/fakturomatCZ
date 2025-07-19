import jsPDF from 'jspdf';
import fs from 'fs';

console.log('Testujem jsPDF základnú funkcionalitu...');

try {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm', 
    format: 'a4'
  });
  
  doc.setFontSize(20);
  doc.text('Test PDF Dokument', 20, 30);
  
  doc.setFontSize(12);
  doc.text('Toto je testovací PDF súbor', 20, 50);
  doc.text('Ak vidíte tento text, PDF funguje správne', 20, 60);
  
  const pdfData = doc.output('arraybuffer');
  const buffer = Buffer.from(pdfData);
  
  console.log('PDF buffer veľkosť:', buffer.length);
  
  if (buffer.length < 1000) {
    throw new Error('PDF je príliš malé');
  }
  
  fs.writeFileSync('test-simple.pdf', buffer);
  console.log('✅ Základný PDF test úspešný!');
  
} catch (error) {
  console.error('❌ PDF test zlyhal:', error);
}