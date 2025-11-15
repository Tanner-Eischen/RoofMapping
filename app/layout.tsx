import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Roof Mapping',
  description: 'Project initialization and configuration',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <script dangerouslySetInnerHTML={{ __html: `window.__GMAPS_KEY = '${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}';` }} />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-sage-50 text-slate-900 antialiased">
        <header className="sticky top-0 z-20 border-b border-sage-200 bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-xl font-semibold text-slate-900">Roof Mapping</a>
            <nav className="flex items-center gap-4">
              <a href="/address" className="text-sage-700 hover:text-sage-900">Analyze</a>
              <a href="/results" className="text-sage-700 hover:text-sage-900">Results</a>
              <a href="/mobile-assist" className="text-sage-700 hover:text-sage-900">Mobile Assist</a>
            </nav>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-4">
          {children}
        </div>
        <footer className="mt-16 border-t border-sage-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600">© {new Date().getFullYear()} Roof Mapping</div>
        </footer>
      </body>
    </html>
  );
}