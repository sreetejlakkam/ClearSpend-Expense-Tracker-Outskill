# Rule: Timezone-Safe Monthly Date Aggregation Invariants

## Context & Problem
When aggregating or querying financial ledger data by month (e.g., `YYYY-MM`), creating boundary `Date` objects (`new Date('YYYY-MM-01')` or `new Date('YYYY-MM-31')`) is inherently fragile. Browser timezone offsets (such as UTC vs IST +05:30 vs EDT) can cause transactions stamped on the 1st or 30th/31st of a month to shift across monthly boundaries, leading to missing ledger items, mismatched summary cards, and incorrect totals.

## Invariant Rules
1. **Use Exact ISO Substring Matching:** Always match transactions to a monthly window using string prefix comparison:
   ```typescript
   const targetPrefix = targetMonth.slice(0, 7); // e.g. "2026-08"
   const isMatch = (txn: Transaction) => txn.txn_date.startsWith(targetPrefix);
   ```
2. **Never Compare Timestamps for Calendar Months:** Do not use mathematical timestamp comparisons (`new Date(t.txn_date).getTime() >= startTimestamp`) for month-level bucketing unless timezone offsets are explicitly normalized.
3. **Format Consistency:** Ensure all transaction date strings conform strictly to `YYYY-MM-DD` or full ISO 8601 strings starting with `YYYY-MM-DD`.
