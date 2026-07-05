'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { motion } from 'framer-motion';

const menuItems = [
  { href: '/profile', label: 'Thông tin cá nhân' },
  { href: '/staff', label: 'Lịch làm việc' },
  { href: '/staff/stats', label: 'Doanh thu cá nhân' },
  { href: '/staff/payroll', label: 'Lương của tôi' },
];

export default function StaffLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'staff')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'staff') return null;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>
      {/* Sidebar for Desktop */}
      <aside style={{ width: '240px', background: 'linear-gradient(180deg, #2D2A26, #3D3830)', padding: '25px 0', flexShrink: 0 }} className="hidden md:block">
        <div style={{ padding: '0 20px 25px', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
          <h2 style={{ fontFamily: 'var(--font-playfair), serif', color: '#D4AF37', fontSize: '18px' }}>Nhân viên</h2>
          <p style={{ fontSize: '12px', color: '#8B8579', marginTop: '5px' }}>{user.fullName}</p>
        </div>
        <nav style={{ padding: '15px 0' }}>
          {menuItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ x: 5 }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', color: isActive ? '#D4AF37' : '#B8B0A0', background: isActive ? 'rgba(212,175,55,0.1)' : 'transparent', borderLeft: isActive ? '3px solid #D4AF37' : '3px solid transparent', fontSize: '14px', fontWeight: isActive ? '600' : '400', transition: 'all 0.2s' }}>
                  {item.label}
                </motion.div>
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '20px', marginTop: 'auto' }}>
          <Link href="/"><button style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.3)', background: 'transparent', color: '#8B8579', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-montserrat), sans-serif' }}>Về trang chủ</button></Link>
        </div>
      </aside>
      
      {/* Main Content Pane */}
      <main style={{ flex: 1, padding: '30px', background: '#F5F1E8', overflow: 'auto' }}>
        {/* Mobile Navigation bar */}
        <div className="md:hidden" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '10px' }}>
          {menuItems.map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '20px', background: pathname === item.href ? '#D4AF37' : 'white', color: pathname === item.href ? 'white' : '#2D2A26', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {item.label}
            </Link>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
