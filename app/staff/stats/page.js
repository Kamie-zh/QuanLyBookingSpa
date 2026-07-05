'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


// Custom Wheel Picker Component (identical to Admin for visual consistency)
const WheelPicker = ({ value, options, onChange, label }) => {
  const index = options.indexOf(value);
  const handleScroll = (direction) => {
    if (direction === 'up' && index > 0) {
      onChange(options[index - 1]);
    } else if (direction === 'down' && index < options.length - 1) {
      onChange(options[index + 1]);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      handleScroll('down');
    } else {
      handleScroll('up');
    }
  };

  const prevVal = index > 0 ? options[index - 1] : '';
  const nextVal = index < options.length - 1 ? options[index + 1] : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px' }}>
      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8B8579', fontWeight: '600', marginBottom: '6px' }}>{label}</span>
      <div 
        onWheel={handleWheel}
        style={{
          position: 'relative',
          height: '110px',
          width: '100%',
          background: 'linear-gradient(to bottom, #fcfaf7 0%, #ffffff 50%, #fcfaf7 100%)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          cursor: 'ns-resize',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ position: 'absolute', top: '35px', left: '10%', right: '10%', height: '1px', background: 'rgba(212,175,55,0.2)' }} />
        <div style={{ position: 'absolute', bottom: '35px', left: '10%', right: '10%', height: '1px', background: 'rgba(212,175,55,0.2)' }} />

        <div 
          onClick={() => prevVal && onChange(prevVal)}
          style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4BEB5', fontSize: '13px', opacity: 0.6, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          {prevVal}
        </div>

        <div style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontSize: '18px', fontWeight: '700', transition: 'all 0.2s' }}>
          {value}
        </div>

        <div 
          onClick={() => nextVal && onChange(nextVal)}
          style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4BEB5', fontSize: '13px', opacity: 0.6, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          {nextVal}
        </div>
      </div>
    </div>
  );
};

const MonthYearWheelSelector = ({ month, year, onChange }) => {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 6 }, (_, i) => 2024 + i);

  return (
    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '10px 15px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
      <WheelPicker value={month} options={months} onChange={(m) => onChange(m, year)} label="Tháng" />
      <div style={{ width: '1px', height: '60px', background: '#F5F1E8', marginTop: '15px' }} />
      <WheelPicker value={year} options={years} onChange={(y) => onChange(month, y)} label="Năm" />
    </div>
  );
};

export default function StaffStatsPage() {
  const { authFetch } = useAuth();
  const [statsData, setStatsData] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/staff/stats?month=${month}&year=${year}`);
      const data = await res.json();
      setStatsData(data.chartData || []);
      setCompletedBookings(data.completedBookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year, authFetch]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const totalRevenue = statsData.reduce((sum, item) => sum + item.revenue, 0);
  const activeDays = statsData.filter(item => item.revenue > 0).length;

  const downloadReport = async () => {
    const res = await authFetch(`/api/staff/stats/export?month=${month}&year=${year}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-doanh-thu-ca-nhan-${month}-${year}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadInvoice = async (bookingId) => {
    window.open(`/invoice/${bookingId}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px', color: '#2D2A26' }}>Doanh thu cá nhân</h1>
          <p style={{ fontSize: '13px', color: '#8B8579' }}>Theo dõi hiệu suất làm việc và doanh thu của bạn theo tháng</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={downloadReport} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#2d6a4f', color: 'white', cursor: 'pointer', fontWeight: '700' }}>
            Xuất Excel
          </button>
          <MonthYearWheelSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'white', borderRadius: '16px', padding: '25px', borderLeft: '4px solid #D4AF37', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}
        >
          <p style={{ fontSize: '13px', color: '#8B8579', marginBottom: '5px' }}>Tổng doanh thu của bạn</p>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#D4AF37' }}>
            {totalRevenue.toLocaleString('vi-VN')}đ
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          style={{ background: 'white', borderRadius: '16px', padding: '25px', borderLeft: '4px solid #8B6F47', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}
        >
          <p style={{ fontSize: '13px', color: '#8B8579', marginBottom: '5px' }}>Số ngày có lịch hoàn thành</p>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#8B6F47' }}>
            {activeDays} ngày
          </p>
        </motion.div>
      </div>

      {/* Horizontal Scrollable Line Chart */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '18px', color: '#2D2A26' }}>Doanh thu chi tiết theo ngày</h3>
          <span style={{ fontSize: '12px', color: '#8B8579', fontStyle: 'italic' }}>* Kéo ngang biểu đồ để xem chi tiết tất cả các ngày</span>
        </div>

        {loading ? (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B6F47' }}>
            Đang tải dữ liệu biểu đồ...
          </div>
        ) : (
          <div style={{ overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'thin' }}>
            <div style={{ minWidth: '1000px', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={statsData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5F1E8" />
                  <XAxis dataKey="day" label={{ value: 'Ngày trong tháng', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: '#8B8579' } }} fontSize={12} stroke="#8B8579" />
                  <YAxis tickFormatter={(v) => `${(v/1000).toLocaleString('vi-VN')}k`} fontSize={12} stroke="#8B8579" />
                  <Tooltip formatter={(value) => [`${value.toLocaleString('vi-VN')}đ`, 'Doanh thu']} labelFormatter={(label) => `Ngày ${label}`} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#D4AF37" 
                    strokeWidth={3} 
                    activeDot={{ r: 8 }} 
                    dot={{ stroke: '#8B6F47', strokeWidth: 2, r: 4, fill: 'white' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '18px', color: '#2D2A26', marginBottom: '15px' }}>Lịch sử đơn đã hoàn thành</h3>
        {completedBookings.length === 0 ? (
          <p style={{ color: '#8B8579' }}>Bạn chưa có đơn hoàn thành trong tháng đã chọn.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F5F1E8' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Ngày</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Khách</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Dịch vụ</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Doanh thu</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {completedBookings.map(b => (
                  <tr key={b._id} style={{ borderBottom: '1px solid #F5F1E8' }}>
                    <td style={{ padding: '10px' }}>{new Date(b.bookingDate).toLocaleDateString('vi-VN')} {b.startTime}</td>
                    <td style={{ padding: '10px' }}>{b.userId?.fullName || '-'}</td>
                    <td style={{ padding: '10px' }}>{b.services?.map(s => s.serviceName).join(', ')}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#D4AF37', fontWeight: '700' }}>{b.estimatedBillId?.totalPrice?.toLocaleString('vi-VN')}đ</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button onClick={() => downloadInvoice(b._id)} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#D4AF37', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>Hóa đơn</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
