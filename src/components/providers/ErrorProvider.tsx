'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ErrorDetailsDialog, { ErrorDetails } from '@/components/common/ErrorDetailsDialog';
import ErrorBoundary from '@/components/common/ErrorBoundary';

interface ErrorContextType {
  showError: (error: ErrorDetails, title?: string) => void;
  showApiError: (response: Response, fallbackMessage?: string) => Promise<void>;
  showNetworkError: (error: unknown, path?: string) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | null>(null);

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [errorTitle, setErrorTitle] = useState('An error occurred');

  const showError = useCallback((error: ErrorDetails, title?: string) => {
    setErrorDetails({
      ...error,
      timestamp: error.timestamp || new Date().toISOString(),
    });
    setErrorTitle(title || 'An error occurred');
    setErrorDialogOpen(true);
  }, []);

  const showApiError = useCallback(async (response: Response, fallbackMessage?: string) => {
    let errorData: unknown;
    let errorMessage = fallbackMessage || 'Request failed';

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        errorData = await response.json();
        errorMessage = (errorData as { error?: string; message?: string })?.error
          || (errorData as { error?: string; message?: string })?.message
          || errorMessage;
      } catch {
        errorData = { parseError: 'Failed to parse JSON response' };
      }
    } else {
      try {
        const textBody = await response.text();
        errorData = { rawResponse: textBody.slice(0, 500) };
        errorMessage = `Server error (${response.status})`;
      } catch {
        errorData = { parseError: 'Failed to read response body' };
      }
    }

    console.error('API Error:', errorData);
    setErrorDetails({
      message: errorMessage,
      status: response.status,
      details: errorData,
      timestamp: new Date().toISOString(),
      path: response.url,
    });
    setErrorTitle('Request Failed');
    setErrorDialogOpen(true);
  }, []);

  const showNetworkError = useCallback((error: unknown, path?: string) => {
    console.error('Network Error:', error);
    setErrorDetails({
      message: error instanceof Error ? error.message : 'Network error occurred',
      status: 0,
      details: {
        type: 'NetworkError',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
      },
      timestamp: new Date().toISOString(),
      path: path || (typeof window !== 'undefined' ? window.location.pathname : ''),
    });
    setErrorTitle('Connection Error');
    setErrorDialogOpen(true);
  }, []);

  const clearError = useCallback(() => {
    setErrorDialogOpen(false);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError, showApiError, showNetworkError, clearError }}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
      <ErrorDetailsDialog
        open={errorDialogOpen}
        onClose={clearError}
        error={errorDetails}
        title={errorTitle}
      />
    </ErrorContext.Provider>
  );
}
