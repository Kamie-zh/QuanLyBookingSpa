'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/Toast';
import { toVietnamISODate, vietnamDateTimeToUTCDate } from '@/lib/vietnamTime';

export default function BookingPage() {
  return <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải...</div>}><BookingContent /></Suspense>;
}

function BookingContent() {
  const { user, authFetch } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('random');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetch('/api/services').then(r => r.json()).then(d => {
      setServices(d.services || []);
      const preId = searchParams.get('serviceId');
      if (preId) setSelectedServices([preId]);
    });
    authFetch('/api/staff/list').then(r => r.json()).then(d => {
      setStaff(d.staff || []);
    });
  }, [user]);

  useEffect(() => {
    if (selectedDate) {
      const svIds = selectedServices.join(',');
      fetch(`/api/bookings/available-slots?date=${selectedDate}&staffId=${selectedStaff}&serviceIds=${svIds}`)
        .then(r => r.json())
        .then(d => setAvailableSlots(d.availableSlots || []));
    }
  }, [selectedDate, selectedStaff, selectedServices]);

  const toggleService = (id) => {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const getQualifiedStaff = () => {
    if (!selectedServices.length) return [];
    return staff;
  };

  const totalDuration = selectedServices.reduce((acc, id) => { const s = services.find(sv => sv._id === id); return acc + (s?.duration || 0); }, 0);
  const originalPrice = selectedServices.reduce((acc, id) => { const s = services.find(sv => sv._id === id); return acc + (s?.price || 0); }, 0);

  const discountAmount = appliedPromo
    ? appliedPromo.discountType === 'percent'
      ? Math.min(Math.round(originalPrice * appliedPromo.discountValue / 100), originalPrice)
      : Math.min(appliedPromo.discountValue, originalPrice)
    : 0;
  const totalPrice = originalPrice - discountAmount;

  const handleCheckPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await authFetch('/api/promotions/check', { method: 'POST', body: JSON.stringify({ code: promoCode.trim(), memberType: user.memberType }) });
      const data = await res.json();
      if (res.ok) {
        setAppliedPromo(data.promotion);
        toast.success(`Áp dụng mã "${data.promotion.title}" thành công!`);
      } else {
        toast.error(data.message);
      }
    } catch { toast.error('Lỗi kết nối'); }
    setPromoLoading(false);
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: selectedServices,
          bookingDate: selectedDate,
          startTime: selectedTime,
          promotionId: appliedPromo?._id,
          staffId: selectedStaff
        })
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Đặt lịch thất bại'); setLoading(false); return; }
      setSuccess(true);
      toast.success('Đặt lịch thành công!');
    } catch (err) { toast.error('Lỗi kết nối'); }
    setLoading(false);
  };

  const getStaffName = () => {
    if (selectedStaff === 'random') return 'Ngẫu nhiên (Tự động phân công sau)';
    const staff = getQualifiedStaff().find(st => st._id === selectedStaff);
    return staff ? staff.fullName : 'Ngẫu nhiên';
  };

  if (success) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', background: 'white', padding: '60px 40px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#2d6a4f', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'white', fontSize: '24px', fontWeight: '700' }}>OK</div>
        <h2 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '28px', margin: '10px 0' }}>Đặt Lịch Thành Công!</h2>
        <p style={{ color: '#8B8579', marginBottom: '25px' }}>Chúng tôi đã gửi email xác nhận cho bạn</p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => router.push('/my-bookings')}>Xem Lịch Hẹn</button>
          <button className="btn-secondary" onClick={() => router.push('/')}>Về Trang Chủ</button>
        </div>
      </motion.div>
    </div>
  );

  const steps = ['Chọn dịch vụ', 'Chọn nhân viên', 'Chọn ngày & giờ', 'Xác nhận'];

  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container-custom" style={{ maxWidth: '900px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '32px', textAlign: 'center', marginBottom: '10px' }}>Đặt Lịch <span className="gold-text">Hẹn</span></h1>
          <p style={{ textAlign: 'center', color: '#8B8579', marginBottom: '40px' }}>Chọn dịch vụ và thời gian phù hợp</p>

          {/* Progress */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '40px' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', background: step > i ? 'linear-gradient(135deg, #8B6F47, #D4AF37)' : step === i + 1 ? '#D4AF37' : '#E5E0D8', color: step >= i + 1 ? 'white' : '#8B8579', transition: 'all 0.3s' }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                {i < 3 && <div style={{ width: '40px', height: '2px', background: step > i + 1 ? '#D4AF37' : '#E5E0D8' }} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {services.map(s => (
                    <motion.div key={s._id} whileHover={{ scale: 1.01 }} onClick={() => toggleService(s._id)} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '16px 20px', background: 'white', borderRadius: '14px', cursor: 'pointer', border: selectedServices.includes(s._id) ? '2px solid #D4AF37' : '2px solid transparent', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: '2px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedServices.includes(s._id) ? '#D4AF37' : 'transparent', color: 'white', fontSize: '14px', flexShrink: 0 }}>
                        {selectedServices.includes(s._id) && '✓'}
                      </div>
                      <img src={s.imageUrl || 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=60'} alt="" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600' }}>{s.serviceName}</h4>
                        <span style={{ fontSize: '12px', color: '#8B8579' }}>{s.serviceType} / {s.duration} phút</span>
                      </div>
                      <span style={{ color: '#D4AF37', fontWeight: '700' }}>{s.price?.toLocaleString('vi-VN')}đ</span>
                    </motion.div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '25px', padding: '20px', background: 'white', borderRadius: '14px' }}>
                  <div><span style={{ color: '#8B8579', fontSize: '14px' }}>Đã chọn: {selectedServices.length} / {totalDuration} phút</span><br /><span style={{ color: '#D4AF37', fontWeight: '700', fontSize: '20px' }}>{originalPrice.toLocaleString('vi-VN')}đ</span></div>
                  <button className="btn-primary" disabled={!selectedServices.length} onClick={() => setStep(2)}>Tiếp theo</button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '16px', marginBottom: '25px' }}>
                  <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '20px', marginBottom: '20px' }}>Lựa chọn nhân viên thực hiện</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                    {/* Random Choice Card */}
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      onClick={() => setSelectedStaff('random')}
                      style={{
                        padding: '24px 15px',
                        background: 'white',
                        borderRadius: '16px',
                        border: selectedStaff === 'random' ? '2.5px solid #D4AF37' : '1px solid #E5E0D8',
                        cursor: 'pointer',
                        textAlign: 'center',
                        boxShadow: selectedStaff === 'random' ? '0 8px 25px rgba(212,175,55,0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B6F47, #D4AF37)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', margin: '0 auto 15px' }}>
                        ?
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 5px' }}>Ngẫu nhiên</h4>
                      <p style={{ fontSize: '12px', color: '#8B8579', margin: 0 }}>Hệ thống tự động sắp xếp nhân viên</p>
                    </motion.div>

                    {/* Specific Qualified Staff Cards */}
                    {getQualifiedStaff().map(st => {
                      const initials = st.fullName.split(' ').map(n => n[0]).join('').slice(-2).toUpperCase();
                      return (
                        <motion.div
                          key={st._id}
                          whileHover={{ scale: 1.03 }}
                          onClick={() => setSelectedStaff(st._id)}
                          style={{
                            padding: '24px 15px',
                            background: 'white',
                            borderRadius: '16px',
                            border: selectedStaff === st._id ? '2.5px solid #D4AF37' : '1px solid #E5E0D8',
                            cursor: 'pointer',
                            textAlign: 'center',
                            boxShadow: selectedStaff === st._id ? '0 8px 25px rgba(212,175,55,0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F5F1E8', color: '#8B6F47', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', margin: '0 auto 15px', border: '1px solid rgba(212,175,55,0.2)' }}>
                            {initials}
                          </div>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 5px' }}>{st.fullName}</h4>
                          <p style={{ fontSize: '12px', color: '#8B8579', margin: 0 }}>Chuyên viên phục vụ</p>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  {getQualifiedStaff().length === 0 && (
                    <p style={{ color: '#c0392b', textAlign: 'center', padding: '20px', fontSize: '14px' }}>
                      Chua co nhan vien tren he thong. Ban van co the chon ngau nhien de admin phan cong sau.
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button className="btn-secondary" onClick={() => setStep(1)}>Quay lại</button>
                  <button className="btn-primary" onClick={() => setStep(3)}>Tiếp theo</button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '16px', marginBottom: '20px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#8B6F47', marginBottom: '10px', display: 'block' }}>Chọn ngày</label>
                  <input type="date" className="input-field" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedTime(''); }} min={toVietnamISODate()} />
                </div>
                {selectedDate && (
                  <div style={{ background: 'white', padding: '30px', borderRadius: '16px', marginBottom: '20px' }}>
                    {(() => {
                      const now = new Date();
                      const minBookingTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                      const futureSlots = availableSlots.filter(slot => {
                        const slotDT = vietnamDateTimeToUTCDate(selectedDate, slot);
                        return slotDT >= minBookingTime;
                      });
                      return (
                        <>
                          <label style={{ fontSize: '14px', fontWeight: '600', color: '#8B6F47', marginBottom: '15px', display: 'block' }}>Chọn giờ ({futureSlots.length} khung giờ trống)</label>
                          <p style={{ fontSize: '12px', color: '#8B8579', marginBottom: '15px', marginTop: '-10px' }}>* Chỉ được đặt lịch trước tối thiểu 24 giờ</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px' }}>
                            {availableSlots.map(slot => {
                              const slotDT = vietnamDateTimeToUTCDate(selectedDate, slot);
                              const isTooSoon = slotDT < minBookingTime;
                              return (
                                <motion.button key={slot} whileHover={isTooSoon ? {} : { scale: 1.05 }} whileTap={isTooSoon ? {} : { scale: 0.95 }} onClick={() => { if (!isTooSoon) setSelectedTime(slot); }} disabled={isTooSoon} style={{ padding: '12px', borderRadius: '10px', border: selectedTime === slot ? '2px solid #D4AF37' : '1px solid #E5E0D8', background: isTooSoon ? '#F5F1E8' : selectedTime === slot ? 'linear-gradient(135deg, #8B6F47, #D4AF37)' : 'white', color: isTooSoon ? '#C5BFB3' : selectedTime === slot ? 'white' : '#2D2A26', cursor: isTooSoon ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'var(--font-montserrat), sans-serif', opacity: isTooSoon ? 0.5 : 1, textDecoration: isTooSoon ? 'line-through' : 'none', transition: 'all 0.2s' }}>
                                  {slot}
                                </motion.button>
                              );
                            })}
                          </div>
                          {futureSlots.length === 0 && <p style={{ color: '#8B8579', textAlign: 'center', padding: '20px' }}>Không còn khung giờ trống cho ngày này (cần đặt trước 24h)</p>}
                        </>
                      );
                    })()}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                  <button className="btn-secondary" onClick={() => setStep(2)}>Quay lại</button>
                  <button className="btn-primary" disabled={!selectedDate || !selectedTime} onClick={() => setStep(4)}>Tiếp theo</button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '16px' }}>
                  <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '22px', marginBottom: '20px', textAlign: 'center' }}>Xác Nhận Đặt Lịch</h3>
                  <div style={{ borderBottom: '1px solid #F5F1E8', paddingBottom: '15px', marginBottom: '15px' }}>
                    <h4 style={{ fontSize: '14px', color: '#8B6F47', fontWeight: '600', marginBottom: '10px' }}>Dịch vụ đã chọn</h4>
                    {selectedServices.map(id => { const s = services.find(sv => sv._id === id); return s ? (
                      <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', fontSize: '14px', gap: '12px' }}>
                        <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>{s.serviceName} ({s.duration} phút)</span>
                        <span style={{ color: '#D4AF37', fontWeight: '600', flexShrink: 0, whiteSpace: 'nowrap' }}>{s.price?.toLocaleString('vi-VN')}đ</span>
                      </div>
                    ) : null; })}
                  </div>

                  {/* Promo Code Section */}
                  <div style={{ borderBottom: '1px solid #F5F1E8', paddingBottom: '15px', marginBottom: '15px' }}>
                    <h4 style={{ fontSize: '14px', color: '#8B6F47', fontWeight: '600', marginBottom: '10px' }}>Mã khuyến mãi</h4>
                    {appliedPromo ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FFF4', border: '1px solid #2d6a4f', borderRadius: '10px', padding: '12px 16px' }}>
                        <div>
                          <span style={{ color: '#2d6a4f', fontWeight: '600', fontSize: '14px' }}>✓ {appliedPromo.title}</span>
                          <span style={{ color: '#2d6a4f', fontSize: '13px', marginLeft: '8px' }}>(-{appliedPromo.discountType === 'percent' ? `${appliedPromo.discountValue}%` : `${appliedPromo.discountValue.toLocaleString('vi-VN')}đ`})</span>
                        </div>
                        <button onClick={() => { setAppliedPromo(null); setPromoCode(''); }} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Xoá</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Nhập mã khuyến mãi..."
                          value={promoCode}
                          onChange={e => setPromoCode(e.target.value.toUpperCase())}
                          onKeyDown={e => e.key === 'Enter' && handleCheckPromo()}
                          style={{ flex: 1, margin: 0 }}
                        />
                        <button
                          className="btn-primary"
                          onClick={handleCheckPromo}
                          disabled={promoLoading || !promoCode.trim()}
                          style={{ whiteSpace: 'nowrap', padding: '10px 20px', fontSize: '13px' }}
                        >
                          {promoLoading ? '...' : 'Áp dụng'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div><span style={{ fontSize: '13px', color: '#8B8579' }}>Ngày</span><p style={{ fontWeight: '600' }}>{new Date(selectedDate).toLocaleDateString('vi-VN')}</p></div>
                    <div><span style={{ fontSize: '13px', color: '#8B8579' }}>Giờ</span><p style={{ fontWeight: '600' }}>{selectedTime}</p></div>
                    <div><span style={{ fontSize: '13px', color: '#8B8579' }}>Nhân viên phục vụ</span><p style={{ fontWeight: '600', color: '#8B6F47' }}>{getStaffName()}</p></div>
                    <div><span style={{ fontSize: '13px', color: '#8B8579' }}>Tổng thời gian</span><p style={{ fontWeight: '600' }}>{totalDuration} phút (+ 30p buffer)</p></div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '13px', color: '#8B8579' }}>Tổng giá (dự tính)</span>
                      {discountAmount > 0 ? (
                        <>
                          <p style={{ fontSize: '13px', color: '#8B8579', textDecoration: 'line-through', margin: '4px 0 2px' }}>{originalPrice.toLocaleString('vi-VN')}đ</p>
                          <p style={{ fontWeight: '700', color: '#2d6a4f', fontSize: '20px', margin: 0 }}>{totalPrice.toLocaleString('vi-VN')}đ</p>
                          <span style={{ fontSize: '12px', color: '#2d6a4f' }}>Giảm {discountAmount.toLocaleString('vi-VN')}đ</span>
                        </>
                      ) : (
                        <p style={{ fontWeight: '700', color: '#D4AF37', fontSize: '20px' }}>{totalPrice.toLocaleString('vi-VN')}đ</p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button className="btn-secondary" onClick={() => setStep(3)}>Quay lại</button>
                    <button className="btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Đang xử lý...' : 'Xác Nhận Đặt Lịch'}</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
