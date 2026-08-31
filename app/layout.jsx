import './globals.css';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/context/AuthContext';
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta'
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  title: 'General Farm Ltd | Poultry Management System',
  description: 'Enterprise poultry operational logging, egg harvest tracking, feed inventory, and Hen-Day Production metrics.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className={`${jakarta.className} flex min-h-screen bg-slate-50 text-slate-900 antialiased`}>
        <AuthProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
