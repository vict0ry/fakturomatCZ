import { db } from '../db.js';
import { bankAccounts, paymentMatches, invoices, bankTransactions, companies } from '../../shared/schema.js';
import { eq, and, or, like, desc, isNull } from 'drizzle-orm';
import OpenAI from 'openai';
import { sql } from 'drizzle-orm';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PaymentData {
  amount: number;
  currency: string;
  variableSymbol?: string;
  constantSymbol?: string;
  specificSymbol?: string;
  counterpartyAccount?: string;
  counterpartyName?: string;
  description?: string;
  transactionDate: Date;
  bankReference?: string;
}

export interface PaymentMatchResult {
  invoiceId: number;
  matchType: 'automatic' | 'manual' | 'partial';
  matchConfidence: number;
  matchedAmount: number;
  remainingAmount?: number;
  notes?: string;
}

export class PaymentMatchingService {
  
  // Process incoming email with bank statement
  async processBankStatementEmail(
    emailContent: string, 
    bankAccountId: number, 
    companyId: number
  ): Promise<{ processed: number; matched: number; errors: string[] }> {
    try {
      console.log(`🔄 Processing bank statement for account ${bankAccountId}`);
      
      // Extract payment data from email
      const payments = await this.extractPaymentsFromEmail(emailContent);
      console.log(`📊 Extracted ${payments.length} payments from email`);
      
      let processed = 0;
      let matched = 0;
      const errors: string[] = [];
      
      for (const payment of payments) {
        try {
          // Save transaction to database
          await this.saveBankTransaction(payment, bankAccountId, companyId);
          processed++;
          
          // Try to match with invoice
          const matchResult = await this.matchPaymentToInvoice(payment, companyId);
          
          if (matchResult) {
            await this.createPaymentMatch(matchResult, payment, bankAccountId, companyId);
            matched++;
            console.log(`✅ Payment matched: ${payment.amount} ${payment.currency} -> Invoice ${matchResult.invoiceId}`);
          } else {
            console.log(`⚠️ No match found for payment: ${payment.amount} ${payment.currency}`);
          }
          
        } catch (error) {
          const errorMsg = `Error processing payment ${payment.amount} ${payment.currency}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
      
      // Update last processed date
      await this.updateLastProcessedDate(bankAccountId, companyId);
      
      return { processed, matched, errors };
      
    } catch (error) {
      console.error('Error processing bank statement:', error);
      throw error;
    }
  }
  
  // Extract payment data from email using AI
  private async extractPaymentsFromEmail(emailContent: string): Promise<PaymentData[]> {
    try {
      const prompt = `Analyzuj tento bankovní výpis a extrahuj všechny platby. Vrať JSON pole s platbami:

PRAVIDLA EXTRACE:
- Hledej částky, datumy, VS, KS, SS, protistranu
- Ignoruj záporné částky (odchozí platby)
- Pro datum použij ISO formát (YYYY-MM-DD)
- Pro částky použij čísla bez měny
- VS = variabilní symbol, KS = konstantní symbol, SS = specifický symbol

Formát odpovědi:
[
  {
    "amount": 25000,
    "currency": "CZK",
    "variableSymbol": "123456",
    "constantSymbol": "0308",
    "specificSymbol": "",
    "counterpartyAccount": "123456789/0800",
    "counterpartyName": "Firma ABC s.r.o.",
    "description": "Platba za fakturu 2025001",
    "transactionDate": "2025-01-15",
    "bankReference": "REF123456"
  }
]

Email obsah:
${emailContent}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.payments || [];
      
    } catch (error) {
      console.error('Error extracting payments from email:', error);
      // Fallback to simple regex extraction
      return this.extractPaymentsFallback(emailContent);
    }
  }
  
  // Fallback extraction using regex patterns
  private extractPaymentsFallback(emailContent: string): PaymentData[] {
    const payments: PaymentData[] = [];
    
    // Common patterns for Czech bank statements
    const amountPattern = /(\d{1,3}(?:\s\d{3})*(?:,\d{2})?)\s*(?:CZK|Kč)/g;
    const vsPattern = /VS[:\s]*(\d+)/gi;
    const datePattern = /(\d{1,2}[.\/]\d{1,2}[.\/]\d{4})/g;
    const accountPattern = /(\d{1,10}\/\d{4})/g;
    
    let match;
    while ((match = amountPattern.exec(emailContent)) !== null) {
      const amount = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
      if (amount > 0) {
        payments.push({
          amount,
          currency: 'CZK',
          transactionDate: new Date(),
          description: 'Extracted from bank statement'
        });
      }
    }
    
    return payments;
  }
  
  // Match payment to invoice using AI and database queries
  private async matchPaymentToInvoice(payment: PaymentData, companyId: number): Promise<PaymentMatchResult | null> {
    try {
      // Get unpaid invoices for the company
      const unpaidInvoices = await db.select()
        .from(invoices)
        .where(and(
          eq(invoices.companyId, companyId),
          eq(invoices.status, 'sent'),
          isNull(invoices.paidAt)
        ))
        .orderBy(desc(invoices.dueDate));
      
      if (unpaidInvoices.length === 0) {
        return null;
      }
      
      // Try exact VS match first
      if (payment.variableSymbol) {
        const exactMatch = unpaidInvoices.find(invoice => 
          invoice.variableSymbol === payment.variableSymbol
        );
        
        if (exactMatch && Math.abs(exactMatch.totalAmount - payment.amount) < 0.01) {
          return {
            invoiceId: exactMatch.id,
            matchType: 'automatic',
            matchConfidence: 100,
            matchedAmount: payment.amount
          };
        }
      }
      
      // Try AI-powered matching
      const aiMatch = await this.aiMatchPayment(payment, unpaidInvoices);
      if (aiMatch) {
        return aiMatch;
      }
      
      // Try amount-based matching
      const amountMatch = unpaidInvoices.find(invoice => 
        Math.abs(invoice.totalAmount - payment.amount) < 0.01
      );
      
      if (amountMatch) {
        return {
          invoiceId: amountMatch.id,
          matchType: 'partial',
          matchConfidence: 70,
          matchedAmount: payment.amount,
          notes: 'Matched by amount only'
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('Error matching payment to invoice:', error);
      return null;
    }
  }
  
  // AI-powered payment matching
  private async aiMatchPayment(payment: PaymentData, invoices: any[]): Promise<PaymentMatchResult | null> {
    try {
      const prompt = `Analyzuj tuto platbu a najdi nejlepší odpovídající fakturu:

PLATBA:
- Částka: ${payment.amount} ${payment.currency}
- VS: ${payment.variableSymbol || 'neuvedeno'}
- Protistrana: ${payment.counterpartyName || 'neuvedeno'}
- Popis: ${payment.description || 'neuvedeno'}
- Datum: ${payment.transactionDate.toISOString().split('T')[0]}

DOSTUPNÉ FAKTURY:
${invoices.map(inv => `- ID: ${inv.id}, Částka: ${inv.totalAmount} CZK, VS: ${inv.variableSymbol || 'neuvedeno'}, Zákazník: ${inv.customerName || 'neuvedeno'}, Splatnost: ${inv.dueDate}`).join('\n')}

PRAVIDLA PÁROVÁNÍ:
1. VS musí přesně odpovídat
2. Částka musí být stejná nebo velmi podobná
3. Zohledni název protistrany vs. zákazníka
4. Zohledni datum splatnosti

Vrať JSON:
{
  "invoiceId": ID_faktury_nebo_null,
  "matchType": "automatic|partial",
  "matchConfidence": 0-100,
  "matchedAmount": částka,
  "notes": "důvod párování"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 500,
        temperature: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      if (result.invoiceId && result.matchConfidence >= 70) {
        return {
          invoiceId: result.invoiceId,
          matchType: result.matchType,
          matchConfidence: result.matchConfidence,
          matchedAmount: result.matchedAmount || payment.amount,
          notes: result.notes
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('Error in AI payment matching:', error);
      return null;
    }
  }
  
  // Save bank transaction to database
  private async saveBankTransaction(payment: PaymentData, bankAccountId: number, companyId: number): Promise<void> {
    await db.insert(bankTransactions).values({
      companyId,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: payment.amount,
      currency: payment.currency,
      description: payment.description,
      variableSymbol: payment.variableSymbol,
      constantSymbol: payment.constantSymbol,
      specificSymbol: payment.specificSymbol,
      counterpartyAccount: payment.counterpartyAccount,
      counterpartyName: payment.counterpartyName,
      transactionDate: payment.transactionDate,
      isMatched: false
    });
  }
  
  // Create payment match record
  private async createPaymentMatch(
    matchResult: PaymentMatchResult, 
    payment: PaymentData, 
    bankAccountId: number, 
    companyId: number
  ): Promise<void> {
    // Create payment match record
    await db.insert(paymentMatches).values({
      companyId,
      bankAccountId,
      invoiceId: matchResult.invoiceId,
      paymentAmount: payment.amount,
      paymentDate: payment.transactionDate,
      variableSymbol: payment.variableSymbol,
      constantSymbol: payment.constantSymbol,
      specificSymbol: payment.specificSymbol,
      counterpartyAccount: payment.counterpartyAccount,
      counterpartyName: payment.counterpartyName,
      paymentReference: payment.bankReference,
      matchType: matchResult.matchType,
      matchConfidence: matchResult.matchConfidence,
      matchedBy: null, // System match
      status: 'matched',
      notes: matchResult.notes
    });
    
    // Update invoice as paid
    await db.update(invoices)
      .set({ 
        status: 'paid',
        paidAt: new Date(),
        paidAmount: matchResult.matchedAmount
      })
      .where(eq(invoices.id, matchResult.invoiceId));
    
    // Update bank transaction as matched
    await db.update(bankTransactions)
      .set({ 
        isMatched: true,
        matchedInvoiceId: matchResult.invoiceId
      })
      .where(and(
        eq(bankTransactions.companyId, companyId),
        eq(bankTransactions.amount, payment.amount),
        eq(bankTransactions.transactionDate, payment.transactionDate)
      ));
  }
  
  // Update last processed date for bank account
  private async updateLastProcessedDate(bankAccountId: number, companyId: number): Promise<void> {
    await db.update(bankAccounts)
      .set({ lastProcessedPayment: new Date() })
      .where(and(
        eq(bankAccounts.id, bankAccountId),
        eq(bankAccounts.companyId, companyId)
      ));
  }
  
  // Get payment matching statistics
  async getMatchingStats(companyId: number): Promise<{
    totalPayments: number;
    matchedPayments: number;
    unmatchedPayments: number;
    matchRate: number;
    lastProcessed: Date | null;
  }> {
    const [totalPayments] = await db.select({ count: sql`count(*)` })
      .from(bankTransactions)
      .where(eq(bankTransactions.companyId, companyId));
    
    const [matchedPayments] = await db.select({ count: sql`count(*)` })
      .from(bankTransactions)
      .where(and(
        eq(bankTransactions.companyId, companyId),
        eq(bankTransactions.isMatched, true)
      ));
    
    const [lastProcessed] = await db.select({ lastProcessedPayment: bankAccounts.lastProcessedPayment })
      .from(bankAccounts)
      .where(eq(bankAccounts.companyId, companyId))
      .orderBy(desc(bankAccounts.lastProcessedPayment))
      .limit(1);
    
    const total = totalPayments.count || 0;
    const matched = matchedPayments.count || 0;
    const unmatched = total - matched;
    const matchRate = total > 0 ? (matched / total) * 100 : 0;
    
    return {
      totalPayments: total,
      matchedPayments: matched,
      unmatchedPayments: unmatched,
      matchRate: Math.round(matchRate * 100) / 100,
      lastProcessed: lastProcessed?.lastProcessedPayment || null
    };
  }
  
  // Get unmatched payments for manual review
  async getUnmatchedPayments(companyId: number): Promise<any[]> {
    return await db.select()
      .from(bankTransactions)
      .where(and(
        eq(bankTransactions.companyId, companyId),
        eq(bankTransactions.isMatched, false)
      ))
      .orderBy(desc(bankTransactions.transactionDate));
  }
  
  // Manual payment matching
  async manualMatchPayment(
    transactionId: number, 
    invoiceId: number, 
    userId: number, 
    companyId: number
  ): Promise<void> {
    const transaction = await db.select()
      .from(bankTransactions)
      .where(eq(bankTransactions.id, transactionId))
      .limit(1);
    
    if (!transaction[0]) {
      throw new Error('Transaction not found');
    }
    
    const invoice = await db.select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);
    
    if (!invoice[0]) {
      throw new Error('Invoice not found');
    }
    
    // Create manual payment match
    await db.insert(paymentMatches).values({
      companyId,
      bankAccountId: transaction[0].bankAccountId || 0,
      invoiceId,
      paymentAmount: transaction[0].amount,
      paymentDate: transaction[0].transactionDate,
      variableSymbol: transaction[0].variableSymbol,
      constantSymbol: transaction[0].constantSymbol,
      specificSymbol: transaction[0].specificSymbol,
      counterpartyAccount: transaction[0].counterpartyAccount,
      counterpartyName: transaction[0].counterpartyName,
      matchType: 'manual',
      matchConfidence: 100,
      matchedBy: userId,
      status: 'matched',
      notes: 'Manual match by user'
    });
    
    // Update invoice as paid
    await db.update(invoices)
      .set({ 
        status: 'paid',
        paidAt: new Date(),
        paidAmount: transaction[0].amount
      })
      .where(eq(invoices.id, invoiceId));
    
    // Update transaction as matched
    await db.update(bankTransactions)
      .set({ 
        isMatched: true,
        matchedInvoiceId: invoiceId
      })
      .where(eq(bankTransactions.id, transactionId));
  }
}

export const paymentMatchingService = new PaymentMatchingService();
