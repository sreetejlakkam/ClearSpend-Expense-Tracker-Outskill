// Robust Client-Side CSV Statement Parser with Column Detection & Duplicate Scanning
import { Transaction } from '../types';
import { generateFingerprint } from './parser';

export interface CsvColumnMapping {
  dateCol: string;
  descriptionCol: string;
  amountCol: string;
  typeCol?: string; // Optional: 'debit'/'credit' indicator
  debitCol?: string; // Separate debit amount column
  creditCol?: string; // Separate credit amount column
}

export interface ParsedCsvRow {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  kind: 'expense' | 'income';
  rawRow: Record<string, string>;
  isSuspectedDuplicate: boolean;
  duplicateReason?: string;
}

// Auto-detect CSV delimiter (comma, semicolon, tab)
export function detectDelimiter(csvText: string): string {
  const lines = csvText.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return ',';

  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (semiCount > commaCount && semiCount > tabCount) return ';';
  if (tabCount > commaCount && tabCount > semiCount) return '\t';
  return ',';
}

// Parse CSV text into array of object rows
export function parseCsvRaw(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const delimiter = detectDelimiter(csvText);
  const rawLines = csvText.split(/\r\n|\n/).map((l) => l.trim()).filter(Boolean);

  if (rawLines.length === 0) return { headers: [], rows: [] };

  // Find header line (skip bank metadata headers like "Statement of Account", etc.)
  let headerIndex = 0;
  for (let i = 0; i < Math.min(10, rawLines.length); i++) {
    const line = rawLines[i].toLowerCase();
    if (
      line.includes('date') ||
      line.includes('narration') ||
      line.includes('particulars') ||
      line.includes('description') ||
      line.includes('amount') ||
      line.includes('debit') ||
      line.includes('credit')
    ) {
      headerIndex = i;
      break;
    }
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const headers = parseLine(rawLines[headerIndex]);
  const rows: Record<string, string>[] = [];

  for (let i = headerIndex + 1; i < rawLines.length; i++) {
    const cols = parseLine(rawLines[i]);
    if (cols.length >= 2 && cols.some((c) => c.length > 0)) {
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] || '';
      });
      rows.push(rowObj);
    }
  }

  return { headers, rows };
}

// Auto-detect best matching column names
export function autoDetectColumnMapping(headers: string[]): CsvColumnMapping {
  let dateCol = '';
  let descriptionCol = '';
  let amountCol = '';
  let debitCol = '';
  let creditCol = '';
  let typeCol = '';

  for (const h of headers) {
    const lower = h.toLowerCase().trim();

    // Date column
    if (!dateCol && (lower.includes('date') || lower.includes('txn dt') || lower.includes('value dt'))) {
      dateCol = h;
    }

    // Description / Merchant column
    if (
      !descriptionCol &&
      (lower.includes('narration') ||
        lower.includes('particulars') ||
        lower.includes('description') ||
        lower.includes('merchant') ||
        lower.includes('remarks') ||
        lower.includes('details'))
    ) {
      descriptionCol = h;
    }

    // Debit column
    if (!debitCol && (lower === 'debit' || lower.includes('withdrawal') || lower.includes('dr amt') || lower.includes('debit amt'))) {
      debitCol = h;
    }

    // Credit column
    if (!creditCol && (lower === 'credit' || lower.includes('deposit') || lower.includes('cr amt') || lower.includes('credit amt'))) {
      creditCol = h;
    }

    // Single amount column
    if (!amountCol && (lower === 'amount' || lower.includes('txn amt') || lower.includes('total amt'))) {
      amountCol = h;
    }

    // Type / Dr-Cr indicator column
    if (!typeCol && (lower === 'type' || lower.includes('dr/cr') || lower.includes('transaction type'))) {
      typeCol = h;
    }
  }

  // Fallbacks
  if (!dateCol && headers.length > 0) dateCol = headers[0];
  if (!descriptionCol && headers.length > 1) descriptionCol = headers[1];
  if (!amountCol && !debitCol && headers.length > 2) amountCol = headers[2];

  return {
    dateCol,
    descriptionCol,
    amountCol,
    debitCol,
    creditCol,
    typeCol,
  };
}

// Parse date string into YYYY-MM-DD
export function parseDateCell(val: string): string {
  if (!val) return new Date().toISOString().split('T')[0];
  const clean = val.trim();

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmy) {
    let day = parseInt(dmy[1], 10);
    let month = parseInt(dmy[2], 10);
    let year = parseInt(dmy[3], 10);
    if (year < 100) year += 2000;
    // If month > 12, likely MM/DD format
    if (month > 12 && day <= 12) {
      const temp = day;
      day = month;
      month = temp;
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // 15-Aug-2026
  const monMatch = clean.match(/^(\d{1,2})[-/\s]([A-Za-z]{3})[-/\s]?(\d{2,4})/i);
  if (monMatch) {
    const day = parseInt(monMatch[1], 10);
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const mIdx = months.indexOf(monMatch[2].toLowerCase());
    if (mIdx >= 0) {
      let year = monMatch[3] ? parseInt(monMatch[3], 10) : new Date().getFullYear();
      if (year < 100) year += 2000;
      return `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Fallback native parse
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

// Map raw CSV rows into normalized ParsedCsvRows with duplicate checking
export function processCsvRows(
  rawRows: Record<string, string>[],
  mapping: CsvColumnMapping,
  existingTransactions: Transaction[],
  targetWalletId: string
): ParsedCsvRow[] {
  const result: ParsedCsvRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rawDate = row[mapping.dateCol] || '';
    const rawDesc = row[mapping.descriptionCol] || '';

    let amount = 0;
    let kind: 'expense' | 'income' = 'expense';

    // Separate Debit/Credit columns
    if (mapping.debitCol && mapping.creditCol) {
      const debitVal = parseFloat((row[mapping.debitCol] || '0').replace(/[^0-9.-]/g, ''));
      const creditVal = parseFloat((row[mapping.creditCol] || '0').replace(/[^0-9.-]/g, ''));

      if (!isNaN(creditVal) && creditVal > 0) {
        amount = creditVal;
        kind = 'income';
      } else if (!isNaN(debitVal) && debitVal > 0) {
        amount = debitVal;
        kind = 'expense';
      }
    } else if (mapping.amountCol) {
      const amtStr = row[mapping.amountCol] || '0';
      const parsedAmt = parseFloat(amtStr.replace(/[^0-9.-]/g, ''));
      amount = Math.abs(parsedAmt);

      if (parsedAmt < 0 || (mapping.typeCol && /cr|credit|deposit|income/i.test(row[mapping.typeCol] || ''))) {
        kind = 'income';
      } else {
        kind = 'expense';
      }
    }

    if (isNaN(amount) || amount <= 0) continue;

    const txnDate = parseDateCell(rawDate);
    const cleanMerchant = rawDesc
      .replace(/^UPI-[A-Z0-9]+-/i, '')
      .replace(/^POS\s+/i, '')
      .trim()
      .slice(0, 35) || (kind === 'income' ? 'Income' : 'Expense');

    // Duplicate Check against existing ledger
    const fp = generateFingerprint(cleanMerchant, rawDesc, amount, txnDate, targetWalletId);
    let isSuspectedDuplicate = false;
    let duplicateReason: string | undefined;

    for (const ext of existingTransactions) {
      if (ext.status === 'active' && ext.amount === amount && ext.kind === kind) {
        if (ext.fingerprint === fp) {
          isSuspectedDuplicate = true;
          duplicateReason = 'Exact duplicate fingerprint';
          break;
        }
        if (ext.txn_date === txnDate && ext.merchant.toLowerCase() === cleanMerchant.toLowerCase()) {
          isSuspectedDuplicate = true;
          duplicateReason = 'Same date, amount & merchant';
          break;
        }
      }
    }

    result.push({
      id: `csv_row_${i}_${Date.now()}`,
      date: txnDate,
      merchant: cleanMerchant,
      amount,
      kind,
      rawRow: row,
      isSuspectedDuplicate,
      duplicateReason,
    });
  }

  return result;
}
