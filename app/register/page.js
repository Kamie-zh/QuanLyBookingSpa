'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Đăng ký thất bại'); setLoading(false); return; }
      login(data.user, data.token);
      toast.success('Đăng ký thành công');
      router.push('/');
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
          <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '28px', marginTop: '10px' }}>Đăng Ký</h1>
          <p style={{ color: '#8B8579', fontSize: '14px', marginTop: '8px' }}>Tạo tài khoản để trải nghiệm dịch vụ</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6F47', marginBottom: '6px', display: 'block' }}>Họ tên</label>
            <input name="fullName" className="input-field" placeholder="Nhập họ và tên của bạn" value={form.fullName} onChange={handleChange} required />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6F47', marginBottom: '6px', display: 'block' }}>Email</label>
            <input name="email" type="email" className="input-field" placeholder="Nhập địa chỉ email" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6F47', marginBottom: '6px', display: 'block' }}>Số điện thoại</label>
            <input name="phone" className="input-field" placeholder="Nhập số điện thoại" value={form.phone} onChange={handleChange} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6F47', marginBottom: '6px', display: 'block' }}>Mật khẩu</label>
            <input name="password" type="password" className="input-field" placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={handleChange} required minLength={6} />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-primary" style={{ width: '100%', marginTop: '5px' }} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng Ký'}
          </motion.button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px', color: '#8B8579' }}>
          Đã có tài khoản? <Link href="/login" style={{ color: '#D4AF37', fontWeight: '600', textDecoration: 'none' }}>Đăng nhập</Link>
        </p>
      </motion.div>
    </div>
  );
}
