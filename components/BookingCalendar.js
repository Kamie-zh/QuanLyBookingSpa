'use client';

import { useMemo, useState } from 'react';
import { toVietnamISODate } from '@/lib/vietnamTime';

const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_MINUTES = 30;

const palette = [
  { bg: '#E8F5E9', border: '#2E7D32', text: '#1B5E20' },
  { bg: '#E3F2FD', border: '#1565C0', text: '#0D47A1' },
  { bg: '#FFF3E0', border: '#EF6C00', text: '#A84300' },
  { bg: '#F3E5F5', border: '#7B1FA2', text: '#4A148C' },
  { bg: '#E0F2F1', border: '#00897B', text: '#004D40' },
  { bg: '#FCE4EC', border: '#C2185B', text: '#880E4F' },
  { bg: '#F1F8E9', border: '#689F38', text: '#33691E' },
  { bg: '#EDE7F6', border: '#512DA8', text: '#311B92' },
];

const statusLabel = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  'checked-in': 'Khách đã đến',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

const optionLabel = {
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  tomorrow: 'Ngày mai',
  custom: 'Tùy chọn ngày',
};

const toISODate = (date) => toVietnamISODate(date);

const getRelativeDate = (mode) => {
  const date = new Date();
  if (mode === 'yesterday') date.setDate(date.getDate() - 1);
  if (mode === 'tomorrow') date.setDate(date.getDate() + 1);
  return toISODate(date);
};

const timeToMinutes = (time = '00:00') => {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return hour * 60 + minute;
};

const minutesToTime = (minutes) => {
  const hour = Math.floor(minutes / 60).toString().padStart(2, '0');
  const minute = (minutes % 60).toString().padStart(2, '0');
  return `${hour}:${minute}`;
};

const colorFor = (booking) => {
  const raw = String(booking?._id || booking?.startTime || '');
  const sum = raw.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return palette[sum % palette.length];
};

const isSameDate = (booking, selectedDate) => toISODate(booking.bookingDate) === selectedDate;

const overlapsSlot = (booking, slotStart) => {
  const bookingStart = timeToMinutes(booking.startTime);
  const bookingEnd = bookingStart + Number(booking.estimatedDuration || SLOT_MINUTES);
  const slotEnd = slotStart + SLOT_MINUTES;
  return bookingStart < slotEnd && bookingEnd > slotStart;
};

const overlapsRange = (startA, endA, startB, endB) => startA < endB && endA > startB;

function BookingBlock({ booking, compact = false }) {
  const color = colorFor(booking);
  return (
    <div
      style={{
        background: color.bg,
        borderLeft: `4px solid ${color.border}`,
        color: color.text,
        borderRadius: '8px',
        padding: compact ? '7px 8px' : '9px 10px',
        boxShadow: '0 2px 8px rgba(45,42,38,0.06)',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
        <strong style={{ fontSize: compact ? '12px' : '13px', whiteSpace: 'nowrap' }}>{booking.startTime}</strong>
        <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(255,255,255,0.55)', borderRadius: '999px', padding: '2px 6px', whiteSpace: 'nowrap' }}>
          {statusLabel[booking.status] || booking.status}
        </span>
      </div>
      <p style={{ margin: '5px 0 0', fontSize: compact ? '11px' : '12px', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {booking.userId?.fullName || 'Khách hàng'}
      </p>
      {!compact && (
        <p style={{ margin: '3px 0 0', fontSize: '11px', opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {booking.services?.map(service => service.serviceName).join(', ') || '-'}
        </p>
      )}
    </div>
  );
}

export default function BookingCalendar({ bookings = [], staff = [], unavailability = [], mode = 'staff', title = 'Lịch hẹn' }) {
  const [dateMode, setDateMode] = useState('today');
  const [customDate, setCustomDate] = useState(() => getRelativeDate('today'));

  const selectedDate = dateMode === 'custom' ? customDate : getRelativeDate(dateMode);
  const dayBookings = useMemo(() => (
    bookings
      .filter(booking => isSameDate(booking, selectedDate))
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  ), [bookings, selectedDate]);
  const dayUnavailable = useMemo(() => (
    unavailability.filter(item => toISODate(item.date) === selectedDate)
  ), [unavailability, selectedDate]);

  const slots = useMemo(() => {
    const start = START_HOUR * 60;
    const end = END_HOUR * 60;
    return Array.from({ length: (end - start) / SLOT_MINUTES }, (_, index) => start + index * SLOT_MINUTES);
  }, []);

  const columns = useMemo(() => {
    if (mode !== 'admin') return [];
    return [
      ...staff.map(item => ({ id: item._id, name: item.fullName })),
      { id: 'unassigned', name: 'Chưa gán' },
    ];
  }, [mode, staff]);

  const selectedDateText = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <section style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #F5F1E8', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '21px', color: '#2D2A26' }}>{title}</h2>
          <p style={{ color: '#8B8579', fontSize: '13px', marginTop: '4px', textTransform: 'capitalize' }}>{selectedDateText}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#8B8579', fontWeight: 800 }}>
            Chọn ngày
            <select
              value={dateMode}
              onChange={(event) => setDateMode(event.target.value)}
              style={{ minHeight: '40px', borderRadius: '9px', border: '1px solid #E5E0D8', background: 'white', padding: '0 12px', color: '#2D2A26', fontWeight: 800, outline: 'none' }}
            >
              {Object.entries(optionLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
          {dateMode === 'custom' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#8B8579', fontWeight: 800 }}>
              Ngày tùy chọn
              <input
                type="date"
                value={customDate}
                onChange={(event) => setCustomDate(event.target.value)}
                style={{ minHeight: '40px', borderRadius: '9px', border: '1px solid #E5E0D8', background: 'white', padding: '0 12px', color: '#2D2A26', fontWeight: 800, outline: 'none' }}
              />
            </label>
          )}
        </div>
      </div>

      {mode === 'admin' ? (
        <div style={{ overflowX: 'auto', border: '1px solid #F0E9DC', borderRadius: '12px' }}>
          <div style={{ minWidth: `${Math.max(720, columns.length * 190 + 92)}px` }}>
            <div style={{ display: 'grid', gridTemplateColumns: `92px repeat(${columns.length}, minmax(170px, 1fr))`, position: 'sticky', top: 0, zIndex: 1 }}>
              <div style={headerCellStyle}>Giờ</div>
              {columns.map(column => <div key={column.id} style={headerCellStyle}>{column.name}</div>)}
            </div>
            {slots.map(slot => (
              <div key={slot} style={{ display: 'grid', gridTemplateColumns: `92px repeat(${columns.length}, minmax(170px, 1fr))`, borderTop: '1px solid #F5F1E8' }}>
                <div style={timeCellStyle}>{minutesToTime(slot)}</div>
                {columns.map(column => {
                  const cellBookings = dayBookings.filter(booking => {
                    const staffId = booking.staffId?._id || 'unassigned';
                    return staffId === column.id && overlapsSlot(booking, slot);
                  });
                  const busyItems = dayUnavailable.filter(item => {
                    const staffId = item.staffId?._id || item.staffId;
                    return staffId === column.id && overlapsRange(slot, slot + SLOT_MINUTES, timeToMinutes(item.startTime), timeToMinutes(item.endTime));
                  });
                  return (
                    <div key={`${slot}-${column.id}`} style={{ minHeight: '74px', padding: '7px', background: cellBookings.length || busyItems.length ? '#FFFCF4' : '#FFFFFF' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {busyItems.map(item => (
                          <div key={`${item._id}-${slot}`} style={{ background: '#FFF5F5', borderLeft: '4px solid #c0392b', color: '#8A1F1F', borderRadius: '8px', padding: '7px 8px', fontSize: '11px', fontWeight: 800 }}>
                            Bận/nghỉ {item.startTime}-{item.endTime}
                            <p style={{ margin: '3px 0 0', fontWeight: 700, color: '#9b2c2c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.reason || 'Không ghi rõ'}</p>
                          </div>
                        ))}
                        {cellBookings.map(booking => <BookingBlock key={`${booking._id}-${slot}`} booking={booking} compact />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ border: '1px solid #F0E9DC', borderRadius: '12px', overflow: 'hidden' }}>
          {slots.map(slot => {
            const slotBookings = dayBookings.filter(booking => overlapsSlot(booking, slot));
            return (
              <div key={slot} style={{ display: 'grid', gridTemplateColumns: '92px 1fr', borderTop: slot === slots[0] ? 'none' : '1px solid #F5F1E8', minHeight: '76px' }}>
                <div style={timeCellStyle}>{minutesToTime(slot)}</div>
                <div style={{ padding: '8px', background: slotBookings.length ? '#FFFCF4' : 'white' }}>
                  {slotBookings.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                      {slotBookings.map(booking => <BookingBlock key={`${booking._id}-${slot}`} booking={booking} />)}
                    </div>
                  ) : (
                    <span style={{ color: '#C1B9AA', fontSize: '12px', fontWeight: 700 }}>Trống</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const headerCellStyle = {
  minHeight: '46px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  background: '#2D2A26',
  color: '#D4AF37',
  fontSize: '12px',
  fontWeight: 900,
  borderRight: '1px solid rgba(212,175,55,0.18)',
};

const timeCellStyle = {
  padding: '10px 12px',
  background: '#F7F4EE',
  color: '#8B6F47',
  fontSize: '13px',
  fontWeight: 900,
  borderRight: '1px solid #F0E9DC',
};
