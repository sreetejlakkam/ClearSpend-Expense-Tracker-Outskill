# Rule: Resilient LocalStorage Migration & Seed Hydration

## Context & Problem
In frontend-first applications with persistent client state (`localStorage`), adding new entities (such as multi-month seed history, partner demo records, or joint household schemas) can fail to appear in active browser sessions because the initial state initializer discovers existing cached keys and bypasses seed replenishment.

## Invariant Rules
1. **Additive Seed Replenishment:** When initializing state for demo or hybrid modes, perform an additive check for mandatory seed records (e.g., partner transactions or default household rooms) and merge missing records into existing local state without overriding user modifications:
   ```typescript
   const [transactions, setTransactions] = useState<Transaction[]>(() => {
     const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
     if (saved) {
       let parsed: Transaction[] = JSON.parse(saved);
       const partnerTxns = demoData.transactions.filter((t) => t.user_id === 'user_partner');
       const missingTxns = partnerTxns.filter((pt) => !parsed.some((t) => t.id === pt.id));
       if (missingTxns.length > 0) {
         parsed = [...parsed, ...missingTxns];
       }
       return parsed;
     }
     return demoData.transactions;
   });
   ```
2. **Safe Schema Fallbacks:** Provide structural fallbacks (`demoData.demoHousehold?.household || null`) so newly added state keys do not resolve to `null` or `undefined` when loading older cached profiles.
3. **Dedicated Reset / Demo Reload Trigger:** Always provide an explicit 1-tap "Load Demo Data" action in empty or error states so users can recover the full interactive demonstration suite.
