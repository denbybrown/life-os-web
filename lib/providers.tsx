'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime:    1000 * 60 * 60 * 24,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
