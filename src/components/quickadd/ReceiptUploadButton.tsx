import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useStore } from '../../lib/store';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

interface ReceiptUploadButtonProps {
  onReceiptParsed: (result: {
    merchant: string;
    amount: number;
    txn_date: string;
    category_hint?: string;
    note?: string;
  }) => void;
  disabled?: boolean;
}

export const ReceiptUploadButton: React.FC<ReceiptUploadButtonProps> = ({
  onReceiptParsed,
  disabled,
}) => {
  const { profile, updateProfile, addToast } = useStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (file: File) => {
    // 1. Consent Gate Check
    if (profile?.ai_consent !== 'cloud') {
      setPendingFile(file);
      setShowConsentModal(true);
      return;
    }

    await processReceiptImage(file);
  };

  const processReceiptImage = async (file: File) => {
    setIsAnalyzing(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.functions.invoke('parse-receipt', {
          body: {
            imageBase64: base64Data,
            mimeType: file.type || 'image/jpeg',
          },
        });

        if (!error && data && data.amount > 0) {
          onReceiptParsed({
            merchant: data.merchant || 'Receipt Expense',
            amount: Number(data.amount),
            txn_date: data.date || new Date().toISOString().split('T')[0],
            category_hint: data.category_hint,
            note: data.line_items?.map((i: any) => `${i.name} (${i.price})`).join(', ') || 'Scanned Receipt',
          });
          addToast({
            title: 'Receipt Scanned',
            message: `Extracted ${data.merchant || 'Expense'} (${data.amount})`,
            type: 'success',
          });
          return;
        }
      }

      // Fallback: Prompt manual completion
      addToast({
        title: 'Receipt Captured',
        message: 'Fill in the final verified amount.',
        type: 'info',
      });
      onReceiptParsed({
        merchant: file.name.replace(/\.[^/.]+$/, '') || 'Receipt Item',
        amount: 0,
        txn_date: new Date().toISOString().split('T')[0],
        note: 'Scanned Receipt Attachment',
      });
    } catch (err: any) {
      console.warn('Receipt scan failed:', err);
      addToast({
        title: 'Scan Error',
        message: 'Could not read receipt image automatically.',
        type: 'error',
      });
    } finally {
      setIsAnalyzing(false);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGrantConsent = async () => {
    await updateProfile({ ai_consent: 'cloud' });
    setShowConsentModal(false);
    if (pendingFile) {
      processReceiptImage(pendingFile);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelected(file);
        }}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isAnalyzing}
        className="p-2 rounded-xl text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center disabled:opacity-50"
        title="Scan Receipt (Camera / Gallery)"
      >
        {isAnalyzing ? (
          <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </button>

      {/* Cloud OCR Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Receipt OCR Privacy Consent
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              To extract the merchant name, date, and amounts from this receipt image using Gemini Vision AI, the image is securely processed by the AI parser.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConsentModal(false);
                  setPendingFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGrantConsent}
                className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-extrabold shadow-sm transition-all"
              >
                Allow Cloud OCR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
