import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get("/", async (req: any, res) => {
  try {
    // Check session authentication
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    const companyId = user.companyId;
    
    // Get current month date range
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Get stats for current and previous month
    const [currentStats, previousStats] = await Promise.all([
      storage.getCompanyStats(companyId, currentMonthStart, now),
      storage.getCompanyStats(companyId, previousMonthStart, previousMonthEnd),
    ]);
    
    // Calculate growth percentage
    const revenueGrowth = previousStats.revenue > 0 
      ? ((currentStats.revenue - previousStats.revenue) / previousStats.revenue) * 100
      : 0;
    
    // Get detailed invoice breakdown
    const [allInvoices, overdueInvoices] = await Promise.all([
      storage.getCompanyInvoices(companyId),
      storage.getOverdueInvoices(companyId),
    ]);
    
    const paidInvoices = allInvoices.filter(inv => inv.status === 'paid').length;
    const pendingInvoices = allInvoices.filter(inv => inv.status === 'sent').length;
    
    // Get customer stats
    const customers = await storage.getCompanyCustomers(companyId);
    const activeCustomers = customers.filter(c => c.isActive).length;
    
    // Generate monthly data for the last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthStats = await storage.getCompanyStats(companyId, monthStart, monthEnd);
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('cs-CZ', { month: 'short' }),
        revenue: monthStats.revenue,
        invoices: monthStats.invoiceCount,
      });
    }
    
    res.json({
      revenue: {
        current: currentStats.revenue,
        previous: previousStats.revenue,
        growth: Math.round(revenueGrowth * 100) / 100,
      },
      invoices: {
        total: allInvoices.length,
        paid: paidInvoices,
        pending: pendingInvoices,
        overdue: overdueInvoices.length,
      },
      customers: {
        total: customers.length,
        active: activeCustomers,
        inactive: customers.length - activeCustomers,
      },
      monthlyData,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Nepodařilo se načíst analytické data' });
  }
});

export default router;