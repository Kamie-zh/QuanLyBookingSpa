'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';
import ImageUpload from '@/components/ImageUpload';

export default function AdminServicesPage() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ serviceName: '', serviceType: 'spa', description: '', duration: 60, price: 0, isCombo: false, isActive: true, imageUrl: '', allowedStaff: [] });
  const [saving, setSaving] = useState(false);
  const busyRef = useRef({});

  async function loadServices() {
    const res = await authFetch('/api/admin/services');
    const data = await res.json();
    setServices(data.services || []);
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadServices();
    });
  }, []);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const openCreate = () => { setEditId(null); setForm({ serviceName: '', serviceType: 'spa', description: '', duration: 60, price: 0, isCombo: false, isActive: true, imageUrl: '', allowedStaff: [] }); setShowModal(true); };
  const openEdit = (s) => {
    setEditId(s._id);
    setForm({
      serviceName: s.serviceName,
      serviceType: s.serviceType,
      description: s.description,
      duration: s.duration,
      price: s.price,
      isCombo: s.isCombo,
      isActive: s.isActive,
      imageUrl: s.imageUrl || '',
      allowedStaff: []
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (editId) {
        await authFetch(`/api/admin/services/${editId}`, { method: 'PUT', body: JSON.stringify({ ...form, allowedStaff: [] }) });
        toast.success('Đã cập nhật dịch vụ');
      } else {
        await authFetch('/api/admin/services', { method: 'POST', body: JSON.stringify({ ...form, allowedStaff: [] }) });
        toast.success('Đã tạo dịch vụ mới');
      }
      setShowModal(false); loadServices();
    } catch (err) { toast.error('Lỗi xử lý'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (busyRef.current[id]) return;
    const ok = await confirm('Bạn có chắc muốn xoá dịch vụ này? Hành động không thể hoàn tác.', 'Xoá dịch vụ');
    if (!ok) return;
    busyRef.current[id] = true;
    try {
      await authFetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      toast.success('Đã xoá dịch vụ');
      loadServices();
    } catch (err) { toast.error('Lỗi xử lý'); }
    busyRef.current[id] = false;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px' }}>Quản lý Dịch vụ</h1>
        <button className="btn-primary" onClick={openCreate} style={{ padding: '10px 25px' }}>+ Thêm mới</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
        {services.map(s => (
          <div key={s._id} style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div style={{ height: '160px', background: '#F5F1E8', position: 'relative' }}>
              {(s.imageUrl || s.imagePath) && <img src={s.imageUrl || s.imagePath} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#D4AF37', color: 'white', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>{s.serviceType}</span>
              {!s.isActive && <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#c0392b', color: 'white', padding: '3px 10px', borderRadius: '10px', fontSize: '11px' }}>Ẩn</span>}
            </div>
            <div style={{ padding: '15px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '5px' }}>{s.serviceName}</h3>
              <p style={{ fontSize: '13px', color: '#8B8579', marginBottom: '10px' }}>{s.duration} phút / {s.price?.toLocaleString('vi-VN')}đ</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => openEdit(s)} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #D4AF37', background: 'transparent', color: '#D4AF37', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Sửa</button>
                <button onClick={() => handleDelete(s._id)} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #c0392b', background: 'transparent', color: '#c0392b', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Xoá</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', padding: '30px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '20px', marginBottom: '20px' }}>{editId ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input name="serviceName" className="input-field" placeholder="Tên dịch vụ" value={form.serviceName} onChange={handleChange} required />
              <select name="serviceType" className="input-field" value={form.serviceType} onChange={handleChange}>
                <option value="spa">Spa</option><option value="nail">Nail</option><option value="makeup">Makeup</option>
              </select>
              <textarea name="description" className="input-field" placeholder="Mô tả" value={form.description} onChange={handleChange} rows={3} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input name="duration" type="number" className="input-field" placeholder="Thời gian (phút)" value={form.duration} onChange={handleChange} />
                <input name="price" type="number" className="input-field" placeholder="Giá (VND)" value={form.price} onChange={handleChange} />
              </div>
              <ImageUpload value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} label="Ảnh dịch vụ" />
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <input name="isActive" type="checkbox" checked={form.isActive} onChange={handleChange} /> Đang hoạt động
              </label>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" style={{ padding: '8px 20px' }} onClick={() => setShowModal(false)}>Huỷ</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }} disabled={saving}>{saving ? 'Đang lưu...' : editId ? 'Cập nhật' : 'Tạo mới'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
