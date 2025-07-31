import { Router } from 'express';
import authRoutes from './auth';
import bankAccountRoutes from './bank-accounts';
import invoiceRoutes from './invoices';
import customerRoutes from './customers';
// import expenseRoutes from './expenses'; // temporarily disabled
import adminRoutes from './admin';
import companyRoutes from './company';
import recurringInvoicesRoutes from './recurring-invoices';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/bank-accounts', bankAccountRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/invoices/recurring', recurringInvoicesRoutes);
router.use('/customers', customerRoutes);
// router.use('/expenses', expenseRoutes); // temporarily disabled
router.use('/admin', adminRoutes);
router.use('/companies', companyRoutes);

export default router;