'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

export default function StaffPayrollPage() {
  const { authFetch } = useAuth();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadPayroll() {
    setLoading(true);
    const res = await authFetch(`/api/staff/payroll?month=${month}&year=${year}`);
    const data = await res.json();
    setPayroll(data.payroll || null);
    setLoading(false);
  }

  useEffect(() => { queueMicrotask(loadPayroll); }, [month, year]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px', color: '#2D2A26' }}>Lương của tôi</h1>
          <p style={{ color: '#8B8579', fontSize: '13px' }}>Theo dõi lương dự kiến theo tháng</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={month} onChange={event => setMonth(Number(event.target.value))} style={inputStyle}>{Array.from({ length: 12 }, (_, index) => index + 1).map(item => <option key={item} value={item}>Tháng {item}</option>)}</select>
          <input type="number" value={year} onChange={event => setYear(Number(event.target.value))} style={{ ...inputStyle, width: '110px' }} />
        </div>
      </div>

      {loading ? <p style={{ color: '#8B8579' }}>Đang tải lương...</p> : !payroll ? <p>Chưa có dữ liệu lương.</p> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
            <Card label="Đơn hoàn thành" value={payroll.completedBookings} />
            <Card label="Doanh thu" value={formatCurrency(payroll.revenue)} />
            <Card label="Hoa hồng" value={formatCurrency(payroll.commissionAmount)} />
            <Card label="Tổng lương" value={formatCurrency(payroll.totalSalary)} highlight />
          </div>
          <section style={{ background: 'white', borderRadius: '14px', padding: '22px', border: '1px solid #F5F1E8' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '21px', color: '#2D2A26', marginBottom: '14px' }}>Chi tiết lương {month}/{year}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
              <Info label="Lương cơ bản" value={formatCurrency(payroll.baseSalary)} />
              <Info label="Tỷ lệ hoa hồng" value={`${payroll.commissionRate}%`} />
              <Info label="Thưởng" value={formatCurrency(payroll.bonus)} />
              <Info label="Phạt/khấu trừ" value={formatCurrency(payroll.penalty)} />
              <Info label="Trạng thái" value={payroll.status === 'paid' ? 'Đã trả' : 'Tạm tính'} />
              <Info label="Ghi chú" value={payroll.note || '-'} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Card({ label, value, highlight }) {
  return <div style={{ background: 'white', borderRadius: '12px', padding: '16px', borderLeft: `4px solid ${highlight ? '#2d6a4f' : '#D4AF37'}` }}><p style={{ color: '#8B8579', fontSize: '12px', fontWeight: 800 }}>{label}</p><p style={{ color: highlight ? '#2d6a4f' : '#2D2A26', fontSize: '22px', fontWeight: 900, marginTop: '5px' }}>{value}</p></div>;
}

function Info({ label, value }) {
  return <div style={{ background: '#FDFBF7', borderRadius: '10px', padding: '13px', border: '1px solid #F5F1E8' }}><p style={{ color: '#8B8579', fontSize: '12px', fontWeight: 800 }}>{label}</p><p style={{ color: '#2D2A26', fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>{value}</p></div>;
}

const inputStyle = { minHeight: '40px', borderRadius: '9px', border: '1px solid #E5E0D8', background: 'white', padding: '0 12px', color: '#2D2A26', fontWeight: 800, outline: 'none' };
