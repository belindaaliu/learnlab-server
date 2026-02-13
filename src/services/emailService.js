const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // e.g., smtp.gmail.com
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const emailService = {
  /**
   * Send password reset email
   */
  sendPasswordResetEmail: async (email, resetToken) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"LearnLab Support" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #4CAF50; 
                color: white; 
                text-decoration: none; 
                border-radius: 4px;
                margin: 20px 0;
              }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
              .warning { color: #d32f2f; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset your password for your LearnLab account.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center;">
                  <a href="${resetLink}" class="button">Reset Password</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetLink}</p>
                <p class="warning">
                  <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                </p>
                <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} LearnLab. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hello,
        
        We received a request to reset your password for your LearnLab account.
        
        Click the link below to reset your password:
        ${resetLink}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request a password reset, please ignore this email.
        
        © ${new Date().getFullYear()} LearnLab. All rights reserved.
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  },

  /**
   * Send MFA verification code
   */
  sendMfaCode: async (email, code) => {
    const mailOptions = {
      from: `"LearnLab Security" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Your Two-Factor Authentication Code',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #667eea; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .code-box { 
                background-color: #fff; 
                border: 2px dashed #667eea;
                padding: 20px; 
                text-align: center; 
                font-size: 32px; 
                font-weight: bold;
                letter-spacing: 5px;
                margin: 20px 0;
                border-radius: 8px;
              }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Two-Factor Authentication</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>Your verification code is:</p>
                <div class="code-box">${code}</div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} LearnLab. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Your Two-Factor Authentication Code
        
        Hello,
        
        Your verification code is: ${code}
        
        This code will expire in 10 minutes.
        
        If you didn't request this code, please ignore this email.
        
        © ${new Date().getFullYear()} LearnLab. All rights reserved.
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('MFA email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('MFA email sending error:', error);
      throw error;
    }
  },

  /**
   * Verify email configuration
   */
  verifyConnection: async () => {
    try {
      await transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  },
};

module.exports = emailService;