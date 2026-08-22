import { describe, it, expect } from 'vitest';
import {
  buildHouseholdContext,
  answerHouseholdQuestionOffline,
  HouseholdAIContextParams,
} from './familyAI';
import { filterHouseholdLedger } from './household';
import {
  Household,
  HouseholdMember,
  Transaction,
} from '../types';

describe('Family Finance AI Privacy & Context Safety Suite', () => {
  const sampleHousehold: Household = {
    id: 'hh_test_1',
    name: 'Sharma Family',
    base_currency: 'INR',
    created_by: 'user_a',
    plan: 'free',
    created_at: new Date().toISOString(),
  };

  const sampleMembers: HouseholdMember[] = [
    {
      id: 'hm_1',
      household_id: 'hh_test_1',
      user_id: 'user_a',
      role: 'owner',
      status: 'active',
      display_name: 'Rahul',
      share_summary: true,
      share_categories: false,
      joined_at: new Date().toISOString(),
    },
    {
      id: 'hm_2',
      household_id: 'hh_test_1',
      user_id: 'user_b',
      role: 'member',
      status: 'active',
      display_name: 'Priya',
      share_summary: true,
      share_categories: false,
      joined_at: new Date().toISOString(),
    },
  ];

  it('strictly prevents private partner transactions and sentinel strings from leaking into context', () => {
    const sentinelPrivateMerchant = 'SECRET_ANNIVERSARY_DIAMOND_RING_999';
    const sentinelPrivateNote = 'Do not let partner see this surprise!';
    const sentinelAmountOnlyMerchant = 'SECRET_CLINIC_APPOINTMENT_888';

    const testTransactions: Transaction[] = [
      // User A (requester) own transaction
      {
        id: 't1',
        user_id: 'user_a',
        wallet_id: 'w1',
        category_id: 'cat_groceries',
        amount: 2400,
        kind: 'expense',
        merchant: 'Nature Basket',
        txn_date: '2026-08-10',
        status: 'active',
        source: 'manual',
        was_corrected: false,
        household_id: 'hh_test_1',
        visibility: 'shared',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      // User B (partner) PRIVATE transaction (Must NEVER leak to User A)
      {
        id: 't2',
        user_id: 'user_b',
        wallet_id: 'w2',
        category_id: 'cat_gifts',
        amount: 45000,
        kind: 'expense',
        merchant: sentinelPrivateMerchant,
        note: sentinelPrivateNote,
        txn_date: '2026-08-11',
        status: 'active',
        source: 'manual',
        was_corrected: false,
        household_id: 'hh_test_1',
        visibility: 'private',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      // User B (partner) AMOUNT_ONLY transaction (Merchant must be masked to Shared Expense)
      {
        id: 't3',
        user_id: 'user_b',
        wallet_id: 'w2',
        category_id: 'cat_health',
        amount: 1500,
        kind: 'expense',
        merchant: sentinelAmountOnlyMerchant,
        note: 'Personal checkup note',
        txn_date: '2026-08-12',
        status: 'active',
        source: 'manual',
        was_corrected: false,
        household_id: 'hh_test_1',
        visibility: 'amount_only',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Filter ledger as User A
    const filteredLedger = filterHouseholdLedger('hh_test_1', 'user_a', testTransactions);

    // Assert User A sees 2 rows (own row + partner's amount_only row), and 0 private rows
    expect(filteredLedger.length).toBe(2);
    expect(filteredLedger.find((r) => r.id === 't2')).toBeUndefined();

    // Assert amount_only merchant is masked and note is undefined
    const maskedRow = filteredLedger.find((r) => r.id === 't3');
    expect(maskedRow).toBeDefined();
    expect(maskedRow?.merchant).toBe('Shared Expense');
    expect(maskedRow?.note).toBeUndefined();

    const contextParams: HouseholdAIContextParams = {
      household: sampleHousehold,
      members: sampleMembers,
      monthlySummaries: [
        {
          month: '2026-08',
          items: [
            { user_id: 'user_a', display_name: 'Rahul', total_income: 120000, total_expense: 65000, net_savings: 55000, is_estimated: false },
            { user_id: 'user_b', display_name: 'Priya', total_income: 80000, total_expense: 45000, net_savings: 35000, is_estimated: false },
          ],
        },
      ],
      sharedLedger: filteredLedger,
      sharedBudgets: [
        { id: 'hb_1', household_id: 'hh_test_1', name: 'Rent & Utilities', amount: 45000, period: 'monthly', start_month: '2026-08-01', created_by: 'user_a', created_at: '' },
      ],
      sharedGoals: [
        { id: 'hg_1', household_id: 'hh_test_1', name: 'Goa Vacation', target_amount: 100000, saved_amount: 35000, expected_return_pct: 12, is_achieved: false, created_by: 'user_a', created_at: '' },
      ],
      recurringItems: [],
    };

    const builtContext = buildHouseholdContext(contextParams);

    // CRITICAL PRIVACY ASSERTIONS:
    expect(builtContext).not.toContain(sentinelPrivateMerchant);
    expect(builtContext).not.toContain(sentinelPrivateNote);
    expect(builtContext).not.toContain(sentinelAmountOnlyMerchant);
    expect(builtContext).not.toContain('Personal checkup note');
    expect(builtContext).toContain('Nature Basket');
    expect(builtContext).toContain('Shared Expense');
  });

  it('generates rich answers showing arithmetic for the 4 core family questions', () => {
    const contextParams: HouseholdAIContextParams = {
      household: sampleHousehold,
      members: sampleMembers,
      monthlySummaries: [
        {
          month: '2026-08',
          items: [
            { user_id: 'user_a', display_name: 'Rahul', total_income: 110000, total_expense: 60000, net_savings: 50000, is_estimated: false },
            { user_id: 'user_b', display_name: 'Priya', total_income: 70000, total_expense: 40000, net_savings: 30000, is_estimated: false },
          ],
        },
      ],
      sharedLedger: [],
      sharedBudgets: [],
      sharedGoals: [
        { id: 'hg_1', household_id: 'hh_test_1', name: 'House Down Payment', target_amount: 2000000, saved_amount: 200000, expected_return_pct: 12, is_achieved: false, created_by: 'user_a', created_at: '' },
      ],
      recurringItems: [
        { id: 'r1', user_id: 'user_a', merchant: 'Apartment Rent', category_id: '', amount: 35000, frequency: 'monthly', due_day: 5, is_active: true, created_at: '', updated_at: '' },
      ],
    };

    const q1 = answerHouseholdQuestionOffline('How much can we realistically save each month?', contextParams);
    expect(q1).toContain('Realistic Monthly Household Savings Capacity');
    expect(q1).toContain('Combined Monthly Income');

    const q2 = answerHouseholdQuestionOffline('Can we afford a 1L vacation trip?', contextParams);
    expect(q2).toContain('Affordability Analysis');
    expect(q2).toContain('1,00,000');

    const q3 = answerHouseholdQuestionOffline('What if we both invest 10k more in sip?', contextParams);
    expect(q3).toContain('Power of Joint Compounding');
    expect(q3).toContain('10,000');

    const q4 = answerHouseholdQuestionOffline('When can we reach our 20L goal?', contextParams);
    expect(q4).toContain('20,00,000');
    expect(q4).toContain('months');
  });
});
