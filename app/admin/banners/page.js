'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';
import ImageUpload from '@/components/ImageUpload';

export default function AdminBannersPage() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [banners, setBanners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', subtitle: '', position: 'HOME_HERO', targetServiceType: 'all', link: '', sortOrder: 0, isActive: true, imageUrl: '' });
  const [saving, setSaving] = useState(false);
  const busyRef = useRef({});

  async function load() {
    const res = await authFetch('/api/admin/banners');
    const data = await res.json();
    setBanners(data.banners || []);
  }

  useEffect(() => { queueMicrotask(load); }, []);
  const handleChange = (e) => { const val = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? Number(e.target.value) : e.target.value; setForm({ ...form, [e.target.name]: val }); };
  const openCreate = () => { setEditId(null); setForm({ title: '', subtitle: '', position: 'HOME_HERO', targetServiceType: 'all', link: '', sortOrder: 0, isActive: true, imageUrl: '' }); setShowModal(true); };
  const openEdit = (b) => { setEditId(b._id); setForm({ title: b.title, subtitle: b.subtitle, position: b.position, targetServiceType: b.targetServiceType, link: b.link, sortOrder: b.sortOrder, isActive: b.isActive, imageUrl: b.imageUrl || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (editId) { await authFetch(`/api/admin/banners/${editId}`, { method: 'PUT', body: JSON.stringify(form) }); toast.success('Đã cập nhật banner'); }
      else { await authFetch('/api/admin/banners', { method: 'POST', body: JSON.stringify(form) }); toast.success('Đã tạo banner mới'); }
      setShowModal(false); load();
    } catch (err) { toast.error('Lỗi xử lý'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (busyRef.current[id]) return;
    const ok = await confirm('Bạn có chắc muốn xoá banner này?', 'Xoá banner');
    if (!ok) return;
    busyRef.current[id] = true;
    try { await authFetch(`/api/admin/banners/${id}`, { method: 'DELETE' }); toast.success('Đã xoá banner'); load(); }
    catch (err) { toast.error('Lỗi xử lý'); }
    busyRef.current[id] = false;
  };

  const toggleActive = async (b) => {
    const key = `toggle-${b._id}`;
    if (busyRef.current[key]) return;
    busyRef.current[key] = true;
    try { await authFetch(`/api/admin/banners/${b._id}`, { method: 'PUT', body: JSON.stringify({ isActive: !b.isActive }) }); toast.success('Đã cập nhật trạng thái'); load(); }
    catch (err) { toast.error('Lỗi xử lý'); }
    busyRef.current[key] = false;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px' }}>Quản lý Banner</h1>
        <button className="btn-primary" onClick={openCreate} style={{ padding: '10px 25px' }}>+ Thêm mới</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
        {banners.map(b => (
          <div key={b._id} style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.1)', opacity: b.isActive ? 1 : 0.6 }}>
            <div style={{ height: '160px', background: '#F5F1E8' }}>
              {(b.imageUrl || b.imagePath) && <img src={b.imageUrl || b.imagePath} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{b.title}</h3>
                  <p style={{ fontSize: '12px', color: '#8B8579' }}>{b.subtitle}</p>
                  <p style={{ fontSize: '11px', color: '#B8956A', marginTop: '4px' }}>{b.position} / {b.targetServiceType}</p>
                </div>
                <button onClick={() => toggleActive(b)} style={{ padding: '4px 10px', borderRadius: '12px', border: 'none', background: b.isActive ? '#D4EDDA' : '#F8D7DA', color: b.isActive ? '#155724' : '#721C24', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                  {b.isActive ? 'Hiện' : 'Ẩn'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button onClick={() => openEdit(b)} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #D4AF37', background: 'transparent', color: '#D4AF37', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Sửa</button>
                <button onClick={() => handleDelete(b._id)} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #c0392b', background: 'transparent', color: '#c0392b', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Xoá</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', padding: '30px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '20px', marginBottom: '20px' }}>{editId ? 'Sửa' : 'Thêm'} Banner</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input name="title" className="input-field" placeholder="Tiêu đề" value={form.title} onChange={handleChange} required />
              <input name="subtitle" className="input-field" placeholder="Phụ đề" value={form.subtitle} onChange={handleChange} />
              <select name="position" className="input-field" value={form.position} onChange={handleChange}>
                <option value="HOME_HERO">Home Hero</option><option value="CATEGORY_COVER">Category Cover</option><option value="PROMO_BANNER">Promo Banner</option>
              </select>
              <select name="targetServiceType" className="input-field" value={form.targetServiceType} onChange={handleChange}>
                <option value="all">Tất cả</option><option value="spa">Spa</option><option value="nail">Nail</option><option value="makeup">Makeup</option>
              </select>
              <ImageUpload value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} label="Ảnh banner" />
              <input name="link" className="input-field" placeholder="Liên kết" value={form.link} onChange={handleChange} />
              <input name="sortOrder" type="number" className="input-field" placeholder="Thứ tự" value={form.sortOrder} onChange={handleChange} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}><input name="isActive" type="checkbox" checked={form.isActive} onChange={handleChange} /> Hiển thị</label>
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
