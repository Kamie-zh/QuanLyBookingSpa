'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải...</div>}><ResetPasswordContent /></Suspense>;
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      toast.error('Mật khẩu phải từ 6 ký tự trở lên');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Có lỗi xảy ra'); setLoading(false); return; }
      setDone(true);
      toast.success('Đặt lại mật khẩu thành công!');
    } catch (err) {
      toast.error('Lỗi kết nối server');
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '50px 40px', borderRadius: '20px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#c0392b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'white', fontSize: '24px' }}>!</div>
          <h2 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '24px', marginBottom: '10px' }}>Link không hợp lệ</h2>
          <p style={{ color: '#8B8579', marginBottom: '25px' }}>Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
          <Link href="/forgot-password"><button className="btn-primary" style={{ width: '100%' }}>Yêu cầu link mới</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'white', borderRadius: '20px', padding: '50px 40px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <img src="/logo.png" alt="Luxe Beauty" style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 15px', display: 'block' }} />
          <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '28px', marginTop: '10px' }}>Đặt Lại Mật Khẩu</h1>
          <p style={{ color: '#8B8579', fontSize: '14px', marginTop: '8px' }}>
            {done ? 'Mật khẩu đã được cập nhật' : 'Nhập mật khẩu mới cho tài khoản'}
          </p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B6F47, #D4AF37)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'white', fontSize: '24px' }}>✓</div>
            <p style={{ color: '#8B8579', fontSize: '14px', marginBottom: '25px' }}>
              Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.
            </p>
            <Link href="/login"><button className="btn-primary" style={{ width: '100%' }}>Đăng Nhập</button></Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6F47', marginBottom: '6px', display: 'block' }}>Mật khẩu mới</label>
              <input type="password" className="input-field" placeholder="Tối thiểu 6 ký tự" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6F47', marginBottom: '6px', display: 'block' }}>Xác nhận mật khẩu</label>
              <input type="password" className="input-field" placeholder="Nhập lại mật khẩu mới" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-primary" style={{ width: '100%', marginTop: '5px' }} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
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
