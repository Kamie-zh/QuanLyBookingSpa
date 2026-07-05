'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Có lỗi xảy ra'); setLoading(false); return; }
      setSent(true);
      toast.success('Đã gửi hướng dẫn đặt lại mật khẩu');
    } catch (err) {
      toast.error('Lỗi kết nối server');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'white', borderRadius: '20px', padding: '50px 40px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <img src="/logo.png" alt="Luxe Beauty" style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 15px', display: 'block' }} />
          <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '28px', marginTop: '10px' }}>Quên Mật Khẩu</h1>
          <p style={{ color: '#8B8579', fontSize: '14px', marginTop: '8px' }}>
            {sent ? 'Kiểm tra email để đặt lại mật khẩu' : 'Nhập email để nhận hướng dẫn đặt lại mật khẩu'}
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B6F47, #D4AF37)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'white', fontSize: '24px' }}>✓</div>
            <p style={{ color: '#8B8579', fontSize: '14px', marginBottom: '25px', lineHeight: 1.6 }}>
              Nếu email <strong style={{ color: '#2D2A26' }}>{email}</strong> tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.
            </p>
            <Link href="/login">
              <button className="btn-primary" style={{ width: '100%' }}>Quay Lại Đăng Nhập</button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6F47', marginBottom: '6px', display: 'block' }}>Email</label>
              <input type="email" className="input-field" placeholder="Nhập địa chỉ email đã đăng ký" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-primary" style={{ width: '100%', marginTop: '5px' }} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Gửi Hướng Dẫn'}
            </motion.button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px', color: '#8B8579' }}>
          <Link href="/login" style={{ color: '#D4AF37', fontWeight: '600', textDecoration: 'none' }}>← Quay lại đăng nhập</Link>
        </p>
      </motion.div>
    </div>
  );
}
