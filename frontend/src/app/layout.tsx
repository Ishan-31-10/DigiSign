import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'DigSign — Digital Signature & Document Management',
  description:
    'Upload PDFs, sign them electronically, manage documents and verify authenticity — all in one place.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { fontSize: '14px' },
              success: { iconTheme: { primary: '#2a48d6', secondary: 'white' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
