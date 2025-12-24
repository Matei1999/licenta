import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RomanianDateInput from '../components/RomanianDateInput';

const VisitForm = () => {
  const { patientId, visitId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [previousVisit, setPreviousVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visit, setVisit] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    clinician: '',
    // Sleep metrics
    ahi: '',
    ahiResidual: '',
    desatIndex: '',
    ahiNrem: '',
    ahiRem: '',
    // Oxygen metrics
    spo2Min: '',
    spo2Max: '',
    spo2Mean: '',
    meanDesaturations: '',
    t90: '',
    t45: '',
    povaraHipoxica: '',
    // CPAP metrics
    cpapCompliancePct: '',
    cpapCompliance4hPct: '',
    cpapUsageMin: '',
    cpapLeaks95p: '',
    cpapPressure95p: '',
    // Mask
    maskType: '',
    maskFitGood: false,
    maskChange: false,
    // Comorbidities
    comorbidities: {
      cardiovascular: [],
      metabolic: [],
      respiratory: [],
      neurologic: [],
      other: []
    },
    // Behavioral factors
    behavioral: {
      sleepHoursPerNight: '',
      bedtimeTypical: '',
      wakeTimeTypical: '',
      sleepVariability: '',
      fragmentedSleep: false,
      alcoholFrequency: '',
      alcoholAmount: '',
      smokingStatus: '',
      cigarettesPerDay: '',
      caffeineCount: '',
      physicalActivity: '',
      napFrequency: '',
      napDuration: '',
      sleepPosition: '',
      positionalOSA: false
    },
    // ORL history
    orlHistory: {
      deviateSeptum: '',
      tonsilHypertrophy: false,
      macroglossia: false,
      mallampatiClass: '',
      retrognathia: false,
      orlSurgery: false,
      orlSurgeryDetails: '',
      nasalObstruction: false,
      chronicRhinitis: false
    },
    // Psychosocial
    psychosocial: {
      socialSupport: '',
      chronicStress: false,
      treatmentSatisfaction: '',
      treatmentMotivation: '',
      rosenbergScore: '',
      whoqolPhysical: '',
      whoqolPsychological: '',
      whoqolSocial: '',
      whoqolEnvironment: '',
      phq2Score: '',
      gad2Score: ''
    },
    // Biomarkers
    biomarkers: {
      crp: '',
      hba1c: '',
      ldl: '',
      hdl: '',
      triglycerides: '',
      tsh: '',
      vitaminD: '',
      creatinine: ''
    },
    // Driving risk (if professional driver)
    drivingRisk: {
      isProfessionalDriver: false,
      drowsinessWhileDriving: false,
      drowsinessFrequency: '',
      accidentsLast3Years: '',
      shiftWorkHours: '',
      resumedDrivingAfterTreatment: false
    },
    // Notes
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [patientId, visitId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      let actualPatientId = patientId;

      if (visitId) {
        // Edit mode - fetch existing visit first to get patientId
        const visitRes = await axios.get(`/api/visits/${visitId}`, { headers });
        setVisit(visitRes.data);
        actualPatientId = visitRes.data.patientId;
      }

      // Fetch patient
      const patientRes = await axios.get(`/api/patients/${actualPatientId}`, { headers });
      setPatient(patientRes.data);

      // Fetch previous visits for comparison
      const visitsRes = await axios.get(`/api/visits?patientId=${actualPatientId}&limit=1`, { headers });
      if (visitsRes.data.length > 0) {
        setPreviousVisit(visitsRes.data[0]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setVisit(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToggleComorbidity = (category, value) => {
    setVisit(prev => {
      const currentArray = prev.comorbidities[category] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        comorbidities: {
          ...prev.comorbidities,
          [category]: newArray
        }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Folosește patientId din URL sau din visit (dacă e vizită existentă) sau din patient
      const actualPatientId = patientId || visit.patientId || patient?.id;
      
      if (!actualPatientId) {
        alert('Eroare: Nu s-a putut identifica pacientul');
        return;
      }

      const dataToSubmit = {
        ...visit,
        patientId: actualPatientId,
        // Convert empty strings to null
        ahi: visit.ahi ? parseFloat(visit.ahi) : null,
        ahiResidual: visit.ahiResidual ? parseFloat(visit.ahiResidual) : null,
        desatIndex: visit.desatIndex ? parseFloat(visit.desatIndex) : null,
        ahiNrem: visit.ahiNrem ? parseFloat(visit.ahiNrem) : null,
        ahiRem: visit.ahiRem ? parseFloat(visit.ahiRem) : null,
        spo2Min: visit.spo2Min ? parseInt(visit.spo2Min) : null,
        spo2Max: visit.spo2Max ? parseInt(visit.spo2Max) : null,
        spo2Mean: visit.spo2Mean ? parseFloat(visit.spo2Mean) : null,
        meanDesaturations: visit.meanDesaturations ? parseFloat(visit.meanDesaturations) : null,
        t90: visit.t90 ? parseFloat(visit.t90) : null,
        t45: visit.t45 ? parseFloat(visit.t45) : null,
        povaraHipoxica: visit.povaraHipoxica ? parseFloat(visit.povaraHipoxica) : null,
        cpapCompliancePct: visit.cpapCompliancePct ? parseInt(visit.cpapCompliancePct) : null,
        cpapCompliance4hPct: visit.cpapCompliance4hPct ? parseInt(visit.cpapCompliance4hPct) : null,
        cpapUsageMin: visit.cpapUsageMin ? parseInt(visit.cpapUsageMin) : null,
        cpapLeaks95p: visit.cpapLeaks95p ? parseFloat(visit.cpapLeaks95p) : null,
        cpapPressure95p: visit.cpapPressure95p ? parseFloat(visit.cpapPressure95p) : null,
        maskType: visit.maskType || null,
      };

      if (visitId) {
        await axios.put(`/api/visits/${visitId}`, dataToSubmit, { headers });
        alert('Vizită actualizată cu succes!');
      } else {
        await axios.post('/api/visits', dataToSubmit, { headers });
        alert('Vizită adăugată cu succes!');
      }

      // Force complete page reload to refresh all patient data
      window.location.href = `/patients/${actualPatientId}`;
    } catch (error) {
      console.error('Error saving visit:', error);
      console.error('Error response:', error.response?.data);
      console.error('Full error details:', JSON.stringify(error.response?.data, null, 2));
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      alert('Eroare la salvare: ' + errorMsg);
    }
  };

  const getSeverityColor = (ahi) => {
    if (!ahi) return 'gray';
    if (ahi < 5) return 'green';
    if (ahi < 15) return 'yellow';
    if (ahi < 30) return 'orange';
    return 'red';
  };

  const getSeverityLabel = (ahi) => {
    if (!ahi) return 'N/A';
    if (ahi < 5) return 'Normal';
    if (ahi < 15) return 'Ușor';
    if (ahi < 30) return 'Moderat';
    return 'Sever';
  };

  const getComparisonArrow = (current, previous) => {
    if (!current || !previous) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 0.5) return '→';
    return diff > 0 ? '↑' : '↓';
  };

  const getComparisonColor = (current, previous, lowerIsBetter = true) => {
    if (!current || !previous) return 'text-[#0d9488]';
    const diff = current - previous;
    if (Math.abs(diff) < 0.5) return 'text-[#0d9488]';
    
    if (lowerIsBetter) {
      return diff > 0 ? 'text-red-600' : 'text-green-600';
    } else {
      return diff > 0 ? 'text-green-600' : 'text-red-600';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Se încarcă...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#065f46]">
              {visitId ? 'Editare Vizită' : 'Vizită Nouă'}
            </h1>
            <p className="text-[#0d9488] mt-1">
              Pacient: {patient?.firstName} {patient?.lastName}
            </p>
          </div>
          <button
            onClick={() => {
              const targetPatientId = visitId ? visit.patientId : patientId;
              navigate(`/patients/${targetPatientId}`);
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Anulează
          </button>
        </div>

        {previousVisit && !visitId && (
          <div className="bg-[#f0fdfa] border border-gray-200 rounded p-4 mb-4">
            <p className="text-sm font-semibold text-[#065f46]">
              Ultima vizită: {new Date(previousVisit.visitDate).toLocaleDateString('ro-RO')}
            </p>
            <p className="text-sm text-[#0d9488]">
              IAH: {previousVisit.ahi || 'N/A'} | Complianță: {previousVisit.cpapCompliancePct || 'N/A'}%
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Informații Generale</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                Data vizitei *
              </label>
              <input
                type="date"
                value={visit.visitDate}
                onChange={(e) => handleChange('visitDate', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                Medic curant *
              </label>
              <input
                type="text"
                value={visit.clinician}
                onChange={(e) => handleChange('clinician', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
                placeholder="Dr. Nume Prenume"
              />
            </div>
          </div>
        </div>

        {/* Sleep Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Metrici Somn</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                IAH (Apnea-Hypopnea Index)
              </label>
              <input
                type="number"
                step="0.1"
                value={visit.ahi}
                onChange={(e) => handleChange('ahi', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
                placeholder="ex: 28.5"
              />
              {visit.ahi && (
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded bg-${getSeverityColor(parseFloat(visit.ahi))}-200 text-${getSeverityColor(parseFloat(visit.ahi))}-800`}>
                    {getSeverityLabel(parseFloat(visit.ahi))}
                  </span>
                  {previousVisit && (
                    <span className={getComparisonColor(parseFloat(visit.ahi), previousVisit.ahi, true)}>
                      {getComparisonArrow(parseFloat(visit.ahi), previousVisit.ahi)} vs. {previousVisit.ahi}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                IAH Rezidual (sub CPAP)
              </label>
              <input
                type="number"
                step="0.1"
                value={visit.ahiResidual}
                onChange={(e) => handleChange('ahiResidual', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
                placeholder="ex: 3.2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                Index Desaturare (ODI)
              </label>
              <input
                type="number"
                step="0.1"
                value={visit.desatIndex}
                onChange={(e) => handleChange('desatIndex', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
                placeholder="ex: 6.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                IAH NREM
              </label>
              <input
                type="number"
                step="0.1"
                value={visit.ahiNrem}
                onChange={(e) => handleChange('ahiNrem', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                IAH REM
              </label>
              <input
                type="number"
                step="0.1"
                value={visit.ahiRem}
                onChange={(e) => handleChange('ahiRem', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
          </div>
        </div>

        {/* Oxygen Saturation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Saturație Oxigen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                SpO2 Min (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={visit.spo2Min}
                onChange={(e) => handleChange('spo2Min', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
                placeholder="ex: 85"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                SpO2 Max (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={visit.spo2Max}
                onChange={(e) => handleChange('spo2Max', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
                placeholder="ex: 98"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                SpO2 Medie (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={visit.spo2Mean}
                onChange={(e) => handleChange('spo2Mean', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
                placeholder="ex: 94.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                Media desaturărilor (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={visit.meanDesaturations}
                onChange={(e) => handleChange('meanDesaturations', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
                placeholder="ex: 3.2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                T90 (% timp SpO2 &lt; 90%)
              </label>
              <input
                type="number"
                step="0.1"
                value={visit.t90}
                onChange={(e) => handleChange('t90', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
                placeholder="ex: 2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                T45 (% timp SpO2 &lt; 45%)
              </label>
              <input
                type="number"
                step="0.1"
                value={visit.t45}
                onChange={(e) => handleChange('t45', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                Povară Hipoxică
              </label>
              <input
                type="number"
                step="0.1"
                value={visit.povaraHipoxica}
                onChange={(e) => handleChange('povaraHipoxica', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
          </div>
        </div>

        {/* CPAP Compliance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Complianță CPAP</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                Complianță (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={visit.cpapCompliancePct}
                onChange={(e) => handleChange('cpapCompliancePct', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
                placeholder="ex: 85"
              />
              {visit.cpapCompliancePct && (
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    parseInt(visit.cpapCompliancePct) >= 70 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {parseInt(visit.cpapCompliancePct) >= 70 ? 'Compliant' : 'Non-compliant'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                Complianță ≥4h (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={visit.cpapCompliance4hPct}
                onChange={(e) => handleChange('cpapCompliance4hPct', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                Utilizare medie (minute/noapte)
              </label>
              <input
                type="number"
                value={visit.cpapUsageMin}
                onChange={(e) => handleChange('cpapUsageMin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
                placeholder="ex: 420"
              />
              {visit.cpapUsageMin && (
                <p className="text-sm text-[#0d9488] mt-1">
                  ≈ {Math.floor(visit.cpapUsageMin / 60)}h {visit.cpapUsageMin % 60}min
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                Scurgeri 95p (L/min)
              </label>
              <input
                type="number"
                step="0.1"
                value={visit.cpapLeaks95p}
                onChange={(e) => handleChange('cpapLeaks95p', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
                placeholder="ex: 12.3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                Presiune 95p (cmH2O)
              </label>
              <input
                type="number"
                step="0.1"
                value={visit.cpapPressure95p}
                onChange={(e) => handleChange('cpapPressure95p', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
                placeholder="ex: 11.2"
              />
            </div>
          </div>
        </div>

        {/* Mask Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Informații Mască</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">
                Tip mască
              </label>
              <select
                value={visit.maskType}
                onChange={(e) => handleChange('maskType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
              >
                <option value="">Selectează...</option>
                <option value="Nazală">Nazală</option>
                <option value="Oronazală">Oronazală</option>
                <option value="Pillows (perne nazale)">Pillows (perne nazale)</option>
                <option value="Pernă Nazală">Pernă Nazală</option>
                <option value="Facială completă">Facială completă</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visit.maskFitGood}
                  onChange={(e) => handleChange('maskFitGood', e.target.checked)}
                  className="w-4 h-4 text-[#14b8a6]"
                />
                <span className="text-sm font-medium text-[#065f46]">Potrivire bună</span>
              </label>
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visit.maskChange}
                  onChange={(e) => handleChange('maskChange', e.target.checked)}
                  className="w-4 h-4 text-[#14b8a6]"
                />
                <span className="text-sm font-medium text-[#065f46]">Schimbare mască</span>
              </label>
            </div>
          </div>
        </div>

        {/* Comorbidities */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Comorbidități la această vizită</h2>
          <p className="text-sm text-[#0d9488] mb-4">Selectați comorbidități prezente/diagnosticate la această vizită (tracking în timp):</p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[#065f46] mb-2">Cardiovasculare</h3>
              <div className="space-y-2">
                {[
                  { code: 'I10', label: 'Hipertensiune arterială (HTA)' },
                  { code: 'I10.1', label: 'HTA rezistentă' },
                  { code: 'I48', label: 'Aritmii (fibrilație atrială)' },
                  { code: 'I50.9', label: 'Insuficiență cardiacă' },
                  { code: 'I25.1', label: 'Boală coronariană' }
                ].map(item => (
                  <label key={item.code} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={visit.comorbidities.cardiovascular?.includes(item.code) || false}
                      onChange={() => handleToggleComorbidity('cardiovascular', item.code)}
                      className="rounded"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-[#065f46] mb-2">Metabolice</h3>
              <div className="space-y-2">
                {[
                  { code: 'E11.9', label: 'Diabet zaharat tip 2' },
                  { code: 'E78.5', label: 'Dislipidemie' },
                  { code: 'E66.9', label: 'Obezitate' },
                  { code: 'E66.01', label: 'Istoric chirurgie bariatrică' }
                ].map(item => (
                  <label key={item.code} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={visit.comorbidities.metabolic?.includes(item.code) || false}
                      onChange={() => handleToggleComorbidity('metabolic', item.code)}
                      className="rounded"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-[#065f46] mb-2">Respiratorii</h3>
              <div className="space-y-2">
                {[
                  { code: 'J45.9', label: 'Astm bronsic' },
                  { code: 'J44.9', label: 'BPOC' },
                  { code: 'J84.9', label: 'Restrictive lung disease' }
                ].map(item => (
                  <label key={item.code} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={visit.comorbidities.respiratory?.includes(item.code) || false}
                      onChange={() => handleToggleComorbidity('respiratory', item.code)}
                      className="rounded"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-[#065f46] mb-2">Neurologice & Psihiatrice</h3>
              <div className="space-y-2">
                {[
                  { code: 'I63.9', label: 'Accident vascular cerebral' },
                  { code: 'F41.9', label: 'Tulburări anxioase' },
                  { code: 'F32.9', label: 'Tulburări depresive' },
                  { code: 'F03', label: 'Tulburări cognitive' }
                ].map(item => (
                  <label key={item.code} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={visit.comorbidities.neurologic?.includes(item.code) || false}
                      onChange={() => handleToggleComorbidity('neurologic', item.code)}
                      className="rounded"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-[#065f46] mb-2">Altele</h3>
              <div className="space-y-2">
                {[
                  { code: 'K21.9', label: 'Reflux gastro-esofagian' },
                  { code: 'E03.9', label: 'Hipotiroidism' },
                  { code: 'I26.9', label: 'Tromboembolism' },
                  { code: 'N18.9', label: 'Insuficiență renală cronică' }
                ].map(item => (
                  <label key={item.code} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={visit.comorbidities.other?.includes(item.code) || false}
                      onChange={() => handleToggleComorbidity('other', item.code)}
                      className="rounded"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Behavioral Factors */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Factori Comportamentali</h2>
          
          <h3 className="text-md font-semibold text-[#0d9488] mb-3">Somn</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Ore somn/noapte</label>
              <input type="number" step="0.5" value={visit.behavioral?.sleepHoursPerNight} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, sleepHoursPerNight: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: 7.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Oră culcare</label>
              <input type="time" value={visit.behavioral?.bedtimeTypical} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, bedtimeTypical: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Oră trezire</label>
              <input type="time" value={visit.behavioral?.wakeTimeTypical} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, wakeTimeTypical: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Variabilitate somn (weekend vs săptămână)</label>
              <input type="text" value={visit.behavioral?.sleepVariability} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, sleepVariability: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: +2h weekend" />
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="fragmentedSleep" checked={visit.behavioral?.fragmentedSleep} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, fragmentedSleep: e.target.checked }}))} className="mr-2" />
              <label htmlFor="fragmentedSleep" className="text-sm font-medium text-[#065f46]">Somn fragmentat ({'>'}3 treziri/noapte)</label>
            </div>
          </div>

          <h3 className="text-md font-semibold text-[#0d9488] mb-3 mt-4">Stil de viață</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Consum alcool (frecvență)</label>
              <select value={visit.behavioral?.alcoholFrequency} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, alcoholFrequency: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]">
                <option value="">Selectează...</option>
                <option value="niciodată">Niciodată</option>
                <option value="rar">Rar (1-2x/lună)</option>
                <option value="moderat">Moderat (1-2x/săptămână)</option>
                <option value="frecvent">Frecvent (3+x/săptămână)</option>
                <option value="zilnic">Zilnic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Cantitate alcool</label>
              <input type="text" value={visit.behavioral?.alcoholAmount} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, alcoholAmount: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: 1-2 pahare" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Status fumat</label>
              <select value={visit.behavioral?.smokingStatus} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, smokingStatus: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]">
                <option value="">Selectează...</option>
                <option value="nefumător">Nefumător</option>
                <option value="fumător_activ">Fumător activ</option>
                <option value="fumător_pasiv">Fumător pasiv</option>
                <option value="ex-fumător">Ex-fumător</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Țigări/zi</label>
              <input type="number" value={visit.behavioral?.cigarettesPerDay} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, cigarettesPerDay: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Cafele/zi</label>
              <input type="number" value={visit.behavioral?.caffeineCount} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, caffeineCount: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Activitate fizică</label>
              <select value={visit.behavioral?.physicalActivity} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, physicalActivity: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]">
                <option value="">Selectează...</option>
                <option value="sedentar">Sedentar</option>
                <option value="moderat">Moderat</option>
                <option value="intens">Intens</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Sieste (frecvență)</label>
              <input type="text" value={visit.behavioral?.napFrequency} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, napFrequency: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: 2x/săptămână" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Durată sieste (min)</label>
              <input type="number" value={visit.behavioral?.napDuration} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, napDuration: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
          </div>

          <h3 className="text-md font-semibold text-[#0d9488] mb-3 mt-4">Poziție somn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Poziție preponderentă</label>
              <select value={visit.behavioral?.sleepPosition} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, sleepPosition: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]">
                <option value="">Selectează...</option>
                <option value="dorsal">Dorsal (spate)</option>
                <option value="lateral">Lateral</option>
                <option value="abdomen">Abdomen</option>
                <option value="mixt">Mixt</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="positionalOSA" checked={visit.behavioral?.positionalOSA} onChange={(e) => setVisit(prev => ({ ...prev, behavioral: { ...prev.behavioral, positionalOSA: e.target.checked }}))} className="mr-2" />
              <label htmlFor="positionalOSA" className="text-sm font-medium text-[#065f46]">OSA pozițională (dorsal-dependent)</label>
            </div>
          </div>
        </div>

        {/* ORL History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Istoric ORL & Obstrucție Căi Aeriene</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Deviație sept</label>
              <select value={visit.orlHistory?.deviateSeptum} onChange={(e) => setVisit(prev => ({ ...prev, orlHistory: { ...prev.orlHistory, deviateSeptum: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]">
                <option value="">Selectează...</option>
                <option value="nu">Nu</option>
                <option value="da">Da</option>
                <option value="necunoscut">Necunoscut</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="tonsilHypertrophy" checked={visit.orlHistory?.tonsilHypertrophy} onChange={(e) => setVisit(prev => ({ ...prev, orlHistory: { ...prev.orlHistory, tonsilHypertrophy: e.target.checked }}))} className="mr-2" />
              <label htmlFor="tonsilHypertrophy" className="text-sm font-medium text-[#065f46]">Hipertrofie amigdaliană</label>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="macroglossia" checked={visit.orlHistory?.macroglossia} onChange={(e) => setVisit(prev => ({ ...prev, orlHistory: { ...prev.orlHistory, macroglossia: e.target.checked }}))} className="mr-2" />
              <label htmlFor="macroglossia" className="text-sm font-medium text-[#065f46]">Macroglosie</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Clasificare Mallampati</label>
              <select value={visit.orlHistory?.mallampatiClass} onChange={(e) => setVisit(prev => ({ ...prev, orlHistory: { ...prev.orlHistory, mallampatiClass: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]">
                <option value="">Selectează...</option>
                <option value="I">I</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="retrognathia" checked={visit.orlHistory?.retrognathia} onChange={(e) => setVisit(prev => ({ ...prev, orlHistory: { ...prev.orlHistory, retrognathia: e.target.checked }}))} className="mr-2" />
              <label htmlFor="retrognathia" className="text-sm font-medium text-[#065f46]">Retrognatism / Micrognatie</label>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="orlSurgery" checked={visit.orlHistory?.orlSurgery} onChange={(e) => setVisit(prev => ({ ...prev, orlHistory: { ...prev.orlHistory, orlSurgery: e.target.checked }}))} className="mr-2" />
              <label htmlFor="orlSurgery" className="text-sm font-medium text-[#065f46]">Istoric chirurgie ORL</label>
            </div>
            {visit.orlHistory?.orlSurgery && (
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-[#065f46] mb-1">Detalii chirurgie ORL</label>
                <input type="text" value={visit.orlHistory?.orlSurgeryDetails} onChange={(e) => setVisit(prev => ({ ...prev, orlHistory: { ...prev.orlHistory, orlSurgeryDetails: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: uvulopalatoplastie în 2020" />
              </div>
            )}
            <div className="flex items-center pt-6">
              <input type="checkbox" id="nasalObstruction" checked={visit.orlHistory?.nasalObstruction} onChange={(e) => setVisit(prev => ({ ...prev, orlHistory: { ...prev.orlHistory, nasalObstruction: e.target.checked }}))} className="mr-2" />
              <label htmlFor="nasalObstruction" className="text-sm font-medium text-[#065f46]">Obstrucție nazală la examen</label>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="chronicRhinitis" checked={visit.orlHistory?.chronicRhinitis} onChange={(e) => setVisit(prev => ({ ...prev, orlHistory: { ...prev.orlHistory, chronicRhinitis: e.target.checked }}))} className="mr-2" />
              <label htmlFor="chronicRhinitis" className="text-sm font-medium text-[#065f46]">Rinite cronice / Alergii</label>
            </div>
          </div>
        </div>

        {/* Psychosocial */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Date Psihosociale</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Suport social perceput</label>
              <select value={visit.psychosocial?.socialSupport} onChange={(e) => setVisit(prev => ({ ...prev, psychosocial: { ...prev.psychosocial, socialSupport: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]">
                <option value="">Selectează...</option>
                <option value="scăzut">Scăzut</option>
                <option value="mediu">Mediu</option>
                <option value="ridicat">Ridicat</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="chronicStress" checked={visit.psychosocial?.chronicStress} onChange={(e) => setVisit(prev => ({ ...prev, psychosocial: { ...prev.psychosocial, chronicStress: e.target.checked }}))} className="mr-2" />
              <label htmlFor="chronicStress" className="text-sm font-medium text-[#065f46]">Stres cronic / Burnout</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Satisfacție tratament (1-10)</label>
              <input type="number" min="1" max="10" value={visit.psychosocial?.treatmentSatisfaction} onChange={(e) => setVisit(prev => ({ ...prev, psychosocial: { ...prev.psychosocial, treatmentSatisfaction: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Motivație tratament (1-10)</label>
              <input type="number" min="1" max="10" value={visit.psychosocial?.treatmentMotivation} onChange={(e) => setVisit(prev => ({ ...prev, psychosocial: { ...prev.psychosocial, treatmentMotivation: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Scor Rosenberg</label>
              <input type="number" value={visit.psychosocial?.rosenbergScore} onChange={(e) => setVisit(prev => ({ ...prev, psychosocial: { ...prev.psychosocial, rosenbergScore: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
          </div>
          
          <h3 className="text-md font-semibold text-[#0d9488] mb-3 mt-4">WHOQOL-BREF (0-100)</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Fizic</label>
              <input type="number" min="0" max="100" value={visit.psychosocial?.whoqolPhysical} onChange={(e) => setVisit(prev => ({ ...prev, psychosocial: { ...prev.psychosocial, whoqolPhysical: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Psihologic</label>
              <input type="number" min="0" max="100" value={visit.psychosocial?.whoqolPsychological} onChange={(e) => setVisit(prev => ({ ...prev, psychosocial: { ...prev.psychosocial, whoqolPsychological: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Social</label>
              <input type="number" min="0" max="100" value={visit.psychosocial?.whoqolSocial} onChange={(e) => setVisit(prev => ({ ...prev, psychosocial: { ...prev.psychosocial, whoqolSocial: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Mediu</label>
              <input type="number" min="0" max="100" value={visit.psychosocial?.whoqolEnvironment} onChange={(e) => setVisit(prev => ({ ...prev, psychosocial: { ...prev.psychosocial, whoqolEnvironment: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
          </div>

          <h3 className="text-md font-semibold text-[#0d9488] mb-3 mt-4">Screening anxietate & depresie</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">PHQ-2 Score (0-6)</label>
              <input type="number" min="0" max="6" value={visit.psychosocial?.phq2Score} onChange={(e) => setVisit(prev => ({ ...prev, psychosocial: { ...prev.psychosocial, phq2Score: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">GAD-2 Score (0-6)</label>
              <input type="number" min="0" max="6" value={visit.psychosocial?.gad2Score} onChange={(e) => setVisit(prev => ({ ...prev, psychosocial: { ...prev.psychosocial, gad2Score: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
          </div>
        </div>

        {/* Biomarkers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Biomarkeri</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">CRP (mg/L)</label>
              <input type="number" step="0.1" value={visit.biomarkers?.crp} onChange={(e) => setVisit(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, crp: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: 3.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">HbA1c (%)</label>
              <input type="number" step="0.1" value={visit.biomarkers?.hba1c} onChange={(e) => setVisit(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, hba1c: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: 5.7" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">LDL (mg/dL)</label>
              <input type="number" value={visit.biomarkers?.ldl} onChange={(e) => setVisit(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, ldl: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: 130" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">HDL (mg/dL)</label>
              <input type="number" value={visit.biomarkers?.hdl} onChange={(e) => setVisit(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, hdl: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: 45" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Trigliceride (mg/dL)</label>
              <input type="number" value={visit.biomarkers?.triglycerides} onChange={(e) => setVisit(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, triglycerides: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: 150" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">TSH (μIU/mL)</label>
              <input type="number" step="0.01" value={visit.biomarkers?.tsh} onChange={(e) => setVisit(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, tsh: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: 2.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Vitamina D (ng/mL)</label>
              <input type="number" step="0.1" value={visit.biomarkers?.vitaminD} onChange={(e) => setVisit(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, vitaminD: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: 30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Creatinină (mg/dL)</label>
              <input type="number" step="0.01" value={visit.biomarkers?.creatinine} onChange={(e) => setVisit(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, creatinine: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: 1.0" />
            </div>
          </div>
        </div>

        {/* Driving Risk */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Risc Rutier & Conducere</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center pt-6">
              <input type="checkbox" id="isProfessionalDriver" checked={visit.drivingRisk?.isProfessionalDriver} onChange={(e) => setVisit(prev => ({ ...prev, drivingRisk: { ...prev.drivingRisk, isProfessionalDriver: e.target.checked }}))} className="mr-2" />
              <label htmlFor="isProfessionalDriver" className="text-sm font-medium text-[#065f46]">Șofer profesionist</label>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="drowsinessWhileDriving" checked={visit.drivingRisk?.drowsinessWhileDriving} onChange={(e) => setVisit(prev => ({ ...prev, drivingRisk: { ...prev.drivingRisk, drowsinessWhileDriving: e.target.checked }}))} className="mr-2" />
              <label htmlFor="drowsinessWhileDriving" className="text-sm font-medium text-[#065f46]">Somnolență la volan</label>
            </div>
            {visit.drivingRisk?.drowsinessWhileDriving && (
              <div>
                <label className="block text-sm font-medium text-[#065f46] mb-1">Frecvență episoade</label>
                <input type="text" value={visit.drivingRisk?.drowsinessFrequency} onChange={(e) => setVisit(prev => ({ ...prev, drivingRisk: { ...prev.drivingRisk, drowsinessFrequency: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: 2-3x/săptămână" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-1">Accidente rutiere (ultimi 3 ani)</label>
              <input type="number" value={visit.drivingRisk?.accidentsLast3Years} onChange={(e) => setVisit(prev => ({ ...prev, drivingRisk: { ...prev.drivingRisk, accidentsLast3Years: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="0" />
            </div>
            {visit.drivingRisk?.isProfessionalDriver && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#065f46] mb-1">Ore lucrate în schimburi</label>
                  <input type="text" value={visit.drivingRisk?.shiftWorkHours} onChange={(e) => setVisit(prev => ({ ...prev, drivingRisk: { ...prev.drivingRisk, shiftWorkHours: e.target.value }}))} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]" placeholder="ex: 8h noapte" />
                </div>
                <div className="flex items-center pt-6">
                  <input type="checkbox" id="resumedDrivingAfterTreatment" checked={visit.drivingRisk?.resumedDrivingAfterTreatment} onChange={(e) => setVisit(prev => ({ ...prev, drivingRisk: { ...prev.drivingRisk, resumedDrivingAfterTreatment: e.target.checked }}))} className="mr-2" />
                  <label htmlFor="resumedDrivingAfterTreatment" className="text-sm font-medium text-[#065f46]">Reluare conducere după tratament</label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Notițe</h2>
          <textarea
            value={visit.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6] min-h-[120px]"
            placeholder="Observații clinice, recomandări, etc."
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate(`/patients/${patientId}`)}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Anulează
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-[#14b8a6] text-white rounded hover:bg-[#0d9488]"
          >
            {visitId ? 'Actualizează Vizită' : 'Salvează Vizită'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VisitForm;

