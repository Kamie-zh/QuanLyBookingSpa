'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/services/${id}`).then(r => r.json()).then(d => { setService(d.service); setLoading(false); });
  }, [id]);

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Đang tải...</p></div>;
  if (!service) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Không tìm thấy dịch vụ</p></div>;

  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container-custom">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start' }} className="detail-grid">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
              <img src={service.imageUrl || 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800'} alt={service.serviceName} style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <span style={{ background: 'linear-gradient(135deg, #8B6F47, #D4AF37)', color: 'white', padding: '5px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>{service.serviceType}</span>
            {service.isCombo && <span style={{ background: '#c0392b', color: 'white', padding: '5px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', marginLeft: '8px' }}>COMBO</span>}
            <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '36px', margin: '15px 0' }}>{service.serviceName}</h1>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
              <div style={{ background: '#F5F1E8', padding: '12px 24px', borderRadius: '12px' }}>
                <span style={{ fontSize: '13px', color: '#8B8579' }}>Giá</span>
                <p style={{ color: '#D4AF37', fontWeight: '700', fontSize: '24px' }}>{service.price?.toLocaleString('vi-VN')}đ</p>
              </div>
              <div style={{ background: '#F5F1E8', padding: '12px 24px', borderRadius: '12px' }}>
                <span style={{ fontSize: '13px', color: '#8B8579' }}>Thời gian</span>
                <p style={{ fontWeight: '700', fontSize: '24px' }}>{service.duration} phút</p>
              </div>
            </div>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#555', marginBottom: '30px' }}>{service.description || 'Dịch vụ chất lượng cao.'}</p>
            {service.isCombo && service.comboServices?.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '18px', color: '#8B6F47', marginBottom: '10px' }}>Dịch vụ trong combo</h3>
                {service.comboServices.map(cs => (
                  <div key={cs._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#F5F1E8', borderRadius: '10px', marginBottom: '8px' }}>
                    <span>{cs.serviceName}</span><span style={{ color: '#8B8579' }}>{cs.duration} phút - {cs.price?.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '15px' }}>
              <Link href={`/booking?serviceId=${service._id}`}><button className="btn-primary" style={{ padding: '15px 40px' }}>Đặt Lịch Ngay</button></Link>
              <Link href="/services"><button className="btn-secondary">Quay lại</button></Link>
            </div>
          </motion.div>
        </div>
      </div>
      <style jsx global>{`@media(max-width:768px){.detail-grid{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
