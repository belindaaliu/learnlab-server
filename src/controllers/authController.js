const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/emailService');
const speakeasy = require('speakeasy'); // Add this

const prisma = new PrismaClient();

const authController = {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  register: async (req, res) => {
    try {
      const {
        email,
        password,
        first_name,
        last_name,
        role = 'student',
      } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }

      // Password strength validation
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
        });
      }

      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create user
      const user = await prisma.users.create({
        data: {
          email: email.toLowerCase(),
          password_hash,
          first_name,
          last_name,
          role,
        },
        select: {
          id: true,
          email: true,
          role: true,
          first_name: true,
          last_name: true,
          created_at: true,
        },
      });

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '60m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration',
        error: error.message,
      });
    }
  },

  /**
   * Login user
   * POST /api/auth/login
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      // Find user with MFA methods
      const user = await prisma.users.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          MultiFactorAuth: {
            where: { is_enabled: true }
          }
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Check if user has MFA enabled
      const hasMfa = user.MultiFactorAuth && user.MultiFactorAuth.length > 0;
      
      if (hasMfa) {
        // Generate temporary token for MFA verification (valid for 10 minutes)
        const tempToken = jwt.sign(
          { 
            userId: user.id, 
            email: user.email,
            mfaRequired: true 
          },
          process.env.JWT_SECRET,
          { expiresIn: '10m' }
        );

        // Store MFA methods in session or temp storage
        const mfaMethods = user.MultiFactorAuth.map(m => ({
          type: m.mfa_type,
          enabled: m.is_enabled
        }));

        return res.status(200).json({
          success: true,
          mfaRequired: true,
          tempToken,
          userId: user.id,
          email: user.email,
          mfaMethods
        });
      }

      // No MFA - proceed with normal login
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      // Remove password from response
      const { password_hash, MultiFactorAuth, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login',
        error: error.message,
      });
    }
  },

  /**
   * Get user's MFA methods (for verification page)
   * POST /api/auth/user-mfa-methods
   */
  getUserMfaMethods: async (req, res) => {
    try {
      const { userId, email } = req.body;

      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          MultiFactorAuth: {
            where: { is_enabled: true }
          }
        }
      });

      if (!user || user.email !== email) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const methods = {
        email: { enabled: false },
        sms: { enabled: false, phone: null },
        authenticator: { enabled: false }
      };

      user.MultiFactorAuth.forEach(method => {
        if (method.mfa_type === 'email') {
          methods.email = { enabled: true };
        } else if (method.mfa_type === 'sms') {
          methods.sms = { enabled: true, phone: method.secret_key };
        } else if (method.mfa_type === 'authenticator') {
          methods.authenticator = { enabled: true };
        }
      });

      res.json({
        success: true,
        data: methods
      });
    } catch (error) {
      console.error('Get MFA methods error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  /**
   * Resend MFA verification code
   * POST /api/auth/resend-mfa-code
   */
  resendMfaCode: async (req, res) => {
    try {
      const { userId, method } = req.body;

      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store code in temporary storage (you can use Redis or a temp table)
      // For now, we'll use a simple in-memory store (not for production)
      if (!global.mfaCodes) global.mfaCodes = {};
      global.mfaCodes[`${userId}_${method}`] = {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      };

      if (method === 'email') {
        await emailService.sendMfaCode(user.email, code);
      } else if (method === 'sms') {
        // Get phone from database
        const mfaMethod = await prisma.multiFactorAuth.findFirst({
          where: {
            user_id: userId,
            mfa_type: 'sms'
          }
        });
        
        if (mfaMethod?.secret_key) {
          // Implement SMS sending here
          console.log(`SMS code for ${mfaMethod.secret_key}: ${code}`);
        }
      }

      res.json({
        success: true,
        message: 'Verification code sent'
      });
    } catch (error) {
      console.error('Resend MFA code error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification code'
      });
    }
  },

  /**
   * Verify MFA code and complete login
   * POST /api/auth/verify-mfa
   */
  verifyMfa: async (req, res) => {
    try {
      const { userId, code, method, tempToken } = req.body;

      // Verify temp token
      try {
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        if (!decoded.mfaRequired || decoded.userId !== userId) {
          return res.status(401).json({
            success: false,
            message: 'Invalid verification session'
          });
        }
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again.'
        });
      }

      // Get user's MFA settings
      const mfaMethod = await prisma.multiFactorAuth.findFirst({
        where: {
          user_id: userId,
          mfa_type: method,
          is_enabled: true
        }
      });

      if (!mfaMethod) {
        return res.status(400).json({
          success: false,
          message: 'Invalid MFA method'
        });
      }

      // Verify code based on method
      let isValid = false;

      if (method === 'authenticator') {
        // Verify TOTP code
        isValid = speakeasy.totp.verify({
          secret: mfaMethod.secret_key,
          encoding: 'base32',
          token: code,
          window: 1
        });
      } else {
        // Verify email/SMS code from temporary storage
        const storedData = global.mfaCodes?.[`${userId}_${method}`];
        if (storedData && storedData.code === code && storedData.expiresAt > Date.now()) {
          isValid = true;
          // Clear used code
          delete global.mfaCodes[`${userId}_${method}`];
        }
      }

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code'
        });
      }

      // Get full user data
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          first_name: true,
          last_name: true,
          photo_url: true,
        }
      });

      // Generate final tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        accessToken,
        refreshToken,
        user
      });
    } catch (error) {
      console.error('MFA verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during MFA verification'
      });
    }
  },

  /**
   * Refresh access token
   * POST /api/auth/refresh-token
   */
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Get user
      const user = await prisma.users.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
        },
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
        });
      }

      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during token refresh',
        error: error.message,
      });
    }
  },

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getCurrentUser: async (req, res) => {
    try {
      // req.user should be set by auth middleware
      const user = await prisma.users.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          role: true,
          first_name: true,
          last_name: true,
          headline: true,
          biography: true,
          photo_url: true,
          field_of_learning: true,
          occupation: true,
          skills: true,
          interests: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  },

  /**
   * Logout user (client-side token removal)
   * POST /api/auth/logout
   */
  logout: async (req, res) => {
    try {
      // In a JWT-based system, logout is primarily handled client-side
      // by removing the tokens from storage
      // If you implement token blacklisting, you would add the token to a blacklist here

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during logout',
        error: error.message,
      });
    }
  },

  /**
   * Change password
   * POST /api/auth/change-password
   */
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long',
        });
      }

      // Get user with password
      const user = await prisma.users.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password_hash
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(newPassword, salt);

      // Update password
      await prisma.users.update({
        where: { id: req.user.userId },
        data: { password_hash },
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during password change',
        error: error.message,
      });
    }
  },

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      const user = await prisma.users.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If an account exists with that email, a password reset link has been sent',
        });
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = jwt.sign(
        { userId: user.id, purpose: 'password-reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // TEMPORARY: Log the reset link for testing
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      console.log('🔗 Password reset link:', resetLink);
      console.log('🎫 Reset token:', resetToken);

      // Send password reset email
      try {
        await emailService.sendPasswordResetEmail(user.email, resetToken);
        
        res.status(200).json({
          success: true,
          message: 'If an account exists with that email, a password reset link has been sent',
          // TEMPORARY: Include token in response for testing
          resetToken, // Remove this in production!
        });
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        
        res.status(200).json({
          success: true,
          message: 'If an account exists with that email, a password reset link has been sent',
          // TEMPORARY: Include token even if email fails
          resetToken, // Remove this in production!
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during password reset request',
        error: error.message,
      });
    }
  },

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required',
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long',
        });
      }

      // Verify reset token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.purpose !== 'password-reset') {
        return res.status(401).json({
          success: false,
          message: 'Invalid reset token',
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(newPassword, salt);

      // Update password
      await prisma.users.update({
        where: { id: decoded.userId },
        data: { password_hash },
      });

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired reset token',
        });
      }

      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during password reset',
        error: error.message,
      });
    }
  },
};

module.exports = authController;