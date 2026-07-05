'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';
import BookingCalendar from '@/components/BookingCalendar';
import BookingTimeline from '@/components/BookingTimeline';

function toISODate(value) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function toMinutes(time = '00:00') {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function overlapsRange(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

const statusLabel = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  'checked-in': 'Khách đã đến',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

const statusClass = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  'checked-in': 'badge-confirmed',
  completed: 'badge-confirmed',
  cancelled: 'badge-cancelled',
};

const statusFilters = ['', 'pending', 'confirmed', 'checked-in', 'completed', 'cancelled'];

export default function AdminBookingsPage() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const busyRef = useRef({});

  const [activeView, setActiveView] = useState('list');
  const [bookings, setBookings] = useState([]);
  const [scheduleBookings, setScheduleBookings] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [addServiceModal, setAddServiceModal] = useState(null);
  const [addingService, setAddingService] = useState(false);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [unavailability, setUnavailability] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');

  async function loadStaff() {
    const res = await authFetch('/api/admin/staff');
    const data = await res.json();
    setStaff(data.staff || []);
  }

  async function loadBookings() {
    const q = filter ? `?status=${filter}` : '';
    const res = await authFetch(`/api/admin/bookings${q}`);
    const data = await res.json();
    setBookings(data.bookings || []);
    setLoading(false);
  }

  async function loadScheduleBookings() {
    const res = await authFetch('/api/admin/bookings');
    const data = await res.json();
    setScheduleBookings(data.bookings || []);
  }

  async function loadServices() {
    const res = await authFetch('/api/admin/services');
    const data = await res.json();
    setServices(data.services || []);
  }

  async function loadUnavailability() {
    const res = await authFetch('/api/admin/staff-unavailability');
    const data = await res.json();
    setUnavailability(data.unavailability || []);
  }

  const refreshBookings = () => {
    loadBookings();
    loadScheduleBookings();
  };

  useEffect(() => {
    queueMicrotask(() => {
      loadServices();
      loadStaff();
      loadUnavailability();
      loadScheduleBookings();
    });
  }, []);

  useEffect(() => { queueMicrotask(loadBookings); }, [filter]);

  const getBlockingUnavailability = (booking) => {
    if (!booking.staffId || ['cancelled', 'completed'].includes(booking.status)) return null;
    const bookingStart = toMinutes(booking.startTime);
    const bookingEnd = bookingStart + Number(booking.estimatedDuration || 0) + Number(booking.bufferTime || 0);
    return unavailability.find(item => {
      const itemStaffId = item.staffId?._id || item.staffId;
      if (itemStaffId !== booking.staffId?._id) return false;
      if (toISODate(item.date) !== toISODate(booking.bookingDate)) return false;
      return overlapsRange(bookingStart, bookingEnd, toMinutes(item.startTime), toMinutes(item.endTime));
    });
  };

  const updateStatus = async (id, status) => {
    const key = `status-${id}`;
    if (busyRef.current[key]) return;
    const labelMap = {
      confirmed: 'xác nhận lịch',
      'checked-in': 'khách đã đến',
      completed: 'hoàn thành dịch vụ',
      cancelled: 'huỷ lịch hẹn',
    };
    const ok = await confirm(`Chuyển trạng thái sang "${labelMap[status] || status}"?`, 'Cập nhật trạng thái');
    if (!ok) return;
    busyRef.current[key] = true;
    try {
      const res = await authFetch(`/api/admin/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Cập nhật thất bại');
      } else {
        const emailMsg = data.emailSent ? ' (Email đã gửi)' : '';
        toast.success(`Cập nhật thành công!${emailMsg}`);
        refreshBookings();
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
    busyRef.current[key] = false;
  };

  const assignStaff = async (bookingId, staffId) => {
    if (!staffId) return;
    try {
      const res = await authFetch(`/api/admin/bookings/${bookingId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ staffId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Đã phân công nhân viên thành công');
        refreshBookings();
        loadUnavailability();
      } else {
        toast.error(data.message || 'Lỗi phân công');
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  const addExtraService = async () => {
    if (!selectedServiceId || addingService) return;
    setAddingService(true);
    try {
      const res = await authFetch(`/api/admin/bookings/${addServiceModal}/add-service`, {
        method: 'PUT',
        body: JSON.stringify({ serviceId: selectedServiceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Thêm thất bại');
      } else {
        toast.success('Đã thêm dịch vụ phát sinh');
        setAddServiceModal(null);
        setSelectedServiceId('');
        refreshBookings();
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
    setAddingService(false);
  };

  const downloadInvoice = (bookingId) => {
    window.open(`/invoice/${bookingId}`, '_blank', 'noopener,noreferrer');
  };

  const affectedBookings = scheduleBookings.filter(booking => getBlockingUnavailability(booking));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px' }}>Quản lý Lịch hẹn</h1>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '100%', paddingBottom: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={() => setActiveView('list')} style={viewButtonStyle(activeView === 'list')}>
            Danh sách lịch hẹn
          </button>
          <button onClick={() => setActiveView('schedule')} style={viewButtonStyle(activeView === 'schedule')}>
            Lịch nhân viên
          </button>
          {activeView === 'list' && statusFilters.map(item => (
            <button key={item || 'all'} onClick={() => setFilter(item)} style={filterButtonStyle(filter === item)}>
              {item === '' ? 'Tất cả' : statusLabel[item]}
            </button>
          ))}
        </div>
      </div>

      {affectedBookings.length > 0 && (
        <section style={{ background: '#FFF5F5', border: '1px solid #F3B7B7', borderLeft: '5px solid #c0392b', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', color: '#8A1F1F', fontWeight: 900, marginBottom: '8px' }}>
            Có {affectedBookings.length} lịch hẹn bị ảnh hưởng do nhân viên bận/nghỉ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {affectedBookings.slice(0, 5).map(booking => {
              const blocked = getBlockingUnavailability(booking);
              return (
                <p key={booking._id} style={{ margin: 0, color: '#6f1d1b', fontSize: '13px', fontWeight: 700 }}>
                  #{booking._id.slice(-6)} - {booking.userId?.fullName || 'Khách hàng'} - {new Date(booking.bookingDate).toLocaleDateString('vi-VN')} {booking.startTime} - {booking.staffId?.fullName} bận {blocked?.startTime}-{blocked?.endTime} ({blocked?.reason || 'không ghi rõ'})
                </p>
              );
            })}
          </div>
        </section>
      )}

      {activeView === 'schedule' ? (
        <BookingCalendar bookings={scheduleBookings} staff={staff} unavailability={unavailability} mode="admin" title="Lịch nhân viên" />
      ) : loading ? (
        <p>Đang tải...</p>
      ) : bookings.length === 0 ? (
        <p style={{ color: '#8B8579', textAlign: 'center', padding: '40px' }}>Không có lịch hẹn nào</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bookings.map((booking, index) => {
            const blocked = getBlockingUnavailability(booking);
            return (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                style={{ background: blocked ? '#FFF9F9' : 'white', borderRadius: '14px', padding: '20px', border: blocked ? '1px solid #F3B7B7' : '1px solid rgba(212,175,55,0.1)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                      <span className={statusClass[booking.status]}>{statusLabel[booking.status]}</span>
                      <span style={{ fontSize: '12px', color: '#8B8579' }}>#{booking._id.slice(-6)}</span>
                    </div>
                    <p style={{ fontWeight: '600', marginBottom: '4px' }}>{booking.userId?.fullName || 'N/A'} {booking.userId?.memberType === 'VIP' ? '[VIP]' : ''}</p>
                    <p style={{ fontSize: '13px', color: '#8B8579' }}>{booking.userId?.email} / {booking.userId?.phone}</p>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '8px', fontSize: '13px', color: '#555', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span>Ngày: {new Date(booking.bookingDate).toLocaleDateString('vi-VN')}</span>
                      <span>Giờ: {booking.startTime}</span>
                      <span>TG: {booking.estimatedDuration} phút</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        Chuyên viên: {booking.staffId ? (
                          <>
                            <strong style={{ color: blocked ? '#c0392b' : '#8B6F47' }}>{booking.staffId.fullName}</strong>
                            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                              <StaffSelect
                                label="-- Đổi nhân viên --"
                                staff={staff.filter(item => item._id !== booking.staffId?._id)}
                                onChange={(staffId) => assignStaff(booking._id, staffId)}
                              />
                            )}
                          </>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#c0392b', fontWeight: '600' }}>Ngẫu nhiên (Chưa gán)</span>
                            <StaffSelect label="-- Giao việc --" staff={staff} onChange={(staffId) => assignStaff(booking._id, staffId)} />
                          </span>
                        )}
                      </span>
                    </div>
                    {blocked && (
                      <p style={{ marginTop: '8px', color: '#c0392b', fontSize: '12px', fontWeight: 800 }}>
                        Cần xử lý: nhân viên bận/nghỉ {blocked.startTime}-{blocked.endTime}. Lý do: {blocked.reason || 'Không ghi rõ'}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {booking.services?.map((service, serviceIndex) => (
                        <span key={`${service._id}-${serviceIndex}`} style={{ background: '#F5F1E8', padding: '3px 10px', borderRadius: '6px', fontSize: '11px' }}>{service.serviceName}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#D4AF37', fontWeight: '700', fontSize: '18px' }}>{booking.estimatedBillId?.totalPrice?.toLocaleString('vi-VN')}đ</p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {booking.status === 'pending' && <ActionButton color="#27ae60" onClick={() => updateStatus(booking._id, 'confirmed')}>Xác nhận</ActionButton>}
                      {booking.status === 'confirmed' && <ActionButton color="#8B6F47" onClick={() => updateStatus(booking._id, 'checked-in')}>Khách đến</ActionButton>}
                      {booking.status === 'checked-in' && <ActionButton color="#2d6a4f" onClick={() => updateStatus(booking._id, 'completed')}>Hoàn thành</ActionButton>}
                      {booking.status === 'completed' && <ActionButton color="#D4AF37" onClick={() => downloadInvoice(booking._id)}>Xuất hóa đơn</ActionButton>}
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && <ActionButton color="#c0392b" onClick={() => updateStatus(booking._id, 'cancelled')}>Huỷ</ActionButton>}
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && <ActionButton color="#D4AF37" onClick={() => setAddServiceModal(booking._id)}>+ Thêm DV</ActionButton>}
                    </div>
                  </div>
                </div>
                <BookingTimeline booking={booking} />
              </motion.div>
            );
          })}
        </div>
      )}

      {addServiceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setAddServiceModal(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={event => event.stopPropagation()} style={{ background: 'white', borderRadius: '16px', padding: '30px', maxWidth: '450px', width: '90%' }}>
            <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '20px', marginBottom: '20px' }}>Thêm dịch vụ phát sinh</h3>
            <select className="input-field" value={selectedServiceId} onChange={event => setSelectedServiceId(event.target.value)} style={{ marginBottom: '20px' }}>
              <option value="">-- Chọn dịch vụ --</option>
              {services.map(service => <option key={service._id} value={service._id}>{service.serviceName} - {service.price?.toLocaleString('vi-VN')}đ</option>)}
            </select>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" style={{ padding: '8px 20px' }} onClick={() => setAddServiceModal(null)}>Huỷ</button>
              <button className="btn-primary" style={{ padding: '8px 20px' }} onClick={addExtraService} disabled={addingService}>{addingService ? 'Đang thêm...' : 'Thêm'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StaffSelect({ label, staff, onChange }) {
  return (
    <select
      onChange={(event) => onChange(event.target.value)}
      defaultValue=""
      style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #D4AF37', fontSize: '12px', outline: 'none', cursor: 'pointer', background: 'white' }}
    >
      <option value="">{label}</option>
      {staff.map(item => <option key={item._id} value={item._id}>{item.fullName}</option>)}
    </select>
  );
}

function ActionButton({ children, color, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: '5px 12px', borderRadius: '6px', background: color, color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
      {children}
    </button>
  );
}

function viewButtonStyle(active) {
  return {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid #2d6a4f',
    background: active ? '#2d6a4f' : 'white',
    color: active ? 'white' : '#2d6a4f',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  };
}

function filterButtonStyle(active) {
  return {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #D4AF37',
    background: active ? '#D4AF37' : 'white',
    color: active ? 'white' : '#8B6F47',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'var(--font-montserrat), sans-serif',
    whiteSpace: 'nowrap',
  };
}
