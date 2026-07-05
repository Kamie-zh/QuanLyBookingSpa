'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const deductionTypes = [
  { value: 'late', label: 'Đi trễ' },
  { value: 'absence', label: 'Nghỉ làm' },
  { value: 'penalty', label: 'Phạt' },
  { value: 'other', label: 'Khác' },
];

const adjustmentKindLabel = { bonus: 'Thưởng', deduction: 'Khấu trừ' };

export default function AdminPayrollPage() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [adjustmentForm, setAdjustmentForm] = useState({ kind: 'bonus', amount: '', type: 'late', reason: '' });

  const selected = useMemo(() => rows.find(row => row.staffId === selectedId) || rows[0] || null, [rows, selectedId]);
  const isSelectedPaid = selected?.status === 'paid';

  async function loadPayroll() {
    setLoading(true);
    const res = await authFetch(`/api/admin/payroll?month=${month}&year=${year}`);
    const data = await res.json();
    const payroll = data.payroll || [];
    setRows(payroll);
    setSelectedId(current => current && payroll.some(row => row.staffId === current) ? current : payroll[0]?.staffId || '');
    setLoading(false);
  }

  useEffect(() => { queueMicrotask(loadPayroll); }, [month, year]);

  const patchRow = (staffId, patch) => {
    setRows(prev => prev.map(row => row.staffId === staffId ? { ...row, ...patch } : row));
  };

  const derived = (row) => {
    const bookingDetails = (row.bookingDetails || []).map(booking => {
      const serviceBreakdown = (booking.serviceBreakdown || []).map(service => {
        const rate = service.usesDefaultCommission ? Number(row.commissionRate || 0) : Number(service.commissionRate || 0);
        return {
          ...service,
          commissionRate: rate,
          commissionAmount: Math.round(Number(service.price || 0) * rate / 100),
        };
      });
      return {
        ...booking,
        serviceBreakdown,
        commissionAmount: serviceBreakdown.reduce((sum, service) => sum + service.commissionAmount, 0),
      };
    });
    const commissionAmount = bookingDetails.reduce((sum, booking) => sum + booking.commissionAmount, 0);
    const bonus = (row.bonuses || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const penalty = (row.deductions || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      bookingDetails,
      commissionAmount,
      bonus,
      penalty,
      totalSalary: Number(row.baseSalary || 0) + commissionAmount + bonus - penalty,
    };
  };

  const rejectLocked = () => {
    toast.error('Bảng lương đã trả, không thể chỉnh sửa');
  };

  const addAdjustment = () => {
    if (!selected) return;
    if (isSelectedPaid) {
      rejectLocked();
      return;
    }
    const amount = Number(adjustmentForm.amount || 0);
    if (amount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (adjustmentForm.kind === 'bonus') {
      patchRow(selected.staffId, {
        bonuses: [...(selected.bonuses || []), { amount, reason: adjustmentForm.reason || 'Thưởng' }],
      });
    } else {
      const fallbackReason = deductionTypes.find(item => item.value === adjustmentForm.type)?.label || 'Khấu trừ';
      patchRow(selected.staffId, {
        deductions: [...(selected.deductions || []), { amount, type: adjustmentForm.type, reason: adjustmentForm.reason || fallbackReason }],
      });
    }

    setAdjustmentForm({ kind: 'bonus', amount: '', type: 'late', reason: '' });
  };

  const removeAdjustment = (kind, index) => {
    if (!selected) return;
    if (isSelectedPaid) {
      rejectLocked();
      return;
    }
    const field = kind === 'bonus' ? 'bonuses' : 'deductions';
    patchRow(selected.staffId, { [field]: (selected[field] || []).filter((_, itemIndex) => itemIndex !== index) });
  };

  const saveRow = async (patch = {}) => {
    if (!selected) return;
    if (isSelectedPaid) {
      rejectLocked();
      return;
    }
    setSavingId(selected.staffId);
    try {
      const res = await authFetch('/api/admin/payroll', {
        method: 'PUT',
        body: JSON.stringify({ ...selected, ...patch, month, year }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Lưu bảng lương thất bại');
      } else {
        toast.success(patch.status === 'paid' ? 'Đã xác nhận trả lương' : 'Đã lưu bảng lương');
        setRows(data.payroll || []);
        setSelectedId(selected.staffId);
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
    setSavingId('');
  };

  const markAsPaid = async () => {
    if (!selected || isSelectedPaid) return;
    const ok = await confirm(`Xác nhận đã trả lương cho ${selected.staffName}? Sau khi xác nhận sẽ không thể chỉnh sửa bảng lương tháng này.`, 'Đã trả lương');
    if (!ok) return;
    await saveRow({ status: 'paid' });
  };

  const exportExcel = async () => {
    try {
      const res = await authFetch(`/api/admin/payroll/export?month=${month}&year=${year}`);
      if (!res.ok) {
        toast.error('Xuất Excel thất bại');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bang-luong-${month}-${year}.xls`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Không thể tải file Excel');
    }
  };

  const selectedDerived = selected ? derived(selected) : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px', color: '#2D2A26' }}>Bảng lương nhân viên</h1>
          <p style={{ color: '#8B8579', fontSize: '13px', marginTop: '4px' }}>Quản lý lương theo từng nhân viên, từng tháng</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={labelStyle}>Tháng
            <select value={month} onChange={event => setMonth(Number(event.target.value))} style={inputStyle}>
              {Array.from({ length: 12 }, (_, index) => index + 1).map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label style={labelStyle}>Năm
            <input type="number" value={year} onChange={event => setYear(Number(event.target.value))} style={{ ...inputStyle, width: '110px' }} />
          </label>
          <button onClick={exportExcel} style={primaryButtonStyle}>Xuất Excel</button>
        </div>
      </div>

      {loading ? <p style={{ color: '#8B8579', padding: '30px' }}>Đang tải bảng lương...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>Nhân viên</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {rows.map(row => {
                const item = derived(row);
                const active = selected?.staffId === row.staffId;
                return (
                  <button key={row.staffId} onClick={() => { setSelectedId(row.staffId); setActiveTab('overview'); }} style={{ textAlign: 'left', border: active ? '2px solid #D4AF37' : '1px solid #F0E8DA', background: active ? '#FFF9E6' : 'white', borderRadius: '10px', padding: '12px', cursor: 'pointer' }}>
                    <strong style={{ color: '#2D2A26', fontSize: '14px' }}>{row.staffName}</strong>
                    <p style={{ margin: '5px 0', color: '#8B8579', fontSize: '12px' }}>{row.completedBookings} đơn | {formatCurrency(row.revenue)}</p>
                    <p style={{ margin: 0, color: '#2d6a4f', fontWeight: 900 }}>{formatCurrency(item.totalSalary)}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {selected && selectedDerived && (
            <section style={panelStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '24px', color: '#2D2A26' }}>{selected.staffName}</h2>
                  <p style={{ color: '#8B8579', fontSize: '13px' }}>{selected.email}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ padding: '8px 12px', borderRadius: '999px', background: isSelectedPaid ? '#E8F5E9' : '#FFF8E1', color: isSelectedPaid ? '#1B5E20' : '#8B6F47', fontSize: '12px', fontWeight: 900 }}>
                    {isSelectedPaid ? 'Đã trả lương' : 'Chưa trả'}
                  </span>
                  {!isSelectedPaid && (
                    <button onClick={markAsPaid} disabled={savingId === selected.staffId} style={{ ...primaryButtonStyle, background: '#D4AF37' }}>
                      {savingId === selected.staffId ? 'Đang lưu...' : 'Đã trả lương'}
                    </button>
                  )}
                </div>
              </div>

              {isSelectedPaid && (
                <p style={{ margin: '0 0 14px', padding: '10px 12px', borderRadius: '10px', background: '#F0FFF4', color: '#1B5E20', fontSize: '13px', fontWeight: 800 }}>
                  Bảng lương tháng này đã trả và đã khóa chỉnh sửa.
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                <Metric label="Lương cơ bản" value={formatCurrency(selected.baseSalary)} />
                <Metric label="Hoa hồng" value={formatCurrency(selectedDerived.commissionAmount)} />
                <Metric label="Thưởng" value={formatCurrency(selectedDerived.bonus)} />
                <Metric label="Khấu trừ" value={formatCurrency(selectedDerived.penalty)} />
                <Metric label="Thực nhận" value={formatCurrency(selectedDerived.totalSalary)} strong />
              </div>

              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #F0E8DA', marginBottom: '18px', overflowX: 'auto' }}>
                {[
                  ['overview', 'Cấu hình lương'],
                  ['adjustments', 'Thưởng / Khấu trừ'],
                  ['commission', 'Chi tiết hoa hồng'],
                ].map(([key, label]) => (
                  <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '10px 14px', border: 'none', borderBottom: activeTab === key ? '3px solid #D4AF37' : '3px solid transparent', background: 'transparent', color: activeTab === key ? '#8B6F47' : '#8B8579', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}>{label}</button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <label style={labelStyle}>Lương cơ bản
                      <input type="number" min="0" value={selected.baseSalary ?? ''} onChange={event => patchRow(selected.staffId, { baseSalary: Number(event.target.value || 0) })} disabled={isSelectedPaid} style={inputStyle} />
                    </label>
                    <label style={labelStyle}>Hoa hồng mặc định (%)
                      <input type="number" min="0" max="100" value={selected.commissionRate ?? ''} onChange={event => patchRow(selected.staffId, { commissionRate: Number(event.target.value || 0) })} disabled={isSelectedPaid} style={inputStyle} />
                    </label>
                    <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>Ghi chú bảng lương
                      <input value={selected.note || ''} onChange={event => patchRow(selected.staffId, { note: event.target.value })} disabled={isSelectedPaid} style={inputStyle} />
                    </label>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: '#FDFBF7', border: '1px solid #F0E8DA', borderRadius: '12px', padding: '14px' }}>
                    <p style={{ margin: 0, color: '#8B8579', fontSize: '13px', fontWeight: 700 }}>
                      Thay đổi sẽ cập nhật phần xem trước ngay. Bấm lưu để ghi cấu hình lương cho nhân viên này.
                    </p>
                    <button onClick={() => saveRow()} disabled={savingId === selected.staffId || isSelectedPaid} style={primaryButtonStyle}>
                      {savingId === selected.staffId ? 'Đang lưu...' : 'Lưu cấu hình lương'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'adjustments' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 360px) minmax(0, 1fr)', gap: '18px', alignItems: 'start' }}>
                  <div style={{ background: '#FDFBF7', border: '1px solid #F0E8DA', borderRadius: '12px', padding: '14px' }}>
                    <h3 style={sectionTitleStyle}>Thêm khoản</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      <label style={labelStyle}>Loại
                        <select value={adjustmentForm.kind} onChange={event => setAdjustmentForm(prev => ({ ...prev, kind: event.target.value }))} disabled={isSelectedPaid} style={inputStyle}>
                          <option value="bonus">Thưởng</option>
                          <option value="deduction">Khấu trừ</option>
                        </select>
                      </label>
                      {adjustmentForm.kind === 'deduction' && (
                        <label style={labelStyle}>Lý do mẫu
                          <select value={adjustmentForm.type} onChange={event => setAdjustmentForm(prev => ({ ...prev, type: event.target.value }))} disabled={isSelectedPaid} style={inputStyle}>
                            {deductionTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                          </select>
                        </label>
                      )}
                      <label style={labelStyle}>Số tiền
                        <input type="number" min="0" value={adjustmentForm.amount} onChange={event => setAdjustmentForm(prev => ({ ...prev, amount: event.target.value }))} disabled={isSelectedPaid} style={inputStyle} />
                      </label>
                      <label style={labelStyle}>Ghi chú
                        <input value={adjustmentForm.reason} onChange={event => setAdjustmentForm(prev => ({ ...prev, reason: event.target.value }))} placeholder="Nhập lý do cụ thể" disabled={isSelectedPaid} style={inputStyle} />
                      </label>
                      <button onClick={addAdjustment} disabled={isSelectedPaid} style={primaryButtonStyle}>Thêm vào bảng lương</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <AdjustmentList title="Thưởng" kind="bonus" items={selected.bonuses || []} onRemove={removeAdjustment} locked={isSelectedPaid} />
                    <AdjustmentList title="Khấu trừ" kind="deduction" items={selected.deductions || []} onRemove={removeAdjustment} locked={isSelectedPaid} />
                  </div>
                </div>
              )}

              {activeTab === 'commission' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedDerived.bookingDetails.length === 0 ? <p style={{ color: '#8B8579' }}>Chưa có lịch hoàn thành trong tháng.</p> : selectedDerived.bookingDetails.map(booking => (
                    <div key={booking.bookingId} style={{ border: '1px solid #F0E8DA', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: '12px', alignItems: 'center', background: '#FDFBF7', padding: '12px 14px' }}>
                        <strong>{new Date(booking.bookingDate).toLocaleDateString('vi-VN')} {booking.startTime} - {booking.customerName || 'Khách hàng'}</strong>
                        <span style={{ color: '#8B8579', fontSize: '12px' }}>{formatCurrency(booking.totalPrice)}</span>
                        <span style={{ color: '#2d6a4f', fontWeight: 900 }}>{formatCurrency(booking.commissionAmount)}</span>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <div style={{ minWidth: '560px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 110px 90px 120px', gap: '8px', padding: '10px 14px', color: '#8B8579', fontSize: '11px', fontWeight: 900 }}>
                            <span>Dịch vụ</span><span>Giá</span><span>Hoa hồng</span><span>Tiền HH</span>
                          </div>
                          {booking.serviceBreakdown.map((service, index) => (
                            <div key={`${booking.bookingId}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1.4fr 110px 90px 120px', gap: '8px', padding: '10px 14px', borderTop: '1px solid #F5F1E8', alignItems: 'center', fontSize: '13px' }}>
                              <span style={{ fontWeight: 800 }}>{service.serviceName}</span>
                              <span>{formatCurrency(service.price)}</span>
                              <span>{service.commissionRate}%{service.usesDefaultCommission ? ' *' : ''}</span>
                              <strong style={{ color: '#2d6a4f' }}>{formatCurrency(service.commissionAmount)}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <p style={{ color: '#8B8579', fontSize: '12px' }}>* Dùng hoa hồng mặc định của nhân viên. Dịch vụ có cấu hình hoa hồng riêng sẽ giữ tỷ lệ riêng.</p>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, strong }) {
  return (
    <div style={{ background: strong ? '#F0FFF4' : '#FDFBF7', borderRadius: '10px', padding: '12px', border: '1px solid #F5F1E8' }}>
      <p style={{ color: '#8B8579', fontSize: '12px', fontWeight: 800 }}>{label}</p>
      <p style={{ color: strong ? '#2d6a4f' : '#2D2A26', fontSize: '18px', fontWeight: 900, marginTop: '4px' }}>{value}</p>
    </div>
  );
}

function AdjustmentList({ title, kind, items, onRemove, locked }) {
  return (
    <div style={{ border: '1px solid #F0E8DA', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ background: '#FDFBF7', padding: '10px 12px', fontWeight: 900, color: '#2D2A26' }}>{title}</div>
      {items.length === 0 ? <p style={{ color: '#8B8579', padding: '14px', margin: 0 }}>Chưa có khoản nào.</p> : items.map((item, index) => (
        <div key={index} style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr) auto', gap: '10px', padding: '10px 12px', borderTop: '1px solid #F5F1E8', alignItems: 'center' }}>
          <strong style={{ color: kind === 'bonus' ? '#2d6a4f' : '#c0392b' }}>{formatCurrency(item.amount)}</strong>
          <span style={{ color: '#2D2A26', fontSize: '13px' }}>{kind === 'deduction' ? `${deductionTypes.find(type => type.value === item.type)?.label || 'Khác'} - ` : ''}{item.reason || adjustmentKindLabel[kind]}</span>
          <button disabled={locked} onClick={() => onRemove(kind, index)} style={{ border: '1px solid #c0392b', background: locked ? '#F5F1E8' : 'white', color: locked ? '#A8A095' : '#c0392b', borderRadius: '8px', padding: '6px 10px', fontWeight: 800, cursor: locked ? 'not-allowed' : 'pointer' }}>Xóa</button>
        </div>
      ))}
    </div>
  );
}

const panelStyle = { background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid #F5F1E8', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' };
const sectionTitleStyle = { fontFamily: 'var(--font-playfair), serif', fontSize: '18px', color: '#2D2A26', margin: 0 };
const labelStyle = { display: 'flex', flexDirection: 'column', gap: '6px', color: '#8B8579', fontSize: '12px', fontWeight: 800 };
const inputStyle = { minHeight: '40px', borderRadius: '9px', border: '1px solid #E5E0D8', background: 'white', padding: '0 12px', color: '#2D2A26', fontWeight: 800, outline: 'none', width: '100%' };
const primaryButtonStyle = { minHeight: '40px', padding: '0 16px', borderRadius: '9px', border: 'none', background: '#2d6a4f', color: 'white', fontWeight: 800, cursor: 'pointer' };
