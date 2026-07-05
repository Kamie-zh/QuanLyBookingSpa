'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';

export default function AdminCustomersPage() {
  const { authFetch } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(null);
  const [drawerBookings, setDrawerBookings] = useState([]);
  const [drawerSummary, setDrawerSummary] = useState(null);

  const loadCustomers = useCallback(async () => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await authFetch(`/api/admin/customers${q}`);
    const data = await res.json();
    setCustomers(data.customers || []);
  }, [authFetch, search]);

  useEffect(() => { queueMicrotask(loadCustomers); }, [loadCustomers]);

  const openDrawer = async (id) => {
    setDrawerOpen(id);
    setDrawerSummary(null);
    const res = await authFetch(`/api/admin/customers/${id}/bookings`);
    const data = await res.json();
    setDrawerBookings(data.bookings || []);
    setDrawerSummary(data.summary || null);
  };

  const statusLabel = { pending: 'Chờ', confirmed: 'Xác nhận', 'checked-in': 'Đã đến', completed: 'Hoàn thành', cancelled: 'Huỷ' };
  const statusClass = { pending: 'badge-pending', confirmed: 'badge-confirmed', 'checked-in': 'badge-confirmed', completed: 'badge-confirmed', cancelled: 'badge-cancelled' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px' }}>Quản lý Khách hàng</h1>
        <input className="input-field" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '300px' }} />
      </div>

      <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead><tr style={{ background: '#F5F1E8' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Khách hàng</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Điện thoại</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>Hạng</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Stylist ưa thích</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>Bookings</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>Tổng chi</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}></th>
            </tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c._id} style={{ borderBottom: '1px solid #F5F1E8' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontWeight: '600' }}>{c.fullName}</p>
                    <p style={{ fontSize: '12px', color: '#8B8579' }}>{c.email}</p>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{c.phone || '-'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', background: c.memberType === 'VIP' ? '#FFF3CD' : '#F5F1E8', color: c.memberType === 'VIP' ? '#D4AF37' : '#8B8579' }}>
                      {c.memberType === 'VIP' ? 'VIP' : 'Thường'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'left', color: '#8B6F47', fontWeight: '500' }}>
                    {c.preferredStaff}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>{c.totalBookings}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#D4AF37', fontWeight: '600' }}>{c.totalEstimatedAmount?.toLocaleString('vi-VN')}đ</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button onClick={() => openDrawer(c._id)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #D4AF37', background: 'transparent', color: '#D4AF37', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Lịch sử</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100 }} onClick={() => setDrawerOpen(null)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
              style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '420px', maxWidth: '90vw', background: 'white', zIndex: 101, padding: '30px', overflowY: 'auto', boxShadow: '-5px 0 30px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '20px' }}>Lịch sử đặt lịch</h3>
                <button onClick={() => setDrawerOpen(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#8B8579' }}>X</button>
              </div>
              {drawerSummary && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', background: '#FDFBF7', borderRadius: '10px', border: '1px solid #F5F1E8' }}>
                    <p style={{ fontSize: '12px', color: '#8B8579' }}>Tổng booking ghi nhận</p>
                    <p style={{ fontWeight: '700' }}>{drawerSummary.storedTotalBookings}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#FDFBF7', borderRadius: '10px', border: '1px solid #F5F1E8' }}>
                    <p style={{ fontSize: '12px', color: '#8B8579' }}>Tổng chi ghi nhận</p>
                    <p style={{ fontWeight: '700', color: '#D4AF37' }}>{drawerSummary.storedTotalEstimatedAmount?.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
              )}
              {drawerBookings.length === 0 ? (
                <div style={{ color: '#8B8579', lineHeight: 1.6 }}>
                  <p>Không tìm thấy bản ghi booking chi tiết.</p>
                  {drawerSummary?.storedTotalBookings > 0 && (
                    <p style={{ marginTop: '8px' }}>Khách này vẫn có thống kê tổng lượt/tổng chi trên hồ sơ. Dữ liệu thống kê có thể được tạo từ bản ghi cũ hoặc booking chi tiết đã bị xoá/không liên kết userId.</p>
                  )}
                </div>
              ) : drawerBookings.map(b => (
                <div key={b._id} style={{ padding: '15px', background: '#F5F1E8', borderRadius: '12px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className={statusClass[b.status]}>{statusLabel[b.status]}</span>
                    <span style={{ color: '#D4AF37', fontWeight: '600' }}>{b.estimatedBillId?.totalPrice?.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <p style={{ fontSize: '13px' }}>Ngày: {new Date(b.bookingDate).toLocaleDateString('vi-VN')} / Giờ: {b.startTime}</p>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {b.services?.map(s => <span key={s._id} style={{ fontSize: '11px', background: 'white', padding: '2px 8px', borderRadius: '4px' }}>{s.serviceName}</span>)}
                  </div>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
