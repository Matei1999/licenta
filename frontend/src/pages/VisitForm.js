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

      // Fetch patient
      const patientRes = await axios.get(`/api/patients/${patientId}`, { headers });
      setPatient(patientRes.data);

      if (visitId) {
        // Edit mode - fetch existing visit
        const visitRes = await axios.get(`/api/visits/${visitId}`, { headers });
        setVisit(visitRes.data);
      }

      // Fetch previous visits for comparison
      const visitsRes = await axios.get(`/api/visits?patientId=${patientId}&limit=1`, { headers });
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

      const dataToSubmit = {
        ...visit,
        patientId,
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
      };

      if (visitId) {
        await axios.put(`/api/visits/${visitId}`, dataToSubmit, { headers });
        alert('Vizită actualizată cu succes!');
      } else {
        await axios.post('/api/visits', dataToSubmit, { headers });
        alert('Vizită adăugată cu succes!');
      }

      navigate(`/patients/${patientId}`);
    } catch (error) {
      console.error('Error saving visit:', error);
      alert('Eroare la salvare: ' + (error.response?.data?.message || error.message));
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
            onClick={() => navigate(`/patients/${patientId}`)}
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
                <option value="Oro-nazală">Oro-nazală</option>
                <option value="Pillow nazal">Pillow nazal</option>
                <option value="Facială completă">Facială completă</option>
                <option value="Hibrid">Hibrid</option>
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

