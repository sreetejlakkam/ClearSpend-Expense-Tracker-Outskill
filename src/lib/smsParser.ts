// Indian Bank SMS Parser Engine
// Extracts amount, kind (debit/credit), merchant, bank, account suffix, and date

export interface ParsedSMS {
  isTransaction: boolean;
  amount?: number;
  kind?: 'expense' | 'income';
  merchant?: string;
  account_suffix?: string;
  bank_name?: string;
  txn_date?: string;
  raw: string;
}

// Common non-transaction SMS filters (OTP, balance query, promotional, spam)
const NON_TRANSACTION_PATTERNS = [
  /\botp\b/i,
  /\bverification code\b/i,
  /\bone time password\b/i,
  /\bdo not share\b/i,
  /\bsecret code\b/i,
  /\blogin pin\b/i,
  /\bpre-approved\b/i,
  /\bloan offer\b/i,
  /\blimited period offer\b/i,
  /\bavail now\b/i,
  /\bbalance enq\b/i,
  /\bavail bal\b/i,
  /\bcleared bal\b/i,
  /\bmissed call\b/i,
];

// Bank identifier patterns
const BANK_MAP: Record<string, RegExp> = {
  'HDFC Bank': /\b(hdfc|hdfcbk)\b/i,
  'SBI': /\b(sbi|sbin|state bank)\b/i,
  'ICICI Bank': /\b(icici|icicib)\b/i,
  'Axis Bank': /\b(axis|axisbk)\b/i,
  'Kotak Mahindra Bank': /\b(kotak|ktkbnk)\b/i,
  'IndusInd Bank': /\b(indusind|indus)\b/i,
  'Yes Bank': /\b(yes bank|yesbnk)\b/i,
  'IDFC First Bank': /\b(idfc|idfcfirst)\b/i,
  'Punjab National Bank': /\b(pnb|punjab national)\b/i,
  'Bank of Baroda': /\b(bob|baroda)\b/i,
  'Canara Bank': /\b(canara|canbnk)\b/i,
  'Union Bank': /\b(union bank|uboi)\b/i,
  'PhonePe': /\b(phonepe)\b/i,
  'Google Pay': /\b(gpay|google pay)\b/i,
  'Paytm': /\b(paytm)\b/i,
  'CRED': /\b(cred)\b/i,
  'Amazon Pay': /\b(amazon pay|amazonpay)\b/i,
  'Slice': /\b(slice)\b/i,
  'Jupiter': /\b(jupiter)\b/i,
  'Fi Money': /\b(fi money|federal bank)\b/i,
};

// Date normalization helper
export function normalizeSmsDate(dateStr: string): string {
  try {
    const today = new Date();
    const clean = dateStr.trim();

    // 15-08-2026 or 15/08/2026 or 15.08.2026 (DD-MM-YYYY)
    const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (dmyMatch) {
      let day = parseInt(dmyMatch[1], 10);
      let month = parseInt(dmyMatch[2], 10);
      let year = parseInt(dmyMatch[3], 10);
      if (year < 100) year += 2000;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // 15-Aug-2026 or 15-Aug-26 or 15 Aug 2026
    const monMatch = clean.match(/^(\d{1,2})[-/\s]([A-Za-z]{3})[-/\s]?(\d{2,4})?$/i);
    if (monMatch) {
      const day = parseInt(monMatch[1], 10);
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthIdx = months.indexOf(monMatch[2].toLowerCase());
      if (monthIdx >= 0) {
        let year = monMatch[3] ? parseInt(monMatch[3], 10) : today.getFullYear();
        if (year < 100) year += 2000;
        return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    // Fallback: Try native Date parse
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {}

  return new Date().toISOString().split('T')[0];
}

// Clean merchant name extracted from SMS
function sanitizeMerchant(str: string): string {
  return str
    .replace(/^(?:at|to|info[*]|vpa|upi\s+ref|ref\s+no|towards|for)\s+/i, '')
    .replace(/\b(?:avl|bal|clear|limit|ac|a\/c|ending|xx\d+|\.|\/|upi:?|ref:?).*$/i, '')
    .replace(/[*#_]+/g, ' ')
    .trim()
    .slice(0, 32);
}

export function parseBankSMS(text: string): ParsedSMS {
  const trimmed = text.trim();
  if (!trimmed) {
    return { isTransaction: false, raw: text };
  }

  // 1. Check non-transaction patterns
  for (const pattern of NON_TRANSACTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { isTransaction: false, raw: trimmed };
    }
  }

  // 2. Debit vs Credit Keywords
  const isDebit = /\b(debited|spent|paid|withdrawn|sent|deducted|charge|purchased)\b/i.test(trimmed);
  const isCredit = /\b(credited|received|refund|deposited|added to|cashback)\b/i.test(trimmed);

  if (!isDebit && !isCredit) {
    return { isTransaction: false, raw: trimmed };
  }

  const kind: 'expense' | 'income' = isCredit && !isDebit ? 'income' : 'expense';

  // 3. Extract Amount
  // Matches: Rs. 1,250.00 | INR 500 | Rs 45.50 | ₹ 1,500
  const amountRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
  const amtMatch = trimmed.match(amountRegex);
  let amount = 0;

  if (amtMatch && amtMatch[1]) {
    amount = parseFloat(amtMatch[1].replace(/,/g, ''));
  } else {
    // Fallback: standalone number preceded by "for" or "amount of"
    const fallbackMatch = trimmed.match(/(?:for|amount of)\s+([\d,]+(?:\.\d{1,2})?)/i);
    if (fallbackMatch && fallbackMatch[1]) {
      amount = parseFloat(fallbackMatch[1].replace(/,/g, ''));
    }
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return { isTransaction: false, raw: trimmed };
  }

  // 4. Detect Bank Name
  let detectedBank: string | undefined;
  for (const [bank, regex] of Object.entries(BANK_MAP)) {
    if (regex.test(trimmed)) {
      detectedBank = bank;
      break;
    }
  }

  // 5. Detect Account / Card Suffix (e.g. A/c XX1234, card ending 4321)
  let accountSuffix: string | undefined;
  const suffixMatch = trimmed.match(/(?:a\/c|acct|acc|card|vpa|ending|xx)\s*(?:no\.?)?\s*[*xX]*(\d{3,4})\b/i);
  if (suffixMatch && suffixMatch[1]) {
    accountSuffix = suffixMatch[1];
  }

  // 6. Extract Merchant
  let merchant: string | undefined;
  // Patterns like "at Swiggy", "to Zomato", "at SHELL PETROL", "VPA swiggy@icici", "Info*Netflix", "by Info*SALARY"
  const merchantMatch =
    trimmed.match(/(?:at|to|towards|vpa|by\s+info\*|info\*)\s+([A-Za-z0-9\s.&'-]{2,30}?)(?=\s+(?:from|on|ref|avl|bal|upi|using|thru|dated|\.|$))/i) ||
    trimmed.match(/(?:paid to|transferred to)\s+([A-Za-z0-9\s.&'-]{2,30}?)(?=\s+(?:from|on|ref|avl|bal|\.|$))/i);

  if (merchantMatch && merchantMatch[1]) {
    merchant = sanitizeMerchant(merchantMatch[1]);
  }

  if (!merchant || merchant.length < 2) {
    merchant = kind === 'income' ? 'Income Transfer' : detectedBank ? `${detectedBank} Expense` : 'Card/UPI Expense';
  }

  // 7. Extract Date
  let txnDate = new Date().toISOString().split('T')[0];
  const dateMatch =
    trimmed.match(/\bon\s+(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i) ||
    trimmed.match(/\bon\s+(\d{1,2}[-/\s][A-Za-z]{3}[-/\s]?\d{2,4})/i);

  if (dateMatch && dateMatch[1]) {
    txnDate = normalizeSmsDate(dateMatch[1]);
  }

  return {
    isTransaction: true,
    amount,
    kind,
    merchant,
    account_suffix: accountSuffix,
    bank_name: detectedBank,
    txn_date: txnDate,
    raw: trimmed,
  };
}
