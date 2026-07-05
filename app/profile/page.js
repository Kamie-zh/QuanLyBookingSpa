'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/Toast';

const roleLabel = {
  user: 'User',
  admin: 'Admin',
  staff: 'Staff',
};

export default function ProfilePage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const { user, loading: authLoading, authFetch, updateUser } = useAuth();
  const userId = user?.id || user?._id || user?.userId;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const res = await authFetch('/api/profile');
    const data = await res.json();
    if (!res.ok) {
      toastError(data.message || 'Unable to load profile');
      setLoading(false);
      return;
    }
    if (!data.user) {
      toastError('Không tìm thấy thông tin cá nhân');
      setProfile(null);
      setLoading(false);
      return;
    }

    const nextProfile = {
      id: data.user.id || data.user._id || '',
      fullName: data.user.fullName || '',
      email: data.user.email || '',
      phone: data.user.phone || '',
      role: data.user.role || '',
      memberType: data.user.memberType || 'normal',
      totalBookings: data.user.totalBookings || 0,
      totalEstimatedAmount: data.user.totalEstimatedAmount || 0,
    };

    setProfile(nextProfile);
    setForm({
      fullName: nextProfile.fullName,
      email: nextProfile.email,
      phone: nextProfile.phone,
    });
    updateUser({
      id: nextProfile.id,
      fullName: nextProfile.fullName,
      email: nextProfile.email,
      role: nextProfile.role,
      memberType: nextProfile.memberType,
      phone: nextProfile.phone,
    });
    setLoading(false);
  }, [authFetch, toastError, updateUser]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.push('/login');
      return;
    }
    queueMicrotask(loadProfile);
  }, [authLoading, loadProfile, router, userId]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!profile) {
      toastError('Thông tin cá nhân chưa được tải xong');
      return;
    }
    setSaving(true);
    const payload = {};
    if (form.fullName.trim() !== (profile.fullName || '')) payload.fullName = form.fullName;
    if (form.email.trim() !== (profile.email || '')) payload.email = form.email;
    if (form.phone.trim() !== (profile.phone || '')) payload.phone = form.phone;

    const res = await authFetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      toastError(data.message || 'Invalid profile information');
      return;
    }

    if (!data.user) {
      toastError('Không nhận được dữ liệu cập nhật');
      return;
    }
    const nextProfile = {
      id: data.user.id || data.user._id || '',
      fullName: data.user.fullName || '',
      email: data.user.email || '',
      phone: data.user.phone || '',
      role: data.user.role || '',
      memberType: data.user.memberType || 'normal',
      totalBookings: data.user.totalBookings || 0,
      totalEstimatedAmount: data.user.totalEstimatedAmount || 0,
    };

    setProfile(nextProfile);
    updateUser({
      id: nextProfile.id,
      fullName: nextProfile.fullName,
      email: nextProfile.email,
      role: nextProfile.role,
      memberType: nextProfile.memberType,
      phone: nextProfile.phone,
    });
    setEditing(false);
    toastSuccess('Profile updated successfully');
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    const res = await authFetch('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify(passwordForm),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      toastError(data.message || 'Unable to change password');
      return;
    }

    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setChangingPassword(false);
    toastSuccess('Password changed successfully');
  };

  const cancelEdit = () => {
    if (!profile) return;
    setForm({
      fullName: profile.fullName || '',
      email: profile.email || '',
      phone: profile.phone || '',
    });
    setEditing(false);
  };

  if (authLoading || loading) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Đang tải...</p></div>;
  }

  if (!profile) return null;

  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container-custom" style={{ maxWidth: '960px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '34px', marginBottom: '8px' }}>Thông tin cá nhân</h1>
              <p style={{ color: '#8B8579' }}>Xem thông tin tài khoản, cập nhật hồ sơ và đổi mật khẩu.</p>
            </div>
            {!editing && !changingPassword && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={() => setEditing(true)} style={{ borderRadius: '10px', padding: '10px 18px', letterSpacing: 0 }}>Chỉnh sửa</button>
                <button className="btn-primary" onClick={() => setChangingPassword(true)} style={{ borderRadius: '10px', padding: '10px 18px', letterSpacing: 0 }}>Đổi mật khẩu</button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <InfoTile label="Name" value={profile.fullName} />
            <InfoTile label="Email" value={profile.email} />
            <InfoTile label="Role" value={roleLabel[profile.role] || profile.role} />
            <InfoTile label="Membership Type" value={profile.memberType === 'VIP' ? 'VIP' : 'Normal'} />
            <InfoTile label="Phone Number" value={profile.phone || '-'} />
            <InfoTile label="Total Bookings" value={profile.totalBookings ?? 0} />
          </div>

          {editing && (
            <form onSubmit={handleSave} style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #F0E7D8', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '18px' }}>Cập nhật thông tin</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <Field label="Name" value={form.fullName} onChange={(value) => setForm(prev => ({ ...prev, fullName: value }))} />
                <Field label="Email" type="email" value={form.email} onChange={(value) => setForm(prev => ({ ...prev, email: value }))} />
                <Field label="Phone Number" value={form.phone} onChange={(value) => setForm(prev => ({ ...prev, phone: value }))} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button type="button" className="btn-secondary" onClick={cancelEdit} style={{ borderRadius: '10px', padding: '10px 18px', letterSpacing: 0 }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ borderRadius: '10px', padding: '10px 18px', letterSpacing: 0 }}>Save</button>
              </div>
            </form>
          )}

          {changingPassword && (
            <form onSubmit={handleChangePassword} style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #F0E7D8' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '18px' }}>Đổi mật khẩu</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <Field label="Old Password" type="password" value={passwordForm.oldPassword} onChange={(value) => setPasswordForm(prev => ({ ...prev, oldPassword: value }))} />
                <Field label="New Password" type="password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm(prev => ({ ...prev, newPassword: value }))} />
                <Field label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={(value) => setPasswordForm(prev => ({ ...prev, confirmPassword: value }))} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button type="button" className="btn-secondary" onClick={() => setChangingPassword(false)} style={{ borderRadius: '10px', padding: '10px 18px', letterSpacing: 0 }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ borderRadius: '10px', padding: '10px 18px', letterSpacing: 0 }}>Change Password</button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div style={{ background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid #F0E7D8' }}>
      <p style={{ color: '#8B8579', fontSize: '13px', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontWeight: '700', color: '#2D2A26', overflowWrap: 'anywhere' }}>{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: '13px', color: '#8B8579', marginBottom: '6px', fontWeight: '600' }}>{label}</span>
      <input className="input-field" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
