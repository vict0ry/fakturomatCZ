// AI Service Types and Interfaces

export interface InvoiceCommand {
  action: "create_invoice" | "search_customer" | "get_status" | "other";
  customerName?: string;
  customerIco?: string;
  description?: string;
  amount?: number;
  currency?: string;
  invoiceType?: "invoice" | "proforma" | "credit_note";
}

export interface UniversalAIResponse {
  content: string;
  action?: {
    type: string;
    data: any;
  };
}

export interface UserContext {
  userId: number;
  companyId: number;
  storage: any;
}

export interface InvoiceItem {
  productName: string;
  quantity: string;
  unit: string;
  description: string;
}

export interface InvoiceData {
  customerName: string;
  items: InvoiceItem[];
  totalAmount: number | null;
  notes: string;
}