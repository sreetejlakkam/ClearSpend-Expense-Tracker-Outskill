import { describe, it, expect } from 'vitest';
import { queryFinAIChat, generateDeterministicFinAIResponse } from './finai';
import { translations } from './i18n';

describe('FinAI Engine & Multi-Language Budget/Ledger Tests', () => {
  const dummyState = {
    profile: {
      id: 'usr_1',
      display_name: 'Sreetej Lakkam',
      email: 'sreetej@example.com',
      avatar_url: null,
      base_currency: 'INR',
      ai_consent: 'cloud' as const,
      locale: 'en',
      theme: 'system',
      onboarded_at: '2026-08-01T00:00:00Z',
      created_at: '2026-08-01T00:00:00Z',
    },
    wallets: [
      {
        id: 'w_1',
        user_id: 'usr_1',
        name: 'HDFC Salary Account',
        type: 'bank' as const,
        currency: 'INR',
        opening_balance: 75000,
        is_archived: false,
        created_at: '2026-08-01T00:00:00Z',
      },
    ],
    categories: [
      {
        id: 'c_food',
        user_id: 'usr_1',
        name: 'Food & Dining',
        icon: 'Utensils',
        color: '#f97316',
        kind: 'expense' as const,
        is_default: true,
        created_at: '2026-08-01T00:00:00Z',
      },
    ],
    transactions: [
      {
        id: 't_1',
        user_id: 'usr_1',
        wallet_id: 'w_1',
        category_id: 'c_food',
        amount: 380,
        kind: 'expense' as const,
        txn_date: '2026-08-10',
        merchant: 'Zomato',
        note: 'Biryani dinner with friends',
        payment_method: 'upi' as const,
        status: 'active' as const,
        is_recurring: false,
        created_at: '2026-08-10T20:00:00Z',
        updated_at: '2026-08-10T20:00:00Z',
      },
      {
        id: 't_2',
        user_id: 'usr_1',
        wallet_id: 'w_1',
        category_id: 'c_food',
        amount: 450,
        kind: 'expense' as const,
        txn_date: '2026-08-14',
        merchant: 'Zomato',
        note: 'Burger and drink',
        payment_method: 'upi' as const,
        status: 'active' as const,
        created_at: '2026-08-14T13:00:00Z',
        updated_at: '2026-08-14T13:00:00Z',
      },
    ],
    budgets: [
      {
        id: 'b_1',
        user_id: 'usr_1',
        category_id: 'c_food',
        amount: 8000,
        period: 'monthly' as const,
        created_at: '2026-08-01T00:00:00Z',
      },
    ],
    selectedMonthStr: '2026-08',
  };

  it('performs accurate ledger merchant calculations for Zomato queries', async () => {
    const res = await queryFinAIChat('How much spent on Zomato?', dummyState as any, {
      preferredModel: 'auto',
      language: 'en',
    });

    expect(res.text).toContain('830'); // 380 + 450
    expect(res.text).toContain('Zomato');
  });

  it('generates Telugu and Hindi responses accurately in precision engine', () => {
    const teResp = generateDeterministicFinAIResponse('How much spent on Zomato?', dummyState as any, 'te');
    expect(teResp).toContain('830');
    expect(teResp).toContain('Zomato');

    const hiResp = generateDeterministicFinAIResponse('How much spent on Zomato?', dummyState as any, 'hi');
    expect(hiResp).toContain('830');
    expect(hiResp).toContain('Zomato');
  });

  it('verifies all budget headings exist in English, Telugu, and Hindi translation dictionaries', () => {
    const budgetKeys = [
      'budgets.title',
      'budgets.subtitle',
      'budgets.subtab_envelopes',
      'budgets.subtab_committed',
      'budgets.subtab_subscriptions',
      'budgets.subtab_goals',
      'budgets.subtab_simulator',
      'budgets.remaining_pool',
      'budgets.safe_daily_target',
      'budgets.actual_burn_rate',
      'budgets.days_remaining',
      'budgets.status_over',
      'budgets.status_caution',
      'budgets.status_healthy',
    ];

    for (const key of budgetKeys) {
      expect((translations.en as any)[key]).toBeDefined();
      expect((translations.te as any)[key]).toBeDefined();
      expect((translations.hi as any)[key]).toBeDefined();
    }
  });

  it('verifies all ledger headings & filters exist in English, Telugu, and Hindi dictionaries', () => {
    const ledgerKeys = [
      'nav.ledger',
      'ledger.search_placeholder',
      'ledger.all_months',
      'ledger.all_categories',
      'ledger.all_wallets',
      'ledger.all_types',
      'ledger.expenses_only',
      'ledger.income_only',
      'ledger.import_csv',
      'ledger.export_csv',
      'ledger.transactions_recorded',
    ];

    for (const key of ledgerKeys) {
      expect((translations.en as any)[key]).toBeDefined();
      expect((translations.te as any)[key]).toBeDefined();
      expect((translations.hi as any)[key]).toBeDefined();
    }
  });

  it('verifies ClearScore translation keys exist across en, te, and hi', () => {
    const clearScoreKeys = [
      'clearscore.title',
      'clearscore.subtitle',
      'clearscore.emergency_runway',
      'clearscore.savings_velocity',
      'clearscore.burn_adherence',
      'clearscore.fixed_commitments',
      'clearscore.envelope_health',
      'clearscore.prescriptions_title',
      'clearscore.stress_test_title',
    ];

    for (const key of clearScoreKeys) {
      expect((translations.en as any)[key]).toBeDefined();
      expect((translations.te as any)[key]).toBeDefined();
      expect((translations.hi as any)[key]).toBeDefined();
    }
  });
});
