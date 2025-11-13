import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Roof Mapping',
  description: 'Project initialization and configuration',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}