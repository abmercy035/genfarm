import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'General Farm Ltd | Poultry Management System',
  description: 'Enterprise poultry operational logging, egg harvest tracking, feed inventory, and Hen-Day Production metrics.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </body>
    </html>
  );
}
