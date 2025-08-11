import { apiRequest } from "./queryClient";

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  ico?: string;
  dic?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  source?: 'local' | 'ares';
  // Enhanced fields
  website?: string;
  contactPerson?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  category?: 'standard' | 'vip' | 'problematic';
  paymentTerms?: number;
  notes?: string;
  isActive?: boolean;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  type: 'invoice' | 'proforma' | 'credit_note';
  issueDate: string;
  dueDate: string;
  subtotal: string;
  vatAmount: string;
  total: string;
  currency?: string;
  // Payment details
  paymentMethod?: "bank_transfer" | "card" | "cash" | "online" | "cheque";
  bankAccount?: string;
  variableSymbol?: string;
  constantSymbol?: string;
  specificSymbol?: string;
  paymentReference?: string;
  // Delivery details
  deliveryMethod?: "email" | "post" | "pickup" | "courier";
  deliveryAddress?: string;
  orderNumber?: string;
  warranty?: string;
  // Standard fields
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  isReverseCharge?: boolean;
  paidAt?: string;
  notes?: string;
  customer?: Customer;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  total: string;
}

export interface Stats {
  revenue: number;
  invoiceCount: number;
  paidInvoices: number;
  unpaidAmount: number;
  overdueCount: number;
  activeCustomers: number;
}

export interface AIResponse {
  response: string;
  command?: {
    action: string;
    customerName?: string;
    customerIco?: string;
    description?: string;
    amount?: number;
    currency?: string;
    invoiceType?: string;
  };
  confidence: number;
}

// Customer API
export const customerAPI = {
  getAll: async (): Promise<Customer[]> => {
    const response = await apiRequest("GET", "/api/customers");
    return response.json();
  },

  search: async (query: string): Promise<Customer[]> => {
    const response = await apiRequest("GET", `/api/customers/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },

  getById: async (id: number): Promise<Customer> => {
    const response = await apiRequest("GET", `/api/customers/${id}`);
    return response.json();
  },

  create: async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const response = await apiRequest("POST", "/api/customers", customer);
    return response.json();
  },

  update: async (id: number, customer: Partial<Customer>): Promise<Customer> => {
    const response = await apiRequest("PUT", `/api/customers/${id}`, customer);
    return response.json();
  },
};

// Invoice API
export const invoiceAPI = {
  getAll: async (status?: string): Promise<Invoice[]> => {
    const url = status ? `/api/invoices?status=${status}` : "/api/invoices";
    const response = await apiRequest("GET", url);
    return response.json();
  },

  getRecent: async (limit: number = 10): Promise<Invoice[]> => {
    const response = await apiRequest("GET", `/api/invoices/recent?limit=${limit}`);
    return response.json();
  },

  getById: async (id: number): Promise<Invoice> => {
    const response = await apiRequest("GET", `/api/invoices/${id}`);
    return response.json();
  },

  create: async (invoice: Omit<Invoice, 'id' | 'customer'>): Promise<Invoice> => {
    const response = await apiRequest("POST", "/api/invoices", invoice);
    return response.json();
  },

  update: async (id: number, invoice: Partial<Invoice>): Promise<Invoice> => {
    const response = await apiRequest("PATCH", `/api/invoices/${id}`, invoice);
    return response.json();
  },

  downloadPDF: async (id: number): Promise<Blob> => {
    const response = await apiRequest("GET", `/api/invoices/${id}/pdf`);
    return response.blob();
  },

  duplicate: async (id: number): Promise<Invoice> => {
    const response = await apiRequest("POST", `/api/invoices/${id}/duplicate`);
    return response.json();
  },

};

// Statistics API
export const statsAPI = {
  getMonthlyStats: async (): Promise<Stats> => {
    const response = await apiRequest("GET", "/api/stats");
    return response.json();
  },
};

// AI Chat API
export const chatAPI = {
  sendMessage: async (message: string): Promise<AIResponse> => {
    const response = await apiRequest("POST", "/api/chat", { message });
    return response.json();
  },

  getHistory: async (limit: number = 50): Promise<any[]> => {
    const response = await apiRequest("GET", `/api/chat/history?limit=${limit}`);
    return response.json();
  },
};

// ARES API
export const aresAPI = {
  getCompany: async (ico: string): Promise<Customer> => {
    const response = await apiRequest("GET", `/api/ares/company/${ico}`);
    return response.json();
  },

  searchCompanies: async (query: string): Promise<Customer[]> => {
    const response = await apiRequest("GET", `/api/ares/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },
};
