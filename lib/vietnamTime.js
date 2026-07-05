const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const VIETNAM_OFFSET_HOURS = 7;

function getVietnamDateParts(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return { year, month, day };
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));

  return {
    year: Number(parts.find(part => part.type === 'year')?.value),
    month: Number(parts.find(part => part.type === 'month')?.value),
    day: Number(parts.find(part => part.type === 'day')?.value),
  };
}

export function toVietnamISODate(value = new Date()) {
  const { year, month, day } = getVietnamDateParts(value);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function vietnamDateTimeToUTCDate(dateValue, time = '00:00') {
  const { year, month, day } = getVietnamDateParts(dateValue);
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - VIETNAM_OFFSET_HOURS, minute, 0, 0));
}

export function getVietnamDayRange(dateValue) {
  const start = vietnamDateTimeToUTCDate(dateValue, '00:00');
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export function hoursUntilVietnamDateTime(dateValue, time, now = new Date()) {
  const target = vietnamDateTimeToUTCDate(dateValue, time);
  return (target - now) / (1000 * 60 * 60);
}
