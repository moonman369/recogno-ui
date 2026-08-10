import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ApiError, SessionExpiredError } from './api/http';
import { AuthProvider } from './auth/AuthProvider';
import { consumeOAuthCallback } from './auth/googleCallback';
import App from './App';
import './index.css';

// Before anything renders: lift the OAuth session out of the URL and scrub the
// query string, so it never reaches the router, the history entry, or a
// referrer. The result is held for /auth/callback to report.
consumeOAuthCallback();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // An expired session is resolved by signing in, not by retrying.
        if (error instanceof SessionExpiredError) return false;
        // 4xx means the request was wrong, not that the worker is flaky.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
