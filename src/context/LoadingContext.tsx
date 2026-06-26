import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface LoadingContextType {
  isLoading: boolean;
  message: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isManual, setIsManual] = useState(false);
  const [manualMessage, setManualMessage] = useState('Yuklanmoqda...');
  const [activeRequests, setActiveRequests] = useState(0);

  const showLoading = (msg = 'Yuklanmoqda...') => {
    setManualMessage(msg);
    setIsManual(true);
  };

  const hideLoading = () => {
    setIsManual(false);
  };

  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use(
      (config) => {
        if ((config as any).showLoading !== false) {
          setActiveRequests((prev) => prev + 1);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const resInterceptor = axios.interceptors.response.use(
      (response) => {
        if ((response.config as any).showLoading !== false) {
          setActiveRequests((prev) => Math.max(0, prev - 1));
        }
        return response;
      },
      (error) => {
        if ((error.config as any).showLoading !== false) {
          setActiveRequests((prev) => Math.max(0, prev - 1));
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  const isLoading = isManual || activeRequests > 0;
  const message = isManual ? manualMessage : 'Maʼlumotlar yuklanmoqda...';

  return (
    <LoadingContext.Provider value={{ isLoading, message, showLoading, hideLoading }}>
      {children}
      {isLoading && (
        <div 
          id="global_loading_overlay"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        >
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center">
            <div className="relative flex items-center justify-center w-12 h-12">
              <div className="absolute w-12 h-12 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 font-sans">Iltimos, kuting</h4>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
