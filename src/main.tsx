import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './lib/theme';
import { LanguageProvider } from './lib/i18n';
import { StoreProvider } from './lib/store';
import { AppContent } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <StoreProvider>
          <AppContent />
        </StoreProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);

