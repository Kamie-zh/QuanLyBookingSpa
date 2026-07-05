'use client';

const STEPS = [
  { key: 'createdAt', label: 'Đặt lịch', statuses: ['pending', 'confirmed', 'checked-in', 'completed'] },
  { key: 'confirmedAt', label: 'Xác nhận', statuses: ['confirmed', 'checked-in', 'completed'] },
  { key: 'checkedInAt', label: 'Check-in', statuses: ['checked-in', 'completed'] },
  { key: 'completedAt', label: 'Hoàn thành', statuses: ['completed'] },
];

const formatTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function BookingTimeline({ booking }) {
  const cancelled = booking?.status === 'cancelled';
  const steps = cancelled
    ? [...STEPS.slice(0, 1), { key: 'cancelledAt', label: 'Da huy', statuses: ['cancelled'] }]
    : STEPS;

  return (
    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F5F1E8' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, minmax(78px, 1fr))`, gap: '8px' }}>
        {steps.map((step, index) => {
          const done = step.statuses.includes(booking?.status) || Boolean(booking?.[step.key]);
          const active = booking?.status !== 'cancelled' && step.statuses.includes(booking?.status);
          const color = cancelled && step.key === 'cancelledAt' ? '#c0392b' : done ? '#D4AF37' : '#D8D1C5';
          return (
            <div key={step.key} style={{ position: 'relative', minWidth: 0 }}>
              {index > 0 && (
                <div style={{ position: 'absolute', top: '11px', left: '-50%', right: '50%', height: '2px', background: done ? '#D4AF37' : '#E5E0D8' }} />
              )}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: color, color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, boxShadow: active ? '0 0 0 4px rgba(212,175,55,0.18)' : 'none' }}>
                  {done ? 'OK' : index + 1}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: done ? '#2D2A26' : '#8B8579', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{step.label}</span>
                <span style={{ fontSize: '10px', color: '#8B8579', minHeight: '13px' }}>{formatTime(booking?.[step.key])}</span>
              </div>
            </div>
          );
        })}
      </div>
      {booking?.reminderSentAt && (
        <p style={{ marginTop: '10px', fontSize: '11px', color: '#2d6a4f', fontWeight: 700 }}>
          Đã gửi email nhắc lịch: {formatTime(booking.reminderSentAt)}
        </p>
      )}
    </div>
  );
}
