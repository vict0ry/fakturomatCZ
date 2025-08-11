import { paymentMatchingService } from './payment-matching-service.js';
import { db } from '../db.js';
import { bankAccounts } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailWebhookData {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
  timestamp: string;
}

export class EmailWebhookService {
  
  // Process incoming email webhook
  async processEmailWebhook(webhookData: EmailWebhookData): Promise<{
    success: boolean;
    message: string;
    processed?: boolean;
    matched?: number;
  }> {
    try {
      console.log(`📧 Processing email webhook from: ${webhookData.from} to: ${webhookData.to}`);
      
      // Check if this is a payment email
      const bankAccount = await this.findBankAccountByEmail(webhookData.to);
      
      if (!bankAccount) {
        console.log(`⚠️ No bank account found for email: ${webhookData.to}`);
        return {
          success: false,
          message: 'No bank account found for this email address'
        };
      }
      
      // Extract email content
      const emailContent = this.extractEmailContent(webhookData);
      
      // Save email for debugging
      await this.saveEmailForDebugging(webhookData, bankAccount.id);
      
      // Process bank statement
      const result = await paymentMatchingService.processBankStatementEmail(
        emailContent,
        bankAccount.id,
        bankAccount.companyId
      );
      
      console.log(`✅ Email processed: ${result.processed} payments, ${result.matched} matched`);
      
      return {
        success: true,
        message: `Processed ${result.processed} payments, ${result.matched} matched`,
        processed: result.processed > 0,
        matched: result.matched
      };
      
    } catch (error) {
      console.error('Error processing email webhook:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // Find bank account by payment email
  private async findBankAccountByEmail(email: string): Promise<any | null> {
    const accounts = await db.select()
      .from(bankAccounts)
      .where(eq(bankAccounts.paymentEmail, email))
      .limit(1);
    
    return accounts[0] || null;
  }
  
  // Extract content from email webhook data
  private extractEmailContent(webhookData: EmailWebhookData): string {
    let content = webhookData.body || '';
    
    // Add subject if available
    if (webhookData.subject) {
      content = `Subject: ${webhookData.subject}\n\n${content}`;
    }
    
    // Add from address if available
    if (webhookData.from) {
      content = `From: ${webhookData.from}\n${content}`;
    }
    
    // Process attachments if any
    if (webhookData.attachments && webhookData.attachments.length > 0) {
      content += '\n\n--- ATTACHMENTS ---\n';
      webhookData.attachments.forEach(attachment => {
        if (attachment.contentType.includes('text') || attachment.contentType.includes('csv')) {
          content += `\n${attachment.filename}:\n${attachment.content}\n`;
        }
      });
    }
    
    return content;
  }
  
  // Save email for debugging purposes
  private async saveEmailForDebugging(webhookData: EmailWebhookData, bankAccountId: number): Promise<void> {
    try {
      const emailsDir = path.join(process.cwd(), 'sent-emails');
      
      if (!fs.existsSync(emailsDir)) {
        fs.mkdirSync(emailsDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `payment-email-${bankAccountId}-${timestamp}.json`;
      
      const emailData = {
        ...webhookData,
        processedAt: new Date().toISOString(),
        bankAccountId
      };
      
      fs.writeFileSync(
        path.join(emailsDir, filename), 
        JSON.stringify(emailData, null, 2)
      );
      
      console.log(`💾 Email saved for debugging: ${filename}`);
      
    } catch (error) {
      console.error('Error saving email for debugging:', error);
    }
  }
  
  // Validate webhook signature (if needed)
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Implement signature validation if your webhook provider requires it
    // For now, we'll assume it's valid
    return true;
  }
  
  // Test email processing with sample data
  async testEmailProcessing(bankAccountId: number, companyId: number): Promise<{
    success: boolean;
    message: string;
    result?: any;
  }> {
    try {
      const sampleEmailContent = `
Subject: Bankovní výpis - 15.01.2025

Dobrý den,

zasíláme Vám výpis z účtu 219819-2602094613/2010 za období 15.01.2025.

PŘÍCHODZÍ PLATBY:
15.01.2025  25 000,00 CZK  VS: 2025001  KS: 0308  SS: 
Protistrana: Firma ABC s.r.o., 123456789/0800
Popis: Platba za fakturu 2025001

15.01.2025  15 500,00 CZK  VS: 2025002  KS: 0308  SS:
Protistrana: Společnost XYZ, 987654321/0100
Popis: Úhrada faktury

S pozdravem,
Fio banka
      `;
      
      const result = await paymentMatchingService.processBankStatementEmail(
        sampleEmailContent,
        bankAccountId,
        companyId
      );
      
      return {
        success: true,
        message: `Test completed: ${result.processed} payments processed, ${result.matched} matched`,
        result
      };
      
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const emailWebhookService = new EmailWebhookService();
