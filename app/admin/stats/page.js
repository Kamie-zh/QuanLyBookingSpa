'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const REPORT_TYPES = [
  { key: 'staff', label: 'Thống kê theo nhân viên', description: 'Doanh thu nhân viên từ cao đến thấp' },
  { key: 'service', label: 'Thống kê theo dịch vụ', description: 'Dịch vụ được khách chọn nhiều nhất' },
  { key: 'customer', label: 'Thống kê theo khách hàng', description: 'Khách hàng có hóa đơn cao đến thấp' },
  { key: 'time', label: 'Thống kê theo thời gian', description: 'Doanh thu theo ngày trong khoảng đã chọn' },
  { key: 'invoice', label: 'Thống kê theo hóa đơn', description: 'óa đơn doanh thu cao đến thấp' },
];

const RANGE_OPTIONS = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'yesterday', label: 'Hôm qua' },
  { key: 'thisWeek', label: 'Tuần nay' },
  { key: 'lastWeek', label: 'Tuần trước' },
  { key: 'thisMonth', label: 'Tháng nay' },
  { key: 'lastMonth', label: 'Tháng trước' },
  { key: 'custom', label: 'Tùy chọn ngày' },
];

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')}d`;
const formatDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '-';
const todayISO = () => new Date().toISOString().slice(0, 10);

function SelectField({ label, value, onChange, children, style }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#8B8579', fontWeight: '700', ...style }}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ minHeight: '42px', borderRadius: '10px', border: '1px solid #E5E0D8', background: 'white', padding: '0 12px', color: '#2D2A26', fontWeight: '700', outline: 'none' }}
      >
        {children}
      </select>
    </label>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#8B8579', fontWeight: '700' }}>
      {label}
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ minHeight: '42px', borderRadius: '10px', border: '1px solid #E5E0D8', background: 'white', padding: '0 12px', color: '#2D2A26', fontWeight: '700', outline: 'none' }}
      />
    </label>
  );
}

function EmptyState() {
  return <p style={{ color: '#8B8579', padding: '25px 0', textAlign: 'center' }}>Khong co du lieu trong khoang thoi gian nay.</p>;
}

function RevenueChart({ data, chartType, xKey, yKey, tooltipLabel }) {
  if (!data.length) return <EmptyState />;

  const Chart = chartType === 'line' ? LineChart : BarChart;
  return (
    <ResponsiveContainer width="100%" height={320}>
      <Chart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F5F1E8" />
        <XAxis dataKey={xKey} fontSize={12} stroke="#8B8579" />
        <YAxis fontSize={12} stroke="#8B8579" tickFormatter={(value) => `${Math.round(value / 1000).toLocaleString('vi-VN')}k`} />
        <Tooltip formatter={(value) => [formatCurrency(value), tooltipLabel]} />
        {chartType === 'line' ? (
          <Line type="monotone" dataKey={yKey} stroke="#D4AF37" strokeWidth={3} dot={{ r: 4 }} />
        ) : (
          <Bar dataKey={yKey} fill="#D4AF37" radius={[6, 6, 0, 0]} />
        )}
      </Chart>
    </ResponsiveContainer>
  );
}

function DataTable({ columns, rows }) {
  if (!rows.length) return <EmptyState />;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#F5F1E8' }}>
            {columns.map(column => (
              <th key={column.key} style={{ padding: '12px', textAlign: column.align || 'left', color: '#2D2A26', whiteSpace: 'nowrap' }}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row._id || row.bookingId || index} style={{ borderBottom: '1px solid #F5F1E8' }}>
              {columns.map(column => (
                <td key={column.key} style={{ padding: '12px', textAlign: column.align || 'left', color: column.color || '#2D2A26', fontWeight: column.bold ? '700' : '500', whiteSpace: column.nowrap ? 'nowrap' : 'normal' }}>
                  {column.render ? column.render(row, index) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminStatsPage() {
  const { user, authFetch } = useAuth();
  const [reportType, setReportType] = useState('staff');
  const [range, setRange] = useState('today');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [chartType, setChartType] = useState('bar');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [exportEmail, setExportEmail] = useState('');
  const [sendingExport, setSendingExport] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  async function loadStats() {
    setLoading(true);
    const params = new URLSearchParams({ range });
    if (range === 'custom') {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    }
    const res = await authFetch(`/api/admin/stats?${params.toString()}`);
    const data = await res.json();
    setStats(data);
    setLoading(false);
  }

  function openExportModal() {
    setExportEmail(user?.email || '');
    setExportMessage('');
    setShowEmailModal(true);
  }

  async function sendReportEmail(event) {
    event.preventDefault();
    if (sendingExport) return;
    setSendingExport(true);
    setExportMessage('');
    const params = new URLSearchParams({ view: reportType, range });
    if (range === 'custom') {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    }
    try {
      const res = await authFetch(`/api/admin/stats/export?${params.toString()}`, {
        method: 'POST',
        body: JSON.stringify({ email: exportEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExportMessage(data.message || 'Gửi báo cáo thất bại. Vui lòng thử lại.');
      } else {
        setExportMessage(data.message || 'Đã gửi báo cáo qua email');
      }
    } catch {
      setExportMessage('Lỗi kết nối khi gửi báo cáo');
    }
    setSendingExport(false);
  }

  useEffect(() => {
    queueMicrotask(loadStats);
  }, [range, startDate, endDate]);

  const activeReport = REPORT_TYPES.find(item => item.key === reportType) || REPORT_TYPES[0];
  const staffChartData = useMemo(() => (stats?.staffStats || []).map(item => ({
    ...item,
    shortName: item.staffName?.length > 14 ? `${item.staffName.slice(0, 14)}...` : item.staffName,
  })), [stats]);
  const timeChartData = useMemo(() => (stats?.timeStats || []).map(item => ({
    ...item,
    label: item.date?.slice(5),
  })), [stats]);

  const renderReport = () => {
    if (loading || !stats) {
      return <p style={{ color: '#8B8579', padding: '40px 0', textAlign: 'center' }}>Dang tai thong ke...</p>;
    }

    if (reportType === 'staff') {
      return (
        <>
          <RevenueChart data={staffChartData} chartType={chartType} xKey="shortName" yKey="revenue" tooltipLabel="Doanh thu" />
          <DataTable
            rows={stats.staffStats || []}
            columns={[
              { key: 'rank', label: '#', render: (_, index) => index + 1, align: 'center', nowrap: true },
              { key: 'staffName', label: 'Nhan vien', bold: true },
              { key: 'completedBookings', label: 'Don hoan thanh', align: 'center', nowrap: true },
              { key: 'revenue', label: 'Doanh thu', align: 'right', color: '#D4AF37', bold: true, render: row => formatCurrency(row.revenue), nowrap: true },
            ]}
          />
        </>
      );
    }

    if (reportType === 'service') {
      return (
        <DataTable
          rows={stats.serviceStats || []}
          columns={[
            { key: 'rank', label: '#', render: (_, index) => index + 1, align: 'center', nowrap: true },
            { key: 'serviceName', label: 'Dịch vụ', bold: true },
            { key: 'serviceType', label: 'Loại', align: 'center', nowrap: true },
            { key: 'bookingCount', label: 'Số lần khách chọn', align: 'center', bold: true, nowrap: true },
            { key: 'price', label: 'Giá dịch vụ', align: 'right', render: row => formatCurrency(row.price), nowrap: true },
            { key: 'estimatedRevenue', label: 'Doanh thu ước tính', align: 'right', color: '#D4AF37', bold: true, render: row => formatCurrency(row.estimatedRevenue), nowrap: true },
          ]}
        />
      );
    }

    if (reportType === 'customer') {
      return (
        <DataTable
          rows={stats.customerStats || []}
          columns={[
            { key: 'rank', label: '#', render: (_, index) => index + 1, align: 'center', nowrap: true },
            { key: 'customerName', label: 'Khách hàng', bold: true },
            { key: 'phone', label: 'SDT', nowrap: true },
            { key: 'memberType', label: 'Hạng', align: 'center', nowrap: true },
            { key: 'invoiceCount', label: 'Số hóa đơn', align: 'center', nowrap: true },
            { key: 'revenue', label: 'Tổng chi tiêu', align: 'right', color: '#D4AF37', bold: true, render: row => formatCurrency(row.revenue), nowrap: true },
          ]}
        />
      );
    }

    if (reportType === 'time') {
      return (
        <>
          <RevenueChart data={timeChartData} chartType={chartType} xKey="label" yKey="revenue" tooltipLabel="Doanh thu" />
          <DataTable
            rows={stats.timeStats || []}
            columns={[
              { key: 'date', label: 'Ngày', render: row => formatDate(row.date), nowrap: true },
              { key: 'invoiceCount', label: 'Số hóa đơn', align: 'center', nowrap: true },
              { key: 'revenue', label: 'Doanh thu', align: 'right', color: '#D4AF37', bold: true, render: row => formatCurrency(row.revenue), nowrap: true },
            ]}
          />
        </>
      );
    }

    return (
      <DataTable
        rows={stats.invoiceStats || []}
        columns={[
          { key: 'rank', label: '#', render: (_, index) => index + 1, align: 'center', nowrap: true },
          { key: 'bookingDate', label: 'Ngày', render: row => `${formatDate(row.bookingDate)} ${row.startTime || ''}`, nowrap: true },
          { key: 'customerName', label: 'Khách hàng', bold: true },
          { key: 'staffName', label: 'Nhân viên' },
          { key: 'services', label: 'Dịch vụ', render: row => row.services?.join(', ') || '-' },
          { key: 'totalPrice', label: 'Doanh thu', align: 'right', color: '#D4AF37', bold: true, render: row => formatCurrency(row.totalPrice), nowrap: true },
        ]}
      />
    );
  };

  const summary = stats?.summary || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '18px', flexWrap: 'wrap', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px', color: '#2D2A26' }}>Thong ke & Bao cao</h1>
          <p style={{ color: '#8B8579', fontSize: '13px', marginTop: '4px' }}>{activeReport.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <SelectField label="Loại thống kê" value={reportType} onChange={setReportType} style={{ minWidth: '250px' }}>
            {REPORT_TYPES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
          </SelectField>
          <SelectField label="Thời gian" value={range} onChange={setRange} style={{ minWidth: '170px' }}>
            {RANGE_OPTIONS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
          </SelectField>
          {(reportType === 'staff' || reportType === 'time') && (
            <SelectField label="Dạng biểu đồ" value={chartType} onChange={setChartType} style={{ minWidth: '130px' }}>
              <option value="bar">Cột</option>
              <option value="line">Đường</option>
            </SelectField>
          )}
          <button
            onClick={openExportModal}
            disabled={loading}
            style={{ minHeight: '42px', padding: '0 16px', borderRadius: '10px', border: 'none', background: '#2d6a4f', color: 'white', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            Xuất Excel
          </button>
        </div>
      </div>

      {range === 'custom' && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px', background: 'white', borderRadius: '12px', padding: '14px', border: '1px solid #F5F1E8' }}>
          <DateField label="Ngày bắt đầu" value={startDate} onChange={setStartDate} />
          <DateField label="Ngày kết thúc" value={endDate} onChange={setEndDate} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Bookings', value: summary.totalBookings || 0, color: '#D4AF37' },
          { label: 'Revenue', value: formatCurrency(summary.totalRevenue || 0), color: '#2d6a4f' },
          { label: 'Customers', value: summary.totalCustomers || 0, color: '#8B6F47' },
          { label: 'Services', value: summary.totalServices || 0, color: '#B8956A' },
          { label: 'Invoices', value: summary.totalInvoices || 0, color: '#2D2A26' },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            style={{ background: 'white', borderRadius: '12px', padding: '18px', borderLeft: `4px solid ${item.color}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}
          >
            <p style={{ color: '#8B8579', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>{item.label}</p>
            <p style={{ color: item.color, fontSize: '23px', fontWeight: '800' }}>{item.value}</p>
          </motion.div>
        ))}
      </div>

      <section style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #F5F1E8', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '20px', color: '#2D2A26' }}>{activeReport.label}</h2>
            {stats && <p style={{ color: '#8B8579', fontSize: '12px', marginTop: '4px' }}>Tu {formatDate(stats.startDate)} den {formatDate(stats.endDate)}</p>}
          </div>
          <SelectField label="Đổi view nhanh" value={reportType} onChange={setReportType} style={{ minWidth: '230px' }}>
            {REPORT_TYPES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
          </SelectField>
        </div>
        {renderReport()}
      </section>

      {showEmailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowEmailModal(false)}>
          <motion.form
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onSubmit={sendReportEmail}
            onClick={(event) => event.stopPropagation()}
            style={{ width: '100%', maxWidth: '460px', background: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
          >
            <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '22px', color: '#2D2A26', marginBottom: '8px' }}>Gui file Excel qua email</h3>
            <p style={{ color: '#8B8579', fontSize: '13px', lineHeight: 1.6, marginBottom: '18px' }}>
              Nhập email muốn nhận báo cáo. Mặc định là email của tài khoản đang đăng nhập.
            </p>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#8B6F47', fontWeight: '800', marginBottom: '14px' }}>
              Email nhận báo cáo
              <input
                type="email"
                required
                value={exportEmail}
                onChange={(event) => setExportEmail(event.target.value)}
                placeholder="email@example.com"
                style={{ minHeight: '44px', borderRadius: '10px', border: '1px solid #E5E0D8', padding: '0 12px', outline: 'none', color: '#2D2A26', fontWeight: '600' }}
              />
            </label>
            {exportMessage && (
              <p style={{ padding: '10px 12px', borderRadius: '8px', background: exportMessage.includes('Da gui') ? '#F0FFF4' : '#FFF5F5', color: exportMessage.includes('Da gui') ? '#2d6a4f' : '#c0392b', fontSize: '13px', marginBottom: '14px' }}>
                {exportMessage}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setShowEmailModal(false)} style={{ minHeight: '40px', padding: '0 16px', borderRadius: '9px', border: '1px solid #E5E0D8', background: 'white', color: '#8B6F47', fontWeight: '800', cursor: 'pointer' }}>Đóng</button>
              <button type="submit" disabled={sendingExport} style={{ minHeight: '40px', padding: '0 18px', borderRadius: '9px', border: 'none', background: '#2d6a4f', color: 'white', fontWeight: '800', cursor: sendingExport ? 'not-allowed' : 'pointer', opacity: sendingExport ? 0.65 : 1 }}>
                {sendingExport ? 'Đang gửi...' : 'Xuất Excel'}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
}
