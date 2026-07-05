'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';

export default function AdminPromotionsPage() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [promotions, setPromotions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', discountType: 'percent', discountValue: 0, targetMember: 'all', startDate: '', endDate: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const busyRef = useRef({});

  async function load() {
    const res = await authFetch('/api/admin/promotions');
    const data = await res.json();
    setPromotions(data.promotions || []);
  }

  useEffect(() => { queueMicrotask(load); }, []);
  const handleChange = (e) => { const val = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? Number(e.target.value) : e.target.value; setForm({ ...form, [e.target.name]: val }); };
  const openCreate = () => { setEditId(null); setForm({ title: '', description: '', discountType: 'percent', discountValue: 0, targetMember: 'all', startDate: '', endDate: '', isActive: true }); setShowModal(true); };
  const openEdit = (p) => { setEditId(p._id); setForm({ title: p.title, description: p.description, discountType: p.discountType, discountValue: p.discountValue, targetMember: p.targetMember, startDate: p.startDate?.split('T')[0] || '', endDate: p.endDate?.split('T')[0] || '', isActive: p.isActive }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (editId) { await authFetch(`/api/admin/promotions/${editId}`, { method: 'PUT', body: JSON.stringify(form) }); toast.success('Đã cập nhật khuyến mãi'); }
      else { await authFetch('/api/admin/promotions', { method: 'POST', body: JSON.stringify(form) }); toast.success('Đã tạo khuyến mãi mới'); }
      setShowModal(false); load();
    } catch (err) { toast.error('Lỗi xử lý'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (busyRef.current[id]) return;
    const ok = await confirm('Bạn có chắc muốn xoá khuyến mãi này?', 'Xoá khuyến mãi');
    if (!ok) return;
    busyRef.current[id] = true;
    try { await authFetch(`/api/admin/promotions/${id}`, { method: 'DELETE' }); toast.success('Đã xoá khuyến mãi'); load(); }
    catch (err) { toast.error('Lỗi xử lý'); }
    busyRef.current[id] = false;
  };

  const isExpired = (endDate) => new Date(endDate) < new Date();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px' }}>Quản lý Khuyến mãi</h1>
        <button className="btn-primary" onClick={openCreate} style={{ padding: '10px 25px' }}>+ Thêm mới</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
        {promotions.map(p => (
          <div key={p._id} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid rgba(212,175,55,0.1)', opacity: p.isActive && !isExpired(p.endDate) ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{p.title}</h3>
              <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', background: isExpired(p.endDate) ? '#F8D7DA' : p.isActive ? '#D4EDDA' : '#FFF3CD', color: isExpired(p.endDate) ? '#721C24' : p.isActive ? '#155724' : '#856404' }}>
                {isExpired(p.endDate) ? 'Hết hạn' : p.isActive ? 'Hoạt động' : 'Tắt'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#8B8579', marginBottom: '12px' }}>{p.description}</p>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#D4AF37', fontWeight: '700' }}>
                {p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue?.toLocaleString('vi-VN')}đ`}
              </span>
              <span>Đối tượng: {p.targetMember === 'VIP' ? 'VIP' : 'Tất cả'}</span>
            </div>
            <p style={{ fontSize: '12px', color: '#8B8579' }}>
              Từ {new Date(p.startDate).toLocaleDateString('vi-VN')} đến {new Date(p.endDate).toLocaleDateString('vi-VN')}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => openEdit(p)} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #D4AF37', background: 'transparent', color: '#D4AF37', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Sửa</button>
              <button onClick={() => handleDelete(p._id)} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #c0392b', background: 'transparent', color: '#c0392b', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Xoá</button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', padding: '30px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '20px', marginBottom: '20px' }}>{editId ? 'Sửa' : 'Thêm'} Khuyến mãi</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input name="title" className="input-field" placeholder="Tên khuyến mãi" value={form.title} onChange={handleChange} required />
              <textarea name="description" className="input-field" placeholder="Mô tả" value={form.description} onChange={handleChange} rows={2} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select name="discountType" className="input-field" value={form.discountType} onChange={handleChange}>
                  <option value="percent">Phần trăm (%)</option><option value="amount">Số tiền (VND)</option>
                </select>
                <input name="discountValue" type="number" className="input-field" placeholder="Giá trị" value={form.discountValue} onChange={handleChange} />
              </div>
              <select name="targetMember" className="input-field" value={form.targetMember} onChange={handleChange}>
                <option value="all">Tất cả</option><option value="VIP">Chỉ VIP</option>
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={{ fontSize: '12px', color: '#8B8579' }}>Bắt đầu</label><input name="startDate" type="date" className="input-field" value={form.startDate} onChange={handleChange} required /></div>
                <div><label style={{ fontSize: '12px', color: '#8B8579' }}>Kết thúc</label><input name="endDate" type="date" className="input-field" value={form.endDate} onChange={handleChange} required /></div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}><input name="isActive" type="checkbox" checked={form.isActive} onChange={handleChange} /> Đang hoạt động</label>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" style={{ padding: '8px 20px' }} onClick={() => setShowModal(false)}>Huỷ</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }} disabled={saving}>{saving ? 'Đang lưu...' : editId ? 'Cập nhật' : 'Tạo'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
