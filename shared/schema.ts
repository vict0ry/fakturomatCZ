import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ico: text("ico"), // Czech company registration number
  dic: text("dic"), // Czech VAT number
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default("CZ"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  bankAccount: text("bank_account"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("user"), // admin, user, viewer
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  ico: text("ico"), // Czech company registration number
  dic: text("dic"), // Czech VAT number
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default("CZ"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  userId: integer("user_id").references(() => users.id),
  invoiceNumber: text("invoice_number").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  type: text("type").notNull().default("invoice"), // invoice, proforma, credit_note, advance
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  originalDueDate: timestamp("original_due_date"), // Track original due date if changed
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  isReverseCharge: boolean("is_reverse_charge").default(false),
  currency: text("currency").default("CZK"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }).default("1"),
  reminderSentAt: timestamp("reminder_sent_at"),
  reminderCount: integer("reminder_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("21"), // Czech VAT rate
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  userId: integer("user_id").references(() => users.id),
  message: text("message").notNull(),
  response: text("response"),
  role: text("role").notNull().default("user"), // user, assistant, system
  sessionId: text("session_id"),
  metadata: json("metadata"), // For storing additional data like commands
  createdAt: timestamp("created_at").defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  type: text("type").notNull(), // payment_reminder, overdue_notice
  sentAt: timestamp("sent_at").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("sent"), // sent, failed, bounced
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoiceHistory = pgTable("invoice_history", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  companyId: integer("company_id").references(() => companies.id),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // created, updated, sent, paid, cancelled, reminder_sent
  oldValue: json("old_value"),
  newValue: json("new_value"),
  description: text("description"),
  recipientEmail: text("recipient_email"), // for sent actions
  metadata: json("metadata"), // additional data like email delivery status
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  invoices: many(invoices),
  chatMessages: many(chatMessages),
  reminders: many(reminders),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  invoices: many(invoices),
  chatMessages: many(chatMessages),
  sessions: many(sessions),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, { fields: [customers.companyId], references: [companies.id] }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, { fields: [invoices.companyId], references: [companies.id] }),
  user: one(users, { fields: [invoices.userId], references: [users.id] }),
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  items: many(invoiceItems),
  reminders: many(reminders),
  history: many(invoiceHistory),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  company: one(companies, { fields: [chatMessages.companyId], references: [companies.id] }),
  user: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  company: one(companies, { fields: [reminders.companyId], references: [companies.id] }),
  invoice: one(invoices, { fields: [reminders.invoiceId], references: [invoices.id] }),
}));

export const invoiceHistoryRelations = relations(invoiceHistory, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceHistory.invoiceId], references: [invoices.id] }),
  company: one(companies, { fields: [invoiceHistory.companyId], references: [companies.id] }),
  user: one(users, { fields: [invoiceHistory.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

// Zod schemas
export const insertCompanySchema = createInsertSchema(companies);
export const insertUserSchema = createInsertSchema(users);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertInvoiceSchema = createInsertSchema(invoices);
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertReminderSchema = createInsertSchema(reminders);
export const insertInvoiceHistorySchema = createInsertSchema(invoiceHistory);
export const insertSessionSchema = createInsertSchema(sessions);

// Types
export type Company = typeof companies.$inferSelect;
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type InvoiceHistory = typeof invoiceHistory.$inferSelect;
export type Session = typeof sessions.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type InsertInvoiceHistory = z.infer<typeof insertInvoiceHistorySchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
