import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';
import { db } from '../db.js';
import { bankAccounts, companies } from '../../shared/schema.js';
import type { BankAccount, InsertBankAccount } from '../../shared/schema.js';

export class BankAccountService {
  // Create new bank account
  async createBankAccount(companyId: number, data: Omit<InsertBankAccount, 'companyId'>): Promise<BankAccount> {
    const [account] = await db.insert(bankAccounts).values({
      ...data,
      companyId,
    }).returning();

    return account;
  }

  // Get all bank accounts for a company
  async getBankAccountsByCompany(companyId: number): Promise<BankAccount[]> {
    return db.select().from(bankAccounts)
      .where(and(
        eq(bankAccounts.companyId, companyId),
        eq(bankAccounts.isActive, true)
      ));
  }

  // Get bank account by ID
  async getBankAccountById(id: number, companyId: number): Promise<BankAccount | null> {
    const [account] = await db.select().from(bankAccounts)
      .where(and(
        eq(bankAccounts.id, id),
        eq(bankAccounts.companyId, companyId),
        eq(bankAccounts.isActive, true)
      ));

    return account || null;
  }

  // Update bank account
  async updateBankAccount(id: number, companyId: number, data: Partial<BankAccount>): Promise<BankAccount | null> {
    const [account] = await db.update(bankAccounts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(
        eq(bankAccounts.id, id),
        eq(bankAccounts.companyId, companyId)
      ))
      .returning();

    return account || null;
  }

  // Generate payment email for bank account
  async generatePaymentEmail(accountId: number, companyId: number): Promise<{ email: string; password: string }> {
    // Get company info to determine domain
    const [company] = await db.select().from(companies)
      .where(eq(companies.id, companyId));

    if (!company) {
      throw new Error('Company not found');
    }

    // Get bank account info
    const account = await this.getBankAccountById(accountId, companyId);
    if (!account) {
      throw new Error('Bank account not found');
    }

    // Extract bank code and account number for email generation
    const accountParts = account.accountNumber.split('/');
    const accountNum = accountParts[0];
    const bankCode = accountParts[1] || account.bankCode || 'bank';

    // Generate unique token and email
    const emailToken = nanoid(10);
    const password = this.generateSecurePassword();
    
    // Create email format like: bank.219819.b7a9415jfb@doklad.ai
    const email = `bank.${accountNum}.${emailToken}@doklad.ai`;

    // Update bank account with payment email info
    await this.updateBankAccount(accountId, companyId, {
      paymentEmail: email,
      paymentEmailPassword: password,
      emailToken: emailToken,
    });

    // Here we would integrate with Mailcow API to actually create the email account
    await this.createMailcowAccount(email, password);

    return { email, password };
  }

  // Create email account in Mailcow
  private async createMailcowAccount(email: string, password: string): Promise<void> {
    console.log(`📧 Creating Mailcow account: ${email}`);
    
    // Check if we have Mailcow credentials
    const mailcowHost = process.env.MAILCOW_HOST;
    const mailcowApiKey = process.env.MAILCOW_API_KEY;

    if (!mailcowHost || !mailcowApiKey) {
      console.log('⚠️ Mailcow credentials not configured - email account creation skipped');
      return;
    }

    try {
      // Create mailbox in Mailcow
      const response = await fetch(`${mailcowHost}/api/v1/add/mailbox`, {
        method: 'POST',
        headers: {
          'X-API-Key': mailcowApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          local_part: email.split('@')[0],
          domain: 'doklad.ai',
          name: `Payment Email - ${email}`,
          password: password,
          password2: password,
          quota: 1024, // 1GB quota
          active: 1,
          force_pw_update: 0,
          tls_enforce_in: 1,
          tls_enforce_out: 1,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Mailcow API error: ${error}`);
      }

      console.log(`✅ Mailcow account created: ${email}`);
    } catch (error) {
      console.error(`❌ Failed to create Mailcow account: ${error}`);
      throw new Error(`Failed to create email account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate secure password for email accounts
  private generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  // Delete bank account (soft delete)
  async deleteBankAccount(id: number, companyId: number): Promise<boolean> {
    const [account] = await db.update(bankAccounts)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(
        eq(bankAccounts.id, id),
        eq(bankAccounts.companyId, companyId)
      ))
      .returning();

    return !!account;
  }

  // Check if account number already exists for company
  async isAccountNumberExists(accountNumber: string, companyId: number, excludeId?: number): Promise<boolean> {
    const query = db.select().from(bankAccounts)
      .where(and(
        eq(bankAccounts.accountNumber, accountNumber),
        eq(bankAccounts.companyId, companyId),
        eq(bankAccounts.isActive, true)
      ));

    if (excludeId) {
      // Add condition to exclude specific ID (for updates)
      const accounts = await query;
      return accounts.some(account => account.id !== excludeId);
    }

    const [account] = await query;
    return !!account;
  }
}