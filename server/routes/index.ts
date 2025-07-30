import { Router } from 'express';
import authRoutes from './auth';
import bankAccountRoutes from './bank-accounts';
import invoiceRoutes from './invoices';
import customerRoutes from './customers';
import expenseRoutes from './expenses';
import adminRoutes from './admin';
import companyRoutes from './company';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/bank-accounts', bankAccountRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/customers', customerRoutes);
router.use('/expenses', expenseRoutes);
router.use('/admin', adminRoutes);
router.use('/companies', companyRoutes);

export default router;