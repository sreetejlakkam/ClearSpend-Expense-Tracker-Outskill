import { describe, it, expect } from 'vitest';
import { parseTransactionInput } from './parser';
import { Category, CategoryRule, Wallet } from '../types';

describe('Zero-Fabrication Natural Language Parser Suite', () => {
  const sampleCategories: Category[] = [
    { id: 'cat_groceries', user_id: 'u1', name: 'Groceries', kind: 'expense', icon: 'ShoppingCart', color: '#10B981', is_default: true, created_at: '' },
    { id: 'cat_dining', user_id: 'u1', name: 'Dining', kind: 'expense', icon: 'Utensils', color: '#F59E0B', is_default: true, created_at: '' },
    { id: 'cat_salary', user_id: 'u1', name: 'Salary', kind: 'income', icon: 'Briefcase', color: '#3B82F6', is_default: true, created_at: '' },
  ];

  const sampleWallets: Wallet[] = [
    { id: 'w1', user_id: 'u1', name: 'HDFC Salary', type: 'bank', currency: 'INR', opening_balance: 0, is_archived: false, created_at: '' },
  ];

  const sampleRules: CategoryRule[] = [];

  it('parses clear amount and merchant accurately', async () => {
    const outcome = await parseTransactionInput(
      'Dinner with friends 1250 at Taj',
      sampleCategories,
      sampleWallets,
      sampleRules,
      'INR'
    );

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.amount).toBe(1250);
      expect(outcome.result.kind).toBe('expense');
      expect(outcome.result.merchant.toLowerCase()).toContain('taj');
    }
  });

  it('returns reason no_amount when amount is missing instead of fabricating numbers', async () => {
    const outcome = await parseTransactionInput(
      'Bought groceries at Nature Basket yesterday',
      sampleCategories,
      sampleWallets,
      sampleRules,
      'INR'
    );

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('no_amount');
    }
  });

  it('parses income transactions correctly', async () => {
    const outcome = await parseTransactionInput(
      'Salary received 75000 from Acme Corp',
      sampleCategories,
      sampleWallets,
      sampleRules,
      'INR'
    );

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.amount).toBe(75000);
      expect(outcome.result.kind).toBe('income');
    }
  });
});
