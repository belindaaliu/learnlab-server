require('dotenv').config();
const emailService = require('../services/emailService');

async function testEmail() {
  try {
    // Verify connection
    const isConnected = await emailService.verifyConnection();
    if (!isConnected) {
      console.error('Email service connection failed');
      return;
    }

    // Send test email
    const result = await emailService.sendPasswordResetEmail(
      'aleksandro.em@gmail.com',
      'test-token-123'
    );
    
    console.log('Test email sent successfully:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testEmail();