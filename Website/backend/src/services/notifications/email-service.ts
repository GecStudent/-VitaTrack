import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { EmailNotification, NotificationChannel } from './types';
import { AuditLogger } from '../../utils/auditLogger';

/**
 * VitaTrack Email Service
 * 
 * This service handles sending email notifications using nodemailer
 */
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly templateDir: string;
  private readonly defaultTemplates: Record<string, string>;
  
  constructor() {
    // Configure email transport
    this.transporter = nodemailer.createTransport({
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
    
    // Set template directory
    this.templateDir = path.join(__dirname, '../../templates/emails');
    
    // Default templates with inline styles
    this.defaultTemplates = {
      // Basic notification template
      notification: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - VitaTrack</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <div style="background: #4a90e2; color: white; padding: 30px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">VitaTrack</div>
            <div style="font-size: 14px; opacity: 0.9;">Your Health & Nutrition Companion</div>
        </div>

        <div style="padding: 30px;">
            <div style="font-size: 20px; font-weight: 600; color: #333; margin-bottom: 20px;">{{title}}</div>
            
            <div style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 25px;">
                {{message}}
            </div>

            {{#if actionUrl}}
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{actionUrl}}" style="display: inline-block; background: #4a90e2; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: 600; font-size: 16px;">{{actionText}}</a>
            </div>
            {{/if}}

            {{#if additionalInfo}}
            <div style="background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px;">
                {{additionalInfo}}
            </div>
            {{/if}}
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
      
      // Water reminder template
      water_reminder: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hydration Reminder - VitaTrack</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <div style="background: #4a90e2; color: white; padding: 30px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">VitaTrack</div>
            <div style="font-size: 14px; opacity: 0.9;">Hydration Reminder</div>
        </div>

        <div style="padding: 30px;">
            <div style="font-size: 20px; font-weight: 600; color: #333; margin-bottom: 20px;">Time to Hydrate!</div>
            
            <div style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 25px;">
                Hi {{name}},<br><br>
                It's time to drink some water! Staying hydrated is essential for your health and wellbeing.
                {{#if currentIntake}}
                <br><br>
                <strong>Your water intake today:</strong> {{currentIntake}}ml of {{dailyTarget}}ml
                {{#if percentComplete}}
                ({{percentComplete}}% of your daily goal)
                {{/if}}
                {{/if}}
                {{#if suggestedIntake}}
                <br><br>
                <strong>Suggested amount:</strong> {{suggestedIntake}}ml
                {{/if}}
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{trackUrl}}" style="display: inline-block; background: #4a90e2; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: 600; font-size: 16px;">Track Water Intake</a>
            </div>

            <div style="background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px;">
                <strong>Health Tip:</strong> Drinking water helps maintain the balance of body fluids, energizes muscles, keeps skin looking good, and helps your kidneys and bowels function properly.
            </div>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; font-size: 14px; color: #666;">
            <strong>VitaTrack</strong><br>
            Your journey to better health starts here.
            <div style="margin-top: 10px;">
                <a href="{{unsubscribeUrl}}" style="color: #4a90e2; text-decoration: none; margin: 0 10px;">Manage Notifications</a>
                <a href="#" style="color: #4a90e2; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                <a href="#" style="color: #4a90e2; text-decoration: none; margin: 0 10px;">Support</a>
            </div>
        </div>
    </div>
</body>
</html>`,
    };
    
    // Test email configuration on startup
    this.testEmailConfig();
  }
  
  /**
   * Test email configuration
   */
  private async testEmailConfig(): Promise<boolean> {
    try {
      console.log('Testing email configuration...');
      console.log('SMTP_HOST:', process.env.SMTP_HOST || process.env.EMAIL_HOST || 'NOT SET');
      console.log('SMTP_PORT:', process.env.SMTP_PORT || process.env.EMAIL_PORT || 'NOT SET');
      console.log('SMTP_USER:', process.env.SMTP_USER || process.env.EMAIL_USER || 'NOT SET');
      console.log('SMTP_PASS:', (process.env.SMTP_PASS || process.env.EMAIL_PASSWORD) ? 'SET' : 'NOT SET');
      
      await this.transporter.verify();
      console.log('✅ Email configuration is valid');
      return true;
    } catch (error) {
      console.error('❌ Email configuration error:', error);
      return false;
    }
  }
  
  /**
   * Send an email notification
   */
  public async send(notification: EmailNotification): Promise<boolean> {
    try {
      console.log(`Preparing to send email to: ${notification.recipient}, Subject: ${notification.subject}`);
      
      // Prepare email content
      let html = notification.html;
      
      // If no HTML is provided, use template
      if (!html && notification.templateId) {
        html = await this.renderTemplate(notification.templateId, notification.templateData || {});
      }
      
      // If still no HTML, use default template
      if (!html) {
        const template = handlebars.compile(this.defaultTemplates.notification);
        html = template({
          title: notification.title,
          message: notification.message,
          actionUrl: notification.data?.actionUrl,
          actionText: notification.data?.actionText || 'View Details',
          additionalInfo: notification.data?.additionalInfo,
        });
      }
      
      // Configure email options
      const mailOptions = {
        from: `${process.env.EMAIL_FROM || 'VitaTrack'} <${process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@vitatrack.com'}>`,
        to: notification.recipient,
        subject: notification.subject,
        html,
        attachments: notification.attachments,
      };
      
      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      console.log('Response:', info.response);
      
      // Log the email
      AuditLogger.log('email_sent', { 
        to: notification.recipient, 
        subject: notification.subject, 
        messageId: info.messageId,
        notificationId: notification.id,
      });
      
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      AuditLogger.logError('email_failed', { 
        to: notification.recipient, 
        subject: notification.subject, 
        error: error instanceof Error ? error.message : 'Unknown error',
        notificationId: notification.id,
      });
      
      return false;
    }
  }
  
  /**
   * Render an email template with data
   */
  private async renderTemplate(templateId: string, data: Record<string, any>): Promise<string> {
    try {
      // Try to load template from file
      const templatePath = path.join(this.templateDir, `${templateId}.html`);
      let template: HandlebarsTemplateDelegate;
      
      if (fs.existsSync(templatePath)) {
        const source = fs.readFileSync(templatePath, 'utf8');
        template = handlebars.compile(source);
      } else if (this.defaultTemplates[templateId]) {
        // Use default template if file doesn't exist
        template = handlebars.compile(this.defaultTemplates[templateId]);
      } else {
        // Fall back to generic notification template
        template = handlebars.compile(this.defaultTemplates.notification);
      }
      
      // Compile template with data
      return template(data);
    } catch (error) {
      console.error('Error rendering email template:', error);
      // Fall back to default template
      const template = handlebars.compile(this.defaultTemplates.notification);
      return template(data);
    }
  }
}