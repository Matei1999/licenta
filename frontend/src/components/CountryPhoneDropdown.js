import React, { useState, useRef, useEffect } from 'react';

// Compact helper to close dropdown on outside click
const useOutsideClose = (ref, onClose) => {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
};

// Country data (emoji flag + dial code). Add or reorder as needed.
const countries = [
  { code: 'RO', dial: '+40', emoji: '🇷🇴', name: 'România' },
  { code: 'AF', dial: '+93', emoji: '🇦🇫', name: 'Afghanistan' },
  { code: 'AL', dial: '+355', emoji: '🇦🇱', name: 'Albania' },
  { code: 'DZ', dial: '+213', emoji: '🇩🇿', name: 'Algeria' },
  { code: 'AD', dial: '+376', emoji: '🇦🇩', name: 'Andorra' },
  { code: 'AO', dial: '+244', emoji: '🇦🇴', name: 'Angola' },
  { code: 'AR', dial: '+54', emoji: '🇦🇷', name: 'Argentina' },
  { code: 'AM', dial: '+374', emoji: '🇦🇲', name: 'Armenia' },
  { code: 'AU', dial: '+61', emoji: '🇦🇺', name: 'Australia' },
  { code: 'AT', dial: '+43', emoji: '🇦🇹', name: 'Austria' },
  { code: 'AZ', dial: '+994', emoji: '🇦🇿', name: 'Azerbaijan' },
  { code: 'BH', dial: '+973', emoji: '🇧🇭', name: 'Bahrain' },
  { code: 'BD', dial: '+880', emoji: '🇧🇩', name: 'Bangladesh' },
  { code: 'BY', dial: '+375', emoji: '🇧🇾', name: 'Belarus' },
  { code: 'BE', dial: '+32', emoji: '🇧🇪', name: 'Belgium' },
  { code: 'BZ', dial: '+501', emoji: '🇧🇿', name: 'Belize' },
  { code: 'BJ', dial: '+229', emoji: '🇧🇯', name: 'Benin' },
  { code: 'BO', dial: '+591', emoji: '🇧🇴', name: 'Bolivia' },
  { code: 'BA', dial: '+387', emoji: '🇧🇦', name: 'Bosnia & Herzegovina' },
  { code: 'BW', dial: '+267', emoji: '🇧🇼', name: 'Botswana' },
  { code: 'BR', dial: '+55', emoji: '🇧🇷', name: 'Brazil' },
  { code: 'BN', dial: '+673', emoji: '🇧🇳', name: 'Brunei' },
  { code: 'BG', dial: '+359', emoji: '🇧🇬', name: 'Bulgaria' },
  { code: 'BF', dial: '+226', emoji: '🇧🇫', name: 'Burkina Faso' },
  { code: 'BI', dial: '+257', emoji: '🇧🇮', name: 'Burundi' },
  { code: 'KH', dial: '+855', emoji: '🇰🇭', name: 'Cambodia' },
  { code: 'CM', dial: '+237', emoji: '🇨🇲', name: 'Cameroon' },
  { code: 'CA', dial: '+1', emoji: '🇨🇦', name: 'Canada' },
  { code: 'CV', dial: '+238', emoji: '🇨🇻', name: 'Cape Verde' },
  { code: 'CF', dial: '+236', emoji: '🇨🇫', name: 'Central African Republic' },
  { code: 'TD', dial: '+235', emoji: '🇹🇩', name: 'Chad' },
  { code: 'CL', dial: '+56', emoji: '🇨🇱', name: 'Chile' },
  { code: 'CN', dial: '+86', emoji: '🇨🇳', name: 'China' },
  { code: 'CO', dial: '+57', emoji: '🇨🇴', name: 'Colombia' },
  { code: 'KM', dial: '+269', emoji: '🇰🇲', name: 'Comoros' },
  { code: 'CG', dial: '+242', emoji: '🇨🇬', name: 'Congo' },
  { code: 'CR', dial: '+506', emoji: '🇨🇷', name: 'Costa Rica' },
  { code: 'HR', dial: '+385', emoji: '🇭🇷', name: 'Croatia' },
  { code: 'CU', dial: '+53', emoji: '🇨🇺', name: 'Cuba' },
  { code: 'CY', dial: '+357', emoji: '🇨🇾', name: 'Cyprus' },
  { code: 'CZ', dial: '+420', emoji: '🇨🇿', name: 'Czechia' },
  { code: 'DK', dial: '+45', emoji: '🇩🇰', name: 'Denmark' },
  { code: 'DJ', dial: '+253', emoji: '🇩🇯', name: 'Djibouti' },
  { code: 'EC', dial: '+593', emoji: '🇪🇨', name: 'Ecuador' },
  { code: 'EG', dial: '+20', emoji: '🇪🇬', name: 'Egypt' },
  { code: 'SV', dial: '+503', emoji: '🇸🇻', name: 'El Salvador' },
  { code: 'GQ', dial: '+240', emoji: '🇬🇶', name: 'Equatorial Guinea' },
  { code: 'ER', dial: '+291', emoji: '🇪🇷', name: 'Eritrea' },
  { code: 'EE', dial: '+372', emoji: '🇪🇪', name: 'Estonia' },
  { code: 'ET', dial: '+251', emoji: '🇪🇹', name: 'Ethiopia' },
  { code: 'FI', dial: '+358', emoji: '🇫🇮', name: 'Finland' },
  { code: 'FR', dial: '+33', emoji: '🇫🇷', name: 'France' },
  { code: 'GA', dial: '+241', emoji: '🇬🇦', name: 'Gabon' },
  { code: 'GM', dial: '+220', emoji: '🇬🇲', name: 'Gambia' },
  { code: 'GE', dial: '+995', emoji: '🇬🇪', name: 'Georgia' },
  { code: 'DE', dial: '+49', emoji: '🇩🇪', name: 'Germany' },
  { code: 'GH', dial: '+233', emoji: '🇬🇭', name: 'Ghana' },
  { code: 'GR', dial: '+30', emoji: '🇬🇷', name: 'Greece' },
  { code: 'GT', dial: '+502', emoji: '🇬🇹', name: 'Guatemala' },
  { code: 'GN', dial: '+224', emoji: '🇬🇳', name: 'Guinea' },
  { code: 'GW', dial: '+245', emoji: '🇬🇼', name: 'Guinea-Bissau' },
  { code: 'HT', dial: '+509', emoji: '🇭🇹', name: 'Haiti' },
  { code: 'HN', dial: '+504', emoji: '🇭🇳', name: 'Honduras' },
  { code: 'HK', dial: '+852', emoji: '🇭🇰', name: 'Hong Kong' },
  { code: 'HU', dial: '+36', emoji: '🇭🇺', name: 'Hungary' },
  { code: 'IS', dial: '+354', emoji: '🇮🇸', name: 'Iceland' },
  { code: 'IN', dial: '+91', emoji: '🇮🇳', name: 'India' },
  { code: 'ID', dial: '+62', emoji: '🇮🇩', name: 'Indonesia' },
  { code: 'IR', dial: '+98', emoji: '🇮🇷', name: 'Iran' },
  { code: 'IQ', dial: '+964', emoji: '🇮🇶', name: 'Iraq' },
  { code: 'IE', dial: '+353', emoji: '🇮🇪', name: 'Ireland' },
  { code: 'IL', dial: '+972', emoji: '🇮🇱', name: 'Israel' },
  { code: 'IT', dial: '+39', emoji: '🇮🇹', name: 'Italy' },
  { code: 'CI', dial: '+225', emoji: '🇨🇮', name: 'Ivory Coast' },
  { code: 'JP', dial: '+81', emoji: '🇯🇵', name: 'Japan' },
  { code: 'JO', dial: '+962', emoji: '🇯🇴', name: 'Jordan' },
  { code: 'KZ', dial: '+7', emoji: '🇰🇿', name: 'Kazakhstan' },
  { code: 'KE', dial: '+254', emoji: '🇰🇪', name: 'Kenya' },
  { code: 'KW', dial: '+965', emoji: '🇰🇼', name: 'Kuwait' },
  { code: 'KG', dial: '+996', emoji: '🇰🇬', name: 'Kyrgyzstan' },
  { code: 'LA', dial: '+856', emoji: '🇱🇦', name: 'Laos' },
  { code: 'LV', dial: '+371', emoji: '🇱🇻', name: 'Latvia' },
  { code: 'LB', dial: '+961', emoji: '🇱🇧', name: 'Lebanon' },
  { code: 'LS', dial: '+266', emoji: '🇱🇸', name: 'Lesotho' },
  { code: 'LR', dial: '+231', emoji: '🇱🇷', name: 'Liberia' },
  { code: 'LY', dial: '+218', emoji: '🇱🇾', name: 'Libya' },
  { code: 'LI', dial: '+423', emoji: '🇱🇮', name: 'Liechtenstein' },
  { code: 'LT', dial: '+370', emoji: '🇱🇹', name: 'Lithuania' },
  { code: 'LU', dial: '+352', emoji: '🇱🇺', name: 'Luxembourg' },
  { code: 'MO', dial: '+853', emoji: '🇲🇴', name: 'Macao' },
  { code: 'MK', dial: '+389', emoji: '🇲🇰', name: 'North Macedonia' },
  { code: 'MG', dial: '+261', emoji: '🇲🇬', name: 'Madagascar' },
  { code: 'MW', dial: '+265', emoji: '🇲🇼', name: 'Malawi' },
  { code: 'MY', dial: '+60', emoji: '🇲🇾', name: 'Malaysia' },
  { code: 'MV', dial: '+960', emoji: '🇲🇻', name: 'Maldives' },
  { code: 'ML', dial: '+223', emoji: '🇲🇱', name: 'Mali' },
  { code: 'MT', dial: '+356', emoji: '🇲🇹', name: 'Malta' },
  { code: 'MR', dial: '+222', emoji: '🇲🇷', name: 'Mauritania' },
  { code: 'MU', dial: '+230', emoji: '🇲🇺', name: 'Mauritius' },
  { code: 'MX', dial: '+52', emoji: '🇲🇽', name: 'Mexico' },
  { code: 'MD', dial: '+373', emoji: '🇲🇩', name: 'Moldova' },
  { code: 'MC', dial: '+377', emoji: '🇲🇨', name: 'Monaco' },
  { code: 'MN', dial: '+976', emoji: '🇲🇳', name: 'Mongolia' },
  { code: 'ME', dial: '+382', emoji: '🇲🇪', name: 'Montenegro' },
  { code: 'MA', dial: '+212', emoji: '🇲🇦', name: 'Morocco' },
  { code: 'MZ', dial: '+258', emoji: '🇲🇿', name: 'Mozambique' },
  { code: 'MM', dial: '+95', emoji: '🇲🇲', name: 'Myanmar' },
  { code: 'NA', dial: '+264', emoji: '🇳🇦', name: 'Namibia' },
  { code: 'NP', dial: '+977', emoji: '🇳🇵', name: 'Nepal' },
  { code: 'NL', dial: '+31', emoji: '🇳🇱', name: 'Netherlands' },
  { code: 'NZ', dial: '+64', emoji: '🇳🇿', name: 'New Zealand' },
  { code: 'NI', dial: '+505', emoji: '🇳🇮', name: 'Nicaragua' },
  { code: 'NE', dial: '+227', emoji: '🇳🇪', name: 'Niger' },
  { code: 'NG', dial: '+234', emoji: '🇳🇬', name: 'Nigeria' },
  { code: 'NO', dial: '+47', emoji: '🇳🇴', name: 'Norway' },
  { code: 'OM', dial: '+968', emoji: '🇴🇲', name: 'Oman' },
  { code: 'PK', dial: '+92', emoji: '🇵🇰', name: 'Pakistan' },
  { code: 'PS', dial: '+970', emoji: '🇵🇸', name: 'Palestine' },
  { code: 'PA', dial: '+507', emoji: '🇵🇦', name: 'Panama' },
  { code: 'PG', dial: '+675', emoji: '🇵🇬', name: 'Papua New Guinea' },
  { code: 'PY', dial: '+595', emoji: '🇵🇾', name: 'Paraguay' },
  { code: 'PE', dial: '+51', emoji: '🇵🇪', name: 'Peru' },
  { code: 'PH', dial: '+63', emoji: '🇵🇭', name: 'Philippines' },
  { code: 'PL', dial: '+48', emoji: '🇵🇱', name: 'Poland' },
  { code: 'PT', dial: '+351', emoji: '🇵🇹', name: 'Portugal' },
  { code: 'QA', dial: '+974', emoji: '🇶🇦', name: 'Qatar' },
  { code: 'RU', dial: '+7', emoji: '🇷🇺', name: 'Russia' },
  { code: 'RW', dial: '+250', emoji: '🇷🇼', name: 'Rwanda' },
  { code: 'SA', dial: '+966', emoji: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'SN', dial: '+221', emoji: '🇸🇳', name: 'Senegal' },
  { code: 'RS', dial: '+381', emoji: '🇷🇸', name: 'Serbia' },
  { code: 'SC', dial: '+248', emoji: '🇸🇨', name: 'Seychelles' },
  { code: 'SL', dial: '+232', emoji: '🇸🇱', name: 'Sierra Leone' },
  { code: 'SG', dial: '+65', emoji: '🇸🇬', name: 'Singapore' },
  { code: 'SK', dial: '+421', emoji: '🇸🇰', name: 'Slovakia' },
  { code: 'SI', dial: '+386', emoji: '🇸🇮', name: 'Slovenia' },
  { code: 'SO', dial: '+252', emoji: '🇸🇴', name: 'Somalia' },
  { code: 'ZA', dial: '+27', emoji: '🇿🇦', name: 'South Africa' },
  { code: 'SS', dial: '+211', emoji: '🇸🇸', name: 'South Sudan' },
  { code: 'ES', dial: '+34', emoji: '🇪🇸', name: 'Spain' },
  { code: 'LK', dial: '+94', emoji: '🇱🇰', name: 'Sri Lanka' },
  { code: 'SD', dial: '+249', emoji: '🇸🇩', name: 'Sudan' },
  { code: 'SR', dial: '+597', emoji: '🇸🇷', name: 'Suriname' },
  { code: 'SE', dial: '+46', emoji: '🇸🇪', name: 'Sweden' },
  { code: 'CH', dial: '+41', emoji: '🇨🇭', name: 'Switzerland' },
  { code: 'SY', dial: '+963', emoji: '🇸🇾', name: 'Syria' },
  { code: 'TW', dial: '+886', emoji: '🇹🇼', name: 'Taiwan' },
  { code: 'TJ', dial: '+992', emoji: '🇹🇯', name: 'Tajikistan' },
  { code: 'TZ', dial: '+255', emoji: '🇹🇿', name: 'Tanzania' },
  { code: 'TH', dial: '+66', emoji: '🇹🇭', name: 'Thailand' },
  { code: 'TG', dial: '+228', emoji: '🇹🇬', name: 'Togo' },
  { code: 'TN', dial: '+216', emoji: '🇹🇳', name: 'Tunisia' },
  { code: 'TR', dial: '+90', emoji: '🇹🇷', name: 'Turkey' },
  { code: 'TM', dial: '+993', emoji: '🇹🇲', name: 'Turkmenistan' },
  { code: 'UG', dial: '+256', emoji: '🇺🇬', name: 'Uganda' },
  { code: 'UA', dial: '+380', emoji: '🇺🇦', name: 'Ukraine' },
  { code: 'AE', dial: '+971', emoji: '🇦🇪', name: 'United Arab Emirates' },
  { code: 'GB', dial: '+44', emoji: '🇬🇧', name: 'United Kingdom' },
  { code: 'US', dial: '+1', emoji: '🇺🇸', name: 'United States' },
  { code: 'UY', dial: '+598', emoji: '🇺🇾', name: 'Uruguay' },
  { code: 'UZ', dial: '+998', emoji: '🇺🇿', name: 'Uzbekistan' },
  { code: 'VE', dial: '+58', emoji: '🇻🇪', name: 'Venezuela' },
  { code: 'VN', dial: '+84', emoji: '🇻🇳', name: 'Vietnam' },
  { code: 'YE', dial: '+967', emoji: '🇾🇪', name: 'Yemen' },
  { code: 'ZM', dial: '+260', emoji: '🇿🇲', name: 'Zambia' },
  { code: 'ZW', dial: '+263', emoji: '🇿🇼', name: 'Zimbabwe' }
];

const CountryPhoneDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = countries.find((c) => c.dial === value) || countries[0];

  useOutsideClose(ref, () => setOpen(false));

  const handleSelect = (dial) => {
    onChange({ target: { name: 'phonePrefix', value: dial } });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="w-32 px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary flex items-center justify-between"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2">
          <span aria-hidden>{selected.emoji}</span>
          <span className="text-sm">{selected.code}</span>
        </span>
        <span className="text-sm font-semibold">{selected.dial}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-72 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {countries.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleSelect(c.dial)}
              className="w-full px-3 py-2 text-left hover:bg-[#ecfeff] flex items-center gap-3 text-text-primary"
              style={{ fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", "Segoe UI", sans-serif' }}
            >
              <span className="w-6 text-center" aria-hidden>{c.emoji}</span>
              <span className="flex-1 text-sm">{c.name}</span>
              <span className="text-sm font-semibold">{c.dial}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CountryPhoneDropdown;
