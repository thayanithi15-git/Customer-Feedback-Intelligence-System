'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import "./globals.css";

// Resilient SVG Icons to avoid import failures
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
);

const ExplorerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m16.24 7.76-1.8 4.68-4.68 1.8 1.8-4.68 4.68-1.8z" /></svg>
);

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);

export default function RootLayout({ children }) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <aside className="sidebar">
            <div className="logo-area">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--accent))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="logo-text">QuickCart Insight</span>
            </div>
            
            <nav style={{ flex: 1 }}>
              <ul className="nav-list">
                <li>
                  <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
                    <DashboardIcon />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link href="/explorer" className={`nav-item ${pathname === '/explorer' ? 'active' : ''}`}>
                    <ExplorerIcon />
                    <span>Feedback Explorer</span>
                  </Link>
                </li>
                <li>
                  <Link href="/upload" className={`nav-item ${pathname === '/upload' ? 'active' : ''}`}>
                    <UploadIcon />
                    <span>Upload CSV</span>
                  </Link>
                </li>
              </ul>
            </nav>
            
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
              CFIS v1.0.0
            </div>
          </aside>
          
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
