import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddPatient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Date Identificare
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    cnp: '',
    email: '',
    phone: '',
    
    // Biometrie
    heightCm: '',
    weightKg: '',
    neckCircumferenceCm: '',
    
    // Demografie
    county: '',
    locality: '',
    environmentType: 'Urban',
    maritalStatus: 'Necăsătorit/ă',
    occupation: '',
    educationLevel: 'Liceal',
    householdSize: '',
    childrenCount: '',
    
    // Screening OSA
    stopBangScore: '',
    epworthScore: '',
    sasoForm: 'Ușoară',
    sleepPosition: 'Lateral',
    
    status: 'Active'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Clean up empty values before sending
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([, value]) => value !== '' && value !== null && value !== undefined)
      );
      
      await axios.post('/api/patients', cleanData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Pacient adăugat cu succes!');
      setTimeout(() => navigate('/patients'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la adăugarea pacientului');
    }
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#065f46]">Adaugă Pacient Nou</h1>
          <button
            onClick={() => navigate('/patients')}
            className="px-4 py-2 bg-[#f0fdfa] text-[#0d9488] rounded-lg hover:bg-[#ccfbf1] font-medium"
          >
            ← Înapoi
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Identificare */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
            <h2 className="text-xl font-bold text-[#065f46] mb-4">Date Identificare</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Nume *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46] focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Prenume *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Data nașterii *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Sex *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                >
                  <option value="Male">Masculin</option>
                  <option value="Female">Feminin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  CNP
                </label>
                <input
                  type="text"
                  name="cnp"
                  value={formData.cnp}
                  onChange={handleChange}
                  maxLength="13"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
            </div>
          </div>

          {/* Biometrie */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
            <h2 className="text-xl font-bold text-[#065f46] mb-4">Biometrie</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Înălțime (cm) *
                </label>
                <input
                  type="number"
                  name="heightCm"
                  value={formData.heightCm}
                  onChange={handleChange}
                  required
                  min="100"
                  max="250"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Greutate (kg) *
                </label>
                <input
                  type="number"
                  name="weightKg"
                  value={formData.weightKg}
                  onChange={handleChange}
                  required
                  min="30"
                  max="300"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Circumferință gât (cm)
                </label>
                <input
                  type="number"
                  name="neckCircumferenceCm"
                  value={formData.neckCircumferenceCm}
                  onChange={handleChange}
                  min="20"
                  max="70"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
            </div>
          </div>

          {/* Demografie */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
            <h2 className="text-xl font-bold text-[#065f46] mb-4">Demografie</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Județ
                </label>
                <input
                  type="text"
                  name="county"
                  value={formData.county}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Localitate
                </label>
                <input
                  type="text"
                  name="locality"
                  value={formData.locality}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Tip mediu
                </label>
                <select
                  name="environmentType"
                  value={formData.environmentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                >
                  <option value="Urban">Urban</option>
                  <option value="Rural">Rural</option>
                  <option value="Suburban">Suburban</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Stare civilă
                </label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                >
                  <option value="Necăsătorit/ă">Necăsătorit/ă</option>
                  <option value="Căsătorit/ă">Căsătorit/ă</option>
                  <option value="Divorțat/ă">Divorțat/ă</option>
                  <option value="Văduv/ă">Văduv/ă</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Ocupație
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Nivel educație
                </label>
                <select
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                >
                  <option value="Primar">Primar</option>
                  <option value="Gimnazial">Gimnazial</option>
                  <option value="Liceal">Liceal</option>
                  <option value="Universitar">Universitar</option>
                  <option value="Postuniversitar">Postuniversitar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Număr persoane în gospodărie
                </label>
                <input
                  type="number"
                  name="householdSize"
                  value={formData.householdSize}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Număr copii în gospodărie
                </label>
                <input
                  type="number"
                  name="childrenCount"
                  value={formData.childrenCount}
                  onChange={handleChange}
                  min="0"
                  max="15"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
            </div>
          </div>

          {/* Screening OSA */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
            <h2 className="text-xl font-bold text-[#065f46] mb-4">Screening OSA</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  STOP-BANG Score (0-8)
                </label>
                <input
                  type="number"
                  name="stopBangScore"
                  value={formData.stopBangScore}
                  onChange={handleChange}
                  min="0"
                  max="8"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Epworth Score (0-24)
                </label>
                <input
                  type="number"
                  name="epworthScore"
                  value={formData.epworthScore}
                  onChange={handleChange}
                  min="0"
                  max="24"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Formă SASO
                </label>
                <select
                  name="sasoForm"
                  value={formData.sasoForm}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                >
                  <option value="Ușoară">Ușoară</option>
                  <option value="Moderată">Moderată</option>
                  <option value="Severă">Severă</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Poziție somn
                </label>
                <select
                  name="sleepPosition"
                  value={formData.sleepPosition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                >
                  <option value="Spate">Spate</option>
                  <option value="Lateral">Lateral</option>
                  <option value="Abdomen">Abdomen</option>
                  <option value="Mixtă">Mixtă</option>
                </select>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488] font-semibold transition-colors"
            >
              Adaugă Pacient
            </button>
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="flex-1 px-6 py-3 bg-[#f0fdfa] text-[#0d9488] rounded-lg hover:bg-[#ccfbf1] font-semibold transition-colors"
            >
              Anulează
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
