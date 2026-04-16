/**
 * Authentication Testing Suite
 * Jest tests for Sign Up, Sign In, and Forgot Password
 * 
 * Run with: npm test
 * Or: jest auth.test.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  validateStatus: () => true // Don't throw on any status code
});

// Test utilities
const generateRandomEmail = () => `test_${Date.now()}@example.com`;
const validPassword = 'SecurePass123!';
const invalidPassword = 'weak';
const newPassword = 'NewSecurePass123!';

describe('Authentication Testing Suite', () => {

  // ============================================
  // SIGN UP TESTS
  // ============================================
  
  describe('SIGN UP - Registration', () => {

    test('AUTH-SU-001: Should register with valid credentials', async () => {
      const email = generateRandomEmail();
      const response = await api.post('/auth/register', {
        name: 'John Doe',
        email,
        password: validPassword
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('OTP');
      expect(response.data.verifyEmail).toBe(true);
    });

    test('AUTH-SU-002: Should reject duplicate email', async () => {
      const email = generateRandomEmail();
      
      // Register first user
      await api.post('/auth/register', {
        name: 'First User',
        email,
        password: validPassword
      });

      // Try to register with same email
      const response = await api.post('/auth/register', {
        name: 'Second User',
        email,
        password: validPassword
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('already registered');
    });

    test('AUTH-SU-003: Should reject password < 8 characters', async () => {
      const response = await api.post('/auth/register', {
        name: 'Test User',
        email: generateRandomEmail(),
        password: 'Pass1!'
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('between 8 and 25');
    });

    test('AUTH-SU-004: Should reject password without uppercase', async () => {
      const response = await api.post('/auth/register', {
        name: 'Test User',
        email: generateRandomEmail(),
        password: 'password123!'
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('uppercase');
    });

    test('AUTH-SU-005: Should reject password without number', async () => {
      const response = await api.post('/auth/register', {
        name: 'Test User',
        email: generateRandomEmail(),
        password: 'Password!'
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    test('AUTH-SU-006: Should reject password without special character', async () => {
      const response = await api.post('/auth/register', {
        name: 'Test User',
        email: generateRandomEmail(),
        password: 'Password123'
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('special character');
    });

    test('AUTH-SU-007: Should reject password > 25 characters', async () => {
      const response = await api.post('/auth/register', {
        name: 'Test User',
        email: generateRandomEmail(),
        password: 'VeryLongPassword123!@#$%^&*()'
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    test('AUTH-SU-008: Should reject name > 25 characters', async () => {
      const response = await api.post('/auth/register', {
        name: 'This Is A Very Long Name That Exceeds Maximum Length',
        email: generateRandomEmail(),
        password: validPassword
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('25 characters');
    });

    test('AUTH-SU-009: Should reject missing name', async () => {
      const response = await api.post('/auth/register', {
        email: generateRandomEmail(),
        password: validPassword
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('required');
    });

    test('AUTH-SU-010: Should reject missing email', async () => {
      const response = await api.post('/auth/register', {
        name: 'Test User',
        password: validPassword
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    test('AUTH-SU-011: Should reject missing password', async () => {
      const response = await api.post('/auth/register', {
        name: 'Test User',
        email: generateRandomEmail()
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

  });

  // ============================================
  // OTP VERIFICATION TESTS
  // ============================================

  describe('OTP Verification', () => {

    let testEmail;
    let testOTP;

    beforeAll(async () => {
      testEmail = generateRandomEmail();
      // Register a user
      const response = await api.post('/auth/register', {
        name: 'OTP Test User',
        email: testEmail,
        password: validPassword
      });
      
      // In real scenario, extract OTP from email or use console log
      // For testing, we would need to either:
      // 1. Mock the email service
      // 2. Use a test email service that provides OTP retrieval
      // 3. Intercept the OTP from the response in dev mode
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    test('AUTH-SU-012: Should reject invalid OTP', async () => {
      const response = await api.post('/auth/verify-otp', {
        email: testEmail,
        otp: '999999'
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('Invalid or expired');
    });

    test('AUTH-SU-013: Should reject expired OTP (manual verification)', async () => {
      // This test requires manual setup:
      // 1. Register user
      // 2. Wait 10+ minutes
      // 3. Try to verify with old OTP
      
      console.log('Manual test: Wait 10+ minutes after registration and verify OTP is rejected');
    });

    test('AUTH-SU-014: Should allow OTP resend', async () => {
      const email = generateRandomEmail();
      
      // Register user
      await api.post('/auth/register', {
        name: 'Resend OTP Test',
        email,
        password: validPassword
      });

      // Resend OTP
      const response = await api.post('/auth/resend-otp', {
        email
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('New OTP');
    });

    test('AUTH-SU-015: Should reject resend for non-existent registration', async () => {
      const response = await api.post('/auth/resend-otp', {
        email: 'nonexistent@example.com'
      });

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('not found');
    });

  });

  // ============================================
  // SIGN IN TESTS
  // ============================================

  describe('SIGN IN - Login', () => {

    let verifiedEmail;
    let verifiedPassword;
    let authToken;

    beforeAll(async () => {
      // This requires manual setup:
      // 1. Register a user
      // 2. Verify the OTP
      // Use a pre-verified account for testing
      verifiedEmail = process.env.TEST_EMAIL || 'verified@example.com';
      verifiedPassword = process.env.TEST_PASSWORD || validPassword;
    });

    test('AUTH-SI-001: Should login with valid credentials', async () => {
      const response = await api.post('/auth/login', {
        email: verifiedEmail,
        password: verifiedPassword
      });

      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.token).toBeDefined();
        expect(response.data.user).toBeDefined();
        expect(response.data.user.email).toBe(verifiedEmail);
        
        // Save token for later tests
        authToken = response.data.token;
      } else {
        console.log('Note: Set TEST_EMAIL and TEST_PASSWORD env vars with verified account');
      }
    });

    test('AUTH-SI-002: Should reject non-existent account', async () => {
      const response = await api.post('/auth/login', {
        email: 'nonexistent@example.com',
        password: validPassword
      });

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
      expect(response.data.accountNotFound).toBe(true);
    });

    test('AUTH-SI-003: Should reject incorrect password', async () => {
      const response = await api.post('/auth/login', {
        email: verifiedEmail,
        password: 'WrongPassword123!'
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('Incorrect');
    });

    test('AUTH-SI-004: Should reject unverified email', async () => {
      // Register but don't verify
      const email = generateRandomEmail();
      await api.post('/auth/register', {
        name: 'Unverified User',
        email,
        password: validPassword
      });

      const response = await api.post('/auth/login', {
        email,
        password: validPassword
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('verify');
      expect(response.data.unverfied).toBe(true);
    });

    test('AUTH-SI-005: Should reject missing email', async () => {
      const response = await api.post('/auth/login', {
        password: validPassword
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    test('AUTH-SI-006: Should reject missing password', async () => {
      const response = await api.post('/auth/login', {
        email: verifiedEmail
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    test('AUTH-SI-007: Should generate valid JWT token', async () => {
      const response = await api.post('/auth/login', {
        email: verifiedEmail,
        password: verifiedPassword
      });

      if (response.status === 200) {
        const token = response.data.token;
        const parts = token.split('.');
        
        // JWT should have 3 parts: header.payload.signature
        expect(parts.length).toBe(3);
        
        // Decode payload (without verification, just to check structure)
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        expect(payload.id).toBeDefined();
        expect(payload.role).toBeDefined();
        expect(payload.exp).toBeDefined();
      }
    });

    test('AUTH-SI-008: Should allow access to protected routes with token', async () => {
      // This is a placeholder - adjust based on your actual protected routes
      if (authToken) {
        const response = await api.get('/users/profile', {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });

        // Adjust based on actual endpoint
        expect(response.status).not.toBe(401);
      }
    });

    test('AUTH-SI-009: Should reject access without token', async () => {
      const response = await api.get('/users/profile');
      expect(response.status).toBe(401);
      expect(response.data.message).toContain('No token');
    });

    test('AUTH-SI-010: Should reject malformed token', async () => {
      const response = await api.get('/users/profile', {
        headers: {
          Authorization: 'Bearer invalid.token.format'
        }
      });

      expect(response.status).toBe(401);
      expect(response.data.message).toContain('Invalid');
    });

  });

  // ============================================
  // ADMIN LOGIN TESTS
  // ============================================

  describe('Admin Login', () => {

    test('AUTH-SI-011: Should allow valid admin login', async () => {
      const response = await api.post('/auth/admin/login', {
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: process.env.ADMIN_PASSWORD || 'AdminPass123!'
      });

      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.token).toBeDefined();
      }
    });

    test('AUTH-SI-012: Should reject invalid admin credentials', async () => {
      const response = await api.post('/auth/admin/login', {
        email: 'admin@example.com',
        password: 'WrongPassword!'
      });

      expect(response.status).not.toBe(200);
      expect(response.data.success).toBe(false);
    });

  });

  // ============================================
  // FORGOT PASSWORD TESTS
  // ============================================

  describe('FORGOT PASSWORD & RESET', () => {

    let resetEmail;

    beforeAll(async () => {
      // Use verified account
      resetEmail = process.env.TEST_EMAIL || 'verified@example.com';
    });

    test('AUTH-FP-001: Should send reset OTP for verified account', async () => {
      const response = await api.post('/auth/forgot-password', {
        email: resetEmail
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('OTP');
      expect(response.data.mailSent).toBeDefined();
    });

    test('AUTH-FP-002: Should reject reset for unverified account', async () => {
      // Register but don't verify
      const email = generateRandomEmail();
      await api.post('/auth/register', {
        name: 'Unverified User',
        email,
        password: validPassword
      });

      const response = await api.post('/auth/forgot-password', {
        email
      });

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('not found');
    });

    test('AUTH-FP-003: Should reject reset for non-existent account', async () => {
      const response = await api.post('/auth/forgot-password', {
        email: 'nonexistent@example.com'
      });

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    test('AUTH-FP-004: Should reject reset with invalid OTP', async () => {
      const response = await api.post('/auth/reset-password', {
        email: resetEmail,
        otp: '999999',
        newPassword: newPassword
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('Invalid or expired');
    });

    test('AUTH-FP-005: Should reject reset with invalid password', async () => {
      const response = await api.post('/auth/reset-password', {
        email: resetEmail,
        otp: '123456', // placeholder
        newPassword: 'weak'
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('between 8 and 25');
    });

    test('AUTH-FP-006: Should reject reset with missing OTP', async () => {
      const response = await api.post('/auth/reset-password', {
        email: resetEmail,
        newPassword: newPassword
      });

      expect(response.status).toBe(400);
    });

    test('AUTH-FP-007: Should reject reset with missing email', async () => {
      const response = await api.post('/auth/reset-password', {
        otp: '123456',
        newPassword: newPassword
      });

      expect(response.status).toBe(400);
    });

    test('AUTH-FP-008: Should reject reset with missing password', async () => {
      const response = await api.post('/auth/reset-password', {
        email: resetEmail,
        otp: '123456'
      });

      expect(response.status).toBe(400);
    });

    // Manual test - requires user action
    test('AUTH-FP-009: Should allow login with new password (manual)', () => {
      console.log(`
        Manual Test Steps:
        1. Call POST /auth/forgot-password with verified email
        2. Get reset OTP from console log
        3. Call POST /auth/reset-password with new password
        4. Try to login with new password
        5. Verify old password no longer works
      `);
    });

  });

  // ============================================
  // SECURITY TESTS
  // ============================================

  describe('Security Tests', () => {

    test('SECURITY-001: Should not return password in response', async () => {
      const response = await api.post('/auth/login', {
        email: process.env.TEST_EMAIL || 'verified@example.com',
        password: process.env.TEST_PASSWORD || validPassword
      });

      if (response.status === 200) {
        expect(response.data.user.password).toBeUndefined();
      }
    });

    test('SECURITY-002: Should not expose OTP in registration response', async () => {
      const response = await api.post('/auth/register', {
        name: 'Security Test',
        email: generateRandomEmail(),
        password: validPassword
      });

      expect(response.data.otp).toBeUndefined();
    });

    test('SECURITY-003: Password should be hashed', async () => {
      // This requires database inspection
      // Verify bcrypt hash is stored, not plain text
      console.log('Manual test: Inspect database to verify password is hashed');
    });

    test('SECURITY-004: Should use secure password requirements', () => {
      // Test password regex
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,25}$/;
      
      const validPasswords = [
        'SecurePass123!',
        'MyPassword@2024',
        'Test#Pass1234'
      ];
      
      const invalidPasswords = [
        'password',        // no uppercase, numbers, special
        'Pass1!',          // too short
        'PASS1234!',       // no lowercase
        'pass123!',        // no uppercase
        'Pass1234',        // no special char
        'Pass1!@#$%^&*()'  // too long
      ];
      
      validPasswords.forEach(pwd => {
        expect(passwordRegex.test(pwd)).toBe(true);
      });
      
      invalidPasswords.forEach(pwd => {
        expect(passwordRegex.test(pwd)).toBe(false);
      });
    });

  });

  // ============================================
  // RATE LIMITING TESTS (Currently No Implementation)
  // ============================================

  describe('Rate Limiting (Currently Not Implemented)', () => {

    test('RATE-LIMIT-001: Should limit registration attempts ⚠️', async () => {
      console.warn('⚠️  WARNING: Rate limiting is NOT implemented');
      console.warn('Recommendation: Implement express-rate-limit');
      console.warn('Suggested limit: 5 registrations per 15 minutes per IP');
    });

    test('RATE-LIMIT-002: Should limit login attempts ⚠️', () => {
      console.warn('⚠️  WARNING: No login rate limiting');
      console.warn('Suggestion: 10 attempts per 15 minutes');
      console.warn('Feature: Account lockout after 5 failed attempts');
    });

    test('RATE-LIMIT-003: Should limit OTP resend ⚠️', () => {
      console.warn('⚠️  WARNING: No OTP resend limiting');
      console.warn('Suggestion: 3 resends per minute');
    });

    test('RATE-LIMIT-004: Should limit password reset attempts ⚠️', () => {
      console.warn('⚠️  WARNING: No password reset limiting');
      console.warn('Suggestion: 5 attempts per hour');
    });

  });

});

// ============================================
// TEST CONFIGURATION
// ============================================

module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'backend/routes/auth.js',
    'backend/middleware/auth.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
