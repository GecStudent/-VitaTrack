import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { AuditLogger } from '../../utils/auditLogger';

// Test email configuration on startup
async function testEmailConfig() {
  try {
    console.log('Testing email configuration...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
    console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
    console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
    
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
}

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST || '',
  port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
  secure: (process.env.SMTP_SECURE || process.env.EMAIL_SECURE) === 'true',
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || ''
  },
  tls: {
    rejectUnauthorized: false // For development
  }
});

// Test configuration when module loads
testEmailConfig();

// Default templates with inline styles
// Update defaultTemplates to include password reset template
const defaultTemplates = {
  verification: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification - VitaTrack</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <div style="background: #4a90e2; color: white; padding: 30px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">VitaTrack</div>
            <div style="font-size: 14px; opacity: 0.9;">Your Health & Nutrition Companion</div>
        </div>

        <div style="padding: 30px;">
            <div style="font-size: 20px; font-weight: 600; color: #333; margin-bottom: 20px;">Verify Your Email Address</div>
            
            <div style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 25px;">
                Thank you for signing up for VitaTrack! To complete your registration and start your health journey, please verify your email address by clicking the button below.
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{verificationLink}}" style="display: inline-block; background: #4a90e2; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: 600; font-size: 16px; border: none; cursor: pointer;" target="_blank">Verify Email Address</a>
            </div>

            <div style="background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px;">
                <strong>Security Notice:</strong> If you didn't create an account with VitaTrack, please ignore this email. This verification link will expire in 24 hours.
            </div>

            <div style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 25px;">
                Once verified, you'll be able to:
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Track your meals and nutrition</li>
                    <li>Monitor your exercise and activity</li>
                    <li>Set and track your health goals</li>
                    <li>Get personalized recommendations</li>
                </ul>
            </div>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; font-size: 14px; color: #666;">
            <strong>VitaTrack</strong><br>
            Your journey to better health starts here.
            <div style="margin-top: 10px;">
                <a href="#" style="color: #4a90e2; text-decoration: none; margin: 0 10px;">Unsubscribe</a>
                <a href="#" style="color: #4a90e2; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                <a href="#" style="color: #4a90e2; text-decoration: none; margin: 0 10px;">Support</a>
            </div>
        </div>
    </div>
</body>
</html>`,
  welcome: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to VitaTrack</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <div style="background: #4a90e2; color: white; padding: 30px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">VitaTrack</div>
            <div style="font-size: 14px; opacity: 0.9;">Your Health & Nutrition Companion</div>
        </div>

        <div style="padding: 30px;">
            <div style="font-size: 20px; font-weight: 600; color: #333; margin-bottom: 20px;">Welcome to VitaTrack! 🎉</div>
            
            <div style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 25px;">
                Congratulations on taking the first step towards a healthier lifestyle! We're excited to have you join our community of health-conscious individuals.
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboardLink}}" style="display: inline-block; background: #4a90e2; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: 600; font-size: 16px;">Start Your Health Journey</a>
            </div>

            <div style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 25px;">
                <strong>Here's what you can do right now:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li><strong>Set Your Goals:</strong> Define your weight, nutrition, and fitness targets</li>
                    <li><strong>Log Your First Meal:</strong> Use our barcode scanner or search our food database</li>
                    <li><strong>Track a Workout:</strong> Connect your fitness devices or manually log exercises</li>
                    <li><strong>Set Water Reminders:</strong> Stay hydrated with custom notifications</li>
                </ul>
            </div>

            <div style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 25px;">
                <strong>🌟 Premium Features Available:</strong><br>
                Unlock AI-powered meal plans, personalized coaching, advanced analytics, and more with our premium subscription.
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="display: inline-block; background: #28a745; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: 600; font-size: 16px;">Start Free Trial</a>
            </div>

            <div style="background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px;">
                <strong>Quick Tip:</strong> Enable notifications to get reminders for meal logging, water intake, and workout schedules. You can customize these in your settings anytime!
            </div>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; font-size: 14px; color: #666;">
            <strong>VitaTrack</strong><br>
            Questions? Reply to this email or visit our help center.
            <div style="margin-top: 10px;">
                <a href="#" style="color: #4a90e2; text-decoration: none; margin: 0 10px;">Help Center</a>
                <a href="#" style="color: #4a90e2; text-decoration: none; margin: 0 10px;">Community</a>
                <a href="#" style="color: #4a90e2; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
            </div>
        </div>
    </div>
</body>
</html>`,
  passwordReset: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your VitaTrack Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <div style="background: #e94e77; color: white; padding: 30px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">VitaTrack</div>
            <div style="font-size: 14px; opacity: 0.9;">Password Reset Request</div>
        </div>
        <div style="padding: 30px;">
            <div style="font-size: 20px; font-weight: 600; color: #333; margin-bottom: 20px;">Reset Your Password</div>
            <div style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 25px;">
                We received a request to reset your VitaTrack account password. Click the button below to set a new password. If you did not request this, you can safely ignore this email.
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{resetLink}}" style="display: inline-block; background: #e94e77; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: 600; font-size: 16px; border: none; cursor: pointer;" target="_blank">Reset Password</a>
            </div>
            <div style="background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px;">
                <strong>Security Notice:</strong> This password reset link will expire in 1 hour for your protection.
            </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; font-size: 14px; color: #666;">
            <strong>VitaTrack</strong><br>
            Need help? Reply to this email or visit our help center.
            <div style="margin-top: 10px;">
                <a href="#" style="color: #4a90e2; text-decoration: none; margin: 0 10px;">Help Center</a>
                <a href="#" style="color: #4a90e2; text-decoration: none; margin: 0 10px;">Community</a>
                <a href="#" style="color: #4a90e2; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
            </div>
        </div>
    </div>
</body>
</html>`
};

/**
 * Send an email with detailed error logging
 */
async function sendEmail(to: string, subject: string, html: string, retries = 3): Promise<boolean> {
  try {
    console.log(`Attempting to send email to: ${to}, Subject: ${subject}`);
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM || 'VitaTrack'} <${process.env.SMTP_USER || 'noreply@nikheelkumbhani.com'}>`,
      to,
      subject,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    console.log('Response:', info.response);
    
    AuditLogger.log('email_sent', { to, subject, messageId: info.messageId });
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    AuditLogger.logError('email_failed', { 
      to, 
      subject, 
      error: error instanceof Error ? error.message : 'Unknown error',
      attempt: 4 - retries
    });
    
    if (retries > 0) {
      console.log(`Retrying email send... (${retries} retries left)`);
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
      return sendEmail(to, subject, html, retries - 1);
    }
    
    return false;
  }
}

/**
 * Send verification email to new user
 */
export async function sendVerificationEmail(email: string, name: string, verificationToken: string): Promise<boolean> {
  try {
    console.log('Preparing verification email for:', email);
    
    // Load template - use dist directory path
    const templatePath = path.join(__dirname, '../../templates/emails/verification.html');
    console.log('Template path:', templatePath);
    
    let template: HandlebarsTemplateDelegate;
    let verificationLink: string;
    
    if (!fs.existsSync(templatePath)) {
      console.log('Template file not found, using default template');
      // Use default template
      template = handlebars.compile(defaultTemplates.verification);
      // Point to backend API for verification
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      verificationLink = `${backendUrl}/api/auth/verify-email?token=${verificationToken}`;
    } else {
      const source = fs.readFileSync(templatePath, 'utf8');
      template = handlebars.compile(source);
      // Point to backend API for verification
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      verificationLink = `${backendUrl}/api/auth/verify-email?token=${verificationToken}`;
    }
    
    console.log('Verification link created with JWT token');
    console.log('Verification link:', verificationLink);
    
    // Compile template with data
    const html = template({
      name: name || email.split('@')[0],
      verificationLink
    });
    
    return await sendEmail(email, 'Verify Your VitaTrack Account', html);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

/**
 * Send welcome email to verified user
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  try {
    console.log('Preparing welcome email for:', email);
    
    // Load template - use dist directory path
    const templatePath = path.join(__dirname, '../../templates/emails/welcome.html');
    
    let template: HandlebarsTemplateDelegate;
    let dashboardLink: string;
    
    if (!fs.existsSync(templatePath)) {
      console.log('Template file not found, using default template');
      // Use default template
      template = handlebars.compile(defaultTemplates.welcome);
      // Point to frontend for dashboard
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      dashboardLink = `${frontendUrl}/dashboard`;
    } else {
      const source = fs.readFileSync(templatePath, 'utf8');
      template = handlebars.compile(source);
      // Point to frontend for dashboard
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      dashboardLink = `${frontendUrl}/dashboard`;
    }
    
    // Compile template with data
    const html = template({
      name: name || email.split('@')[0],
      dashboardLink
    });
    
    return await sendEmail(email, 'Welcome to VitaTrack!', html);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<boolean> {
  try {
    console.log('Preparing password reset email for:', email);
    
    // Load template - use dist directory path
    const templatePath = path.join(__dirname, '../../templates/emails/password-reset.html');
    
    let template: HandlebarsTemplateDelegate;
    let resetLink: string;
    
    if (!fs.existsSync(templatePath)) {
      console.log('Template file not found, using default template');
      // Use default template
      template = handlebars.compile(defaultTemplates.passwordReset);
      // Point to frontend for password reset
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    } else {
      const source = fs.readFileSync(templatePath, 'utf8');
      template = handlebars.compile(source);
      // Point to frontend for password reset
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    }
    
    console.log('Reset link created with JWT token');
    console.log('Reset link:', resetLink);
    
    // Compile template with data
    const html = template({
      name: name || email.split('@')[0],
      resetLink
    });
    
    return await sendEmail(email, 'Reset Your VitaTrack Password', html);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}
