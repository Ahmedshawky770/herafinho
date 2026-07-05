'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
};

type ToastContextValue = {
  toasts: Toast[];
  toast: (message: string, type?: Toast['type']) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (message: string, type: Toast['type'] = 'info') => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-4 py-3 shadow-medium animate-fade-in ${
              t.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : t.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : t.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            <p className="text-sm font-medium">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
