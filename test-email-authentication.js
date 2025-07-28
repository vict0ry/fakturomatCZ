#!/usr/bin/env node

import nodemailer from 'nodemailer';

async function testAntiSpamEmail() {
  console.log('🔧 Testing Anti-Spam Email Configuration\n');

  const transporter = nodemailer.createTransport({
    host: 'email-smtp.eu-north-1.amazonaws.com',
    port: 587,
    secure: false,
    auth: {
      user: 'AKIA3AIIBQDYVZ2P7VEP',
      pass: 'BKBN+yP6MRTBnyCFJGEHAXZjzR+IUSLw0tJG7p+WdmTG'
    },
  });

  try {
    console.log('📧 Sending professionally formatted email...');
    
    const result = await transporter.sendMail({
      from: '"Doklad.ai Team" <noreply@doklad.ai>',
      to: 'mail@victoreliot.com',
      subject: 'Invoice Management System - Welcome',
      html: `
        <!DOCTYPE html>
        <html lang="cs">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Doklad.ai</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f4f4f4;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Doklad.ai</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.95;">AI-Powered Czech Invoice Management</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: white; padding: 40px 30px;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Welcome to Professional Invoice Management</h2>
            
            <p style="margin-bottom: 20px; color: #4b5563;">
              This email confirms that your Doklad.ai email system is properly configured and ready for production use.
            </p>
            
            <!-- Feature List -->
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f97316;">
              <h3 style="margin-top: 0; color: #1f2937; font-size: 18px;">System Features Active:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 8px;">✅ Secure password reset emails</li>
                <li style="margin-bottom: 8px;">✅ Professional invoice delivery</li>
                <li style="margin-bottom: 8px;">✅ Payment notification system</li>
                <li style="margin-bottom: 8px;">✅ Automated bank account matching</li>
                <li style="margin-bottom: 8px;">✅ ARES registry integration</li>
              </ul>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://doklad.ai" 
                 style="background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 2px 4px rgba(249, 115, 22, 0.2);">
                Access Your Dashboard
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
              If you have any questions about your invoice management system, please don't hesitate to contact our support team.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 13px;">
              This email was sent by Doklad.ai invoice management system.<br>
              <a href="https://doklad.ai" style="color: #f97316; text-decoration: none;">doklad.ai</a> | 
              <a href="mailto:support@doklad.ai" style="color: #f97316; text-decoration: none;">support@doklad.ai</a>
            </p>
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Czech Republic | Professional Invoice Management Solution
              </p>
            </div>
          </div>
          
        </body>
        </html>
      `,
      text: `
Welcome to Doklad.ai

This email confirms that your professional invoice management system is properly configured and ready for production use.

System Features Active:
- Secure password reset emails
- Professional invoice delivery  
- Payment notification system
- Automated bank account matching
- ARES registry integration

Access your dashboard: https://doklad.ai

If you have any questions, contact our support team at support@doklad.ai

Best regards,
Doklad.ai Team
Czech Republic | Professional Invoice Management Solution
      `,
      headers: {
        'X-Mailer': 'Doklad.ai Professional v1.0',
        'X-Priority': '3',
        'List-Unsubscribe': '<mailto:unsubscribe@doklad.ai>',
        'X-Entity-Ref-ID': 'doklad-system-notification'
      }
    });

    console.log('✅ Professional email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Recipient: mail@victoreliot.com');
    console.log('🎯 Anti-spam measures implemented:');
    console.log('   - Professional HTML template');
    console.log('   - Proper email headers');
    console.log('   - Unsubscribe header');
    console.log('   - Clear sender identification');
    console.log('   - Business-appropriate content');
    console.log('');
    console.log('🔍 Next step: Add DNS records for full authentication');
    console.log('   Run: ./setup-dns-records.sh');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testAntiSpamEmail().catch(console.error);