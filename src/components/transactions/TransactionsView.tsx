import React, { useState, useMemo } from 'react';
import { useStore } from '../../lib/store';
import { exportTransactionsToCSV } from '../../lib/csv';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  Search,
  Download,
  Plus,
  Trash2,
  Tag,
  CheckSquare,
  Square,
  X,
  Sparkles,
  ReceiptText
} from 'lucide-react';
import { Transaction } from '../../types';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    categories,
    wallets,
    profile,
    selectedMonthStr,
    activeCategoryFilter,
    setActiveCategoryFilter,
    setEditingTransaction,
    setIsManualModalOpen,
    bulkRecategorize,
    bulkDeleteTransactions,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWalletFilter, setSelectedWalletFilter] = useState<string>('all');
  const [selectedKindFilter, setSelectedKindFilter] = useState<string>('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(selectedMonthStr);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTxnIds, setSelectedTxnIds] = useState<string[]>([]);
  const [bulkCatModalOpen, setBulkCatModalOpen] = useState(false);
  const [targetBulkCatId, setTargetBulkCatId] = useState<string>(categories[0]?.id || '');

  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.status !== 'active') return false;

      // Month filter
      if (selectedMonthFilter !== 'all' && !t.txn_date.startsWith(selectedMonthFilter)) {
        return false;
      }

      // Category filter
      if (activeCategoryFilter && t.category_id !== activeCategoryFilter) {
        return false;
      }

      // Wallet filter
      if (selectedWalletFilter !== 'all' && t.wallet_id !== selectedWalletFilter) {
        return false;
      }

      // Kind filter
      if (selectedKindFilter !== 'all' && t.kind !== selectedKindFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = categories.find((c) => c.id === t.category_id);
        const matchMerchant = (t.merchant || '').toLowerCase().includes(q);
        const matchNote = (t.note || '').toLowerCase().includes(q);
        const matchCat = (cat?.name || '').toLowerCase().includes(q);
        const matchAmount = t.amount.toString().includes(q);
        if (!matchMerchant && !matchNote && !matchCat && !matchAmount) return false;
      }

      return true;
    });
  }, [transactions, selectedMonthFilter, activeCategoryFilter, selectedWalletFilter, selectedKindFilter, searchQuery, categories]);

  // Group by Date (Sorted Descending)
  const groupedByDay = useMemo(() => {
    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(b.txn_date).getTime() - new Date(a.txn_date).getTime()
    );

    const groups = new Map<string, { date: string; items: Transaction[]; daySpent: number; dayEarned: number }>();

    for (const t of sorted) {
      if (!groups.has(t.txn_date)) {
        groups.set(t.txn_date, { date: t.txn_date, items: [], daySpent: 0, dayEarned: 0 });
      }
      const g = groups.get(t.txn_date)!;
      g.items.push(t);
      if (t.kind === 'expense') g.daySpent += t.amount;
      else g.dayEarned += t.amount;
    }

    return Array.from(groups.values());
  }, [filteredTransactions]);

  // Toggle selection
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTxnIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTxnIds.length === filteredTransactions.length) {
      setSelectedTxnIds([]);
    } else {
      setSelectedTxnIds(filteredTransactions.map((t) => t.id));
    }
  };

  const handleApplyBulkRecategorize = async () => {
    if (selectedTxnIds.length === 0 || !targetBulkCatId) return;
    await bulkRecategorize(selectedTxnIds, targetBulkCatId);
    setBulkCatModalOpen(false);
    setSelectedTxnIds([]);
    setIsMultiSelectMode(false);
  };

  const handleApplyBulkDelete = async () => {
    if (selectedTxnIds.length === 0) return;
    if (confirm(`Delete ${selectedTxnIds.length} selected transactions?`)) {
      await bulkDeleteTransactions(selectedTxnIds);
      setSelectedTxnIds([]);
      setIsMultiSelectMode(false);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 leading-tight">Ledger & History</h2>
          <p className="text-xs text-zinc-500">
            {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'} recorded
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportTransactionsToCSV(transactions, categories, wallets, profile?.base_currency || 'INR')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-zinc-200/80 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs transition-colors"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              setIsMultiSelectMode(!isMultiSelectMode);
              setSelectedTxnIds([]);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isMultiSelectMode
                ? 'bg-brand-50 border-brand-300 text-brand-800'
                : 'bg-white border-zinc-200/80 text-zinc-700 hover:bg-zinc-50 shadow-xs'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Select</span>
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow-sm shadow-brand-700/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Multi-Select Floating Action Bar */}
      {isMultiSelectMode && (
        <div className="p-3 bg-brand-900 text-white rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="text-xs font-bold text-teal-300 hover:text-white flex items-center gap-1"
            >
              {selectedTxnIds.length === filteredTransactions.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-xs text-zinc-300">•</span>
            <span className="text-xs font-semibold text-white">
              {selectedTxnIds.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkCatModalOpen(true)}
              disabled={selectedTxnIds.length === 0}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-bold text-white flex items-center gap-1 transition-colors"
            >
              <Tag className="w-3.5 h-3.5" />
              Recategorize
            </button>

            <button
              onClick={handleApplyBulkDelete}
              disabled={selectedTxnIds.length === 0}
              className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-xs font-bold text-white flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>

            <button
              onClick={() => {
                setIsMultiSelectMode(false);
                setSelectedTxnIds([]);
              }}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar (Search + Dropdowns) */}
      <div className="p-3 bg-white rounded-2xl border border-zinc-200/80 shadow-xs space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchant, category, amount, or note…"
            className="w-full text-xs font-medium text-zinc-900 pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-brand-700 focus:bg-white focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills / Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Month selector */}
          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="w-full text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5 text-zinc-700 focus:outline-hidden"
          >
            <option value="all">All Months</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
          </select>

          {/* Category Filter */}
          <select
            value={activeCategoryFilter || 'all'}
            onChange={(e) => setActiveCategoryFilter(e.target.value === 'all' ? null : e.target.value)}
            className="w-full text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5 text-zinc-700 focus:outline-hidden truncate"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Wallet Filter */}
          <select
            value={selectedWalletFilter}
            onChange={(e) => setSelectedWalletFilter(e.target.value)}
            className="w-full text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5 text-zinc-700 focus:outline-hidden truncate"
          >
            <option value="all">All Wallets</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {/* Kind Filter */}
          <select
            value={selectedKindFilter}
            onChange={(e) => setSelectedKindFilter(e.target.value)}
            className="w-full text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5 text-zinc-700 focus:outline-hidden"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>
        </div>
      </div>

      {/* Active Category Filter Chip */}
      {activeCategoryFilter && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Filtered by:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-100 text-brand-800 text-xs font-bold">
            {categories.find((c) => c.id === activeCategoryFilter)?.name}
            <button onClick={() => setActiveCategoryFilter(null)} className="hover:text-brand-950">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}

      {/* Transactions List Grouped by Day */}
      {groupedByDay.length > 0 ? (
        <div className="space-y-4">
          {groupedByDay.map((group) => {
            const dateObj = new Date(group.date);
            const dateLabel = dateObj.toLocaleDateString('default', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });

            return (
              <div
                key={group.date}
                className="bg-white rounded-3xl border border-zinc-200/80 shadow-card overflow-hidden"
              >
                {/* Day Header */}
                <div className="px-4 py-2.5 bg-zinc-50/90 border-b border-zinc-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-700">{dateLabel}</span>
                  <div className="flex items-center gap-3 tabular-nums font-semibold">
                    {group.daySpent > 0 && (
                      <span className="text-zinc-800">
                        Spent: <span className="font-extrabold">{currSym}{group.daySpent.toLocaleString()}</span>
                      </span>
                    )}
                    {group.dayEarned > 0 && (
                      <span className="text-emerald-700">
                        Income: <span className="font-extrabold">+{currSym}{group.dayEarned.toLocaleString()}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Transactions */}
                <div className="divide-y divide-zinc-100">
                  {group.items.map((t) => {
                    const cat = categories.find((c) => c.id === t.category_id);
                    const wallet = wallets.find((w) => w.id === t.wallet_id);
                    const isExpense = t.kind === 'expense';
                    const isSelected = selectedTxnIds.includes(t.id);

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          if (isMultiSelectMode) {
                            handleToggleSelect(t.id, {} as any);
                          } else {
                            setEditingTransaction(t);
                          }
                        }}
                        className={`p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/90 cursor-pointer transition-colors ${
                          isSelected ? 'bg-brand-50/60' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Selection Checkbox */}
                          {isMultiSelectMode ? (
                            <button
                              onClick={(e) => handleToggleSelect(t.id, e)}
                              className="text-brand-700 shrink-0"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 fill-brand-700 text-white" />
                              ) : (
                                <Square className="w-5 h-5 text-zinc-400" />
                              )}
                            </button>
                          ) : (
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${cat?.color || '#0F766E'}18` }}
                            >
                              <CategoryIcon
                                name={cat?.icon || 'ReceiptText'}
                                color={cat?.color || '#0F766E'}
                                size={19}
                              />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-zinc-900 truncate">
                                {t.merchant || 'Transaction'}
                              </p>
                              {t.source === 'nl' && (
                                <span title="Logged via Natural Language AI Quick-Add">
                                  <Sparkles className="w-3 h-3 text-brand-600 shrink-0" />
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5 flex-wrap">
                              <span className="font-semibold text-zinc-700">{cat?.name || 'Category'}</span>
                              <span>•</span>
                              <span className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 font-medium">
                                {wallet?.name || 'Wallet'}
                              </span>
                              {t.note && t.note !== t.merchant && (
                                <>
                                  <span>•</span>
                                  <span className="text-zinc-400 truncate max-w-[120px]">{t.note}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-black tabular-nums ${
                              isExpense ? 'text-zinc-900' : 'text-emerald-700'
                            }`}
                          >
                            {isExpense ? '−' : '+'}
                            {currSym}{t.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-zinc-200/80 text-center shadow-card">
          <ReceiptText className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-zinc-700">No transactions match your filters</h4>
          <p className="text-xs text-zinc-400 mt-1">Try clearing filters or search terms</p>
        </div>
      )}

      {/* Bulk Recategorize Modal */}
      {bulkCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-modal border border-zinc-200 max-w-sm w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-zinc-900">
              Recategorize {selectedTxnIds.length} Transactions
            </h3>
            <p className="text-xs text-zinc-500">
              Select the new target category for all selected transactions:
            </p>

            <select
              value={targetBulkCatId}
              onChange={(e) => setTargetBulkCatId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-brand-700 focus:outline-hidden"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.kind})
                </option>
              ))}
            </select>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setBulkCatModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBulkRecategorize}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm"
              >
                Apply Recategorization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
