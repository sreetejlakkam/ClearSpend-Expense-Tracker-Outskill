import {
  Budget,
  Category,
  CategoryRule,
  Profile,
  Transaction,
  Wallet
} from '../types';
import { generateFingerprint } from './parser';

export const DEFAULT_CATEGORIES: Array<Omit<Category, 'user_id'>> = [
  { id: 'cat_food', name: 'Food & Dining', icon: 'Utensils', color: '#F97316', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_groceries', name: 'Groceries', icon: 'ShoppingCart', color: '#10B981', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_transport', name: 'Transport', icon: 'Car', color: '#0284C7', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#EC4899', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_bills', name: 'Bills & Utilities', icon: 'Zap', color: '#F59E0B', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_rent', name: 'Rent', icon: 'Home', color: '#6366F1', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_health', name: 'Health', icon: 'HeartPulse', color: '#EF4444', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_entertainment', name: 'Entertainment', icon: 'Film', color: '#8B5CF6', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_education', name: 'Education', icon: 'GraduationCap', color: '#0D9488', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_other', name: 'Other', icon: 'MoreHorizontal', color: '#64748B', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_salary', name: 'Salary', icon: 'Briefcase', color: '#059669', kind: 'income', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_other_income', name: 'Other Income', icon: 'ArrowDownToLine', color: '#3B82F6', kind: 'income', is_default: true, created_at: new Date().toISOString() },
];

/**
 * Relative date helper for generating demo data anchored to real current date.
 * monthOffset = 0 (current month), 1 (last month), 2 (2 months ago), etc.
 */
export function getDemoDateStr(monthOffset: number, dayOfMonth: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthOffset);
  const maxDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const clampedDay = Math.min(Math.max(dayOfMonth, 1), maxDays);
  d.setDate(clampedDay);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(clampedDay).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getDaysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getInitialDemoState(userId: string = 'demo_user_1') {
  const profile: Profile = {
    id: userId,
    email: 'demo@clearspend.app',
    display_name: 'Aarav Sharma',
    base_currency: 'INR',
    ai_consent: 'none',
    onboarded_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
  };

  const wallets: Wallet[] = [
    { id: 'w_bank', user_id: userId, name: 'Salary Account', type: 'bank', currency: 'INR', opening_balance: 45000, is_archived: false, created_at: new Date().toISOString() },
    { id: 'w_upi', user_id: userId, name: 'Google Pay UPI', type: 'wallet', currency: 'INR', opening_balance: 8500, is_archived: false, created_at: new Date().toISOString() },
    { id: 'w_cash', user_id: userId, name: 'Cash in Pocket', type: 'cash', currency: 'INR', opening_balance: 3200, is_archived: false, created_at: new Date().toISOString() },
    { id: 'w_card', user_id: userId, name: 'Credit Card', type: 'card', currency: 'INR', opening_balance: 0, is_archived: false, created_at: new Date().toISOString() },
  ];

  const categories: Category[] = DEFAULT_CATEGORIES.map((c) => ({
    ...c,
    user_id: userId,
  }));

  const curMonthStart = getDemoDateStr(0, 1);

  const budgets: Budget[] = [
    { id: 'b_food', user_id: userId, category_id: 'cat_food', period: 'monthly', amount: 9000, start_month: curMonthStart, alert_threshold: 80, created_at: new Date().toISOString() },
    { id: 'b_groceries', user_id: userId, category_id: 'cat_groceries', period: 'monthly', amount: 7000, start_month: curMonthStart, alert_threshold: 80, created_at: new Date().toISOString() },
    { id: 'b_transport', user_id: userId, category_id: 'cat_transport', period: 'monthly', amount: 4000, start_month: curMonthStart, alert_threshold: 80, created_at: new Date().toISOString() },
    { id: 'b_shopping', user_id: userId, category_id: 'cat_shopping', period: 'monthly', amount: 6000, start_month: curMonthStart, alert_threshold: 80, created_at: new Date().toISOString() },
    { id: 'b_entertainment', user_id: userId, category_id: 'cat_entertainment', period: 'monthly', amount: 3000, start_month: curMonthStart, alert_threshold: 80, created_at: new Date().toISOString() },
    { id: 'b_bills', user_id: userId, category_id: 'cat_bills', period: 'monthly', amount: 4500, start_month: curMonthStart, alert_threshold: 85, created_at: new Date().toISOString() },
  ];

  const rules: CategoryRule[] = [
    { id: 'r_zomato', user_id: userId, match_text: 'zomato', category_id: 'cat_food', hit_count: 14, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'r_swiggy', user_id: userId, match_text: 'swiggy', category_id: 'cat_food', hit_count: 11, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'r_zepto', user_id: userId, match_text: 'zepto', category_id: 'cat_groceries', hit_count: 9, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'r_uber', user_id: userId, match_text: 'uber', category_id: 'cat_transport', hit_count: 12, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'r_netflix', user_id: userId, match_text: 'netflix', category_id: 'cat_entertainment', hit_count: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  // Dynamic relative multi-month transactions dataset spanning current month and past 4 months
  const rawTxns = [
    // ==========================================
    // 📅 MONTH 0 (Current Active Month)
    // ==========================================
    { amount: 85000, kind: 'income', date: getDemoDateStr(0, 1), merchant: 'Acme Tech Salary', cat: 'cat_salary', wallet: 'w_bank', note: 'Monthly salary credit', src: 'manual' },
    { amount: 12000, kind: 'income', date: getDemoDateStr(0, 10), merchant: 'Upwork Freelance', cat: 'cat_other_income', wallet: 'w_bank', note: 'UI Design consulting payout', src: 'manual' },
    { amount: 22000, kind: 'expense', date: getDemoDateStr(0, 2), merchant: 'Apartment Rent', cat: 'cat_rent', wallet: 'w_bank', note: 'Monthly apartment rent', src: 'manual' },
    { amount: 1179, kind: 'expense', date: getDemoDateStr(0, 5), merchant: 'Broadband Bill', cat: 'cat_bills', wallet: 'w_bank', note: '300 Mbps unlimited wifi plan', src: 'manual' },
    { amount: 1850, kind: 'expense', date: getDemoDateStr(0, 6), merchant: 'Electricity Bill', cat: 'cat_bills', wallet: 'w_upi', note: 'Electricity bill payment', src: 'manual' },
    { amount: 380, kind: 'expense', date: getDaysAgoStr(1), merchant: 'Zomato Lunch Bowl', cat: 'cat_food', wallet: 'w_upi', note: '380 zomato lunch', src: 'nl', conf: 0.95 },
    { amount: 450, kind: 'expense', date: getDaysAgoStr(3), merchant: 'Swiggy Biryani Bowl', cat: 'cat_food', wallet: 'w_upi', note: 'Dinner with colleagues', src: 'nl', conf: 0.95 },
    { amount: 680, kind: 'expense', date: getDaysAgoStr(2), merchant: 'Zomato Dinner Feast', cat: 'cat_food', wallet: 'w_upi', note: 'Zomato dinner feast', src: 'nl', conf: 0.95 },
    { amount: 180, kind: 'expense', date: getDaysAgoStr(4), merchant: 'Chai Point Kadak Chai & Bun', cat: 'cat_food', wallet: 'w_upi', note: 'Evening tea snack', src: 'manual' },
    { amount: 320, kind: 'expense', date: getDaysAgoStr(6), merchant: 'McDonalds Burger Combo', cat: 'cat_food', wallet: 'w_card', note: 'Quick lunch bite', src: 'nl', conf: 0.9 },
    { amount: 520, kind: 'expense', date: getDaysAgoStr(8), merchant: 'Domino Pizza Mania', cat: 'cat_food', wallet: 'w_upi', note: 'Weekend pizza', src: 'manual' },
    { amount: 240, kind: 'expense', date: getDaysAgoStr(9), merchant: 'Starbucks Cold Brew', cat: 'cat_food', wallet: 'w_card', note: 'Coffee while working', src: 'manual' },
    { amount: 750, kind: 'expense', date: getDaysAgoStr(11), merchant: 'Barbeque Nation Dinner', cat: 'cat_food', wallet: 'w_card', note: 'Team dinner share', src: 'manual' },
    { amount: 480, kind: 'expense', date: getDaysAgoStr(2), merchant: 'Zepto Quick Groceries', cat: 'cat_groceries', wallet: 'w_upi', note: 'Milk, bread & fruits', src: 'nl', conf: 0.95 },
    { amount: 1250, kind: 'expense', date: getDaysAgoStr(5), merchant: 'Blinkit Weekend Essentials', cat: 'cat_groceries', wallet: 'w_upi', note: 'Cooking oil & veggies', src: 'manual' },
    { amount: 890, kind: 'expense', date: getDaysAgoStr(9), merchant: 'Swiggy Instamart Order', cat: 'cat_groceries', wallet: 'w_upi', note: 'Snacks & dairy products', src: 'manual' },
    { amount: 2400, kind: 'expense', date: getDaysAgoStr(14), merchant: 'DMart Monthly Supermarket', cat: 'cat_groceries', wallet: 'w_card', note: 'Monthly groceries bulk shopping', src: 'manual' },
    { amount: 280, kind: 'expense', date: getDaysAgoStr(1), merchant: 'Uber Premier Ride', cat: 'cat_transport', wallet: 'w_upi', note: 'Cab to office', src: 'nl', conf: 0.95 },
    { amount: 190, kind: 'expense', date: getDaysAgoStr(3), merchant: 'Rapido Auto Ride', cat: 'cat_transport', wallet: 'w_upi', note: 'Metro station to home', src: 'manual' },
    { amount: 2100, kind: 'expense', date: getDaysAgoStr(7), merchant: 'Shell Petrol Pump', cat: 'cat_transport', wallet: 'w_card', note: 'Car fuel tank top-up', src: 'manual' },
    { amount: 350, kind: 'expense', date: getDaysAgoStr(12), merchant: 'Fastag Toll Recharge', cat: 'cat_transport', wallet: 'w_upi', note: 'Highway toll wallet', src: 'manual' },
    { amount: 2199, kind: 'expense', date: getDaysAgoStr(4), merchant: 'Amazon Wireless Earbuds', cat: 'cat_shopping', wallet: 'w_card', note: 'Noise cancelling buds', src: 'manual' },
    { amount: 1490, kind: 'expense', date: getDaysAgoStr(10), merchant: 'Myntra Casual Shirts', cat: 'cat_shopping', wallet: 'w_card', note: 'Weekend clothing haul', src: 'manual' },
    { amount: 649, kind: 'expense', date: getDaysAgoStr(5), merchant: 'Netflix Premium Plan', cat: 'cat_entertainment', wallet: 'w_card', note: '4K monthly subscription', src: 'manual' },
    { amount: 119, kind: 'expense', date: getDaysAgoStr(8), merchant: 'Spotify Individual Premium', cat: 'cat_entertainment', wallet: 'w_upi', note: 'Music streaming auto-debit', src: 'manual' },
    { amount: 840, kind: 'expense', date: getDaysAgoStr(12), merchant: 'PVR Cinemas IMAX Movie', cat: 'cat_entertainment', wallet: 'w_card', note: 'Movie tickets with popcorn', src: 'manual' },
    { amount: 1800, kind: 'expense', date: getDaysAgoStr(15), merchant: 'Cult.fit Fitness Membership', cat: 'cat_health', wallet: 'w_card', note: 'Gym monthly pass', src: 'manual' },
    { amount: 360, kind: 'expense', date: getDaysAgoStr(7), merchant: 'Apollo Pharmacy Multivitamins', cat: 'cat_health', wallet: 'w_upi', note: 'Vitamin C & supplements', src: 'manual' },

    // ==========================================
    // 📅 MONTH 1 (1 Month Ago)
    // ==========================================
    { amount: 85000, kind: 'income', date: getDemoDateStr(1, 1), merchant: 'Acme Tech Salary', cat: 'cat_salary', wallet: 'w_bank', note: 'Monthly salary', src: 'manual' },
    { amount: 15000, kind: 'income', date: getDemoDateStr(1, 15), merchant: 'Upwork Freelance Consulting', cat: 'cat_other_income', wallet: 'w_bank', note: 'Mobile app architecture payout', src: 'manual' },
    { amount: 22000, kind: 'expense', date: getDemoDateStr(1, 2), merchant: 'Apartment Rent', cat: 'cat_rent', wallet: 'w_bank', note: 'Flat rent', src: 'manual' },
    { amount: 1179, kind: 'expense', date: getDemoDateStr(1, 5), merchant: 'Broadband Bill', cat: 'cat_bills', wallet: 'w_bank', note: 'High speed wifi bill', src: 'manual' },
    { amount: 1920, kind: 'expense', date: getDemoDateStr(1, 7), merchant: 'Electricity Bill', cat: 'cat_bills', wallet: 'w_upi', note: 'Electricity bill', src: 'manual' },
    { amount: 1450, kind: 'expense', date: getDemoDateStr(1, 4), merchant: 'DMart Monthly Supermarket', cat: 'cat_groceries', wallet: 'w_card', note: 'Grocery staples & kitchen items', src: 'manual' },
    { amount: 2100, kind: 'expense', date: getDemoDateStr(1, 14), merchant: 'Blinkit Bulk Groceries', cat: 'cat_groceries', wallet: 'w_upi', note: 'Vegetables & pantry restock', src: 'manual' },
    { amount: 620, kind: 'expense', date: getDemoDateStr(1, 22), merchant: 'Zepto Instant Grocery', cat: 'cat_groceries', wallet: 'w_upi', note: 'Snacks, beverages & milk', src: 'manual' },
    { amount: 1250, kind: 'expense', date: getDemoDateStr(1, 28), merchant: 'Nature Basket Gourmet', cat: 'cat_groceries', wallet: 'w_card', note: 'Cheese & gourmet pasta', src: 'manual' },
    { amount: 550, kind: 'expense', date: getDemoDateStr(1, 3), merchant: 'Zomato Lunch Bowl', cat: 'cat_food', wallet: 'w_upi', note: 'Lunch bowl at desk', src: 'manual' },
    { amount: 890, kind: 'expense', date: getDemoDateStr(1, 11), merchant: 'Swiggy Dinner Feast', cat: 'cat_food', wallet: 'w_upi', note: 'Chinese dinner', src: 'manual' },
    { amount: 1400, kind: 'expense', date: getDemoDateStr(1, 18), merchant: 'Toit Brewpub Social', cat: 'cat_food', wallet: 'w_card', note: 'Saturday team catchup', src: 'manual' },
    { amount: 420, kind: 'expense', date: getDemoDateStr(1, 25), merchant: 'Third Wave Coffee', cat: 'cat_food', wallet: 'w_card', note: 'Cold brew & bagel', src: 'manual' },
    { amount: 650, kind: 'expense', date: getDemoDateStr(1, 29), merchant: 'Zomato Biryani Night', cat: 'cat_food', wallet: 'w_upi', note: 'Late night biryani', src: 'manual' },
    { amount: 2200, kind: 'expense', date: getDemoDateStr(1, 8), merchant: 'Shell Petrol Pump', cat: 'cat_transport', wallet: 'w_card', note: 'Full tank fuel', src: 'manual' },
    { amount: 320, kind: 'expense', date: getDemoDateStr(1, 16), merchant: 'Uber Auto Ride', cat: 'cat_transport', wallet: 'w_upi', note: 'Office commute', src: 'manual' },
    { amount: 480, kind: 'expense', date: getDemoDateStr(1, 24), merchant: 'Uber Premier Ride', cat: 'cat_transport', wallet: 'w_upi', note: 'Client visit ride', src: 'manual' },
    { amount: 3499, kind: 'expense', date: getDemoDateStr(1, 12), merchant: 'Amazon Sale Electronics', cat: 'cat_shopping', wallet: 'w_card', note: 'Ergonomic mouse & desk mat', src: 'manual' },
    { amount: 1890, kind: 'expense', date: getDemoDateStr(1, 21), merchant: 'Zara Cotton Polo', cat: 'cat_shopping', wallet: 'w_card', note: 'Formal office wear', src: 'manual' },
    { amount: 649, kind: 'expense', date: getDemoDateStr(1, 15), merchant: 'Netflix Premium Plan', cat: 'cat_entertainment', wallet: 'w_card', note: 'Monthly streaming bill', src: 'manual' },
    { amount: 119, kind: 'expense', date: getDemoDateStr(1, 8), merchant: 'Spotify Individual Premium', cat: 'cat_entertainment', wallet: 'w_upi', note: 'Music streaming subscription', src: 'manual' },
    { amount: 950, kind: 'expense', date: getDemoDateStr(1, 19), merchant: 'PVR Inox Movie Tickets', cat: 'cat_entertainment', wallet: 'w_card', note: 'Weekend cinema outing', src: 'manual' },
    { amount: 1800, kind: 'expense', date: getDemoDateStr(1, 3), merchant: 'Cult.fit Fitness Membership', cat: 'cat_health', wallet: 'w_card', note: 'Gym pass', src: 'manual' },
    { amount: 420, kind: 'expense', date: getDemoDateStr(1, 23), merchant: 'Apollo Pharmacy Health Supplements', cat: 'cat_health', wallet: 'w_upi', note: 'Electrolytes & protein bar', src: 'manual' },

    // ==========================================
    // 📅 MONTH 2 (2 Months Ago)
    // ==========================================
    { amount: 85000, kind: 'income', date: getDemoDateStr(2, 1), merchant: 'Acme Tech Salary', cat: 'cat_salary', wallet: 'w_bank', note: 'Monthly salary', src: 'manual' },
    { amount: 10000, kind: 'income', date: getDemoDateStr(2, 18), merchant: 'Design Project Dividend', cat: 'cat_other_income', wallet: 'w_bank', note: 'Consulting bonus', src: 'manual' },
    { amount: 22000, kind: 'expense', date: getDemoDateStr(2, 2), merchant: 'Apartment Rent', cat: 'cat_rent', wallet: 'w_bank', note: 'Flat rent', src: 'manual' },
    { amount: 1179, kind: 'expense', date: getDemoDateStr(2, 5), merchant: 'Broadband Bill', cat: 'cat_bills', wallet: 'w_bank', note: 'Wifi broadband bill', src: 'manual' },
    { amount: 2150, kind: 'expense', date: getDemoDateStr(2, 8), merchant: 'Electricity Bill', cat: 'cat_bills', wallet: 'w_upi', note: 'Summer AC power bill', src: 'manual' },
    { amount: 3200, kind: 'expense', date: getDemoDateStr(2, 4), merchant: 'DMart Supermarket Monthly', cat: 'cat_groceries', wallet: 'w_card', note: 'Provisions and groceries', src: 'manual' },
    { amount: 980, kind: 'expense', date: getDemoDateStr(2, 12), merchant: 'Blinkit Instant Mart', cat: 'cat_groceries', wallet: 'w_upi', note: 'Eggs, oats, fruits', src: 'manual' },
    { amount: 760, kind: 'expense', date: getDemoDateStr(2, 20), merchant: 'Zepto Quick Groceries', cat: 'cat_groceries', wallet: 'w_upi', note: 'Dry snacks and milk', src: 'manual' },
    { amount: 480, kind: 'expense', date: getDemoDateStr(2, 3), merchant: 'Swiggy Rice Bowl', cat: 'cat_food', wallet: 'w_upi', note: 'Office lunch', src: 'manual' },
    { amount: 920, kind: 'expense', date: getDemoDateStr(2, 10), merchant: 'Zomato Pizza Feast', cat: 'cat_food', wallet: 'w_upi', note: 'Friends dinner', src: 'manual' },
    { amount: 1650, kind: 'expense', date: getDemoDateStr(2, 17), merchant: 'Mainland China Dinner', cat: 'cat_food', wallet: 'w_card', note: 'Family anniversary dinner', src: 'manual' },
    { amount: 350, kind: 'expense', date: getDemoDateStr(2, 23), merchant: 'Blue Tokai Coffee Roasters', cat: 'cat_food', wallet: 'w_card', note: 'Iced latte', src: 'manual' },
    { amount: 590, kind: 'expense', date: getDemoDateStr(2, 28), merchant: 'Swiggy Biryani Bowl', cat: 'cat_food', wallet: 'w_upi', note: 'Weekend meal', src: 'manual' },
    { amount: 2050, kind: 'expense', date: getDemoDateStr(2, 7), merchant: 'Shell Petrol Pump', cat: 'cat_transport', wallet: 'w_card', note: 'Car fuel refill', src: 'manual' },
    { amount: 450, kind: 'expense', date: getDemoDateStr(2, 15), merchant: 'Uber Premier Ride', cat: 'cat_transport', wallet: 'w_upi', note: 'Airport pickup ride', src: 'manual' },
    { amount: 220, kind: 'expense', date: getDemoDateStr(2, 22), merchant: 'Rapido Bike Commute', cat: 'cat_transport', wallet: 'w_upi', note: 'Fast travel to hub', src: 'manual' },
    { amount: 2899, kind: 'expense', date: getDemoDateStr(2, 14), merchant: 'Nike Running Shoes', cat: 'cat_shopping', wallet: 'w_card', note: 'Road running shoes', src: 'manual' },
    { amount: 1200, kind: 'expense', date: getDemoDateStr(2, 25), merchant: 'Amazon Books & Stationery', cat: 'cat_shopping', wallet: 'w_card', note: 'Technical architecture books', src: 'manual' },
    { amount: 649, kind: 'expense', date: getDemoDateStr(2, 15), merchant: 'Netflix Premium Plan', cat: 'cat_entertainment', wallet: 'w_card', note: 'Monthly subscription', src: 'manual' },
    { amount: 119, kind: 'expense', date: getDemoDateStr(2, 8), merchant: 'Spotify Individual Premium', cat: 'cat_entertainment', wallet: 'w_upi', note: 'Music auto-debit', src: 'manual' },
    { amount: 750, kind: 'expense', date: getDemoDateStr(2, 21), merchant: 'PVR Cinema Tickets', cat: 'cat_entertainment', wallet: 'w_card', note: 'Sci-fi blockbuster release', src: 'manual' },
    { amount: 1800, kind: 'expense', date: getDemoDateStr(2, 3), merchant: 'Cult.fit Fitness Membership', cat: 'cat_health', wallet: 'w_card', note: 'Gym membership', src: 'manual' },
    { amount: 280, kind: 'expense', date: getDemoDateStr(2, 19), merchant: 'Apollo Pharmacy Health Check', cat: 'cat_health', wallet: 'w_upi', note: 'Pain relief & eye drops', src: 'manual' },

    // ==========================================
    // 📅 MONTH 3 (3 Months Ago)
    // ==========================================
    { amount: 85000, kind: 'income', date: getDemoDateStr(3, 1), merchant: 'Acme Tech Salary', cat: 'cat_salary', wallet: 'w_bank', note: 'Monthly salary credit', src: 'manual' },
    { amount: 18000, kind: 'income', date: getDemoDateStr(3, 12), merchant: 'Frontend Consulting Client', cat: 'cat_other_income', wallet: 'w_bank', note: 'Dashboard design gig milestone', src: 'manual' },
    { amount: 22000, kind: 'expense', date: getDemoDateStr(3, 2), merchant: 'Apartment Rent', cat: 'cat_rent', wallet: 'w_bank', note: 'Flat rent', src: 'manual' },
    { amount: 1179, kind: 'expense', date: getDemoDateStr(3, 5), merchant: 'Broadband Bill', cat: 'cat_bills', wallet: 'w_bank', note: 'Wifi fiber payment', src: 'manual' },
    { amount: 2450, kind: 'expense', date: getDemoDateStr(3, 9), merchant: 'Electricity Bill', cat: 'cat_bills', wallet: 'w_upi', note: 'Electricity bill', src: 'manual' },
    { amount: 2800, kind: 'expense', date: getDemoDateStr(3, 3), merchant: 'DMart Supermarket Bulks', cat: 'cat_groceries', wallet: 'w_card', note: 'Dry ration & cleaning items', src: 'manual' },
    { amount: 1150, kind: 'expense', date: getDemoDateStr(3, 13), merchant: 'Blinkit Fresh Veggies', cat: 'cat_groceries', wallet: 'w_upi', note: 'Weekly fresh vegetables', src: 'manual' },
    { amount: 840, kind: 'expense', date: getDemoDateStr(3, 21), merchant: 'Zepto Instant Delivery', cat: 'cat_groceries', wallet: 'w_upi', note: 'Juices and breakfast cereals', src: 'manual' },
    { amount: 420, kind: 'expense', date: getDemoDateStr(3, 4), merchant: 'Zomato Lunch Special', cat: 'cat_food', wallet: 'w_upi', note: 'South Indian thali lunch', src: 'manual' },
    { amount: 780, kind: 'expense', date: getDemoDateStr(3, 11), merchant: 'Swiggy Pasta & Garlic Bread', cat: 'cat_food', wallet: 'w_upi', note: 'Italian dinner delivery', src: 'manual' },
    { amount: 1850, kind: 'expense', date: getDemoDateStr(3, 18), merchant: 'Windmills Craftworks Dining', cat: 'cat_food', wallet: 'w_card', note: 'Weekend craft food', src: 'manual' },
    { amount: 390, kind: 'expense', date: getDemoDateStr(3, 24), merchant: 'Starbucks Caramel Frappuccino', cat: 'cat_food', wallet: 'w_card', note: 'Summer beverage', src: 'manual' },
    { amount: 620, kind: 'expense', date: getDemoDateStr(3, 29), merchant: 'Zomato Biryani Feast', cat: 'cat_food', wallet: 'w_upi', note: 'Dum biryani', src: 'manual' },
    { amount: 2200, kind: 'expense', date: getDemoDateStr(3, 6), merchant: 'Shell Petrol Pump', cat: 'cat_transport', wallet: 'w_card', note: 'Fuel refill', src: 'manual' },
    { amount: 380, kind: 'expense', date: getDemoDateStr(3, 14), merchant: 'Uber Auto Ride', cat: 'cat_transport', wallet: 'w_upi', note: 'Rainy day commute', src: 'manual' },
    { amount: 510, kind: 'expense', date: getDemoDateStr(3, 23), merchant: 'Uber Premier Ride', cat: 'cat_transport', wallet: 'w_upi', note: 'Evening return cab', src: 'manual' },
    { amount: 4200, kind: 'expense', date: getDemoDateStr(3, 16), merchant: 'IKEA Study Lamp & Organizer', cat: 'cat_shopping', wallet: 'w_card', note: 'Work from home desk setup upgrade', src: 'manual' },
    { amount: 1650, kind: 'expense', date: getDemoDateStr(3, 26), merchant: 'H&M Linen Summer Shirt', cat: 'cat_shopping', wallet: 'w_card', note: 'Summer apparel', src: 'manual' },
    { amount: 649, kind: 'expense', date: getDemoDateStr(3, 15), merchant: 'Netflix Premium Plan', cat: 'cat_entertainment', wallet: 'w_card', note: 'Monthly subscription', src: 'manual' },
    { amount: 119, kind: 'expense', date: getDemoDateStr(3, 8), merchant: 'Spotify Individual Premium', cat: 'cat_entertainment', wallet: 'w_upi', note: 'Music streaming bill', src: 'manual' },
    { amount: 820, kind: 'expense', date: getDemoDateStr(3, 22), merchant: 'PVR Cinemas Ticket & Snack', cat: 'cat_entertainment', wallet: 'w_card', note: 'Weekend cinema', src: 'manual' },
    { amount: 1800, kind: 'expense', date: getDemoDateStr(3, 3), merchant: 'Cult.fit Fitness Membership', cat: 'cat_health', wallet: 'w_card', note: 'Monthly gym subscription', src: 'manual' },
    { amount: 540, kind: 'expense', date: getDemoDateStr(3, 19), merchant: 'Apollo Pharmacy First Aid & Vitamins', cat: 'cat_health', wallet: 'w_upi', note: 'Omega-3 and sunscreen', src: 'manual' },

    // ==========================================
    // 📅 MONTH 4 (4 Months Ago)
    // ==========================================
    { amount: 85000, kind: 'income', date: getDemoDateStr(4, 1), merchant: 'Acme Tech Salary', cat: 'cat_salary', wallet: 'w_bank', note: 'Monthly salary', src: 'manual' },
    { amount: 8000, kind: 'income', date: getDemoDateStr(4, 14), merchant: 'Consulting Advisory', cat: 'cat_other_income', wallet: 'w_bank', note: 'Tech advisory consultation', src: 'manual' },
    { amount: 22000, kind: 'expense', date: getDemoDateStr(4, 2), merchant: 'Apartment Rent', cat: 'cat_rent', wallet: 'w_bank', note: 'Flat rent', src: 'manual' },
    { amount: 1179, kind: 'expense', date: getDemoDateStr(4, 5), merchant: 'Broadband Bill', cat: 'cat_bills', wallet: 'w_bank', note: 'Fiber internet bill', src: 'manual' },
    { amount: 1650, kind: 'expense', date: getDemoDateStr(4, 7), merchant: 'Electricity Bill', cat: 'cat_bills', wallet: 'w_upi', note: 'Electricity bill', src: 'manual' },
    { amount: 3100, kind: 'expense', date: getDemoDateStr(4, 3), merchant: 'DMart Supermarket Monthly', cat: 'cat_groceries', wallet: 'w_card', note: 'Monthly kitchen supplies', src: 'manual' },
    { amount: 950, kind: 'expense', date: getDemoDateStr(4, 11), merchant: 'Blinkit Instant Groceries', cat: 'cat_groceries', wallet: 'w_upi', note: 'Bread, milk, eggs & coffee', src: 'manual' },
    { amount: 680, kind: 'expense', date: getDemoDateStr(4, 19), merchant: 'Zepto Express Delivery', cat: 'cat_groceries', wallet: 'w_upi', note: 'Fresh fruits and salads', src: 'manual' },
    { amount: 490, kind: 'expense', date: getDemoDateStr(4, 4), merchant: 'Swiggy Gourmet Bowl', cat: 'cat_food', wallet: 'w_upi', note: 'Lunch delivery', src: 'manual' },
    { amount: 850, kind: 'expense', date: getDemoDateStr(4, 12), merchant: 'Zomato Pizza Treat', cat: 'cat_food', wallet: 'w_upi', note: 'Gourmet thin-crust pizza', src: 'manual' },
    { amount: 1550, kind: 'expense', date: getDemoDateStr(4, 20), merchant: 'The Black Pearl Dining', cat: 'cat_food', wallet: 'w_card', note: 'Team celebratory buffet', src: 'manual' },
    { amount: 310, kind: 'expense', date: getDemoDateStr(4, 26), merchant: 'Chai Point Ginger Chai & Samosa', cat: 'cat_food', wallet: 'w_upi', note: 'Evening snacks', src: 'manual' },
    { amount: 1950, kind: 'expense', date: getDemoDateStr(4, 6), merchant: 'Shell Petrol Pump', cat: 'cat_transport', wallet: 'w_card', note: 'Petrol refill', src: 'manual' },
    { amount: 290, kind: 'expense', date: getDemoDateStr(4, 15), merchant: 'Uber Auto Ride', cat: 'cat_transport', wallet: 'w_upi', note: 'Ride to co-working space', src: 'manual' },
    { amount: 460, kind: 'expense', date: getDemoDateStr(4, 23), merchant: 'Uber Premier Ride', cat: 'cat_transport', wallet: 'w_upi', note: 'Return cab', src: 'manual' },
    { amount: 2499, kind: 'expense', date: getDemoDateStr(4, 17), merchant: 'Amazon Tech Accessories', cat: 'cat_shopping', wallet: 'w_card', note: 'USB-C hub and fast charging cable', src: 'manual' },
    { amount: 1350, kind: 'expense', date: getDemoDateStr(4, 25), merchant: 'Myntra Casual T-Shirts', cat: 'cat_shopping', wallet: 'w_card', note: 'Casual tees', src: 'manual' },
    { amount: 649, kind: 'expense', date: getDemoDateStr(4, 15), merchant: 'Netflix Premium Plan', cat: 'cat_entertainment', wallet: 'w_card', note: 'Monthly 4K streaming plan', src: 'manual' },
    { amount: 119, kind: 'expense', date: getDemoDateStr(4, 8), merchant: 'Spotify Individual Premium', cat: 'cat_entertainment', wallet: 'w_upi', note: 'Music auto-debit', src: 'manual' },
    { amount: 680, kind: 'expense', date: getDemoDateStr(4, 22), merchant: 'PVR Cinemas Cinema Ticket', cat: 'cat_entertainment', wallet: 'w_card', note: 'Cinema ticket', src: 'manual' },
    { amount: 1800, kind: 'expense', date: getDemoDateStr(4, 3), merchant: 'Cult.fit Fitness Membership', cat: 'cat_health', wallet: 'w_card', note: 'Monthly gym membership', src: 'manual' },
    { amount: 390, kind: 'expense', date: getDemoDateStr(4, 18), merchant: 'Apollo Pharmacy Health & Care', cat: 'cat_health', wallet: 'w_upi', note: 'Health essentials', src: 'manual' },
  ];

  const transactions: Transaction[] = rawTxns.map((t, idx) => {
    const id = `txn_demo_${idx + 1}`;
    const fp = generateFingerprint(t.merchant, t.note, t.amount, t.date, t.wallet);
    return {
      id,
      user_id: userId,
      wallet_id: t.wallet,
      category_id: t.cat,
      amount: t.amount,
      kind: t.kind as 'expense' | 'income',
      txn_date: t.date,
      merchant: t.merchant,
      note: t.note,
      source: (t.src || 'manual') as any,
      ai_confidence: (t as any).conf || 0.92,
      ai_suggested_category_id: t.cat,
      was_corrected: false,
      fingerprint: fp,
      duplicate_of_id: null,
      status: 'active',
      created_at: new Date(t.date).toISOString(),
      updated_at: new Date(t.date).toISOString(),
    };
  });

  // 1. Plant an authentic rapid-tap duplicate for the Review Inbox demo
  const plantedOriginalId = 'txn_demo_planted_orig';
  const plantedDuplicateId = 'txn_demo_planted_dup';
  const recentDateStr = getDaysAgoStr(1);
  const recentTimestamp = new Date(Date.now() - 86400000).toISOString();
  const recentDuplicateTimestamp = new Date(Date.now() - 86400000 + 45000).toISOString(); // 45 seconds later!

  const originalTxn: Transaction = {
    id: plantedOriginalId,
    user_id: userId,
    wallet_id: 'w_upi',
    category_id: 'cat_food',
    amount: 550,
    kind: 'expense',
    txn_date: recentDateStr,
    merchant: 'Zomato Gourmet Lunch',
    note: '550 zomato lunch with team',
    source: 'nl',
    ai_confidence: 0.95,
    ai_suggested_category_id: 'cat_food',
    was_corrected: false,
    fingerprint: generateFingerprint('Zomato Gourmet Lunch', '550 zomato lunch', 550, recentDateStr, 'w_upi'),
    duplicate_of_id: null,
    status: 'active',
    created_at: recentTimestamp,
    updated_at: recentTimestamp,
  };

  const duplicateTxn: Transaction = {
    id: plantedDuplicateId,
    user_id: userId,
    wallet_id: 'w_upi',
    category_id: 'cat_food',
    amount: 550,
    kind: 'expense',
    txn_date: recentDateStr,
    merchant: 'Zomato Gourmet Lunch',
    note: 'Zomato order payment',
    source: 'manual',
    ai_confidence: 0.9,
    ai_suggested_category_id: 'cat_food',
    was_corrected: false,
    fingerprint: generateFingerprint('Zomato Gourmet Lunch', 'Zomato order payment', 550, recentDateStr, 'w_upi'),
    duplicate_of_id: plantedOriginalId,
    status: 'active',
    created_at: recentDuplicateTimestamp,
    updated_at: recentDuplicateTimestamp,
  };

  // 2. Plant an authentic Anomaly (>3x category median)
  const anomalyTxn: Transaction = {
    id: 'txn_demo_anomaly_taj',
    user_id: userId,
    wallet_id: 'w_card',
    category_id: 'cat_food',
    amount: 7800, // Median is ~450
    kind: 'expense',
    txn_date: getDaysAgoStr(4),
    merchant: 'Taj West End Fine Dining',
    note: 'Celebration dinner anniversary',
    source: 'manual',
    ai_confidence: 0.95,
    ai_suggested_category_id: 'cat_food',
    was_corrected: false,
    fingerprint: generateFingerprint('Taj West End Fine Dining', 'Celebration dinner', 7800, getDaysAgoStr(4), 'w_card'),
    duplicate_of_id: null,
    status: 'active',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  };

  transactions.unshift(originalTxn, duplicateTxn, anomalyTxn);

  return {
    profile,
    wallets,
    categories,
    transactions,
    budgets,
    rules,
  };
}
