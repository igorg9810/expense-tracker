import nodemailer from 'nodemailer';
import { logger } from '../helpers/Logger';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface ResetPasswordEmailData {
  email: string;
  resetCode: string;
  resetLink?: string;
  userName?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Initialize transporter with configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'test@example.com',
        pass: process.env.SMTP_PASS || 'password',
      },
      // For development/testing purposes - allows self-signed certificates
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Log configuration (without sensitive data)
    logger.info('Email service initialized', {
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || '587',
      secure: process.env.SMTP_SECURE === 'true',
    });
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"ExpenseTracker" <noreply@expensetracker.com>',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      logger.info('Sending email', {
        to: options.to,
        subject: options.subject,
      });

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to: options.to,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        error,
        to: options.to,
        subject: options.subject,
      });
      return false;
    }
  }

  /**
   * Send password reset email with reset code
   */
  async sendPasswordResetEmail(data: ResetPasswordEmailData): Promise<boolean> {
    const { email, resetCode, resetLink, userName } = data;

    const subject = 'Password Reset Request - ExpenseTracker';

    // Create a reset link if not provided
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const finalResetLink = resetLink || `${baseUrl}/reset-password?code=${resetCode}`;

    const text = `
Hello ${userName || ''},

You have requested a password reset for your ExpenseTracker account.

Your password reset code is: ${resetCode}

You can also use this link to reset your password: ${finalResetLink}

This code will expire in 10 minutes for security reasons.

If you did not request this password reset, please ignore this email.

Best regards,
ExpenseTracker Team
    `.trim();

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .reset-code { background: #e9ecef; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hello ${userName || 'there'},</p>
                
                <p>You have requested a password reset for your ExpenseTracker account.</p>
                
                <div class="reset-code">
                    Reset Code: ${resetCode}
                </div>
                
                <p>You can also click the button below to reset your password:</p>
                
                <div style="text-align: center;">
                    <a href="${finalResetLink}" class="button">Reset Password</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important:</strong> This code will expire in 10 minutes for security reasons.
                </div>
                
                <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
                
                <p>Best regards,<br>ExpenseTracker Team</p>
            </div>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', { error });
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
