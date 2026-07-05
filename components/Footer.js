'use client';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer style={{ background: 'linear-gradient(135deg, #2D2A26 0%, #3D3830 100%)', color: '#F5F1E8', padding: '70px 0 30px' }}>
      <div className="container-custom">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '50px', marginBottom: '50px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Image src="/logo.png" alt="Luxe Beauty" width={36} height={36} style={{ borderRadius: '50%' }} />
              <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '22px', fontWeight: '700', color: '#D4AF37' }}>Luxe Beauty</span>
            </div>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#B8B0A0' }}>
              Nơi vẻ đẹp toả sáng. Chúng tôi mang đến trải nghiệm làm đẹp đẳng cấp với dịch vụ chuyên nghiệp và tận tâm.
            </p>
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '18px', color: '#D4AF37', marginBottom: '15px' }}>Liên kết</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <FooterLink href="/">Trang chủ</FooterLink>
              <FooterLink href="/services">Dịch vụ</FooterLink>
              <FooterLink href="/booking">Đặt lịch</FooterLink>
              <FooterLink href="/register">Đăng ký</FooterLink>
            </div>
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '18px', color: '#D4AF37', marginBottom: '15px' }}>Dịch vụ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <FooterLink href="/services?type=spa">Spa & Massage</FooterLink>
              <FooterLink href="/services?type=nail">Nail Art</FooterLink>
              <FooterLink href="/services?type=makeup">Makeup</FooterLink>
            </div>
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '18px', color: '#D4AF37', marginBottom: '15px' }}>Liên hệ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#B8B0A0' }}>
              <p>123 Nguyễn Huệ, Q.1, TP.HCM</p>
              <p>0901 234 567</p>
              <p>info@luxebeauty.vn</p>
              <p>8:00 - 20:00 (Thứ 2 - Chủ nhật)</p>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(212,175,55,0.2)', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#8B8579' }}>
            &copy; 2024 Luxe Beauty Spa. Đồ án chuyên ngành - Nhật Trường.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: '#B8B0A0', fontSize: '14px', transition: 'color 0.3s' }}>
      <motion.span whileHover={{ color: '#D4AF37' }}>{children}</motion.span>
    </Link>
  );
}
