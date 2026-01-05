import React from 'react';

const RomanianTimeInput = ({ value, onChange, className = '', ...props }) => {
  // Parse HH:MM format
  const parseTime = (timeStr) => {
    if (!timeStr) return { hours: '', minutes: '' };
    const parts = timeStr.split(':');
    return {
      hours: parts[0] || '',
      minutes: parts[1] || ''
    };
  };

  const { hours, minutes } = parseTime(value);

  const handleHoursChange = (e) => {
    let h = e.target.value;
    if (h === '') {
      onChange('');
      return;
    }
    h = parseInt(h, 10);
    if (isNaN(h)) return;
    h = Math.max(0, Math.min(23, h));
    const newTime = `${String(h).padStart(2, '0')}:${String(minutes || '00').padStart(2, '0')}`;
    onChange(newTime);
  };

  const handleMinutesChange = (e) => {
    let m = e.target.value;
    if (m === '') {
      onChange(`${String(hours || '00').padStart(2, '0')}:00`);
      return;
    }
    m = parseInt(m, 10);
    if (isNaN(m)) return;
    m = Math.max(0, Math.min(59, m));
    const newTime = `${String(hours || '00').padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange(newTime);
  };

  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <input
        type="number"
        min="0"
        max="23"
        value={hours}
        onChange={handleHoursChange}
        placeholder="HH"
        className="w-20 px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary text-center"
        {...props}
      />
      <span className="text-gray-600 font-semibold">:</span>
      <input
        type="number"
        min="0"
        max="59"
        value={minutes}
        onChange={handleMinutesChange}
        placeholder="MM"
        className="w-20 px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary text-center"
        {...props}
      />
    </div>
  );
};

export default RomanianTimeInput;
