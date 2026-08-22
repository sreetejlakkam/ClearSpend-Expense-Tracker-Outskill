import { describe, expect, it } from 'vitest';
import { parseBankSMS } from './smsParser';

describe('Indian Bank SMS Parser Suite', () => {
  it('parses HDFC Bank debit SMS correctly', () => {
    const sms = 'Rs 450.00 debited from HDFC Bank A/C **1234 on 15-08-2026 at Swiggy. Avl Bal: Rs 45,230.00';
    const parsed = parseBankSMS(sms);
    expect(parsed.isTransaction).toBe(true);
    expect(parsed.amount).toBe(450);
    expect(parsed.kind).toBe('expense');
    expect(parsed.bank_name).toBe('HDFC Bank');
    expect(parsed.account_suffix).toBe('1234');
    expect(parsed.merchant?.toLowerCase()).toContain('swiggy');
    expect(parsed.txn_date).toBe('2026-08-15');
  });

  it('parses SBI salary credit SMS correctly', () => {
    const sms = 'SBI: Your A/C 9876 has been credited with INR 85,000.00 on 01-Aug-2026 by Info*SALARY-INFOSYS. Total Bal Rs 1,12,000.00';
    const parsed = parseBankSMS(sms);
    expect(parsed.isTransaction).toBe(true);
    expect(parsed.amount).toBe(85000);
    expect(parsed.kind).toBe('income');
    expect(parsed.bank_name).toBe('SBI');
    expect(parsed.account_suffix).toBe('9876');
    expect(parsed.txn_date).toBe('2026-08-01');
  });

  it('parses ICICI Credit Card swipe at petrol pump', () => {
    const sms = 'Spent INR 2,200.00 on ICICI Bank Card ending 5432 at SHELL PETROL PUMP on 18-08-2026. Limit left: Rs 1,45,000.';
    const parsed = parseBankSMS(sms);
    expect(parsed.isTransaction).toBe(true);
    expect(parsed.amount).toBe(2200);
    expect(parsed.kind).toBe('expense');
    expect(parsed.bank_name).toBe('ICICI Bank');
    expect(parsed.account_suffix).toBe('5432');
    expect(parsed.merchant?.toLowerCase()).toContain('shell petrol');
    expect(parsed.txn_date).toBe('2026-08-18');
  });

  it('parses Axis Bank UPI transaction to Zomato', () => {
    const sms = 'Dear UPI user, A/c *8821 debited by Rs. 380.00 on 12-08-2026 to Zomato UPI ref 42398472. Axis Bank.';
    const parsed = parseBankSMS(sms);
    expect(parsed.isTransaction).toBe(true);
    expect(parsed.amount).toBe(380);
    expect(parsed.kind).toBe('expense');
    expect(parsed.bank_name).toBe('Axis Bank');
    expect(parsed.account_suffix).toBe('8821');
    expect(parsed.merchant?.toLowerCase()).toContain('zomato');
    expect(parsed.txn_date).toBe('2026-08-12');
  });

  it('parses Kotak Mahindra Bank debit SMS', () => {
    const sms = 'Kotak Bank: Rs 1,299.00 debited from A/c XX4321 on 10-Aug-26 at Netflix. Avl bal: Rs 24,000.';
    const parsed = parseBankSMS(sms);
    expect(parsed.isTransaction).toBe(true);
    expect(parsed.amount).toBe(1299);
    expect(parsed.kind).toBe('expense');
    expect(parsed.bank_name).toBe('Kotak Mahindra Bank');
    expect(parsed.account_suffix).toBe('4321');
    expect(parsed.merchant?.toLowerCase()).toContain('netflix');
    expect(parsed.txn_date).toBe('2026-08-10');
  });

  it('parses PhonePe UPI payment notification', () => {
    const sms = 'Paid Rs. 150 on PhonePe to Chai Point from HDFC Bank A/c 1234 on 14-08-2026.';
    const parsed = parseBankSMS(sms);
    expect(parsed.isTransaction).toBe(true);
    expect(parsed.amount).toBe(150);
    expect(parsed.kind).toBe('expense');
    expect(parsed.merchant?.toLowerCase()).toContain('chai point');
  });

  it('parses Paytm cashback / refund credit notification', () => {
    const sms = 'Cashback of Rs. 50 credited to your Paytm wallet on 11-08-2026.';
    const parsed = parseBankSMS(sms);
    expect(parsed.isTransaction).toBe(true);
    expect(parsed.amount).toBe(50);
    expect(parsed.kind).toBe('income');
    expect(parsed.bank_name).toBe('Paytm');
  });

  it('rejects OTP and authentication messages cleanly', () => {
    const otp1 = 'Your OTP for HDFC Bank NetBanking login is 482910. Do not share this OTP with anyone.';
    const otp2 = '492019 is your secret verification code for Uber. Valid for 10 minutes.';
    expect(parseBankSMS(otp1).isTransaction).toBe(false);
    expect(parseBankSMS(otp2).isTransaction).toBe(false);
  });

  it('rejects marketing and loan offers cleanly', () => {
    const promo = 'Congratulations! You have a pre-approved personal loan of Rs 5,00,000 at 10.5%. Avail now at bit.ly/bankoffer';
    expect(parseBankSMS(promo).isTransaction).toBe(false);
  });
});
