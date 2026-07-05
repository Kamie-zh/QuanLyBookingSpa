'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

const th = { padding: '12px', textAlign: 'left', fontSize: '13px', color: '#2D2A26', fontWeight: '800' };
const td = { padding: '12px', fontSize: '13px', color: '#2D2A26', verticalAlign: 'top' };

export default function InvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading, authFetch } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    async function loadInvoice() {
      const res = await authFetch(`/api/bookings/${id}/invoice`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Không thể tải hóa đơn');
        return;
      }
      setInvoice(data.invoice);
    }

    loadInvoice();
  }, [authLoading, user, id, authFetch, router]);

  if (authLoading || (!invoice && !error)) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải hóa đơn...</div>;
  }

  if (error) {
    return <div className="container-custom" style={{ padding: '60px 0', color: '#9b2226' }}>{error}</div>;
  }

  const subtotal = invoice.services.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div style={{ padding: '40px 0 80px', background: '#F5F1E8' }}>
      <style>{`
        @media print {
          nav, footer, .no-print { display: none !important; }
          body { background: white !important; }
          main { min-height: auto !important; }
          .invoice-sheet { box-shadow: none !important; border: none !important; }
        }
      `}</style>
      <div className="container-custom" style={{ maxWidth: '880px' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => router.back()} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #D4AF37', background: 'white', color: '#8B6F47', cursor: 'pointer', fontWeight: '700' }}>Quay lại</button>
          <button onClick={() => window.print()} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#D4AF37', color: 'white', cursor: 'pointer', fontWeight: '700' }}>In hóa đơn</button>
        </div>

        <div className="invoice-sheet" style={{ background: 'white', borderRadius: '8px', padding: '36px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #EFE6D8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', borderBottom: '2px solid #D4AF37', paddingBottom: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '32px', color: '#8B6F47', margin: 0 }}>Luxe Beauty Spa</h1>
              <p style={{ color: '#8B8579', marginTop: '6px' }}>Hóa đơn dịch vụ</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '13px', color: '#8B8579' }}>Mã booking</p>
              <p style={{ fontWeight: '800', color: '#2D2A26' }}>#{String(invoice.bookingId).slice(-8).toUpperCase()}</p>
              <p style={{ fontSize: '13px', color: '#8B8579', marginTop: '8px' }}>Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px' }}>
            <InfoBlock title="Khách hàng" rows={[
              ['Họ tên', invoice.customer.fullName],
              ['Email', invoice.customer.email],
              ['SĐT', invoice.customer.phone || '-'],
              ['Hạng', invoice.customer.memberType === 'VIP' ? 'VIP' : 'Thường'],
            ]} />
            <InfoBlock title="Lịch hẹn" rows={[
              ['Ngày', new Date(invoice.bookingDate).toLocaleDateString('vi-VN')],
              ['Giờ', invoice.startTime],
              ['Nhân viên', invoice.staff.fullName || '-'],
              ['Hoàn thành', invoice.completedAt ? new Date(invoice.completedAt).toLocaleString('vi-VN') : '-'],
            ]} />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr style={{ background: '#F5F1E8' }}>
                <th style={th}>STT</th>
                <th style={th}>Dịch vụ</th>
                <th style={th}>Loại</th>
                <th style={{ ...th, textAlign: 'right' }}>Thời lượng</th>
                <th style={{ ...th, textAlign: 'right' }}>Đơn giá</th>
              </tr>
            </thead>
            <tbody>
              {invoice.services.map((item, index) => (
                <tr key={`${item.serviceName}-${index}`} style={{ borderBottom: '1px solid #F5F1E8' }}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{item.serviceName}</td>
                  <td style={td}>{item.serviceType || '-'}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{item.duration} phút</td>
                  <td style={{ ...td, textAlign: 'right' }}>{item.price.toLocaleString('vi-VN')}đ</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '320px', maxWidth: '100%' }}>
              <TotalRow label="Tạm tính" value={subtotal} />
              <TotalRow label={invoice.promotionTitle ? `Giảm giá (${invoice.promotionTitle})` : 'Giảm giá'} value={invoice.discountAmount} muted />
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #D4AF37', marginTop: '10px', paddingTop: '12px', fontSize: '20px', fontWeight: '800', color: '#2D2A26' }}>
                <span>Tổng thanh toán</span>
                <span style={{ color: '#D4AF37' }}>{invoice.totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>

          <p style={{ marginTop: '34px', color: '#8B8579', fontSize: '13px', textAlign: 'center' }}>Cảm ơn quý khách đã sử dụng dịch vụ tại Luxe Beauty Spa.</p>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ title, rows }) {
  return (
    <div style={{ border: '1px solid #F0E7D8', borderRadius: '8px', padding: '16px' }}>
      <h3 style={{ color: '#8B6F47', fontSize: '15px', fontWeight: '800', marginBottom: '10px' }}>{title}</h3>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '4px 0', fontSize: '13px' }}>
          <span style={{ color: '#8B8579' }}>{label}</span>
          <span style={{ fontWeight: '700', textAlign: 'right' }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function TotalRow({ label, value, muted }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: muted ? '#8B8579' : '#2D2A26' }}>
      <span>{label}</span>
      <span>{value.toLocaleString('vi-VN')}đ</span>
    </div>
  );
}
