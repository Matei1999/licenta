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
    phonePrefix: '+40',
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

    status: 'Active'
  });
  const [error, setError] = useState('');

  // Calculate BMI whenever height or weight changes
  const calculateBMI = () => {
    const height = parseFloat(formData.heightCm);
    const weight = parseFloat(formData.weightKg);
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
      return bmi;
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Combine phone prefix with phone number
      const cleanData = {
        ...formData,
        phone: formData.phonePrefix && formData.phone ? `${formData.phonePrefix}${formData.phone}` : formData.phone
      };
      
      // Remove phonePrefix before sending (not needed in DB)
      delete cleanData.phonePrefix;
      
      // Clean up empty values before sending
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

        <form onSubmit={handleNext} className="space-y-6">
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
                <div className="flex gap-2">
                  <select
                    name="phonePrefix"
                    value={formData.phonePrefix}
                    onChange={handleChange}
                    className="w-32 px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                  >
                    <option value="+40">🇷🇴 +40</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+43">🇦🇹 +43</option>
                    <option value="+32">🇧🇪 +32</option>
                    <option value="+31">🇳🇱 +31</option>
                    <option value="+41">🇨🇭 +41</option>
                    <option value="+46">🇸🇪 +46</option>
                    <option value="+47">🇳🇴 +47</option>
                    <option value="+45">🇩🇰 +45</option>
                    <option value="+351">🇵🇹 +351</option>
                    <option value="+30">🇬🇷 +30</option>
                    <option value="+36">🇭🇺 +36</option>
                    <option value="+48">🇵🇱 +48</option>
                    <option value="+420">🇨🇿 +420</option>
                    <option value="+421">🇸🇰 +421</option>
                    <option value="+359">🇧🇬 +359</option>
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46]"
                    placeholder="745123456"
                  />
                </div>
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
            
            {/* BMI Display */}
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
                   'Obez'}
                </p>
              </div>
            )}
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

          {/* Next to questionnaires */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488] font-semibold transition-colors"
            >
              Next: Chestionare
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
