'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isCustomer = !user || user.role === 'user';

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        background: 'rgba(253, 251, 247, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="container-custom" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '75px' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <motion.div whileHover={{ scale: 1.05 }} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Image src="/logo.png" alt="Luxe Beauty" width={44} height={44} style={{ borderRadius: '50%' }} />
            <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '24px', fontWeight: '700', background: 'linear-gradient(135deg, #8B6F47, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Luxe Beauty
            </span>
          </motion.div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '35px' }} className="hidden md:flex">
          <NavLink href="/">Trang chủ</NavLink>
          {isCustomer && <NavLink href="/services">Dịch vụ</NavLink>}
          {user?.role === 'user' && <NavLink href="/booking">Đặt lịch</NavLink>}
          {user?.role === 'user' && <NavLink href="/my-bookings">Lịch hẹn</NavLink>}
          {user?.role === 'admin' && <NavLink href="/admin/bookings">Quản trị</NavLink>}
          {user?.role === 'staff' && (
            <>
              <NavLink href="/staff">Lịch làm việc</NavLink>
              <NavLink href="/staff/stats">Doanh thu cá nhân</NavLink>
              <NavLink href="/staff/payroll">Lương của tôi</NavLink>
            </>
          )}

          {user && <NavLink href="/profile">Thông tin cá nhân</NavLink>}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Link href="/profile" style={{ textDecoration: 'none', fontSize: '14px', color: '#8B6F47', fontWeight: '500' }}>
                {user.memberType === 'VIP' && '[VIP] '}{user.fullName}
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid #D4AF37', background: 'transparent', color: '#D4AF37', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-montserrat), sans-serif' }}
              >
                Đăng xuất
              </motion.button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href="/login"><motion.button whileHover={{ scale: 1.05 }} className="btn-secondary" style={{ padding: '8px 24px', fontSize: '13px' }}>Đăng nhập</motion.button></Link>
              <Link href="/register"><motion.button whileHover={{ scale: 1.05 }} className="btn-primary" style={{ padding: '8px 24px', fontSize: '13px' }}>Đăng ký</motion.button></Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#8B6F47' }}
        >
          {menuOpen ? 'X' : '='}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden"
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(212,175,55,0.2)' }}
          >
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <MobileLink href="/" onClick={() => setMenuOpen(false)}>Trang chủ</MobileLink>
              {isCustomer && <MobileLink href="/services" onClick={() => setMenuOpen(false)}>Dịch vụ</MobileLink>}
              {user?.role === 'user' && <MobileLink href="/booking" onClick={() => setMenuOpen(false)}>Đặt lịch</MobileLink>}
              {user?.role === 'user' && <MobileLink href="/my-bookings" onClick={() => setMenuOpen(false)}>Lịch hẹn</MobileLink>}
              {user?.role === 'admin' && <MobileLink href="/admin/bookings" onClick={() => setMenuOpen(false)}>Quản trị</MobileLink>}
              {user?.role === 'staff' && (
                <>
                  <MobileLink href="/staff" onClick={() => setMenuOpen(false)}>Lịch làm việc</MobileLink>
                  <MobileLink href="/staff/stats" onClick={() => setMenuOpen(false)}>Doanh thu cá nhân</MobileLink>
                  <MobileLink href="/staff/payroll" onClick={() => setMenuOpen(false)}>Lương của tôi</MobileLink>
                </>
              )}
              {user ? (
                <>
                  <MobileLink href="/profile" onClick={() => setMenuOpen(false)}>Thông tin cá nhân</MobileLink>
                  <button onClick={() => { logout(); setMenuOpen(false); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D4AF37', background: 'transparent', color: '#D4AF37', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-montserrat), sans-serif' }}>
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link href="/login" style={{ flex: 1 }} onClick={() => setMenuOpen(false)}><button className="btn-secondary" style={{ width: '100%' }}>Đăng nhập</button></Link>
                  <Link href="/register" style={{ flex: 1 }} onClick={() => setMenuOpen(false)}><button className="btn-primary" style={{ width: '100%' }}>Đăng ký</button></Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function NavLink({ href, children }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: '#2D2A26', fontSize: '14px', fontWeight: '500', transition: 'color 0.3s', position: 'relative' }}>
      <motion.span whileHover={{ color: '#D4AF37' }}>{children}</motion.span>
    </Link>
  );
}

function MobileLink({ href, children, onClick }) {
  return (
    <Link href={href} onClick={onClick} style={{ textDecoration: 'none', color: '#2D2A26', fontSize: '16px', fontWeight: '500', padding: '8px 0', borderBottom: '1px solid #F5F1E8' }}>
      {children}
    </Link>
  );
}
