import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';

const router = Router();

// GET /api/invitations/:token - Get invitation details (for acceptance page)
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await storage.getInvitationByToken(token);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation is no longer valid' });
    }
    
    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ message: 'Invitation has expired' });
    }
    
    // Get company info
    const company = invitation.companyId ? await storage.getCompany(invitation.companyId) : null;
    
    res.json({
      id: invitation.id,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      role: invitation.role,
      company: company ? { name: company.name } : null,
      expiresAt: invitation.expiresAt
    });
    
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/invitations/:token/accept - Accept invitation and create user
router.post('/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    const newUser = await storage.acceptInvitation(token, password);
    
    res.status(201).json({
      message: 'Invitation accepted successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      }
    });
    
  } catch (error) {
    console.error('Error accepting invitation:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid invitation token')) {
        return res.status(404).json({ message: 'Invitation not found' });
      }
      if (error.message.includes('no longer valid') || error.message.includes('expired')) {
        return res.status(400).json({ message: error.message });
      }
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;