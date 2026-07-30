'use client';

import { WatermelonProvider } from 'watermelon-ui';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Sonner } from 'sonner';
import { useState } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <WatermelonProvider>
          {children}
          <Sonner position="top-right" />
          <ReactQueryDevtools initialIsOpen={false} />
        </WatermelonProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}