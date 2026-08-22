import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useStore } from '../../lib/store';
import {
  autoDetectColumnMapping,
  CsvColumnMapping,
  parseCsvRaw,
  processCsvRows,
  ParsedCsvRow
} from '../../lib/csvParser';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const {
    wallets,
    categories,
    transactions,
    addTransaction,
    addToast
  } = useStore();

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping>({
    dateCol: '',
    descriptionCol: '',
    amountCol: '',
  });
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || '');
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importProgress, setImportProgress] = useState(0);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const { headers: parsedHeaders, rows: parsedRawRows } = parseCsvRaw(text);
      if (parsedHeaders.length === 0 || parsedRawRows.length === 0) {
        addToast({
          title: 'Empty or Invalid CSV',
          message: 'Could not detect valid transaction columns in this file.',
          type: 'error',
        });
        return;
      }

      setHeaders(parsedHeaders);
      setRawRows(parsedRawRows);
      const autoMap = autoDetectColumnMapping(parsedHeaders);
      setMapping(autoMap);
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  const handleProceedToPreview = () => {
    const processed = processCsvRows(rawRows, mapping, transactions, selectedWalletId);
    if (processed.length === 0) {
      addToast({
        title: 'No Transactions Parsed',
        message: 'Please check your column mappings for Date and Amount.',
        type: 'warning',
      });
      return;
    }
    setParsedRows(processed);
    setStep('preview');
  };

  const handleExecuteImport = async () => {
    setStep('importing');
    setImportProgress(0);

    const defaultExpCat = categories.find((c) => c.kind === 'expense')?.id || categories[0]?.id || '';
    const defaultIncCat = categories.find((c) => c.kind === 'income')?.id || categories[0]?.id || '';

    const toImport = skipDuplicates
      ? parsedRows.filter((r) => !r.isSuspectedDuplicate)
      : parsedRows;

    const skippedCount = parsedRows.length - toImport.length;
    let importedCount = 0;

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      try {
        await addTransaction({
          amount: row.amount,
          kind: row.kind,
          category_id: row.kind === 'income' ? defaultIncCat : defaultExpCat,
          wallet_id: selectedWalletId,
          txn_date: row.date,
          merchant: row.merchant,
          note: row.merchant,
          source: 'csv',
          was_corrected: false,
          status: 'active',
        });
        importedCount++;
        setImportProgress(Math.round(((i + 1) / toImport.length) * 100));
      } catch (err) {
        console.warn('Row import failed:', err);
      }
    }

    addToast({
      title: 'Import Complete',
      message: `Imported ${importedCount} transactions. Skipped ${skippedCount} duplicate(s).`,
      type: 'success',
      duration: 7000,
    });

    onClose();
    // Reset modal state
    setStep('upload');
    setRawRows([]);
    setParsedRows([]);
  };

  const duplicateCount = parsedRows.filter((r) => r.isSuspectedDuplicate).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-dark rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Import Bank Statement CSV
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 'upload' && 'Upload CSV exported from your bank or UPI app'}
                {step === 'mapping' && 'Verify and map statement columns'}
                {step === 'preview' && 'Review parsed transactions and duplicate warnings'}
                {step === 'importing' && 'Importing transactions to ledger…'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: Upload Dropzone */}
          {step === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 rounded-3xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                <Upload className="w-10 h-10 text-brand-600 dark:text-brand-400 mb-3" />
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  Click or drag your bank statement CSV here
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Supports HDFC, SBI, ICICI, Axis, Kotak, GPay, Paytm exports
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                  className="hidden"
                />
              </label>

              {wallets.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Allocate to Wallet / Account
                  </label>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="p-3 bg-brand-50 dark:bg-brand-950/60 rounded-2xl border border-brand-200 dark:border-brand-800 text-xs font-semibold text-brand-800 dark:text-brand-300">
                Auto-detected columns from <strong>{fileName}</strong> ({rawRows.length} rows). Please verify:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date Column <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={mapping.dateCol}
                    onChange={(e) => setMapping({ ...mapping, dateCol: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Description / Merchant <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={mapping.descriptionCol}
                    onChange={(e) => setMapping({ ...mapping, descriptionCol: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Column
                  </label>
                  <select
                    value={mapping.amountCol}
                    onChange={(e) => setMapping({ ...mapping, amountCol: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="">-- None (Using Debit/Credit) --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Debit Column (Optional)
                  </label>
                  <select
                    value={mapping.debitCol || ''}
                    onChange={(e) => setMapping({ ...mapping, debitCol: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="">-- None --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedToPreview}
                  className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                >
                  <span>Preview Parsed Rows</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Duplicate Warning */}
          {step === 'preview' && (
            <div className="space-y-4">
              {duplicateCount > 0 && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      {duplicateCount} probable duplicate(s) detected with your active ledger
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="rounded accent-amber-600"
                    />
                    <span>Skip duplicates</span>
                  </label>
                </div>
              )}

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-right">Amount</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedRows.slice(0, 6).map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {row.date}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                          {row.merchant}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              row.kind === 'income'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {row.kind}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-black text-slate-900 dark:text-white tabular-nums">
                          ₹{row.amount.toLocaleString()}
                        </td>
                        <td className="p-2.5">
                          {row.isSuspectedDuplicate ? (
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                              Duplicate
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                              Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Ready to import{' '}
                  <strong>
                    {skipDuplicates ? parsedRows.length - duplicateCount : parsedRows.length}
                  </strong>{' '}
                  transactions
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('mapping')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Import to Ledger</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Importing Progress */}
          {step === 'importing' && (
            <div className="space-y-4 py-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Importing Transactions… {importProgress}%
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Enqueuing ledger mutations and running duplicate defense…
                </p>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-600 h-full transition-all duration-150"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
