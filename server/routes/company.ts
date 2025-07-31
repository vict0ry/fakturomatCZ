import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { insertCompanySchema } from '@shared/schema';

const router = Router();

// All company routes require authentication
router.use(requireAuth);

// GET /api/companies - Get company info
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const company = await storage.getCompany(user.companyId);
    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/companies - Update company
router.patch('/', async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Validate partial update data
    const updateSchema = insertCompanySchema.partial();
    const validatedData = updateSchema.parse(req.body);
    
    // Update company
    const updatedCompany = await storage.updateCompany(user.companyId, validatedData);
    
    res.json(updatedCompany);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/companies/settings - Get company settings (alias for compatibility)
router.get('/settings', async (req, res) => {
  try {
    const user = (req as any).user;
    const company = await storage.getCompany(user.companyId);
    res.json(company);
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/companies/settings - Update company settings (alias for compatibility)
router.post('/settings', async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Validate partial update data
    const updateSchema = insertCompanySchema.partial();
    const validatedData = updateSchema.parse(req.body);
    
    // Update company
    const updatedCompany = await storage.updateCompany(user.companyId, validatedData);
    
    res.json(updatedCompany);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error updating company settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/companies/users - Get company users
router.get('/users', async (req, res) => {
  try {
    const user = (req as any).user;
    const users = await storage.getCompanyUsers(user.companyId);
    
    // Remove password fields from response
    const safeUsers = users.map(u => ({ ...u, password: undefined }));
    
    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching company users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/companies/users/invite - Invite new user
router.post('/users/invite', async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Company owners and admins can invite users to their company
    if (user.role !== 'admin' && user.role !== 'owner') {
      return res.status(403).json({ message: 'Only company owners and administrators can invite users' });
    }
    
    const { email, firstName, lastName, role, accessLevel } = req.body;
    
    // Validate required fields
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ 
        message: 'Email, first name, and last name are required' 
      });
    }
    
    // Check if user with this email already exists in the company
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser && existingUser.companyId === user.companyId) {
      return res.status(400).json({ 
        message: 'User with this email already exists in your company' 
      });
    }
    
    // Check if there's already a pending invitation for this email
    const existingInvitation = await storage.getPendingInvitationByEmail(email, user.companyId);
    if (existingInvitation) {
      return res.status(400).json({ 
        message: 'Invitation already sent to this email address' 
      });
    }
    
    // Create invitation
    const invitation = await storage.createUserInvitation({
      companyId: user.companyId,
      invitedBy: user.id,
      email,
      firstName,
      lastName,
      role: role || 'user',
      accessLevel: accessLevel || 'read'
    });
    
    // Send invitation email
    await storage.sendInvitationEmail(invitation);
    
    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/companies/invitations - Get pending invitations
router.get('/invitations', async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Company owners and admins can view invitations
    if (user.role !== 'admin' && user.role !== 'owner') {
      return res.status(403).json({ message: 'Only company owners and administrators can view invitations' });
    }
    
    const invitations = await storage.getCompanyInvitations(user.companyId);
    res.json(invitations);
    
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/companies/invitations/:id - Revoke invitation
router.delete('/invitations/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const invitationId = parseInt(req.params.id);
    
    // Company owners and admins can revoke invitations
    if (user.role !== 'admin' && user.role !== 'owner') {
      return res.status(403).json({ message: 'Only company owners and administrators can revoke invitations' });
    }
    
    await storage.revokeInvitation(invitationId, user.companyId);
    res.json({ message: 'Invitation revoked successfully' });
    
  } catch (error) {
    console.error('Error revoking invitation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Setup function to mount the router
export default function setupCompanyRoutes(app: any) {
  app.use('/api/company', router);
}

export { router };