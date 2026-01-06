import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RomanianDateInput from '../components/RomanianDateInput';
import CountryPhoneDropdown from '../components/CountryPhoneDropdown';
import { extractInfoFromCNP, validateCNP } from '../utils/cnpUtils';

const AddPatient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    cnp: '',
    email: '',
    phonePrefix: '+40',
    phone: '',
    heightCm: '',
    weightKg: '',
    neckCircumferenceCm: '',
    county: '',
    locality: '',
    environmentType: 'Urban',
    occupation: '',
    educationLevel: 'Liceal',
    householdSize: '',
    childrenCount: '',
    status: 'Active'
  });
  const [error, setError] = useState('');

  const calculateBMI = () => {
    const height = parseFloat(formData.heightCm);
    const weight = parseFloat(formData.weightKg);
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(2);
    }
    return null;
  };

  // Handle CNP change and auto-fill fields
  const handleCNPChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Dacă CNP are 13 caractere și sunt doar cifre
    if (value.length === 13 && /^\d{13}$/.test(value)) {
      if (validateCNP(value)) {
        const cnpInfo = extractInfoFromCNP(value);
        if (cnpInfo) {
          // Auto-fill sex, birthDate, county
          setFormData((prev) => ({
            ...prev,
            gender: cnpInfo.sex === 'M' ? 'Male' : 'Female',
            dateOfBirth: cnpInfo.birthDate,
            county: cnpInfo.county || prev.county
          }));
          setError('');
        }
      } else {
        setError('CNP-ul nu este valid. Verifică cifrele introduse.');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      const cleanData = {
        ...formData,
        phone: formData.phonePrefix && formData.phone ? `${formData.phonePrefix}${formData.phone}` : formData.phone
      };
      delete cleanData.phonePrefix;
      const finalData = Object.fromEntries(
        Object.entries(cleanData).filter(([, value]) => value !== '' && value !== null && value !== undefined)
      );
      const res = await axios.post('/api/patients', finalData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newId = res.data?.id;
      if (newId) {
        navigate(`/patients/${newId}/stop-bang`);
      } else {
        setError('Pacient salvat, dar nu am primit ID-ul. Verifică lista de pacienți.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la adăugarea pacientului');
    }
  };

  const handleSaveAndClose = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      const cleanData = {
        ...formData,
        phone: formData.phonePrefix && formData.phone ? `${formData.phonePrefix}${formData.phone}` : formData.phone
      };
      delete cleanData.phonePrefix;
      const finalData = Object.fromEntries(
        Object.entries(cleanData).filter(([, value]) => value !== '' && value !== null && value !== undefined)
      );
      await axios.post('/api/patients', finalData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/patients');
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la adăugarea pacientului');
    }
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text-primary">Adaugă Pacient Nou</h1>
          <button
            onClick={() => navigate('/patients')}
            className="px-4 py-2 bg-bg-surface text-primary-hover rounded-lg hover:bg-primary-light font-medium"
          >
            ← Înapoi
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleNext} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Date Identificare</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Nume *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Prenume *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Data nașterii *</label>
                <RomanianDateInput
                  value={formData.dateOfBirth}
                  onChange={(val) => handleChange({ target: { name: 'dateOfBirth', value: val } })}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Sex *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary"
                >
                  <option value="Male">Masculin</option>
                  <option value="Female">Feminin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">CNP</label>
                <input
                  type="text"
                  name="cnp"
                  value={formData.cnp}
                  onChange={handleCNPChange}
                  maxLength="13"
                  placeholder="1234567890123 (13 cifre)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary"
                />
                <p className="text-xs text-gray-500 mt-1">Se vor completa automat: Data nașterii, Sexul și Județul</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Telefon</label>
                <div className="flex gap-2 items-center">
                  <CountryPhoneDropdown value={formData.phonePrefix} onChange={handleChange} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary"
                    placeholder="745123456"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Biometrie</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Înălțime (cm) *</label>
                <input
                  type="number"
                  name="heightCm"
                  value={formData.heightCm}
                  onChange={handleChange}
                  required
                  min="100"
                  max="250"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Greutate (kg) *</label>
                <input
                  type="number"
                  name="weightKg"
                  value={formData.weightKg}
                  onChange={handleChange}
                  required
                  min="30"
                  max="300"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Circumferință gât (cm)</label>
                <input
                  type="number"
                  name="neckCircumferenceCm"
                  value={formData.neckCircumferenceCm}
                  onChange={handleChange}
                  min="20"
                  max="70"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary"
                />
              </div>
            </div>
            {calculateBMI() && (
              <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-teal-900">BMI (calculat automat):</span>
                  <span className="text-2xl font-bold text-teal-700">{calculateBMI()} kg/m²</span>
                </div>
                <p className="text-xs text-teal-600 mt-1">
                  {parseFloat(calculateBMI()) < 18.5 ? 'Subponderal' :
                   parseFloat(calculateBMI()) < 25 ? 'Normal' :
                   parseFloat(calculateBMI()) < 30 ? 'Supraponderal' :
                   parseFloat(calculateBMI()) < 40 ? 'Obez' :
                   'Obez Morbid'}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Demografie</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Județ</label>
                <input
                  type="text"
                  name="county"
                  value={formData.county}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Localitate</label>
                <input
                  type="text"
                  name="locality"
                  value={formData.locality}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Tip mediu</label>
                <select
                  name="environmentType"
                  value={formData.environmentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary"
                >
                  <option value="Urban">Urban</option>
                  <option value="Rural">Rural</option>
                  <option value="Suburban">Suburban</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Ocupație</label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Nivel educație</label>
                <select
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-bg-surface text-text-primary"
                >
                  <option value="Primar">Primar</option>
                  <option value="Gimnazial">Gimnazial</option>
                  <option value="Liceal">Liceal</option>
                  <option value="Universitar">Universitar</option>
                  <option value="Postuniversitar">Postuniversitar</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold transition-colors"
            >
              Salvează
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold transition-colors"
            >
              Salvează & Chestionare
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
