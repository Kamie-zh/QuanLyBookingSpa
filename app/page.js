'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const fadeInUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

export default function HomePage() {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [services, setServices] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeType, setActiveType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/banners?position=HOME_HERO').then(r => r.json()).then(d => setBanners(d.banners || []));
    fetch('/api/services').then(r => r.json()).then(d => setServices(d.services || []));
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => setActiveSlide(p => (p + 1) % filteredBanners.length), 5000);
      return () => clearInterval(timer);
    }
  }, [banners, activeType]);

  const filteredServices = activeType === 'all' ? services : services.filter(s => s.serviceType === activeType);
  const filteredBanners = activeType === 'all' ? banners : banners.filter(b => b.targetServiceType === activeType || b.targetServiceType === 'all');
  const handleSearch = (event) => {
    event.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/services?q=${encodeURIComponent(q)}` : '/services');
  };

  return (
    <div>
      {/* Hero Banner Slider */}
      <section style={{ position: 'relative', height: '90vh', minHeight: '550px', overflow: 'hidden' }}>
        {filteredBanners.map((banner, i) => (
          <motion.div key={banner._id || i} animate={{ opacity: activeSlide === i ? 1 : 0 }} transition={{ duration: 0.8 }}
            style={{ position: 'absolute', inset: 0, backgroundImage: `url(${banner.imageUrl || banner.imagePath})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(45,42,38,0.7) 0%, rgba(45,42,38,0.3) 100%)' }} />
          </motion.div>
        ))}
        {filteredBanners.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #2D2A26 0%, #3D3830 50%, #8B6F47 100%)' }} />
        )}
        <div className="container-custom" style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', alignItems: 'center' }}>
          <motion.div initial="hidden" animate="visible" variants={stagger} style={{ maxWidth: '600px' }}>
            <motion.p variants={fadeInUp} style={{ color: '#D4AF37', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '14px', marginBottom: '15px' }}>
              CHÀO MỪNG ĐẾN VỚI
            </motion.p>
            <motion.h1 variants={fadeInUp} style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 'clamp(36px, 6vw, 64px)', color: 'white', lineHeight: 1.1, marginBottom: '20px' }}>
              Luxe Beauty <span style={{ color: '#D4AF37' }}>Spa</span>
            </motion.h1>
            <motion.p variants={fadeInUp} style={{ color: '#E8E0D4', fontSize: '18px', lineHeight: 1.7, marginBottom: '35px' }}>
              {filteredBanners[activeSlide]?.subtitle || 'Nơi vẻ đẹp toả sáng. Trải nghiệm dịch vụ Spa, Nail và Makeup đẳng cấp.'}
            </motion.p>
            <motion.form variants={fadeInUp} onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '22px', maxWidth: '560px' }}>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tim dich vu spa, nail, makeup..."
                style={{ flex: '1 1 280px', minWidth: 0, padding: '15px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.92)', color: '#2D2A26', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-montserrat), sans-serif' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '15px 28px', fontSize: '14px' }}>Tìm kiếm</button>
            </motion.form>
            <motion.div variants={fadeInUp} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <Link href="/services"><button className="btn-primary" style={{ fontSize: '15px', padding: '15px 40px' }}>Khám Phá Dịch Vụ</button></Link>
              <Link href="/booking"><button className="btn-secondary" style={{ fontSize: '15px', padding: '15px 40px', borderColor: 'white', color: 'white' }}>Đặt Lịch Ngay</button></Link>
            </motion.div>
          </motion.div>
        </div>
        {filteredBanners.length > 1 && (
          <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 20 }}>
            {filteredBanners.map((_, i) => (
              <button key={i} onClick={() => setActiveSlide(i)} style={{ width: activeSlide === i ? '30px' : '10px', height: '10px', borderRadius: '5px', background: activeSlide === i ? '#D4AF37' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
        )}
        {filteredBanners.length > 1 && (
          <>
            <button onClick={() => setActiveSlide(p => (p - 1 + filteredBanners.length) % filteredBanners.length)} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(212,175,55,0.3)', border: 'none', color: 'white', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', zIndex: 20 }}>&#8249;</button>
            <button onClick={() => setActiveSlide(p => (p + 1) % filteredBanners.length)} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(212,175,55,0.3)', border: 'none', color: 'white', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', zIndex: 20 }}>&#8250;</button>
          </>
        )}
      </section>

      {/* Services */}
      <section style={{ padding: '80px 0 100px' }}>
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} style={{ textAlign: 'center', marginBottom: '50px' }}>
            <motion.p variants={fadeInUp} style={{ color: '#D4AF37', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '13px', marginBottom: '10px' }}>DỊCH VỤ CỦA CHÚNG TÔI</motion.p>
            <motion.h2 variants={fadeInUp} style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '15px' }}>
              Dịch Vụ <span className="gold-text">Nổi Bật</span>
            </motion.h2>
            <motion.div variants={fadeInUp} style={{ width: '60px', height: '3px', background: 'linear-gradient(135deg, #8B6F47, #D4AF37)', margin: '0 auto 30px', borderRadius: '2px' }} />
            <motion.div variants={fadeInUp} style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {[{ key: 'all', label: 'Tất cả' }, { key: 'spa', label: 'Spa' }, { key: 'nail', label: 'Nail' }, { key: 'makeup', label: 'Makeup' }].map(tab => (
                <motion.button key={tab.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setActiveType(tab.key); setActiveSlide(0); }}
                  style={{ padding: '10px 28px', borderRadius: '25px', border: '1px solid #D4AF37', cursor: 'pointer', background: activeType === tab.key ? 'linear-gradient(135deg, #8B6F47, #D4AF37)' : 'transparent', color: activeType === tab.key ? 'white' : '#8B6F47', fontWeight: '600', fontSize: '14px', fontFamily: 'var(--font-montserrat), sans-serif', transition: 'all 0.3s' }}>
                  {tab.label}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          <motion.div key={activeType} initial="hidden" animate="visible" variants={stagger} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
            {filteredServices.slice(0, 8).map((service) => (
              <motion.div key={service._id} variants={fadeInUp} whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                <Link href={`/services/${service._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card" style={{ height: '100%' }}>
                    <div style={{ height: '220px', overflow: 'hidden', position: 'relative' }}>
                      <img src={service.imageUrl || service.imagePath || 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400'} alt={service.serviceName} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} onMouseOver={e => e.target.style.transform = 'scale(1.1)'} onMouseOut={e => e.target.style.transform = 'scale(1)'} />
                      <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'linear-gradient(135deg, #8B6F47, #D4AF37)', color: 'white', padding: '4px 14px', borderRadius: '15px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>{service.serviceType}</span>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '18px', marginBottom: '8px' }}>{service.serviceName}</h3>
                      <p style={{ fontSize: '13px', color: '#8B8579', marginBottom: '15px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{service.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#D4AF37', fontWeight: '700', fontSize: '18px' }}>{service.price?.toLocaleString('vi-VN')}đ</span>
                        <span style={{ fontSize: '13px', color: '#8B8579' }}>{service.duration} phút</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {services.length > 8 && (
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <Link href="/services"><button className="btn-secondary">Xem Tất Cả Dịch Vụ</button></Link>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding: '100px 0', background: 'linear-gradient(135deg, #2D2A26, #3D3830)' }}>
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} style={{ textAlign: 'center', marginBottom: '50px' }}>
            <motion.p variants={fadeInUp} style={{ color: '#D4AF37', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '13px', marginBottom: '10px' }}>TẠI SAO CHỌN CHÚNG TÔI</motion.p>
            <motion.h2 variants={fadeInUp} style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 'clamp(28px, 4vw, 42px)', color: 'white' }}>
              Tại Sao Chọn <span style={{ color: '#D4AF37' }}>Luxe Beauty</span>
            </motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '35px' }}>
            {[
              { icon: 'I', title: 'Dịch Vụ Cao Cấp', desc: 'Sản phẩm và thiết bị nhập khẩu từ Hàn Quốc, Nhật Bản' },
              { icon: 'II', title: 'Chuyên Gia Hàng Đầu', desc: 'Đội ngũ kỹ thuật viên giàu kinh nghiệm, được đào tạo chuyên nghiệp' },
              { icon: 'III', title: 'Đặt Lịch Dễ Dàng', desc: 'Hệ thống đặt lịch online tiện lợi, xác nhận tức thì qua email' },
              { icon: 'IV', title: 'Ưu Đãi VIP', desc: 'Chương trình khách hàng thân thiết với nhiều ưu đãi hấp dẫn' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp} whileHover={{ y: -5, scale: 1.02 }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', padding: '35px 25px', textAlign: 'center', transition: 'all 0.3s' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B6F47, #D4AF37)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', color: 'white', fontWeight: '700', fontSize: '16px' }}>{item.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '20px', color: '#D4AF37', marginBottom: '10px' }}>{item.title}</h3>
                <p style={{ fontSize: '14px', color: '#B8B0A0', lineHeight: 1.7 }}>{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Gallery & Menu Sections */}
      <section style={{ padding: '80px 0', background: '#FDFBF8', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
        <div className="container-custom">
          {/* Gallery Header */}
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <p style={{ color: '#D4AF37', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '13px', marginBottom: '10px' }}>BỘ SƯU TẬP ẢNH</p>
            <h2 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '15px' }}>
              Gallery <span className="gold-text">Làm Đẹp</span>
            </h2>
            <div style={{ width: '60px', height: '3px', background: 'linear-gradient(135deg, #8B6F47, #D4AF37)', margin: '0 auto', borderRadius: '2px' }} />
          </div>

          {/* 3:4 aspect-ratio Gallery grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px', marginBottom: '80px' }}>
            {[
              { title: 'Liệu trình massage tinh dầu', img: 'https://images.pexels.com/photos/3852204/pexels-photo-3852204.jpeg?auto=compress&cs=tinysrgb&w=600' },
              { title: 'Chăm sóc móng nghệ thuật', img: 'https://images.pexels.com/photos/3997383/pexels-photo-3997383.jpeg?auto=compress&cs=tinysrgb&w=600' },
              { title: 'Trang điểm cô dâu tinh tế', img: 'https://images.pexels.com/photos/3018845/pexels-photo-3018845.jpeg?auto=compress&cs=tinysrgb&w=600' },
              { title: 'Trị liệu da mặt chuyên sâu', img: 'https://images.pexels.com/photos/3762466/pexels-photo-3762466.jpeg?auto=compress&cs=tinysrgb&w=600' },
            ].map((g, idx) => (
              <motion.div key={idx} whileHover={{ y: -6 }} style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', aspectRatios: '3/4', position: 'relative' }}>
                <img src={g.img} alt={g.title} style={{ width: '100%', height: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block', transition: 'transform 0.4s' }} onMouseOver={e => e.target.style.transform = 'scale(1.08)'} onMouseOut={e => e.target.style.transform = 'scale(1)'} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 15px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', color: 'white' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>{g.title}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Menu Header */}
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <p style={{ color: '#D4AF37', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '13px', marginBottom: '10px' }}>BẢNG GIÁ & THỰC ĐƠN DỊCH VỤ</p>
            <h2 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '15px' }}>
              Menu Dịch Vụ <span className="gold-text">Luxe</span>
            </h2>
            <div style={{ width: '60px', height: '3px', background: 'linear-gradient(135deg, #8B6F47, #D4AF37)', margin: '0 auto', borderRadius: '2px' }} />
          </div>

          {/* Menu columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', background: 'white', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-playfair), serif', color: '#8B6F47', fontSize: '22px', borderBottom: '1px solid #F5F1E8', paddingBottom: '12px', marginBottom: '20px' }}>Spa & Thư Giãn</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>Massage Toàn Thân Tinh Dầu</span>
                    <p style={{ fontSize: '12px', color: '#8B8579', margin: '4px 0 0' }}>Massage 90 phút, giảm mỏi mệt</p>
                  </div>
                  <span style={{ fontWeight: '700', color: '#D4AF37', fontSize: '15px' }}>500,000đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>Chăm Sóc Da Mặt Premium</span>
                    <p style={{ fontSize: '12px', color: '#8B8579', margin: '4px 0 0' }}>Chăm sóc da mặt chuyên sâu 60 phút</p>
                  </div>
                  <span style={{ fontWeight: '700', color: '#D4AF37', fontSize: '15px' }}>350,000đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>Xông Hơi Thảo Dược tự nhiên</span>
                    <p style={{ fontSize: '12px', color: '#8B8579', margin: '4px 0 0' }}>Đào thải độc tố 45 phút</p>
                  </div>
                  <span style={{ fontWeight: '700', color: '#D4AF37', fontSize: '15px' }}>200,000đ</span>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-playfair), serif', color: '#8B6F47', fontSize: '22px', borderBottom: '1px solid #F5F1E8', paddingBottom: '12px', marginBottom: '20px' }}>Nail Art & Makeup</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>Sơn Gel Hàn Quốc Cao Cấp</span>
                    <p style={{ fontSize: '12px', color: '#8B8579', margin: '4px 0 0' }}>Độ bền cao, bóng mượt 45 phút</p>
                  </div>
                  <span style={{ fontWeight: '700', color: '#D4AF37', fontSize: '15px' }}>150,000đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>Nail Art Design theo mẫu</span>
                    <p style={{ fontSize: '12px', color: '#8B8579', margin: '4px 0 0' }}>Đắp đá, vẽ hoạ tiết 90 phút</p>
                  </div>
                  <span style={{ fontWeight: '700', color: '#D4AF37', fontSize: '15px' }}>350,000đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>Trang Điểm Dự Tiệc</span>
                    <p style={{ fontSize: '12px', color: '#8B8579', margin: '4px 0 0' }}>Trang điểm chuyên nghiệp 60 phút</p>
                  </div>
                  <span style={{ fontWeight: '700', color: '#D4AF37', fontSize: '15px' }}>400,000đ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 0', textAlign: 'center' }}>
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeInUp} style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '15px' }}>
              Sẵn Sàng <span className="gold-text">Toả Sáng</span>?
            </motion.h2>
            <motion.p variants={fadeInUp} style={{ color: '#8B8579', fontSize: '16px', marginBottom: '30px', maxWidth: '500px', margin: '0 auto 30px' }}>
              Đặt lịch ngay hôm nay để trải nghiệm dịch vụ làm đẹp đẳng cấp tại Luxe Beauty Spa
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Link href="/booking"><button className="btn-primary" style={{ fontSize: '16px', padding: '18px 50px' }}>Đặt Lịch Ngay</button></Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
