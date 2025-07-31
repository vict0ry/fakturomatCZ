import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";

const router = Router();

interface SearchResult {
  id: string;
  type: 'invoice' | 'customer' | 'expense' | 'recurring';
  title: string;
  subtitle?: string;
  url: string;
  status?: string;
  amount?: string;
  date?: string;
}

router.get('/', requireAuth, async (req: any, res) => {
  try {
    const query = req.query.q as string;
    const companyId = req.user.companyId;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase();

    // Search invoices
    try {
      const invoices = await storage.getCompanyInvoices(companyId);
      const filteredInvoices = invoices.filter(invoice => 
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm) ||
        invoice.notes?.toLowerCase().includes(searchTerm) ||
        (invoice.customer?.name?.toLowerCase().includes(searchTerm))
      ).slice(0, 5);

      filteredInvoices.forEach(invoice => {
        results.push({
          id: `invoice-${invoice.id}`,
          type: 'invoice',
          title: `Faktura ${invoice.invoiceNumber || invoice.id}`,
          subtitle: invoice.customer?.name,
          url: `/invoices/${invoice.id}`,
          status: invoice.status,
          amount: `${parseFloat(invoice.total || '0').toLocaleString('cs-CZ')} Kč`,
          date: new Date(invoice.issueDate).toLocaleDateString('cs-CZ')
        });
      });
    } catch (error) {
      console.error('Error searching invoices:', error);
    }

    // Search customers
    try {
      const customers = await storage.getCompanyCustomers(companyId);
      const filteredCustomers = customers.filter(customer => 
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.ico?.includes(searchTerm) ||
        customer.dic?.includes(searchTerm)
      ).slice(0, 5);

      filteredCustomers.forEach(customer => {
        results.push({
          id: `customer-${customer.id}`,
          type: 'customer',
          title: customer.name || 'Bez názvu',
          subtitle: customer.email || customer.ico,
          url: `/customers/${customer.id}`,
          status: customer.isActive ? 'active' : 'inactive'
        });
      });
    } catch (error) {
      console.error('Error searching customers:', error);
    }

    // Search expenses
    try {
      const expenses = await storage.getCompanyExpenses?.(companyId) || [];
      const filteredExpenses = expenses.filter((expense: any) => 
        expense.description?.toLowerCase().includes(searchTerm) ||
        expense.vendor?.toLowerCase().includes(searchTerm) ||
        expense.category?.toLowerCase().includes(searchTerm)
      ).slice(0, 3);

      filteredExpenses.forEach((expense: any) => {
        results.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          title: expense.description || 'Náklad bez popisu',
          subtitle: expense.vendor || expense.category,
          url: `/expenses/${expense.id}`,
          amount: `${parseFloat(expense.amount || '0').toLocaleString('cs-CZ')} Kč`,
          date: new Date(expense.date).toLocaleDateString('cs-CZ')
        });
      });
    } catch (error) {
      console.error('Error searching expenses:', error);
    }

    // Search recurring invoices
    try {
      const recurringInvoices = await storage.getRecurringInvoices?.(companyId) || [];
      const filteredRecurring = recurringInvoices.filter((recurring: any) => 
        recurring.templateName?.toLowerCase().includes(searchTerm) ||
        recurring.customer?.name?.toLowerCase().includes(searchTerm)
      ).slice(0, 3);

      filteredRecurring.forEach((recurring: any) => {
        results.push({
          id: `recurring-${recurring.id}`,
          type: 'recurring',
          title: recurring.templateName || 'Opakovaná faktura',
          subtitle: recurring.customer?.name,
          url: `/recurring-invoices`,
          status: recurring.isActive ? 'active' : 'inactive'
        });
      });
    } catch (error) {
      console.error('Error searching recurring invoices:', error);
    }

    // Sort results by relevance (exact matches first, then partial matches)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().startsWith(searchTerm) ? 1 : 0;
      const bExact = b.title.toLowerCase().startsWith(searchTerm) ? 1 : 0;
      
      if (aExact !== bExact) return bExact - aExact;
      
      // Then by type priority (invoices first, then customers)
      const typeOrder = { invoice: 1, customer: 2, expense: 3, recurring: 4 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    res.json(results.slice(0, 12)); // Limit to 12 results total
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
});

export default router;