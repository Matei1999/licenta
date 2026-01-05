import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RomanianDateInput from '../components/RomanianDateInput';
import RomanianTimeInput from '../components/RomanianTimeInput';

// Styled Section (defined outside component to prevent re-creation)
const VSection = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
    <h4 className="text-lg font-bold mb-6 text-text-primary pb-3 border-b border-[#e0f2f1]">{title}</h4>
    {children}
  </div>
);

// SAQLI calculator reused from patient details (keeps scoring consistent)
const SAQLICalculator = ({ saqli, hasCPAPTreatment }) => {
  if (!saqli) return null;

  const domainA_items = [
    saqli.saqliDailyEnergy,
    saqli.saqliDailyConcentration,
    saqli.saqliDailyProductivity
  ].filter(v => v !== null && v !== undefined && v !== '');

  const domainA = domainA_items.length > 0
    ? (domainA_items.reduce((s, v) => s + parseFloat(v), 0) / domainA_items.length).toFixed(2)
    : null;

  const domainB_items = [
    saqli.saqliSocialIntimate,
    saqli.saqliSocialActivities,
    saqli.saqliSocialSelfEsteem
  ].filter(v => v !== null && v !== undefined && v !== '');

  const domainB = domainB_items.length > 0
    ? (domainB_items.reduce((s, v) => s + parseFloat(v), 0) / domainB_items.length).toFixed(2)
    : null;

  const domainC_items = [
    saqli.saqliEmotionalMood,
    saqli.saqliEmotionalAnxiety,
    saqli.saqliEmotionalFrustration
  ].filter(v => v !== null && v !== undefined && v !== '');

  const domainC = domainC_items.length > 0
    ? (domainC_items.reduce((s, v) => s + parseFloat(v), 0) / domainC_items.length).toFixed(2)
    : null;

  const domainD_items = [
    saqli.saqliSymptomsSleepiness,
    saqli.saqliSymptomsFatigue,
    saqli.saqliSymptomsSnoring,
    saqli.saqliSymptomsAwakenings
  ].filter(v => v !== null && v !== undefined && v !== '');

  const domainD = domainD_items.length > 0
    ? (domainD_items.reduce((s, v) => s + parseFloat(v), 0) / domainD_items.length).toFixed(2)
    : null;

  let finalScore = null;
  if (domainA && domainB && domainC && domainD) {
    if (!hasCPAPTreatment) {
      finalScore = ((parseFloat(domainA) + parseFloat(domainB) + parseFloat(domainC) + parseFloat(domainD)) / 4).toFixed(2);
    } else {
      const reverseCode = (val) => 7 - parseFloat(val);

      const domainE_items = [
        saqli.saqliTreatmentSatisfaction,
        saqli.saqliTreatmentSideEffects,
        saqli.saqliTreatmentDiscomfort
      ].filter(v => v !== null && v !== undefined && v !== '');

      if (domainE_items.length > 0) {
        const domainE_recoded = domainE_items.map(reverseCode);
        const domainE = (domainE_recoded.reduce((s, v) => s + v, 0) / 5).toFixed(2);
        const weightingFactor = 1.0;
        const domainE_weighted = (parseFloat(domainE) * weightingFactor).toFixed(2);

        finalScore = (
          (parseFloat(domainA) + parseFloat(domainB) + parseFloat(domainC) + parseFloat(domainD) - parseFloat(domainE_weighted)) / 4
        ).toFixed(2);
      } else {
        finalScore = ((parseFloat(domainA) + parseFloat(domainB) + parseFloat(domainC) + parseFloat(domainD)) / 4).toFixed(2);
      }
    }
  }

  const getInterpretation = (score) => {
    if (!score) return '';
    const s = parseFloat(score);
    if (s <= 3) return '🔴 Calitate a vieții sever afectată';
    if (s <= 5) return '🟡 Calitate a vieții moderat afectată';
    return '🟢 Calitate bună a vieții';
  };

  return (
    <div>
      <h4 className="font-semibold text-text-primary mb-3">Scor SAQLI Calculat</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {domainA && (
          <div className="text-center p-2 bg-white rounded border border-primary/30">
            <p className="text-xs text-primary-hover">Domeniu A</p>
            <p className="text-lg font-bold text-text-primary">{domainA}</p>
          </div>
        )}
        {domainB && (
          <div className="text-center p-2 bg-white rounded border border-primary/30">
            <p className="text-xs text-primary-hover">Domeniu B</p>
            <p className="text-lg font-bold text-text-primary">{domainB}</p>
          </div>
        )}
        {domainC && (
          <div className="text-center p-2 bg-white rounded border border-primary/30">
            <p className="text-xs text-primary-hover">Domeniu C</p>
            <p className="text-lg font-bold text-text-primary">{domainC}</p>
          </div>
        )}
        {domainD && (
          <div className="text-center p-2 bg-white rounded border border-primary/30">
            <p className="text-xs text-primary-hover">Domeniu D</p>
            <p className="text-lg font-bold text-text-primary">{domainD}</p>
          </div>
        )}
      </div>
      {finalScore && (
        <div className="text-center p-3 bg-white rounded border-2 border-primary">
          <p className="text-sm text-primary-hover mb-1">Scor Final SAQLI</p>
          <p className="text-3xl font-bold text-text-primary">{finalScore}</p>
          <p className="text-sm mt-2">{getInterpretation(finalScore)}</p>
        </div>
      )}
    </div>
  );
};

const VisitForm = () => {
  const { patientId, visitId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [previousVisit, setPreviousVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visit, setVisit] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    clinician: '',
    // Screening metrics
    screening: {
      sasoForm: '',
      stopBangScore: '',
      epworthScore: ''
    },
    // Polysomnography metrics
    polysomnography: {
      ahi: '',
      ahiNrem: '',
      ahiRem: '',
      ahiResidual: '',
      desatIndex: '',
      spo2Min: '',
      spo2Max: '',
      spo2Mean: '',
      t90: '',
      t45: '',
      hypoxicBurden: ''
    },
    // CPAP metrics
    cpapBrand: '',
    cpapCompliancePct: '',
    cpapCompliance4hPct: '',
    cpapUsageMin: '',
    cpapLeaks95p: '',
    cpapPressure95p: '',
    cpapComplianceLessThan4h: false,
    // Mask
    maskType: '',
    maskFitGood: false,
    maskChange: false,
    // Detailed CPAP Device Data
    cpapData: {
      brand: '',
      model: '',
      therapyType: '',
      pressureMin: '',
      pressureMax: '',
      startDate: '',
      maskType: '',
      humidificationEnabled: false,
      humidificationLevel: '',
      rampEnabled: false,
      rampTime: '',
      technicalProblems: {
        facialIrritation: false,
        claustrophobia: false,
        deviceNoise: false,
        nasalSecretions: false,
        aerophagia: false,
        otherIssues: ''
      },
      nonAdherenceReasons: {
        dryness: false,
        pressureTooHigh: false,
        anxiety: false,
        other: ''
      }
    },
    // Comorbidities
    comorbidities: {
      cardiovascular: [],
      metabolic: [],
      respiratory: [],
      neurologic: [],
      other: [],
      otherText: ''
    },
    // Behavioral factors
    behavioral: {
      sleepHoursPerNight: '',
      bedtimeTypical: '',
      wakeTimeTypical: '',
      sleepVariability: '',
      fragmentedSleep: false,
      hasNaps: false,
      alcoholFrequency: '',
      alcoholAmount: '',
      smokingStatus: '',
      cigarettesPerDay: '',
      packsPerDay: '',
      smokingYears: '',
      caffeineCount: '',
      physicalActivity: '',
      physicalActivityHours: '',
      napFrequency: '',
      napDuration: '',
      sleepPosition: '',
      positionalOSA: false
    },
    // ORL history
    orlHistory: {
      septumDeviation: false,
      tonsilHypertrophy: false,
      macroglossia: false,
      uvulaHypertrophy: false,
      mallampatiClass: '',
      retrognathia: false,
      orlSurgery: false,
      orlSurgeryDetails: '',
      nasalObstruction: false,
      chronicRhinitis: false
    },
    // Psychosocial (SAQLI - Sleep Apnea Quality of Life Index)
    psychosocial: {
      saqliDailyEnergy: '',
      saqliDailyConcentration: '',
      saqliDailyProductivity: '',
      saqliSocialIntimate: '',
      saqliSocialActivities: '',
      saqliSocialSelfEsteem: '',
      saqliEmotionalMood: '',
      saqliEmotionalAnxiety: '',
      saqliEmotionalFrustration: '',
      saqliSymptomsSleepiness: '',
      saqliSymptomsFatigue: '',
      saqliSymptomsSnoring: '',
      saqliSymptomsAwakenings: '',
      saqliTreatmentSatisfaction: '',
      saqliTreatmentSideEffects: '',
      saqliTreatmentDiscomfort: ''
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
        const visitData = visitRes.data || {};

        // Normalize behavioral defaults
        const normalizedBehavioral = {
          ...(visitData.behavioral || {}),
        };
        if (normalizedBehavioral.hasNaps === undefined && (normalizedBehavioral.napFrequency || normalizedBehavioral.napDuration)) {
          normalizedBehavioral.hasNaps = true;
        }

        // Normalize ORL septum deviation to boolean
        const normalizedOrl = {
          ...(visitData.orlHistory || {}),
        };
        if (normalizedOrl.septumDeviation === undefined && normalizedOrl.deviateSeptum !== undefined) {
          normalizedOrl.septumDeviation = normalizedOrl.deviateSeptum === 'da' || normalizedOrl.deviateSeptum === true;
        }

        setVisit(prev => ({
          ...prev,
          ...visitData,
          behavioral: normalizedBehavioral,
          orlHistory: normalizedOrl
        }));
        actualPatientId = visitData.patientId;
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

  const handleChange = useCallback((field, value) => {
    setVisit(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  // Note: startTransition is included in useCallback implicitly by React

  const handleNestedChange = useCallback((parent, field, value) => {
    setVisit(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  }, []);

  const handleToggleComorbidity = useCallback((category, value) => {
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
  }, []);

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
        // Convert polysomnography values
        screening: {
          sasoForm: visit.screening?.sasoForm || null,
          stopBangScore: visit.screening?.stopBangScore ? parseInt(visit.screening.stopBangScore) : null,
          epworthScore: visit.screening?.epworthScore ? parseInt(visit.screening.epworthScore) : null
        },
        polysomnography: {
          ahi: visit.polysomnography?.ahi ? parseFloat(visit.polysomnography.ahi) : null,
          ahiNrem: visit.polysomnography?.ahiNrem ? parseFloat(visit.polysomnography.ahiNrem) : null,
          ahiRem: visit.polysomnography?.ahiRem ? parseFloat(visit.polysomnography.ahiRem) : null,
          ahiResidual: visit.polysomnography?.ahiResidual ? parseFloat(visit.polysomnography.ahiResidual) : null,
          desatIndex: visit.polysomnography?.desatIndex ? parseFloat(visit.polysomnography.desatIndex) : null,
          spo2Min: visit.polysomnography?.spo2Min ? parseFloat(visit.polysomnography.spo2Min) : null,
          spo2Max: visit.polysomnography?.spo2Max ? parseFloat(visit.polysomnography.spo2Max) : null,
          spo2Mean: visit.polysomnography?.spo2Mean ? parseFloat(visit.polysomnography.spo2Mean) : null,
          t90: visit.polysomnography?.t90 ? parseFloat(visit.polysomnography.t90) : null,
          t45: visit.polysomnography?.t45 ? parseFloat(visit.polysomnography.t45) : null,
          hypoxicBurden: visit.polysomnography?.hypoxicBurden ? parseFloat(visit.polysomnography.hypoxicBurden) : null
        },
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

      // Force complete page reload with timestamp to ensure fresh data
      const timestamp = Date.now();
      window.location.href = `/patients/${actualPatientId}?t=${timestamp}`;
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
    if (ahi < 30) return 'orange';
    return 'red';
  };

  const getSeverityLabel = (ahi) => {
    if (!ahi) return '-';
    if (ahi < 30) return 'Moderat';
    return 'Sever';
  };

  // Check if patient is a professional driver based on occupation
  const isProfessionalDriver = patient?.occupation?.toLowerCase().includes('șofer') || 
                               patient?.occupation?.toLowerCase().includes('sofer') ||
                               patient?.occupation?.toLowerCase().includes('tir') ||
                               patient?.occupation?.toLowerCase().includes('taximetrist');

  const getComparisonArrow = (current, previous) => {
    if (!current || !previous) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 0.5) return '→';
    return diff > 0 ? '↑' : '↓';
  };

  const getComparisonColor = (current, previous, lowerIsBetter = true) => {
    if (!current || !previous) return 'text-primary-hover';
    const diff = current - previous;
    if (Math.abs(diff) < 0.5) return 'text-primary-hover';
    
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
            <h1 className="text-3xl font-bold text-text-primary">
              {visitId ? 'Editare Vizită' : 'Vizită Nouă'}
            </h1>
            <p className="text-primary-hover mt-1">
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
          <div className="bg-bg-surface border border-gray-200 rounded p-4 mb-4">
            <p className="text-sm font-semibold text-text-primary">
              Ultima vizită: {new Date(previousVisit.visitDate).toLocaleDateString('ro-RO')}
            </p>
            <p className="text-sm text-primary-hover">
              IAH: {previousVisit.ahi || '-'} | Complianță: {previousVisit.cpapCompliancePct || '-'}%
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informații Generale */}
        <VSection title="Informații Generale">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Data vizitei</label>
              <RomanianDateInput value={visit.visitDate} onChange={(v) => handleChange('visitDate', v)} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Clinician</label>
              <input type="text" value={visit.clinician} onChange={(e) => handleChange('clinician', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </VSection>

        {/* Screening & Polysomnografie Simplificat */}
        <VSection title="Screening & Polysomnografie">
          <h3 className="text-md font-semibold text-primary-hover mb-3">Screening</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">SASO formă</label>
              <select value={visit.screening?.sasoForm || ''} onChange={(e) => handleNestedChange('screening', 'sasoForm', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary">
                <option value="">Selectează...</option>
                <option value="moderată">Moderată</option>
                <option value="severă">Severă</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">STOP-BANG (score)</label>
              <input type="number" min="0" max="8" value={visit.screening?.stopBangScore ?? ''} onChange={(e) => handleNestedChange('screening', 'stopBangScore', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="0-8" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Epworth (score)</label>
              <input type="number" min="0" max="24" value={visit.screening?.epworthScore ?? ''} onChange={(e) => handleNestedChange('screening', 'epworthScore', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="0-24" />
            </div>
          </div>

          <h3 className="text-md font-semibold text-primary-hover mb-3">Indice Apnee-Hipopnee</h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">AHI (total)</label>
              <input type="number" step="0.1" value={visit.polysomnography?.ahi ?? ''} onChange={(e) => handleNestedChange('polysomnography', 'ahi', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 25.5" />
            </div>
          </div>

          <h3 className="text-md font-semibold text-primary-hover mb-3">Indice de Desaturare</h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Indice desaturare</label>
              <input type="number" step="0.1" value={visit.polysomnography?.desatIndex ?? ''} onChange={(e) => handleNestedChange('polysomnography', 'desatIndex', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 20.5" />
            </div>
          </div>

          <h3 className="text-md font-semibold text-primary-hover mb-3">Indici de Timp</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">T90 (% timp SpO2 &lt;90%)</label>
              <input type="number" step="0.1" value={visit.polysomnography?.t90 ?? ''} onChange={(e) => handleNestedChange('polysomnography', 't90', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 2.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">T45 (% timp SpO2 &lt;45%)</label>
              <input type="number" step="0.1" value={visit.polysomnography?.t45 ?? ''} onChange={(e) => handleNestedChange('polysomnography', 't45', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Povara hipoxică (%·min)</label>
              <input type="number" step="0.1" value={visit.polysomnography?.hypoxicBurden ?? ''} onChange={(e) => handleNestedChange('polysomnography', 'hypoxicBurden', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 150.5" />
            </div>
          </div>
        </VSection>

        {/* Comorbidități */}
        <VSection title="Comorbidități">
          <p className="text-sm text-primary-hover mb-4">Selectați comorbidități prezente/diagnosticate la această vizită (tracking în timp):</p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-text-primary mb-2">Cardiovasculare</h3>
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
              <h3 className="font-semibold text-text-primary mb-2">Metabolice</h3>
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
              <h3 className="font-semibold text-text-primary mb-2">Respiratorii</h3>
              <div className="space-y-2">
                {[
                  { code: 'J45.9', label: 'Astm bronsic' },
                  { code: 'J44.9', label: 'BPOC' },
                  { code: 'J84.9', label: 'Patologii pulmonare restrictive' }
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
              <h3 className="font-semibold text-text-primary mb-2">Neurologice & Psihiatrice</h3>
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
              <h3 className="font-semibold text-text-primary mb-2">Altele</h3>
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
              <div className="mt-3">
                <label className="block text-sm font-medium text-text-primary mb-1">Alte comorbidități (text liber)</label>
                <textarea
                  value={visit.comorbidities?.otherText || ''}
                  onChange={(e) => handleNestedChange('comorbidities', 'otherText', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary"
                  placeholder="Alte comorbidități relevante..."
                  rows="2"
                />
              </div>
            </div>
          </div>
        </VSection>

        {/* Comportament & ORL */}
        <VSection title="Comportament & ORL">
          <h3 className="text-md font-semibold text-primary-hover mb-3">Factori Comportamentali</h3>
          
          <h3 className="text-md font-semibold text-primary-hover mb-3">Somn</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Ore somn/noapte</label>
              <input type="number" step="0.5" value={visit.behavioral?.sleepHoursPerNight ?? ''} onChange={(e) => handleNestedChange('behavioral', 'sleepHoursPerNight', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 7.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Oră culcare</label>
              <RomanianTimeInput value={visit.behavioral?.bedtimeTypical ?? ''} onChange={(v) => handleNestedChange('behavioral', 'bedtimeTypical', v)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Oră trezire</label>
              <RomanianTimeInput value={visit.behavioral?.wakeTimeTypical ?? ''} onChange={(v) => handleNestedChange('behavioral', 'wakeTimeTypical', v)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Variabilitate somn (weekend vs săptămână)</label>
              <select value={visit.behavioral?.sleepVariability || ''} onChange={(e) => handleNestedChange('behavioral', 'sleepVariability', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary">
                <option value="">Selectează...</option>
                <option value="Constantă">Constantă</option>
                <option value="Moderată">Moderată</option>
                <option value="Mare">Mare</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="fragmentedSleep" checked={visit.behavioral?.fragmentedSleep || false} onChange={(e) => handleNestedChange('behavioral', 'fragmentedSleep', e.target.checked)} className="mr-2" />
              <label htmlFor="fragmentedSleep" className="text-sm font-medium text-text-primary">Somn fragmentat ({'>'}3 treziri/noapte)</label>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="hasNaps" checked={visit.behavioral?.hasNaps || false} onChange={(e) => handleNestedChange('behavioral', 'hasNaps', e.target.checked)} className="mr-2" />
              <label htmlFor="hasNaps" className="text-sm font-medium text-text-primary">Somnolență diurnă (sieste)</label>
            </div>
            {visit.behavioral?.hasNaps && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Frecvență sieste</label>
                  <select value={visit.behavioral?.napFrequency || ''} onChange={(e) => handleNestedChange('behavioral', 'napFrequency', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary">
                    <option value="">Selectează...</option>
                    <option value="Zilnic">Zilnic</option>
                    <option value="Ocazional">Ocazional</option>
                    <option value="Rar">Rar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Durată sieste (minute)</label>
                  <input type="number" value={visit.behavioral?.napDuration ?? ''} onChange={(e) => handleNestedChange('behavioral', 'napDuration', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 20" />
                </div>
              </>
            )}
          </div>

          <h3 className="text-md font-semibold text-primary-hover mb-3 mt-4">Stil de viață</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Consum alcool (frecvență)</label>
              <select value={visit.behavioral?.alcoholFrequency || ''} onChange={(e) => handleNestedChange('behavioral', 'alcoholFrequency', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary">
                <option value="">Selectează...</option>
                <option value="niciodată">Niciodată</option>
                <option value="rar">Rar (1-2x/lună)</option>
                <option value="moderat">Moderat (1-2x/săptămână)</option>
                <option value="frecvent">Frecvent (3+x/săptămână)</option>
                <option value="zilnic">Zilnic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Cantitate alcool</label>
              <input type="text" value={visit.behavioral?.alcoholAmount ?? ''} onChange={(e) => handleNestedChange('behavioral', 'alcoholAmount', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 1-2 pahare" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Status fumat</label>
              <select value={visit.behavioral?.smokingStatus || ''} onChange={(e) => handleNestedChange('behavioral', 'smokingStatus', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary">
                <option value="">Selectează...</option>
                <option value="nefumător">Nefumător</option>
                <option value="fumător_activ">Fumător activ</option>
                <option value="fumător_pasiv">Fumător pasiv</option>
                <option value="fost_fumător">Fost fumător ({'>'}6 luni abstinență)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Pachete/Zi</label>
              <input type="number" step="0.05" value={visit.behavioral?.packsPerDay ?? ''} onChange={(e) => handleNestedChange('behavioral', 'packsPerDay', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Ani de fumat</label>
              <input type="number" value={visit.behavioral?.smokingYears ?? ''} onChange={(e) => handleNestedChange('behavioral', 'smokingYears', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 25" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Pachete-An</label>
              <input 
                type="number" 
                step="0.5" 
                value={visit.behavioral?.packsPerDay && visit.behavioral?.smokingYears ? (parseFloat(visit.behavioral.packsPerDay) * parseFloat(visit.behavioral.smokingYears)).toFixed(1) : ''} 
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-50 text-gray-600" 
                placeholder="Auto-calculat" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Cafele/zi</label>
              <input type="number" value={visit.behavioral?.caffeineCount ?? ''} onChange={(e) => handleNestedChange('behavioral', 'caffeineCount', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Activitate fizică</label>
              <select value={visit.behavioral?.physicalActivity || ''} onChange={(e) => handleNestedChange('behavioral', 'physicalActivity', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary">
                <option value="">Selectează...</option>
                <option value="sedentar">Sedentar</option>
                <option value="moderat">Moderat</option>
                <option value="intens">Intens</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Ore activitate fizică/săptămână</label>
              <input type="number" step="0.5" value={visit.behavioral?.physicalActivityHours ?? ''} onChange={(e) => handleNestedChange('behavioral', 'physicalActivityHours', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 3.5" />
            </div>
          </div>

          <h3 className="text-md font-semibold text-primary-hover mb-3 mt-4">Poziție somn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Poziție preponderentă</label>
              <select value={visit.behavioral?.sleepPosition || ''} onChange={(e) => handleNestedChange('behavioral', 'sleepPosition', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary">
                <option value="">Selectează...</option>
                <option value="dorsal">Dorsal (spate)</option>
                <option value="lateral">Lateral</option>
                <option value="abdomen">Abdomen</option>
                <option value="mixt">Mixt</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="positionalOSA" checked={visit.behavioral?.positionalOSA || false} onChange={(e) => handleNestedChange('behavioral', 'positionalOSA', e.target.checked)} className="mr-2" />
              <label htmlFor="positionalOSA" className="text-sm font-medium text-text-primary">OSA pozițională (dorsal-dependent)</label>
            </div>
          </div>
        </VSection>

        {/* ORL History */}
        <VSection title="Istoric ORL & Obstrucție Căi Aeriene">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center pt-6">
              <input type="checkbox" id="septumDeviation" checked={(visit.orlHistory?.septumDeviation ?? visit.orlHistory?.deviateSeptum === 'da') || false} onChange={(e) => handleNestedChange('orlHistory', 'septumDeviation', e.target.checked)} className="mr-2" />
              <label htmlFor="septumDeviation" className="text-sm font-medium text-text-primary">Deviație sept nazal</label>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="tonsilHypertrophy" checked={visit.orlHistory?.tonsilHypertrophy || false} onChange={(e) => handleNestedChange('orlHistory', 'tonsilHypertrophy', e.target.checked)} className="mr-2" />
              <label htmlFor="tonsilHypertrophy" className="text-sm font-medium text-text-primary">Hipertrofie amigdaliană</label>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="macroglossia" checked={visit.orlHistory?.macroglossia || false} onChange={(e) => handleNestedChange('orlHistory', 'macroglossia', e.target.checked)} className="mr-2" />
              <label htmlFor="macroglossia" className="text-sm font-medium text-text-primary">Macroglosie</label>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="uvulaHypertrophy" checked={visit.orlHistory?.uvulaHypertrophy || false} onChange={(e) => handleNestedChange('orlHistory', 'uvulaHypertrophy', e.target.checked)} className="mr-2" />
              <label htmlFor="uvulaHypertrophy" className="text-sm font-medium text-text-primary">Luetă hipertrofică</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Clasificare Mallampati</label>
              <select value={visit.orlHistory?.mallampatiClass || ''} onChange={(e) => handleNestedChange('orlHistory', 'mallampatiClass', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary">
                <option value="">Selectează...</option>
                <option value="I">I</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="retrognathia" checked={visit.orlHistory?.retrognathia || false} onChange={(e) => handleNestedChange('orlHistory', 'retrognathia', e.target.checked)} className="mr-2" />
              <label htmlFor="retrognathia" className="text-sm font-medium text-text-primary">Retrognatism / Micrognatie</label>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="orlSurgery" checked={visit.orlHistory?.orlSurgery || false} onChange={(e) => handleNestedChange('orlHistory', 'orlSurgery', e.target.checked)} className="mr-2" />
              <label htmlFor="orlSurgery" className="text-sm font-medium text-text-primary">Istoric chirurgie ORL</label>
            </div>
            {visit.orlHistory?.orlSurgery && (
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-text-primary mb-1">Detalii chirurgie ORL</label>
                <input type="text" value={visit.orlHistory?.orlSurgeryDetails ?? ''} onChange={(e) => handleNestedChange('orlHistory', 'orlSurgeryDetails', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: uvulopalatoplastie în 2020" />
              </div>
            )}
            <div className="flex items-center pt-6">
              <input type="checkbox" id="nasalObstruction" checked={visit.orlHistory?.nasalObstruction || false} onChange={(e) => handleNestedChange('orlHistory', 'nasalObstruction', e.target.checked)} className="mr-2" />
              <label htmlFor="nasalObstruction" className="text-sm font-medium text-text-primary">Obstrucție nazală la examen</label>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="chronicRhinitis" checked={visit.orlHistory?.chronicRhinitis || false} onChange={(e) => handleNestedChange('orlHistory', 'chronicRhinitis', e.target.checked)} className="mr-2" />
              <label htmlFor="chronicRhinitis" className="text-sm font-medium text-text-primary">Rinite cronice / Alergii</label>
            </div>
          </div>
        </VSection>

        {/* Psihosocial & Bio */}
        <VSection title="Psihosocial & Bio">
          <h3 className="text-md font-semibold text-primary-hover mb-3">SAQLI - Calitatea Vieții în Apneea de Somn</h3>
          <p className="text-sm text-primary-hover mb-4">Sleep Apnea Quality of Life Index (1-7: 1=foarte afectat, 7=deloc afectat)</p>
          
          <h3 className="text-md font-semibold text-primary-hover mb-3">Funcționare Zilnică</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Energie & vitalitate (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliDailyEnergy ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliDailyEnergy', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Concentrare & atenție (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliDailyConcentration ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliDailyConcentration', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Productivitate (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliDailyProductivity ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliDailyProductivity', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <h3 className="text-md font-semibold text-primary-hover mb-3 mt-4">Interacțiuni Sociale</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Relații apropiate (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliSocialIntimate ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliSocialIntimate', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Activități sociale (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliSocialActivities ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliSocialActivities', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Stimă de sine (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliSocialSelfEsteem ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliSocialSelfEsteem', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <h3 className="text-md font-semibold text-primary-hover mb-3 mt-4">Funcționare Emoțională</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Dispoziție generală (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliEmotionalMood ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliEmotionalMood', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Anxietate (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliEmotionalAnxiety ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliEmotionalAnxiety', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Frustrare (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliEmotionalFrustration ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliEmotionalFrustration', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <h3 className="text-md font-semibold text-primary-hover mb-3 mt-4">Simptome</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Somnolență diurnă (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliSymptomsSleepiness ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliSymptomsSleepiness', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Oboseală (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliSymptomsFatigue ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliSymptomsFatigue', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Sforăit (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliSymptomsSnoring ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliSymptomsSnoring', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Treziri nocturne (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliSymptomsAwakenings ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliSymptomsAwakenings', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <h3 className="text-md font-semibold text-primary-hover mb-3 mt-4">Impact Tratament</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Satisfacție tratament (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliTreatmentSatisfaction ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliTreatmentSatisfaction', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Efecte secundare (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliTreatmentSideEffects ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliTreatmentSideEffects', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Disconfort echipament (1-7)</label>
              <input type="number" min="1" max="7" value={visit.psychosocial?.saqliTreatmentDiscomfort ?? ''} onChange={(e) => handleNestedChange('psychosocial', 'saqliTreatmentDiscomfort', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="mt-6 p-4 bg-bg-surface border border-primary rounded-lg">
            <SAQLICalculator saqli={visit.psychosocial} hasCPAPTreatment={!!(visit.cpapData?.brand || visit.cpapBrand)} />
          </div>
        </VSection>

        {/* Biomarkers */}
        <VSection title="Biomarkeri">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">CRP (mg/L)</label>
              <input type="number" step="0.1" value={visit.biomarkers?.crp ?? ''} onChange={(e) => handleNestedChange('biomarkers', 'crp', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 3.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">HbA1c (%)</label>
              <input type="number" step="0.1" value={visit.biomarkers?.hba1c ?? ''} onChange={(e) => handleNestedChange('biomarkers', 'hba1c', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 5.7" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">LDL (mg/dL)</label>
              <input type="number" value={visit.biomarkers?.ldl ?? ''} onChange={(e) => handleNestedChange('biomarkers', 'ldl', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 130" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">HDL (mg/dL)</label>
              <input type="number" value={visit.biomarkers?.hdl ?? ''} onChange={(e) => handleNestedChange('biomarkers', 'hdl', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 45" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Trigliceride (mg/dL)</label>
              <input type="number" value={visit.biomarkers?.triglycerides ?? ''} onChange={(e) => handleNestedChange('biomarkers', 'triglycerides', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 150" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">TSH (μIU/mL)</label>
              <input type="number" step="0.01" value={visit.biomarkers?.tsh ?? ''} onChange={(e) => handleNestedChange('biomarkers', 'tsh', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 2.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Vitamina D (ng/mL)</label>
              <input type="number" step="0.1" value={visit.biomarkers?.vitaminD ?? ''} onChange={(e) => handleNestedChange('biomarkers', 'vitaminD', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Creatinină (mg/dL)</label>
              <input type="number" step="0.01" value={visit.biomarkers?.creatinine ?? ''} onChange={(e) => handleNestedChange('biomarkers', 'creatinine', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 1.0" />
            </div>
          </div>
        </VSection>

        {/* CPAP */}
        <VSection title="CPAP">

          {/* Dispozitiv CPAP */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-primary-hover mb-3">Dispozitiv CPAP</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Brand</label>
                <select value={visit.cpapData?.brand || ''} onChange={(e) => handleNestedChange('cpapData', 'brand', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary">
                  <option value="">Selectați brand</option>
                  <option value="ResMed">ResMed</option>
                  <option value="Philips Respironics">Philips Respironics</option>
                  <option value="Löwenstein Medical">Löwenstein Medical</option>
                  <option value="Altul">Altul</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Model</label>
                <input type="text" value={visit.cpapData?.model || ''} onChange={(e) => handleNestedChange('cpapData', 'model', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Tip terapie</label>
                <select value={visit.cpapData?.therapyType || ''} onChange={(e) => handleNestedChange('cpapData', 'therapyType', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary">
                  <option value="">Selectați...</option>
                  <option value="CPAP">CPAP</option>
                  <option value="APAP">APAP</option>
                  <option value="BiPAP">BiPAP</option>
                  <option value="ASV">ASV</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Presiune min (cmH2O)</label>
                <input type="number" value={visit.cpapData?.pressureMin || ''} onChange={(e) => handleNestedChange('cpapData', 'pressureMin', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Presiune max (cmH2O)</label>
                <input type="number" value={visit.cpapData?.pressureMax || ''} onChange={(e) => handleNestedChange('cpapData', 'pressureMax', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Data început tratament</label>
                <RomanianDateInput 
                  value={visit.cpapData?.startDate || ''}
                  onChange={(v) => handleNestedChange('cpapData', 'startDate', v)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Tip mască</label>
                <select value={visit.cpapData?.maskType || ''} onChange={(e) => handleNestedChange('cpapData', 'maskType', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary">
                  <option value="">Selectează...</option>
                  <option value="Nazală">Nazală</option>
                  <option value="Oro-nazală">Oro-nazală</option>
                  <option value="Pillow nazal">Pillow nazal</option>
                  <option value="Facială completă">Facială completă</option>
                  <option value="Hibrid">Hibrid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Setări */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-primary-hover mb-3">Setări</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center pt-6">
                <input type="checkbox" id="humidificationEnabled" checked={visit.cpapData?.humidificationEnabled || false} onChange={(e) => handleNestedChange('cpapData', 'humidificationEnabled', e.target.checked)} className="mr-2" />
                <label htmlFor="humidificationEnabled" className="text-sm font-medium text-text-primary">Umidificare activată</label>
              </div>
              {visit.cpapData?.humidificationEnabled && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Nivel umidificare (1-5)</label>
                  <input type="number" min="1" max="5" value={visit.cpapData?.humidificationLevel || ''} onChange={(e) => handleNestedChange('cpapData', 'humidificationLevel', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
                </div>
              )}
              <div className="flex items-center pt-6">
                <input type="checkbox" id="rampEnabled" checked={visit.cpapData?.rampEnabled || false} onChange={(e) => handleNestedChange('cpapData', 'rampEnabled', e.target.checked)} className="mr-2" />
                <label htmlFor="rampEnabled" className="text-sm font-medium text-text-primary">Rampa activată</label>
              </div>
              {visit.cpapData?.rampEnabled && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Timp rampă (min)</label>
                  <input type="number" value={visit.cpapData?.rampTime || ''} onChange={(e) => handleNestedChange('cpapData', 'rampTime', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
                </div>
              )}
            </div>
          </div>

          {/* Probleme tehnice */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-primary-hover mb-3">Probleme tehnice raportate</h3>
            <div className="space-y-2">
              {[
                { key: 'facialIrritation', label: 'Iritații faciale' },
                { key: 'claustrophobia', label: 'Senzație de claustrofobie' },
                { key: 'deviceNoise', label: 'Zgomotul aparatului' },
                { key: 'nasalSecretions', label: 'Secreții nazale' },
                { key: 'aerophagia', label: 'Aerofagie' }
              ].map(item => (
                <div key={item.key} className="flex items-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={visit.cpapData?.technicalProblems?.[item.key] || false} onChange={(e) => {
                      const updated = { ...(visit.cpapData?.technicalProblems || {}), [item.key]: e.target.checked };
                      setVisit(prev => ({ ...prev, cpapData: { ...prev.cpapData, technicalProblems: updated } }));
                    }} className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-text-primary">{item.label}</span>
                  </label>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Alte probleme</label>
                <input type="text" value={visit.cpapData?.technicalProblems?.otherIssues || ''} onChange={(e) => {
                  const updated = { ...(visit.cpapData?.technicalProblems || {}), otherIssues: e.target.value };
                  setVisit(prev => ({ ...prev, cpapData: { ...prev.cpapData, technicalProblems: updated } }));
                }} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="Descrieți alte probleme..." />
              </div>
            </div>
          </div>

          {/* Motive neaderență */}
          <div>
            <h3 className="text-md font-semibold text-primary-hover mb-3">Motive pentru neaderență</h3>
            <div className="space-y-2">
              {[
                { key: 'dryness', label: 'Uscăciune (gură/nas)' },
                { key: 'pressureTooHigh', label: 'Presiune prea mare' },
                { key: 'anxiety', label: 'Anxietate/Disconfort psihologic' }
              ].map(item => (
                <div key={item.key} className="flex items-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={visit.cpapData?.nonAdherenceReasons?.[item.key] || false} onChange={(e) => {
                      const updated = { ...(visit.cpapData?.nonAdherenceReasons || {}), [item.key]: e.target.checked };
                      setVisit(prev => ({ ...prev, cpapData: { ...prev.cpapData, nonAdherenceReasons: updated } }));
                    }} className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-text-primary">{item.label}</span>
                  </label>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Alte motive</label>
                <input type="text" value={visit.cpapData?.nonAdherenceReasons?.other || ''} onChange={(e) => {
                  const updated = { ...(visit.cpapData?.nonAdherenceReasons || {}), other: e.target.value };
                  setVisit(prev => ({ ...prev, cpapData: { ...prev.cpapData, nonAdherenceReasons: updated } }));
                }} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="Descrieți alte motive..." />
              </div>
            </div>
          </div>

          {/* Metrici CPAP din vizită */}
          <div className="mt-6">
            <h3 className="text-md font-semibold text-primary-hover mb-3">Metrici din această vizită</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Complianță (%)</label>
                <input type="number" min="0" max="100" value={visit.cpapCompliancePct ?? ''} onChange={(e) => handleChange('cpapCompliancePct', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 85" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Complianță ≥4h (%)</label>
                <input type="number" min="0" max="100" value={visit.cpapCompliance4hPct ?? ''} onChange={(e) => handleChange('cpapCompliance4hPct', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Utilizare medie (minute/noapte)</label>
                <input type="number" value={visit.cpapUsageMin ?? ''} onChange={(e) => handleChange('cpapUsageMin', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 420" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Scurgeri 95p (L/min)</label>
                <input type="number" step="0.1" value={visit.cpapLeaks95p ?? ''} onChange={(e) => handleChange('cpapLeaks95p', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 12.3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Presiune 95p (cmH2O)</label>
                <input type="number" step="0.1" value={visit.cpapPressure95p ?? ''} onChange={(e) => handleChange('cpapPressure95p', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 11.2" />
              </div>
            </div>
          </div>
        </VSection>

        {/* Risc Rutier & Conducere */}
        <VSection title="Risc Rutier & Conducere">
          {isProfessionalDriver ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-yellow-100 border border-yellow-400 rounded p-3 col-span-full mb-4">
                <p className="text-sm text-yellow-800 font-medium">⚠️ <strong>Șofer profesionist detectat</strong> - Completare obligatorie pentru evaluare risc rutier!</p>
              </div>
              <div className="flex items-center pt-6">
                <input type="checkbox" id="drowsinessWhileDriving" checked={visit.drivingRisk?.drowsinessWhileDriving || false} onChange={(e) => handleNestedChange('drivingRisk', 'drowsinessWhileDriving', e.target.checked)} className="mr-2" />
                <label htmlFor="drowsinessWhileDriving" className="text-sm font-medium text-text-primary">Somnolență la volan</label>
              </div>
              {visit.drivingRisk?.drowsinessWhileDriving && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Frecvență episoade</label>
                  <input type="text" value={visit.drivingRisk?.drowsinessFrequency ?? ''} onChange={(e) => handleNestedChange('drivingRisk', 'drowsinessFrequency', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 2-3x/săptămână" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Accidente rutiere (ultimi 3 ani)</label>
                <input type="number" value={visit.drivingRisk?.accidentsLast3Years ?? ''} onChange={(e) => handleNestedChange('drivingRisk', 'accidentsLast3Years', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Ore lucrate în schimburi</label>
                <input type="text" value={visit.drivingRisk?.shiftWorkHours ?? ''} onChange={(e) => handleNestedChange('drivingRisk', 'shiftWorkHours', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary" placeholder="ex: 8h noapte" />
              </div>
              <div className="flex items-center pt-6">
                <input type="checkbox" id="resumedDrivingAfterTreatment" checked={visit.drivingRisk?.resumedDrivingAfterTreatment || false} onChange={(e) => handleNestedChange('drivingRisk', 'resumedDrivingAfterTreatment', e.target.checked)} className="mr-2" />
                <label htmlFor="resumedDrivingAfterTreatment" className="text-sm font-medium text-text-primary">Reluare conducere după tratament</label>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>Pacientul nu este catalogat ca șofer profesionist.</p>
              <p className="text-sm mt-2">Actualizați ocupația în profilul pacientului dacă sunt schimbări.</p>
            </div>
          )}
        </VSection>

        {/* Notițe */}
        <VSection title="Notițe">
          <textarea
            value={visit.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary min-h-[120px]"
            placeholder="Observații clinice, recomandări, etc."
          />
        </VSection>

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
            className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-hover"
          >
            {visitId ? 'Actualizează Vizită' : 'Salvează Vizită'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VisitForm;

