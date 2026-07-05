'use client';
import { useState, useRef } from 'react';

export default function ImageUpload({ value, onChange, label = 'Ảnh' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || '');
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File ảnh tối đa 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Upload thất bại');
        setUploading(false);
        return;
      }

      setPreview(data.url);
      onChange(data.url);
    } catch (err) {
      alert('Lỗi kết nối khi upload');
    }
    setUploading(false);
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setPreview(url);
    onChange(url);
  };

  return (
    <div>
      <label style={{ fontSize: '13px', fontWeight: '600', color: '#8B6F47', marginBottom: '6px', display: 'block' }}>{label}</label>

      {/* Preview */}
      {preview && (
        <div style={{ marginBottom: '10px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E5E0D8', position: 'relative' }}>
          <img src={preview} alt="Preview" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
          <button type="button" onClick={() => { setPreview(''); onChange(''); }}
            style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      )}

      {/* Upload button + URL input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="file"
          ref={fileRef}
          accept="image/*"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            border: '2px dashed #D4AF37',
            background: 'transparent',
            color: '#D4AF37',
            cursor: uploading ? 'wait' : 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? 'Đang tải...' : 'Chọn ảnh'}
        </button>
        <input
          type="text"
          className="input-field"
          placeholder="hoặc dán URL ảnh"
          value={preview}
          onChange={handleUrlChange}
          style={{ flex: 1, fontSize: '13px' }}
        />
      </div>
    </div>
  );
}
