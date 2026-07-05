'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';
import BookingTimeline from '@/components/BookingTimeline';
import { hoursUntilVietnamDateTime, toVietnamISODate, vietnamDateTimeToUTCDate } from '@/lib/vietnamTime';

export default function MyBookingsPage() {
  const { user, authFetch } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [rescheduling, setRescheduling] = useState(false);

  async function loadBookings() {
    const res = await authFetch('/api/bookings/my');
    const data = await res.json();
    setBookings(data.bookings || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    queueMicrotask(loadBookings);
  }, [user]);

  const handleCancel = async (id) => {
    if (cancellingId) return;
    const ok = await confirm('Bạn có chắc muốn huỷ lịch hẹn này? Hành động này không thể hoàn tác.', 'Huỷ lịch hẹn');
    if (!ok) return;
    setCancellingId(id);
    try {
      const res = await authFetch(`/api/bookings/${id}/cancel`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Huỷ lịch thất bại'); setCancellingId(null); return; }
      toast.success('Đã huỷ lịch hẹn thành công');
      loadBookings();
    } catch (err) {
      toast.error('Lỗi kết nối');
    }
    setCancellingId(null);
  };

  const openReschedule = (booking) => {
    setRescheduleBooking(booking);
    setNewDate('');
    setNewTime('');
    setAvailableSlots([]);
  };

  const loadAvailableSlots = async (date, booking = rescheduleBooking) => {
    if (!date || !booking) return;
    const serviceIds = booking.services?.map(service => service._id).join(',') || '';
    const staffId = booking.staffId?._id || 'random';
    const res = await fetch(`/api/bookings/available-slots?date=${date}&staffId=${staffId}&serviceIds=${serviceIds}&excludeBookingId=${booking._id}`);
    const data = await res.json();
    setAvailableSlots(data.availableSlots || []);
  };

  const handleReschedule = async () => {
    if (!rescheduleBooking || !newDate || !newTime || rescheduling) return;
    setRescheduling(true);
    try {
      const res = await authFetch(`/api/bookings/${rescheduleBooking._id}/reschedule`, {
        method: 'PUT',
        body: JSON.stringify({ bookingDate: newDate, startTime: newTime }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Sửa lịch thất bại');
      } else {
        toast.success('Đã cập nhật ngày giờ lịch hẹn');
        setRescheduleBooking(null);
        loadBookings();
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
    setRescheduling(false);
  };

  const canRescheduleBooking = (booking) => {
    if (!['pending', 'confirmed'].includes(booking.status)) return false;
    return hoursUntilVietnamDateTime(booking.bookingDate, booking.startTime || '00:00') >= 24;
  };

  const statusLabel = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', 'checked-in': 'Khách đã đến', completed: 'Hoàn thành', cancelled: 'Đã huỷ' };
  const statusClass = { pending: 'badge-pending', confirmed: 'badge-confirmed', 'checked-in': 'badge-confirmed', completed: 'badge-confirmed', cancelled: 'badge-cancelled' };

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Đang tải...</p></div>;

  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container-custom" style={{ maxWidth: '1000px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '32px', textAlign: 'center', marginBottom: '40px' }}>Lịch Hẹn <span className="gold-text">Của Tôi</span></h1>
          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#F5F1E8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', color: '#8B8579', fontSize: '24px', fontWeight: '700' }}>0</div>
              <p style={{ color: '#8B8579', marginTop: '15px' }}>Bạn chưa có lịch hẹn nào</p>
              <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => router.push('/booking')}>Đặt Lịch Ngay</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {bookings.map((b, i) => (
                <motion.div key={b._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid rgba(212,175,55,0.1)', boxShadow: '0 2px 15px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                        <span className={statusClass[b.status]}>{statusLabel[b.status]}</span>
                        <span style={{ fontSize: '13px', color: '#8B8579' }}>#{b._id.slice(-6)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#555', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <span>Ngày: {new Date(b.bookingDate).toLocaleDateString('vi-VN')}</span>
                        <span>Giờ: {b.startTime}</span>
                        <span>TG: {b.estimatedDuration} phút</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {b.services?.map(s => (
                          <span key={s._id} style={{ background: '#F5F1E8', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '500' }}>{s.serviceName}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#D4AF37', fontWeight: '700', fontSize: '18px' }}>{b.estimatedBillId?.totalPrice?.toLocaleString('vi-VN')}đ</p>
                      {['pending', 'confirmed'].includes(b.status) && (() => {
                        const hoursLeft = hoursUntilVietnamDateTime(b.bookingDate, b.startTime || '00:00');
                        const canCancel = hoursLeft >= 24;
                        return (
                          <motion.button whileHover={canCancel ? { scale: 1.05 } : {}} onClick={() => { if (canCancel) handleCancel(b._id); }} disabled={!canCancel || cancellingId === b._id}
                            title={!canCancel ? 'Chỉ được huỷ online trước tối thiểu 24 giờ so với giờ hẹn' : ''}
                            style={{ marginTop: '10px', padding: '6px 18px', borderRadius: '8px', border: '1px solid #c0392b', background: 'transparent', color: '#c0392b', cursor: !canCancel || cancellingId === b._id ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'var(--font-montserrat), sans-serif', opacity: !canCancel || cancellingId === b._id ? 0.4 : 1, transition: 'all 0.2s' }}>
                            {cancellingId === b._id ? 'Đang huỷ...' : !canCancel ? 'Không thể huỷ online' : 'Huỷ lịch'}
                          </motion.button>
                        );
                      })()}
                      {canRescheduleBooking(b) && (
                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => openReschedule(b)}
                          style={{ marginTop: '10px', marginLeft: '8px', padding: '6px 18px', borderRadius: '8px', border: '1px solid #D4AF37', background: 'transparent', color: '#8B6F47', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'var(--font-montserrat), sans-serif' }}>
                          Sửa ngày/giờ
                        </motion.button>
                      )}
                      {b.status === 'completed' && (
                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => window.open(`/invoice/${b._id}`, '_blank', 'noopener,noreferrer')}
                          style={{ marginTop: '10px', marginLeft: '8px', padding: '6px 18px', borderRadius: '8px', border: '1px solid #D4AF37', background: '#D4AF37', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'var(--font-montserrat), sans-serif' }}>
                          Hóa đơn
                        </motion.button>
                      )}
                    </div>
                  </div>
                  <BookingTimeline booking={b} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {rescheduleBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setRescheduleBooking(null)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={event => event.stopPropagation()} style={{ background: 'white', borderRadius: '16px', padding: '26px', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '22px', marginBottom: '8px' }}>Sửa ngày/giờ lịch hẹn</h3>
            <p style={{ color: '#8B8579', fontSize: '13px', lineHeight: 1.6, marginBottom: '18px' }}>
              Chỉ sửa lịch chờ xác nhận/đã xác nhận, phải trước giờ hẹn hiện tại tối thiểu 24 giờ. Giờ mới cũng phải cách hiện tại tối thiểu 24 giờ và còn nhân viên phù hợp.
            </p>
            <label style={{ display: 'block', fontSize: '13px', color: '#8B6F47', fontWeight: '700', marginBottom: '8px' }}>Ngày mới</label>
            <input
              type="date"
              className="input-field"
              value={newDate}
              min={toVietnamISODate()}
              onChange={(event) => {
                setNewDate(event.target.value);
                setNewTime('');
                loadAvailableSlots(event.target.value, rescheduleBooking);
              }}
            />
            {newDate && (
              <div style={{ marginTop: '18px' }}>
                <p style={{ fontSize: '13px', color: '#8B6F47', fontWeight: '700', marginBottom: '10px' }}>Giờ còn trống</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: '8px' }}>
                  {availableSlots.map(slot => {
                    const slotDT = vietnamDateTimeToUTCDate(newDate, slot);
                    const disabled = (slotDT - new Date()) / (1000 * 60 * 60) < 24;
                    return (
                      <button key={slot} disabled={disabled} onClick={() => setNewTime(slot)} style={{ padding: '10px', borderRadius: '8px', border: newTime === slot ? '2px solid #D4AF37' : '1px solid #E5E0D8', background: disabled ? '#F5F1E8' : newTime === slot ? '#D4AF37' : 'white', color: disabled ? '#C5BFB3' : newTime === slot ? 'white' : '#2D2A26', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: '700' }}>
                        {slot}
                      </button>
                    );
                  })}
                </div>
                {availableSlots.length === 0 && <p style={{ color: '#8B8579', marginTop: '10px' }}>Không còn khung giờ phù hợp cho ngày này.</p>}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
              <button className="btn-secondary" onClick={() => setRescheduleBooking(null)} style={{ padding: '10px 18px' }}>Huỷ</button>
              <button className="btn-primary" onClick={handleReschedule} disabled={!newDate || !newTime || rescheduling} style={{ padding: '10px 18px' }}>{rescheduling ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
