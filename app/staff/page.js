'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import BookingCalendar from '@/components/BookingCalendar';
import BookingTimeline from '@/components/BookingTimeline';
import { toVietnamISODate } from '@/lib/vietnamTime';

export default function StaffBookingsPage() {
  const { authFetch } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [viewMode, setViewMode] = useState('timeline');
  const [unavailability, setUnavailability] = useState([]);
  const [busyDate, setBusyDate] = useState(toVietnamISODate());
  const [busyStart, setBusyStart] = useState('08:00');
  const [busyEnd, setBusyEnd] = useState('20:00');
  const [busyFullDay, setBusyFullDay] = useState(true);
  const [busyReason, setBusyReason] = useState('');
  const [submittingBusy, setSubmittingBusy] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/staff/bookings');
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadBookings();
    loadUnavailability();
  }, [loadBookings]);

  async function loadUnavailability() {
    try {
      const res = await authFetch('/api/staff/unavailability');
      const data = await res.json();
      setUnavailability(data.unavailability || []);
    } catch (err) {
      console.error(err);
    }
  }

  const submitBusyTime = async (event) => {
    event.preventDefault();
    if (submittingBusy) return;
    setSubmittingBusy(true);
    try {
      const res = await authFetch('/api/staff/unavailability', {
        method: 'POST',
        body: JSON.stringify({
          date: busyDate,
          startTime: busyStart,
          endTime: busyEnd,
          fullDay: busyFullDay,
          reason: busyReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Khong the ghi nhan lich ban/nghi');
      } else {
        setBusyReason('');
        loadUnavailability();
      }
    } catch {
      alert('Khong the ket noi may chu');
    }
    setSubmittingBusy(false);
  };

  const handleUpdateStatus = async (bookingId, newStatus, reason = '') => {
    try {
      const res = await authFetch(`/api/staff/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, cancelReason: reason }),
      });
      const data = await res.json();
      if (res.ok) {
        // Update state locally
        setBookings(prev => prev.map(b => b._id === bookingId ? data.booking : b));
        setSelectedBookingForCancel(null);
        setCancelReason('');
      } else {
        alert(data.message || 'Lỗi khi cập nhật trạng thái');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối đến máy chủ');
    }
  };

  const triggerCancelDialog = (booking) => {
    setSelectedBookingForCancel(booking);
    setCancelReason('Khách không đến cuộc hẹn');
  };

  const submitCancellation = async () => {
    if (!cancelReason.trim()) return;
    setSubmittingCancel(true);
    await handleUpdateStatus(selectedBookingForCancel._id, 'cancelled', cancelReason);
    setSubmittingCancel(false);
  };

  const downloadInvoice = async (bookingId) => {
    window.open(`/invoice/${bookingId}`, '_blank', 'noopener,noreferrer');
  };

  // Group bookings by date for timeline grouping
  const groupBookingsByDate = () => {
    const groups = {};
    bookings.forEach(b => {
      const dateStr = new Date(b.bookingDate).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(b);
    });
    return groups;
  };

  const grouped = groupBookingsByDate();

  const statusLabel = {
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    'checked-in': 'Đã check-in',
    completed: 'Hoàn thành',
    cancelled: 'Đã huỷ'
  };

  const statusColor = {
    pending: { bg: '#FFF3CD', text: '#856404' },
    confirmed: { bg: '#D1ECF1', text: '#0C5460' },
    'checked-in': { bg: '#CCE5FF', text: '#004085' },
    completed: { bg: '#D4EDDA', text: '#155724' },
    cancelled: { bg: '#F8D7DA', text: '#721C24' }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px', color: '#2D2A26' }}>Lịch làm việc của tôi</h1>
          <p style={{ fontSize: '13px', color: '#8B8579' }}>Theo dõi danh sách khách hàng và cập nhật trạng thái làm việc</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {['timeline', 'calendar'].map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #2d6a4f', background: viewMode === mode ? '#2d6a4f' : 'white', color: viewMode === mode ? 'white' : '#2d6a4f', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
              {mode === 'timeline' ? 'Timeline' : 'Calendar'}
            </button>
          ))}
          <button 
            onClick={loadBookings} 
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #D4AF37', background: 'transparent', color: '#D4AF37', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
          >
            Làm mới
          </button>
        </div>
      </div>

      <section style={{ background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid rgba(212,175,55,0.15)', marginBottom: '22px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <form onSubmit={submitBusyTime} style={{ flex: '1 1 420px' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '20px', color: '#2D2A26', marginBottom: '10px' }}>Báo bận/nghỉ</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', alignItems: 'end' }}>
              <label style={fieldLabelStyle}>
                Ngày
                <input type="date" value={busyDate} onChange={event => setBusyDate(event.target.value)} style={fieldInputStyle} required />
              </label>
              <label style={{ ...fieldLabelStyle, flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: '8px', paddingTop: '20px' }}>
                <input type="checkbox" checked={busyFullDay} onChange={event => setBusyFullDay(event.target.checked)} />
                Nghỉ cả ngày
              </label>
              {!busyFullDay && (
                <>
                  <label style={fieldLabelStyle}>
                    Từ
                    <input type="time" value={busyStart} onChange={event => setBusyStart(event.target.value)} style={fieldInputStyle} />
                  </label>
                  <label style={fieldLabelStyle}>
                    Đến
                    <input type="time" value={busyEnd} onChange={event => setBusyEnd(event.target.value)} style={fieldInputStyle} />
                  </label>
                </>
              )}
              <label style={{ ...fieldLabelStyle, gridColumn: '1 / -1' }}>
                Lý do
                <input value={busyReason} onChange={event => setBusyReason(event.target.value)} placeholder="Ví dụ: bệnh, việc cá nhân, đào tạo..." style={fieldInputStyle} />
              </label>
            </div>
            <button type="submit" disabled={submittingBusy} style={{ marginTop: '12px', padding: '9px 16px', borderRadius: '9px', border: 'none', background: '#2d6a4f', color: 'white', fontWeight: 800, cursor: submittingBusy ? 'not-allowed' : 'pointer', opacity: submittingBusy ? 0.65 : 1 }}>
              {submittingBusy ? 'Đang lưu...' : 'Gửi báo bận'}
            </button>
          </form>

          <div style={{ flex: '1 1 260px' }}>
            <h3 style={{ fontSize: '14px', color: '#8B6F47', fontWeight: 900, marginBottom: '10px' }}>Lịch bận/nghỉ sắp tới</h3>
            {unavailability.length === 0 ? (
              <p style={{ color: '#8B8579', fontSize: '13px' }}>Chưa có lịch bận/nghỉ.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '190px', overflowY: 'auto' }}>
                {unavailability.map(item => (
                  <div key={item._id} style={{ border: '1px solid #F5F1E8', borderRadius: '10px', padding: '9px 10px', background: '#FFFCF4' }}>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#2D2A26' }}>{new Date(item.date).toLocaleDateString('vi-VN')} - {item.fullDay ? 'Cả ngày' : `${item.startTime} - ${item.endTime}`}</strong>
                    <span style={{ fontSize: '12px', color: '#8B8579' }}>{item.reason || 'Không ghi rõ lý do'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#8B6F47' }}>Đang tải danh sách lịch hẹn...</div>
      ) : bookings.length === 0 ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '14px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <p style={{ color: '#8B8579', fontSize: '15px' }}>Bạn không có lịch hẹn nào được phân công.</p>
        </div>
      ) : viewMode === 'calendar' ? (
        <BookingCalendar bookings={bookings} mode="staff" title="Lịch làm việc theo ngày" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {Object.keys(grouped).map((dateGroup, gIdx) => (
            <div key={dateGroup}>
              <h3 style={{ fontSize: '15px', color: '#8B6F47', fontWeight: '600', marginBottom: '15px', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#D4AF37' }}></span>
                {dateGroup}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderLeft: '2px solid rgba(212,175,55,0.15)', paddingLeft: '15px', marginLeft: '3px' }}>
                {grouped[dateGroup].map(booking => {
                  const statusColors = statusColor[booking.status] || { bg: '#F5F1E8', text: '#8B8579' };
                  return (
                    <motion.div 
                      key={booking._id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid rgba(212,175,55,0.05)', position: 'relative' }}
                    >
                      {/* Timeline Dot overlay */}
                      <div style={{ position: 'absolute', left: '-21px', top: '26px', width: '10px', height: '10px', borderRadius: '50%', background: '#D4AF37', border: '2px solid #F5F1E8' }}></div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-start' }}>
                        <div>
                          {/* Time */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '18px', fontWeight: '700', color: '#D4AF37' }}>{booking.startTime}</span>
                            <span style={{ fontSize: '12px', color: '#8B8579' }}>({booking.estimatedDuration} phút)</span>
                            <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: statusColors.bg, color: statusColors.text }}>
                              {statusLabel[booking.status] || booking.status}
                            </span>
                          </div>

                          {/* Client Detail */}
                          <div style={{ marginBottom: '12px' }}>
                            <p style={{ fontWeight: '600', color: '#2D2A26', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
                              {booking.userId?.fullName}
                              {booking.userId?.memberType === 'VIP' && (
                                <span style={{ background: '#FFF3CD', color: '#D4AF37', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>VIP</span>
                              )}
                            </p>
                            <p style={{ fontSize: '12px', color: '#8B8579' }}>SĐT: {booking.userId?.phone || 'Chưa cung cấp'} | Email: {booking.userId?.email}</p>
                          </div>

                          {/* Services */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {booking.services?.map(s => (
                              <span key={s._id} style={{ fontSize: '11px', background: '#F5F1E8', color: '#8B6F47', padding: '3px 8px', borderRadius: '6px', fontWeight: '500' }}>
                                {s.serviceName}
                              </span>
                            ))}
                          </div>

                          {booking.cancelReason && (
                            <p style={{ fontSize: '12px', color: '#c0392b', fontStyle: 'italic', marginTop: '10px' }}>
                              Lý do huỷ: {booking.cancelReason}
                            </p>
                          )}
                        </div>

                        {/* Interactive Buttons */}
                        <div style={{ display: 'flex', gap: '8px', alignSelf: 'center' }}>
                          {booking.status === 'pending' || booking.status === 'confirmed' ? (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(booking._id, 'checked-in')}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#D4AF37', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                              >
                                Khách đến
                              </button>
                              <button 
                                onClick={() => triggerCancelDialog(booking)}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #721C24', background: 'transparent', color: '#721C24', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                              >
                                Báo huỷ
                              </button>
                            </>
                          ) : booking.status === 'checked-in' ? (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(booking._id, 'completed')}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#27ae60', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                              >
                                Hoàn thành
                              </button>
                              <button 
                                onClick={() => triggerCancelDialog(booking)}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #721C24', background: 'transparent', color: '#721C24', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                              >
                                Báo huỷ
                              </button>
                            </>
                          ) : booking.status === 'completed' ? (
                            <button
                              onClick={() => downloadInvoice(booking._id)}
                              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#D4AF37', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                            >
                              Xuất hóa đơn
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <BookingTimeline booking={booking} />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Modal */}
      <AnimatePresence>
        {selectedBookingForCancel && (
          <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} onClick={() => setSelectedBookingForCancel(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '400px', maxWidth: '90vw', background: 'white', zIndex: 101, padding: '25px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', transformOrigin: 'center center' }}
            >
              <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '18px', color: '#2D2A26', marginBottom: '15px' }}>Báo cáo huỷ lịch hẹn</h3>
              <p style={{ fontSize: '13px', color: '#8B8579', marginBottom: '15px' }}>Bạn đang thực hiện huỷ lịch hẹn của khách hàng <strong>{selectedBookingForCancel.userId?.fullName}</strong> lúc {selectedBookingForCancel.startTime}. Vui lòng nhập lý do:</p>
              
              <textarea 
                className="input-field"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Nhập lý do huỷ cuộc hẹn..."
                rows={4}
                style={{ width: '100%', resize: 'none', marginBottom: '20px', fontFamily: 'inherit' }}
              />

              <div style={{ display: 'flex', justifyContext: 'flex-end', gap: '10px' }}>
                <button 
                  onClick={() => setSelectedBookingForCancel(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E5E0D8', background: 'transparent', color: '#8B8579', cursor: 'pointer', fontWeight: '600' }}
                >
                  Bỏ qua
                </button>
                <button 
                  onClick={submitCancellation}
                  disabled={submittingCancel || !cancelReason.trim()}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#721C24', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                >
                  {submittingCancel ? 'Đang huỷ...' : 'Xác nhận huỷ'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const fieldLabelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '12px',
  color: '#8B8579',
  fontWeight: 800,
};

const fieldInputStyle = {
  minHeight: '40px',
  borderRadius: '9px',
  border: '1px solid #E5E0D8',
  background: 'white',
  padding: '0 12px',
  color: '#2D2A26',
  fontWeight: 700,
  outline: 'none',
};
