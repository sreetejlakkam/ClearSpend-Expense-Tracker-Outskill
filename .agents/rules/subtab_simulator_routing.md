# Rule: Deep Subtab Routing for Cross-Feature Simulators & Prescriptions

## Context & Problem
Actionable AI recommendations, overview widgets, and prescription cards often feature direct simulation links (e.g. "Test in Budget Simulator", "Open Wealth Simulator"). When subtab states are kept purely local to child views, top-level tab switching only renders the default sub-view, failing to navigate the user directly into the target simulator.

## Invariant Rules
1. **Lift Active Subtabs to Global Store:** When a subtab represents a distinct interactive mode (such as a What-If Simulator or Compounding Visualizer), lift the active subtab state to the global store (`budgetSubTab: 'envelopes' | 'simulator' | ...`).
2. **Unified Simulator Action Helper:** Expose a centralized `openSimulator` helper from the store to coordinate multi-level navigation atomically:
   ```typescript
   const openSimulator = (type: 'compounding' | 'budget' = 'budget') => {
     if (type === 'compounding') {
       setActiveTab('compounding');
     } else {
       setActiveTab('budgets');
       setBudgetSubTab('simulator');
     }
   };
   ```
3. **Dual Simulation Affordance:** For card-level recommendations, provide both an **in-place playground test** (temporary parameter adjustment) and a **deep link to the full simulator page**.
