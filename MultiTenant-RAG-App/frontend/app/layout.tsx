import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Multi-Tenant RAG SaaS',
  description: 'Upload documents and get AI-powered answers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}