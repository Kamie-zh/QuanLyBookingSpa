'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';

export default function AdminStaffPage() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const busyRef = useRef({});

  async function loadStaff() {
    try {
      const res = await authFetch('/api/admin/staff');
      const data = await res.json();
      setStaff(data.staff || []);
    } catch (err) {
      toast.error('Không thể tải danh sách nhân viên');
    }
  }

  useEffect(() => { queueMicrotask(loadStaff); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ fullName: '', email: '', password: '', phone: '' });
    setShowModal(true);
  };

  const openEdit = (st) => {
    setEditId(st._id);
    setForm({ fullName: st.fullName, email: st.email, password: '', phone: st.phone || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      if (editId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password; // Don't update password if empty
        const res = await authFetch(`/api/admin/staff/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        const data = await res.json();
        if (res.ok) {
          toast.success('Cập nhật tài khoản nhân viên thành công');
          setShowModal(false);
          loadStaff();
        } else {
          toast.error(data.message || 'Lỗi cập nhật');
        }
      } else {
        const res = await authFetch('/api/admin/staff', { method: 'POST', body: JSON.stringify(form) });
        const data = await res.json();
        if (res.ok) {
          toast.success('Tạo tài khoản nhân viên thành công');
          setShowModal(false);
          loadStaff();
        } else {
          toast.error(data.message || 'Lỗi tạo tài khoản');
        }
      }
    } catch (err) {
      toast.error('Lỗi kết nối mạng');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (busyRef.current[id]) return;
    const ok = await confirm('Bạn có chắc chắn muốn xoá nhân viên này? Lịch hẹn liên quan có thể bị ảnh hưởng.', 'Xoá nhân viên');
    if (!ok) return;

    busyRef.current[id] = true;
    try {
      const res = await authFetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Đã xoá tài khoản nhân viên');
        loadStaff();
      } else {
        toast.error(data.message || 'Lỗi xoá tài khoản');
      }
    } catch (err) {
      toast.error('Lỗi kết nối mạng');
    }
    busyRef.current[id] = false;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px' }}>Quản lý Nhân viên</h1>
        <button className="btn-primary" onClick={openCreate} style={{ padding: '10px 25px' }}>+ Thêm nhân viên</button>
      </div>

      <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.1)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#F5F1E8' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Tên chuyên viên</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Số điện thoại</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#8B8579' }}>Chưa có nhân viên nào trên hệ thống</td>
                </tr>
              ) : (
                staff.map((st, i) => (
                  <tr key={st._id} style={{ borderBottom: '1px solid #F5F1E8' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>{st.fullName}</td>
                    <td style={{ padding: '12px 16px' }}>{st.email}</td>
                    <td style={{ padding: '12px 16px' }}>{st.phone || '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => openEdit(st)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #D4AF37', background: 'transparent', color: '#D4AF37', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Sửa</button>
                        <button onClick={() => handleDelete(st._id)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #c0392b', background: 'transparent', color: '#c0392b', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Xoá</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', padding: '30px', maxWidth: '450px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '20px', marginBottom: '20px' }}>{editId ? 'Sửa thông tin NV' : 'Thêm tài khoản Staff mới'}</h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#8B6F47' }}>Họ và tên</label>
                  <input name="fullName" className="input-field" placeholder="Nguyễn Văn A" value={form.fullName} onChange={handleChange} required style={{ margin: 0 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#8B6F47' }}>Email</label>
                  <input name="email" type="email" className="input-field" placeholder="nv1@spa.com" value={form.email} onChange={handleChange} required style={{ margin: 0 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#8B6F47' }}>Số điện thoại</label>
                  <input name="phone" className="input-field" placeholder="0901234567" value={form.phone} onChange={handleChange} style={{ margin: 0 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#8B6F47' }}>Mật khẩu {editId && '(để trống nếu không đổi)'}</label>
                  <input name="password" type="password" className="input-field" placeholder={editId ? '••••••••' : 'Nhập mật khẩu ban đầu'} value={form.password} onChange={handleChange} required={!editId} style={{ margin: 0 }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" style={{ padding: '8px 20px' }} onClick={() => setShowModal(false)}>Huỷ</button>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }} disabled={saving}>{saving ? 'Đang lưu...' : editId ? 'Cập nhật' : 'Tạo mới'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
