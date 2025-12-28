import React, { useState, useEffect } from 'react';

const RomanianDateInput = ({ value, onChange, required, min, max, className }) => {
  const months = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];
  
  // Parse ISO date (YYYY-MM-DD) to day, month, year
  const parseDate = (isoDate) => {
    if (!isoDate) return { day: '', month: '', year: '' };
    const [year, month, day] = isoDate.split('-');
    return { day: day || '', month: month || '', year: year || '' };
  };
  
  // Format to ISO date (YYYY-MM-DD)
  const formatDate = (day, month, year) => {
    if (!day || !month || !year) return '';
    const d = String(day).padStart(2, '0');
    const m = String(month).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };
  
  const [parts, setParts] = useState(() => parseDate(value));
  
  useEffect(() => {
    const newParts = parseDate(value);
    // Only update if value actually changed
    if (value !== formatDate(parts.day, parts.month, parts.year)) {
      setParts(newParts);
    }
  }, [value]);
  
  const handleChange = (field, val) => {
    const newParts = { ...parts, [field]: val };
    
    // If changing month/year, validate day doesn't exceed max days in new month
    if ((field === 'month' || field === 'year') && newParts.day && newParts.month && newParts.year) {
      const maxDays = new Date(newParts.year, newParts.month, 0).getDate();
      if (parseInt(newParts.day) > maxDays) {
        newParts.day = maxDays; // Adjust day to max valid day
      }
    }
    
    setParts(newParts);
    
    if (newParts.day && newParts.month && newParts.year) {
      const isoDate = formatDate(newParts.day, newParts.month, newParts.year);
      onChange(isoDate);
    } else if (!newParts.day && !newParts.month && !newParts.year) {
      // All cleared, send empty string
      onChange('');
    }
  };
  
  // Get year range from min/max
  const getYearRange = () => {
    const minYear = min ? parseInt(min.split('-')[0]) : 1920;
    const maxYear = max ? parseInt(max.split('-')[0]) : new Date().getFullYear();
    const years = [];
    for (let y = maxYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  };
  
  const getDaysInMonth = () => {
    if (!parts.month || !parts.year) return 31;
    return new Date(parts.year, parts.month, 0).getDate();
  };
  
  return (
    <div className={`flex gap-2 ${className || ''}`}>
      <select 
        value={parts.day} 
        onChange={(e) => handleChange('day', e.target.value)}
        required={required}
        className="form-select rounded-lg border border-gray-200 bg-white text-[#065f46] focus:ring-2 focus:ring-[#14b8a6] h-12 px-3 flex-1"
      >
        <option value="">Zi</option>
        {Array.from({ length: getDaysInMonth() }, (_, i) => i + 1).map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      
      <select 
        value={parts.month} 
        onChange={(e) => handleChange('month', e.target.value)}
        required={required}
        className="form-select rounded-lg border border-gray-200 bg-white text-[#065f46] focus:ring-2 focus:ring-[#14b8a6] h-12 px-3 flex-[2]"
      >
        <option value="">Luna</option>
        {months.map((m, i) => (
          <option key={i} value={i + 1}>{m}</option>
        ))}
      </select>
      
      <select 
        value={parts.year} 
        onChange={(e) => handleChange('year', e.target.value)}
        required={required}
        className="form-select rounded-lg border border-gray-200 bg-white text-[#065f46] focus:ring-2 focus:ring-[#14b8a6] h-12 px-3 flex-1"
      >
        <option value="">An</option>
        {getYearRange().map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
};

export default RomanianDateInput;
