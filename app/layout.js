import './globals.css';
import { Playfair_Display, Montserrat } from 'next/font/google';
import { AuthProvider } from '@/components/AuthContext';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/ConfirmModal';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AIChatbot from '@/components/AIChatbot';

const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata = {
  title: 'Luxe Beauty Spa - Đặt lịch làm đẹp Spa/Nail/Makeup',
  description: 'Hệ thống đặt lịch làm đẹp chuyên nghiệp - Spa, Nail Art, Makeup. Trải nghiệm dịch vụ đẳng cấp tại Luxe Beauty Spa.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${playfair.variable} ${montserrat.variable}`}>
      <body style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <Navbar />
              <main style={{ minHeight: 'calc(100vh - 140px)' }}>
                {children}
              </main>
              <Footer />
              <AIChatbot />
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
