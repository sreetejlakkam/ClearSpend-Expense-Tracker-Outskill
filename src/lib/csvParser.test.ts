import { describe, it, expect } from 'vitest';
import { detectDelimiter, parseCsvRaw, autoDetectColumnMapping, processCsvRows } from './csvParser';

describe('CSV Bank Statement Importer Suite', () => {
  it('parses standard comma-separated bank statement with debit and credit columns', () => {
    const csvContent = `Date,Description,Debit,Credit,Balance
01/08/2026,SALARY CREDIT ACME CORP,,75000.00,105000.00
03/08/2026,UPI/ZOMATO/ORDER123,450.00,,104550.00
05/08/2026,NATURE BASKET GROCERIES,2400.00,,102150.00`;

    expect(detectDelimiter(csvContent)).toBe(',');

    const { headers, rows } = parseCsvRaw(csvContent);
    expect(headers).toContain('Date');
    expect(headers).toContain('Debit');
    expect(rows.length).toBe(3);

    const mapping = autoDetectColumnMapping(headers);
    expect(mapping.dateCol).toBe('Date');
    expect(mapping.descriptionCol).toBe('Description');
    expect(mapping.debitCol).toBe('Debit');
    expect(mapping.creditCol).toBe('Credit');

    const processed = processCsvRows(rows, mapping, [], 'wallet_1');
    expect(processed.length).toBe(3);

    // Row 1: Salary Income
    expect(processed[0].kind).toBe('income');
    expect(processed[0].amount).toBe(75000);
    expect(processed[0].merchant).toContain('SALARY CREDIT');

    // Row 2: Zomato Expense
    expect(processed[1].kind).toBe('expense');
    expect(processed[1].amount).toBe(450);

    // Row 3: Groceries Expense
    expect(processed[2].kind).toBe('expense');
    expect(processed[2].amount).toBe(2400);
  });

  it('parses semicolon-separated statement with DD-MM-YYYY dates', () => {
    const csvContent = `Txn Date;Narration;Withdrawal;Deposit
15-08-2026;SWIGGY INSTAMART BANGALORE;890;;
18-08-2026;FREELANCE PAYMENT CLIENT;;15000;`;

    expect(detectDelimiter(csvContent)).toBe(';');

    const { headers, rows } = parseCsvRaw(csvContent);
    const mapping = autoDetectColumnMapping(headers);
    const processed = processCsvRows(rows, mapping, [], 'wallet_1');

    expect(processed.length).toBe(2);
    expect(processed[0].amount).toBe(890);
    expect(processed[0].kind).toBe('expense');
    expect(processed[1].amount).toBe(15000);
    expect(processed[1].kind).toBe('income');
  });
});
