/**
 * Quick test script — simulates the "Place Order" flow for WhatsApp OTP.
 *
 * Usage:  node test-whatsapp.js
 *
 * This calls the same sendOTP() function the order controller uses,
 * targeting 6395905793 (India +91).
 *
 * Check the console logs carefully:
 *   - [WHATSAPP] MOCK MODE     → Your .env tokens are missing/invalid
 *   - [WHATSAPP] OTP sent successfully → Message delivered to Meta
 *   - [WHATSAPP] OTP send failed      → Meta rejected it (check error)
 */

import dotenv from 'dotenv';
dotenv.config();

import { sendOTP } from './services/whatsapp.js';

const TEST_PHONE = '6395905793';

console.log('=== WHATSAPP OTP TEST ===');
console.log('Target phone:', TEST_PHONE);
console.log('WHATSAPP_TOKEN present:', !!process.env.WHATSAPP_TOKEN, '| length:', process.env.WHATSAPP_TOKEN?.length || 0);
console.log('WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID || '(NOT SET)');
console.log('');

try {
  const result = await sendOTP(TEST_PHONE);
  console.log('\n=== RESULT ===');
  console.log(JSON.stringify(result, null, 2));

  if (result.mock) {
    console.log('\n⚠️  MOCK MODE — No real API call was made.');
    console.log('   Check your .env file has valid WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID');
  } else if (result.success) {
    console.log('\n✅ OTP sent! Check WhatsApp on 6395905793');
  } else {
    console.log('\n❌ FAILED. Common causes:');
    console.log('   1. otp_template1 not approved in Meta dashboard');
    console.log('   2. WHATSAPP_TOKEN expired (temporary tokens last 24h)');
    console.log('   3. Phone number not registered on WhatsApp');
    console.log('   4. WHATSAPP_PHONE_NUMBER_ID is wrong');
  }
} catch (err) {
  console.error('\n❌ CRASH:', err.message);
}
