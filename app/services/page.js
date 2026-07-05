'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export default function ServicesPage() {
  return <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải...</div>}><ServicesContent /></Suspense>;
}

function ServicesContent() {
  const [services, setServices] = useState([]);
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'all';
  const searchQuery = searchParams.get('q') || '';
  const [activeType, setActiveType] = useState(initialType);
  const [loading, setLoading] = useState(true);

  async function loadServices(type) {
    setLoading(true);
    const params = new URLSearchParams();
    if (type !== 'all') params.set('type', type);
    if (searchQuery) params.set('q', searchQuery);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/services${query}`);
    const data = await res.json();
    setServices(data.services || []);
    setLoading(false);
  }

  useEffect(() => {
    queueMicrotask(() => loadServices(activeType));
  }, [activeType, searchQuery]);

  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container-custom">
        <motion.div initial="hidden" animate="visible" variants={stagger} style={{ textAlign: 'center', marginBottom: '50px' }}>
          <motion.p variants={fadeInUp} style={{ color: '#D4AF37', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '13px', marginBottom: '10px' }}>KHÁM PHÁ</motion.p>
          <motion.h1 variants={fadeInUp} style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: '15px' }}>
            Dịch Vụ Của <span className="gold-text">Chúng Tôi</span>
          </motion.h1>
          <motion.div variants={fadeInUp} style={{ width: '60px', height: '3px', background: 'linear-gradient(135deg, #8B6F47, #D4AF37)', margin: '0 auto 30px', borderRadius: '2px' }} />
          <motion.div variants={fadeInUp} style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {[{ key: 'all', label: 'Tất cả' }, { key: 'spa', label: 'Spa' }, { key: 'nail', label: 'Nail' }, { key: 'makeup', label: 'Makeup' }].map(tab => (
              <motion.button key={tab.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveType(tab.key)}
                style={{ padding: '10px 28px', borderRadius: '25px', border: '1px solid #D4AF37', cursor: 'pointer', background: activeType === tab.key ? 'linear-gradient(135deg, #8B6F47, #D4AF37)' : 'transparent', color: activeType === tab.key ? 'white' : '#8B6F47', fontWeight: '600', fontSize: '14px', fontFamily: 'var(--font-montserrat), sans-serif' }}>
                {tab.label}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8B8579' }}>
            <div className="shimmer" style={{ width: '200px', height: '20px', borderRadius: '10px', margin: '0 auto' }} />
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={stagger} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
            {services.map(service => (
              <motion.div key={service._id} variants={fadeInUp} whileHover={{ y: -8 }}>
                <Link href={`/services/${service._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card" style={{ height: '100%' }}>
                    <div style={{ height: '240px', overflow: 'hidden', position: 'relative' }}>
                      <img src={service.imageUrl || 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400'} alt={service.serviceName} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} onMouseOver={e => e.target.style.transform = 'scale(1.1)'} onMouseOut={e => e.target.style.transform = 'scale(1)'} />
                      <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'linear-gradient(135deg, #8B6F47, #D4AF37)', color: 'white', padding: '4px 14px', borderRadius: '15px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>{service.serviceType}</span>
                      {service.isCombo && <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#c0392b', color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '11px', fontWeight: '700' }}>COMBO</span>}
                    </div>
                    <div style={{ padding: '22px' }}>
                      <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '20px', marginBottom: '10px' }}>{service.serviceName}</h3>
                      <p style={{ fontSize: '14px', color: '#8B8579', marginBottom: '18px', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{service.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#D4AF37', fontWeight: '700', fontSize: '20px' }}>{service.price?.toLocaleString('vi-VN')}đ</span>
                        <span style={{ fontSize: '13px', color: '#8B8579', background: '#F5F1E8', padding: '4px 12px', borderRadius: '12px' }}>{service.duration} phút</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && services.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8B8579' }}>
            <p style={{ fontSize: '18px', marginBottom: '15px', fontWeight: '600' }}>Không tìm thấy</p>
            <p>Không tìm thấy dịch vụ nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
