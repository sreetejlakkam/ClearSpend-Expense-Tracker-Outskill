import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript, disabled }) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            currentInterim += transcript;
          }
        }

        setInterimText(currentInterim || finalTranscript);

        // Reset silence timer on new speech
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, 1800);

        if (finalTranscript.trim()) {
          onTranscript(finalTranscript.trim());
          setInterimText('');
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
        setInterimText('');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition initialization failed:', e);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [onTranscript]);

  const toggleListen = () => {
    if (!isSupported || disabled) return;

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      if (interimText.trim()) {
        onTranscript(interimText.trim());
        setInterimText('');
      }
    } else {
      setInterimText('');
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsListening(true);
        }
      } catch (err) {
        console.warn('Recognition start failed:', err);
      }
    }
  };

  if (!isSupported) {
    return null; // Gracefully hidden in unsupported browsers
  }

  return (
    <div className="relative inline-flex items-center">
      {/* Floating Live Voice Preview Pill */}
      {isListening && (
        <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-2xl bg-slate-900/90 text-white text-xs font-bold shadow-xl border border-indigo-500/40 whitespace-nowrap flex items-center gap-2 z-50 animate-bounce-subtle">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>{interimText || 'Listening… Speak now'}</span>
        </div>
      )}

      <button
        type="button"
        onClick={toggleListen}
        disabled={disabled}
        className={`relative p-2 rounded-xl transition-all flex items-center justify-center ${
          isListening
            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse'
            : 'text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title={isListening ? 'Tap to stop listening' : 'Voice Quick Add (Speak natural expense)'}
      >
        {isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};
