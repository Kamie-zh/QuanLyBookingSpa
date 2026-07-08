'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Dang tai...</div>}><ResetPasswordContent /></Suspense>;
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!email.trim() || !otp.trim() || !password || !confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          password,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Something went wrong');
        setLoading(false);
        return;
      }
      setDone(true);
      toast.success(data.message || 'Password reset successfully');
      setTimeout(() => router.push('/login'), 1400);
    } catch (err) {
      toast.error('Server connection error');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'white', borderRadius: '20px', padding: '50px 40px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <img src="/logo.png" alt="Luxe Beauty" style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 15px', display: 'block' }} />
          <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '28px', marginTop: '10px' }}>Reset Password</h1>
          <p style={{ color: '#8B8579', fontSize: '14px', marginTop: '8px' }}>
            {done ? 'Password reset successfully' : 'Nhập email, mã OTP, và mật khẩu mới'}
          </p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B6F47, #D4AF37)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'white', fontSize: '24px' }}>OK</div>
            <p style={{ color: '#8B8579', fontSize: '14px', marginBottom: '25px' }}>You can now log in with your new password.</p>
            <Link href="/login"><button className="btn-primary" style={{ width: '100%' }}>Login</button></Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6F47', marginBottom: '6px', display: 'block' }}>Email</label>
              <input type="email" className="input-field" placeholder="Nhập email của bạn" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6F47', marginBottom: '6px', display: 'block' }}>Mã OTP</label>
              <input className="input-field" placeholder="Nhập mã OTP 6 chữ số" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required inputMode="numeric" maxLength={6} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6F47', marginBottom: '6px', display: 'block' }}>New Password</label>
              <input type="password" className="input-field" placeholder="Ít nhất 6 ký tự" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6F47', marginBottom: '6px', display: 'block' }}>Confirm Password</label>
              <input type="password" className="input-field" placeholder="Xác nhận mật khẩu mới" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-primary" style={{ width: '100%', marginTop: '5px' }} disabled={loading}>
              {loading ? 'Processing...' : 'Reset Password'}
            </motion.button>
          </form>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', marginTop: '25px', fontSize: '14px' }}>
          <Link href="/forgot-password" style={{ color: '#D4AF37', fontWeight: '600', textDecoration: 'none' }}>Resend OTP</Link>
          <Link href="/login" style={{ color: '#D4AF37', fontWeight: '600', textDecoration: 'none' }}>Trở về Đăng nhập</Link>
        </div>
      </motion.div>
    </div>
  );
}
