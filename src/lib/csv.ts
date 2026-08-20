import { Category, Transaction, Wallet } from '../types';

export function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  wallets: Wallet[],
  currency: string = 'INR'
): void {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));

  const headers = ['Date', 'Merchant', 'Category', 'Wallet', 'Kind', `Amount (${currency})`, 'Note', 'Source', 'Status'];

  const rows = transactions.map((t) => [
    t.txn_date,
    `"${(t.merchant || '').replace(/"/g, '""')}"`,
    `"${(catMap.get(t.category_id) || 'Uncategorized').replace(/"/g, '""')}"`,
    `"${(walletMap.get(t.wallet_id) || 'Default').replace(/"/g, '""')}"`,
    t.kind,
    t.amount.toFixed(2),
    `"${(t.note || '').replace(/"/g, '""')}"`,
    t.source,
    t.status,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ClearSpend_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
