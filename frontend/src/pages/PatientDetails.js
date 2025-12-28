import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import RomanianDateInput from '../components/RomanianDateInput';
import { formatDateRo } from '../utils/dateUtils';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Personal');
  const [editMode, setEditMode] = useState(false);
  const [editedPatient, setEditedPatient] = useState(null);

  const tabs = [
    'Personal',
    'Comorbidități',
    'Comportament & ORL',
    'Psihosocial & Bio',
    'Medicație',
    'CPAP',
    'Istoric',
    'Consimțământ'
  ];

  useEffect(() => {
    fetchPatientData();
    
    // Clean up timestamp parameter after loading
    if (searchParams.get('t')) {
      // Use replace instead of push to avoid adding to history
      window.history.replaceState({}, '', `/patients/${id}`);
    }
  }, [id, searchParams.get('t')]);

  useEffect(() => {
    if (activeTab === 'Istoric') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchPatientData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [patientRes, visitsRes] = await Promise.all([
        axios.get(`/api/patients/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`/api/visits?patientId=${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      console.log('=== PatientDetails Fetch Complete ===');
      console.log('Patient data comorbidities:', patientRes.data?.comorbidities);
      console.log('Visits count:', visitsRes.data?.length);
      if (visitsRes.data?.length > 0) {
        console.log('Latest visit:', visitsRes.data[0]);
        console.log('Latest visit comorbidities:', visitsRes.data[0]?.comorbidities);
      }

      setPatient(patientRes.data);
      setEditedPatient(patientRes.data);
      setVisits(visitsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/audit-logs/entity/patient/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  // Merge base patient data with latest visit values for display-only mode
  const getLatestVisit = () => {
    return Array.isArray(visits) && visits.length > 0
      ? [...visits].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))[0]
      : null;
  };

  const normalizeValue = (map, val) => (val in map ? map[val] : val);

  const overlayPatientWithVisit = (base, v) => {
    if (!v || !base) return base;
    const out = JSON.parse(JSON.stringify(base));

    // Comorbidities: use visit comorbidities as source of truth (replacing base)
    if (v.comorbidities) {
      console.log('Overlay: visit has comorbidities:', v.comorbidities);
      out.comorbidities = {
        cardiovascular: Array.isArray(v.comorbidities.cardiovascular) ? v.comorbidities.cardiovascular : [],
        metabolic: Array.isArray(v.comorbidities.metabolic) ? v.comorbidities.metabolic : [],
        respiratory: Array.isArray(v.comorbidities.respiratory) ? v.comorbidities.respiratory : [],
        neurologic: Array.isArray(v.comorbidities.neurologic) ? v.comorbidities.neurologic : [],
        other: Array.isArray(v.comorbidities.other) ? v.comorbidities.other : []
      };
      if (v.comorbidities.otherText) {
        out.comorbidities.otherText = v.comorbidities.otherText;
      }
      console.log('Overlay: replaced comorbidities with visit values:', out.comorbidities);
    } else {
      console.log('Overlay: visit has NO comorbidities');
    }

    // Behavioral mapping - REPLACE patient behavioral with visit values
    if (v.behavioral) {
      console.log('Overlay: visit has behavioral:', v.behavioral);
      out.behavioral = out.behavioral || {};
      if (v.behavioral.sleepHoursPerNight !== undefined) out.behavioral.avgSleepDuration = v.behavioral.sleepHoursPerNight;
      if (v.behavioral.bedtimeTypical !== undefined) out.behavioral.bedtimeTypical = v.behavioral.bedtimeTypical;
      if (v.behavioral.wakeTimeTypical !== undefined) out.behavioral.waketimeTypical = v.behavioral.wakeTimeTypical;
      if (v.behavioral.sleepVariability !== undefined) out.behavioral.sleepVariability = v.behavioral.sleepVariability;
      if (v.behavioral.fragmentedSleep !== undefined) out.behavioral.fragmentedSleep = v.behavioral.fragmentedSleep;
      if (v.behavioral.hasNaps !== undefined) out.behavioral.hasNaps = v.behavioral.hasNaps;

      // Naps
      if (v.behavioral.napFrequency !== undefined || v.behavioral.napDuration !== undefined) {
        out.behavioral.hasNaps = v.behavioral.hasNaps !== undefined ? v.behavioral.hasNaps : !!(v.behavioral.napFrequency || v.behavioral.napDuration);
        if (v.behavioral.napFrequency !== undefined) out.behavioral.napFrequency = v.behavioral.napFrequency;
        if (v.behavioral.napDuration !== undefined) out.behavioral.napDurationMin = v.behavioral.napDuration;
      }

      // Smoking
      const smokingMap = {
        nefumător: 'Nefumător',
        'fumător_activ': 'Fumător activ',
        'fumător_pasiv': 'Fumător pasiv',
        'fost_fumător': 'Fost fumător (>6 luni abstinență)'
      };
      if (v.behavioral.smokingStatus !== undefined) out.behavioral.smokingStatus = normalizeValue(smokingMap, v.behavioral.smokingStatus);
      if (v.behavioral.packsPerDay !== undefined) out.behavioral.packsPerDay = v.behavioral.packsPerDay;
      if (v.behavioral.smokingYears !== undefined) out.behavioral.smokingYears = v.behavioral.smokingYears;

      // Alcohol
      if (v.behavioral.alcoholFrequency !== undefined) {
        const alcoholMap = {
          niciodată: 'Niciodată',
          rar: 'Ocazional',
          'moderat': 'Săptămânal',
          'frecvent': 'Zilnic',
          'zilnic': 'Zilnic'
        };
        out.behavioral.alcoholFrequency = normalizeValue(alcoholMap, v.behavioral.alcoholFrequency);
      }
      if (v.behavioral.alcoholAmount !== undefined) out.behavioral.alcoholQuantity = v.behavioral.alcoholAmount;

      // Lifestyle
      if (v.behavioral.caffeineCount !== undefined) out.behavioral.caffeineIntake = v.behavioral.caffeineCount;
      const activityMap = { sedentar: 'Sedentar', moderat: 'Moderat', intens: 'Intens' };
      if (v.behavioral.physicalActivity !== undefined) out.behavioral.physicalActivityLevel = normalizeValue(activityMap, v.behavioral.physicalActivity);
      if (v.behavioral.physicalActivityHours !== undefined) out.behavioral.physicalActivityHours = v.behavioral.physicalActivityHours;

      // Sleep position
      const posMap = { dorsal: 'Dorsal', lateral: 'Lateral', mixt: 'Mixt', abdomen: 'Abdomen' };
      if (v.behavioral.sleepPosition !== undefined) out.behavioral.sleepPositionPrimary = normalizeValue(posMap, v.behavioral.sleepPosition);
      if (v.behavioral.positionalOSA !== undefined) out.behavioral.positionalOSA = v.behavioral.positionalOSA;
      console.log('Overlay: mapped behavioral to:', out.behavioral);
    }

    // ORL - REPLACE patient ORL with visit values
    if (v.orlHistory) {
      console.log('Overlay: visit has orlHistory:', v.orlHistory);
      out.behavioral = out.behavioral || {};
      if (v.orlHistory.mallampatiClass !== undefined) out.behavioral.mallampati = v.orlHistory.mallampatiClass;
        const devMap = { da: true, nu: false };
        if (v.orlHistory.septumDeviation !== undefined) {
          out.behavioral.septumDeviation = v.orlHistory.septumDeviation;
        } else if (v.orlHistory.deviateSeptum !== undefined) {
          out.behavioral.septumDeviation = normalizeValue(devMap, v.orlHistory.deviateSeptum);
        }
      if (v.orlHistory.macroglossia !== undefined) out.behavioral.macroglossia = v.orlHistory.macroglossia;
      if (v.orlHistory.tonsilHypertrophy !== undefined) out.behavioral.tonsillarHypertrophy = v.orlHistory.tonsilHypertrophy;
      if (v.orlHistory.retrognathia !== undefined) out.behavioral.retrognathia = v.orlHistory.retrognathia;
      if (v.orlHistory.nasalObstruction !== undefined) out.behavioral.nasalObstruction = v.orlHistory.nasalObstruction;
      if (v.orlHistory.chronicRhinitis !== undefined) out.behavioral.chronicRhinitis = v.orlHistory.chronicRhinitis;
      if (v.orlHistory.orlSurgery !== undefined) out.behavioral.priorENTSurgery = v.orlHistory.orlSurgeryDetails || '';
      console.log('Overlay: mapped ORL to behavioral:', out.behavioral);
    }

    // Psychosocial - REPLACE patient psychosocial with visit values
    if (v.psychosocial) {
      console.log('Overlay: visit has psychosocial:', v.psychosocial);
      const updatedPsychosocial = {};
      if (v.psychosocial.saqliDailyEnergy !== undefined) updatedPsychosocial.saqliDailyEnergy = v.psychosocial.saqliDailyEnergy;
      if (v.psychosocial.saqliDailyConcentration !== undefined) updatedPsychosocial.saqliDailyConcentration = v.psychosocial.saqliDailyConcentration;
      if (v.psychosocial.saqliDailyProductivity !== undefined) updatedPsychosocial.saqliDailyProductivity = v.psychosocial.saqliDailyProductivity;
      if (v.psychosocial.saqliSocialIntimate !== undefined) updatedPsychosocial.saqliSocialIntimate = v.psychosocial.saqliSocialIntimate;
      if (v.psychosocial.saqliSocialActivities !== undefined) updatedPsychosocial.saqliSocialActivities = v.psychosocial.saqliSocialActivities;
      if (v.psychosocial.saqliSocialSelfEsteem !== undefined) updatedPsychosocial.saqliSocialSelfEsteem = v.psychosocial.saqliSocialSelfEsteem;
      if (v.psychosocial.saqliEmotionalMood !== undefined) updatedPsychosocial.saqliEmotionalMood = v.psychosocial.saqliEmotionalMood;
      if (v.psychosocial.saqliEmotionalAnxiety !== undefined) updatedPsychosocial.saqliEmotionalAnxiety = v.psychosocial.saqliEmotionalAnxiety;
      if (v.psychosocial.saqliEmotionalFrustration !== undefined) updatedPsychosocial.saqliEmotionalFrustration = v.psychosocial.saqliEmotionalFrustration;
      if (v.psychosocial.saqliSymptomsSleepiness !== undefined) updatedPsychosocial.saqliSymptomsSleepiness = v.psychosocial.saqliSymptomsSleepiness;
      if (v.psychosocial.saqliSymptomsFatigue !== undefined) updatedPsychosocial.saqliSymptomsFatigue = v.psychosocial.saqliSymptomsFatigue;
      if (v.psychosocial.saqliSymptomsSnoring !== undefined) updatedPsychosocial.saqliSymptomsSnoring = v.psychosocial.saqliSymptomsSnoring;
      if (v.psychosocial.saqliSymptomsAwakenings !== undefined) updatedPsychosocial.saqliSymptomsAwakenings = v.psychosocial.saqliSymptomsAwakenings;
      if (v.psychosocial.saqliTreatmentSatisfaction !== undefined) updatedPsychosocial.saqliTreatmentSatisfaction = v.psychosocial.saqliTreatmentSatisfaction;
      if (v.psychosocial.saqliTreatmentSideEffects !== undefined) updatedPsychosocial.saqliTreatmentSideEffects = v.psychosocial.saqliTreatmentSideEffects;
      if (v.psychosocial.saqliTreatmentDiscomfort !== undefined) updatedPsychosocial.saqliTreatmentDiscomfort = v.psychosocial.saqliTreatmentDiscomfort;
      console.log('Overlay: replaced psychosocial with:', updatedPsychosocial);
      out.psychosocial = updatedPsychosocial;
    }

    // Biomarkers - REPLACE patient biomarkers with visit values
    if (v.biomarkers) {
      console.log('Overlay: visit has biomarkers:', v.biomarkers);
      const updatedBiomarkers = {};
      if (v.biomarkers.crp !== undefined) updatedBiomarkers.crp = v.biomarkers.crp;
      if (v.biomarkers.hba1c !== undefined) updatedBiomarkers.hba1c = v.biomarkers.hba1c;
      if (v.biomarkers.ldl !== undefined) updatedBiomarkers.ldl = v.biomarkers.ldl;
      if (v.biomarkers.hdl !== undefined) updatedBiomarkers.hdl = v.biomarkers.hdl;
      if (v.biomarkers.triglycerides !== undefined) updatedBiomarkers.triglycerides = v.biomarkers.triglycerides;
      if (v.biomarkers.tsh !== undefined) updatedBiomarkers.tsh = v.biomarkers.tsh;
      if (v.biomarkers.vitaminD !== undefined) updatedBiomarkers.vitaminD = v.biomarkers.vitaminD;
      if (v.biomarkers.creatinine !== undefined) updatedBiomarkers.creatinine = v.biomarkers.creatinine;
      console.log('Overlay: replaced biomarkers with:', updatedBiomarkers);
      out.biomarkers = updatedBiomarkers;
    }

    // CPAP Device Data - REPLACE patient cpapData with visit values
    if (v.cpapData) {
      console.log('Overlay: visit has cpapData:', v.cpapData);
      const updatedCpapData = { ...(out.cpapData || {}) };
      
      if (v.cpapData.brand !== undefined) updatedCpapData.brand = v.cpapData.brand;
      if (v.cpapData.model !== undefined) updatedCpapData.model = v.cpapData.model;
      if (v.cpapData.therapyType !== undefined) updatedCpapData.therapyType = v.cpapData.therapyType;
      if (v.cpapData.pressureMin !== undefined) updatedCpapData.pressureMin = v.cpapData.pressureMin;
      if (v.cpapData.pressureMax !== undefined) updatedCpapData.pressureMax = v.cpapData.pressureMax;
      if (v.cpapData.startDate !== undefined) updatedCpapData.startDate = v.cpapData.startDate;
      if (v.cpapData.maskType !== undefined) updatedCpapData.maskType = v.cpapData.maskType;
      if (v.cpapData.humidificationEnabled !== undefined) updatedCpapData.humidificationEnabled = v.cpapData.humidificationEnabled;
      if (v.cpapData.humidificationLevel !== undefined) updatedCpapData.humidificationLevel = v.cpapData.humidificationLevel;
      if (v.cpapData.rampEnabled !== undefined) updatedCpapData.rampEnabled = v.cpapData.rampEnabled;
      if (v.cpapData.rampTime !== undefined) updatedCpapData.rampTime = v.cpapData.rampTime;
      
      if (v.cpapData.technicalProblems) {
        updatedCpapData.technicalProblems = { ...(updatedCpapData.technicalProblems || {}) };
        if (v.cpapData.technicalProblems.facialIrritation !== undefined) updatedCpapData.technicalProblems.facialIrritation = v.cpapData.technicalProblems.facialIrritation;
        if (v.cpapData.technicalProblems.claustrophobia !== undefined) updatedCpapData.technicalProblems.claustrophobia = v.cpapData.technicalProblems.claustrophobia;
        if (v.cpapData.technicalProblems.deviceNoise !== undefined) updatedCpapData.technicalProblems.deviceNoise = v.cpapData.technicalProblems.deviceNoise;
        if (v.cpapData.technicalProblems.nasalSecretions !== undefined) updatedCpapData.technicalProblems.nasalSecretions = v.cpapData.technicalProblems.nasalSecretions;
        if (v.cpapData.technicalProblems.aerophagia !== undefined) updatedCpapData.technicalProblems.aerophagia = v.cpapData.technicalProblems.aerophagia;
        if (v.cpapData.technicalProblems.otherIssues !== undefined) updatedCpapData.technicalProblems.otherIssues = v.cpapData.technicalProblems.otherIssues;
      }
      
      if (v.cpapData.nonAdherenceReasons) {
        updatedCpapData.nonAdherenceReasons = { ...(updatedCpapData.nonAdherenceReasons || {}) };
        if (v.cpapData.nonAdherenceReasons.dryness !== undefined) updatedCpapData.nonAdherenceReasons.dryness = v.cpapData.nonAdherenceReasons.dryness;
        if (v.cpapData.nonAdherenceReasons.pressureTooHigh !== undefined) updatedCpapData.nonAdherenceReasons.pressureTooHigh = v.cpapData.nonAdherenceReasons.pressureTooHigh;
        if (v.cpapData.nonAdherenceReasons.anxiety !== undefined) updatedCpapData.nonAdherenceReasons.anxiety = v.cpapData.nonAdherenceReasons.anxiety;
        if (v.cpapData.nonAdherenceReasons.other !== undefined) updatedCpapData.nonAdherenceReasons.other = v.cpapData.nonAdherenceReasons.other;
      }
      
      console.log('Overlay: replaced cpapData with:', updatedCpapData);
      out.cpapData = updatedCpapData;
    }

    return out;
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/patients/${id}`, editedPatient, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update both patient states immediately before fetching
      setPatient(editedPatient);
      setEditMode(false);
      
      // Fetch fresh data from backend
      await fetchPatientData();
      
      alert('Date salvate cu succes!');
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('Eroare la salvare!');
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedPatient(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedFieldChange = (parent, field, value) => {
    setEditedPatient(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] || {}),
        [field]: value
      }
    }));
  };

  const handleArrayFieldToggle = (parent, field, value) => {
    setEditedPatient(prev => {
      // Handle text field for otherText
      if (field === 'otherText') {
        return {
          ...prev,
          [parent]: {
            ...(prev[parent] || {}),
            [field]: value
          }
        };
      }
      
      // Handle array toggle for checkboxes
      const currentArray = prev[parent]?.[field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [parent]: {
          ...(prev[parent] || {}),
          [field]: newArray
        }
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Se încarcă...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Pacientul nu a fost găsit
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-[#065f46] mb-2">
              {patient.firstName} {patient.lastName}
            </h1>
            <div className="text-[#0d9488] space-y-1">
              <p>CNP: {patient.cnp || '-'}</p>
              <p>Data nașterii: {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('ro-RO') : '-'}</p>
              <p>Vârstă: {patient.dateOfBirth ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / 31557600000) : '-'} ani</p>
            </div>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Salvează
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setEditedPatient(patient);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Anulează
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  // When entering edit mode, initialize editedPatient with latest visit values (overlay)
                  const latest = getLatestVisit();
                  const dataForEditing = overlayPatientWithVisit(patient, latest);
                  setEditedPatient(dataForEditing);
                  setEditMode(true);
                }}
                className="px-4 py-2 bg-[#14b8a6] text-white rounded hover:bg-[#0d9488]"
              >
                Editează
              </button>
            )}
            <button
              onClick={() => navigate(`/patients/${id}/stop-bang`)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              STOP-BANG
            </button>
            <button
              onClick={() => navigate(`/patients/${id}/epworth`)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Epworth
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Înapoi
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-x-auto">
        <div className="flex border-b">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === tab
                  ? 'border-b-2 border-[#14b8a6] text-[#14b8a6]'
                  : 'text-[#0d9488] hover:text-[#065f46]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {(() => {
          const latest = getLatestVisit();
          console.log('=== PatientDetails Tab Render ===');
          console.log('Patient comorbidities:', patient?.comorbidities);
          console.log('Latest visit:', latest);
          if (latest) {
            console.log('Latest visit comorbidities:', latest.comorbidities);
          }
          const viewPatient = editMode ? editedPatient : overlayPatientWithVisit(patient, latest);
          console.log('ViewPatient comorbidities (after overlay):', viewPatient?.comorbidities);
          return (
            <>
              {activeTab === 'Personal' && <PersonalTab patient={viewPatient} editMode={editMode} onChange={handleFieldChange} />}
              {activeTab === 'Comorbidități' && <ComorbiditiesTab patient={viewPatient} editMode={editMode} onChange={handleArrayFieldToggle} patientId={id} />}
              {activeTab === 'Comportament & ORL' && <BehavioralTab patient={viewPatient} editMode={editMode} onChange={handleNestedFieldChange} patientId={id} />}
              {activeTab === 'Psihosocial & Bio' && <PsychosocialTab patient={viewPatient} editMode={editMode} onChange={handleNestedFieldChange} patientId={id} />}
            </>
          );
        })()}
        {activeTab === 'Medicație' && (
          <MedicationTab
            patient={editMode ? editedPatient : patient}
            editMode={editMode}
            onChange={handleNestedFieldChange}
            onSave={handleSave}
            visits={visits}
          />
        )}
        {activeTab === 'CPAP' && <CPAPTab patient={editMode ? editedPatient : overlayPatientWithVisit(patient, getLatestVisit())} editMode={editMode} onChange={handleNestedFieldChange} patientId={id} visits={visits} />}
        {activeTab === 'Istoric' && <HistoryTab logs={auditLogs} patientId={id} onRefresh={fetchAuditLogs} />}
        {activeTab === 'Consimțământ' && (
          <ConsentTab
            patient={editMode ? editedPatient : overlayPatientWithVisit(patient, getLatestVisit())}
            editMode={editMode}
            onChange={handleFieldChange}
          />
        )}
      </div>
    </div>
  );
};

// Personal Tab Component
const PersonalTab = ({ patient, editMode, onChange }) => {
  return (
    <div className="space-y-6">
      <Section title="Date Identificare">
        <Field label="Nume" value={patient.firstName} editMode={editMode} onChange={(v) => onChange('firstName', v)} />
        <Field label="Prenume" value={patient.lastName} editMode={editMode} onChange={(v) => onChange('lastName', v)} />
        <Field label="Data nașterii" value={patient.dateOfBirth} editMode={editMode} onChange={(v) => onChange('dateOfBirth', v)} type="date" />
        <SelectField 
          label="Sex" 
          value={patient.gender} 
          editMode={editMode} 
          onChange={(v) => onChange('gender', v)}
          options={['Male', 'Female']}
        />
        <Field label="CNP" value={patient.cnp} editMode={editMode} onChange={(v) => onChange('cnp', v)} />
        <CheckboxField 
          label="Decedat" 
          checked={patient.decedat} 
          editMode={editMode} 
          onChange={(v) => onChange('decedat', v)} 
        />
        <Field label="Email" value={patient.email} editMode={editMode} onChange={(v) => onChange('email', v)} type="email" />
        <Field label="Telefon" value={patient.phone} editMode={editMode} onChange={(v) => onChange('phone', v)} />
      </Section>

      <Section title="Biometrie">
        <Field label="Înălțime (cm)" value={patient.heightCm} editMode={editMode} onChange={(v) => onChange('heightCm', v)} type="number" />
        <Field label="Greutate (kg)" value={patient.weightKg} editMode={editMode} onChange={(v) => onChange('weightKg', v)} type="number" />
        <Field label="BMI" value={patient.bmi ? Number(patient.bmi).toFixed(2) : ''} editMode={false} />
        <Field label="Circumferință gât (cm)" value={patient.neckCircumferenceCm} editMode={editMode} onChange={(v) => onChange('neckCircumferenceCm', v)} type="number" />
      </Section>

      <Section title="Demografie">
        <Field label="Județ" value={patient.county} editMode={editMode} onChange={(v) => onChange('county', v)} />
        <Field label="Localitate" value={patient.locality} editMode={editMode} onChange={(v) => onChange('locality', v)} />
        <SelectField 
          label="Tip mediu" 
          value={patient.environmentType} 
          editMode={editMode} 
          onChange={(v) => onChange('environmentType', v)}
          options={['Urban', 'Rural', 'Suburban']}
        />
        {false && (
          <SelectField 
            label="Stare civilă" 
            value={patient.maritalStatus} 
            editMode={editMode} 
            onChange={(v) => onChange('maritalStatus', v)}
            options={['Necăsătorit/ă', 'Căsătorit/ă', 'Divorțat/ă', 'Văduv/ă']}
          />
        )}
        <Field label="Ocupație" value={patient.occupation} editMode={editMode} onChange={(v) => onChange('occupation', v)} />
        <SelectField 
          label="Nivel educație" 
          value={patient.educationLevel} 
          editMode={editMode} 
          onChange={(v) => onChange('educationLevel', v)}
          options={['Primar', 'Gimnazial', 'Liceal', 'Universitar', 'Postuniversitar']}
        />
        {false && (
          <>
            <Field label="Număr persoane în gospodărie" value={patient.householdSize} editMode={editMode} onChange={(v) => onChange('householdSize', v)} type="number" />
            <Field label="Număr copii în gospodărie" value={patient.childrenCount} editMode={editMode} onChange={(v) => onChange('childrenCount', v)} type="number" />
          </>
        )}
      </Section>

      <Section title="Screening OSA">
        <Field label="STOP-BANG Score (0-8)" value={patient.stopBangScore} editMode={editMode} onChange={(v) => onChange('stopBangScore', v)} type="number" min="0" max="8" />
        <Field label="Epworth Score (0-24)" value={patient.epworthScore} editMode={editMode} onChange={(v) => onChange('epworthScore', v)} type="number" min="0" max="24" />
        <SelectField 
          label="Formă SASO" 
          value={patient.sasoForm} 
          editMode={editMode} 
          onChange={(v) => onChange('sasoForm', v)}
          options={['Moderată', 'Severă']}
        />
        <Field 
          label="Clasificare OSA (din ultima vizită)" 
          value={patient.osaClassification || ''} 
          editMode={false}
        />
        <SelectField 
          label="Poziție somn" 
          value={patient.sleepPosition} 
          editMode={editMode} 
          onChange={(v) => onChange('sleepPosition', v)}
          options={['Spate', 'Lateral', 'Abdomen', 'Mixtă']}
        />
      </Section>
    </div>
  );
};

// Comorbidities Tab Component
const ComorbiditiesTab = ({ patient, editMode, onChange, patientId }) => {
  const comorbidityCategories = {
    cardiovascular: {
      title: 'Cardiovasculare',
      options: [
        { code: 'I10', label: 'Hipertensiune arterială (HTA)' },
        { code: 'I10.1', label: 'HTA rezistentă' },
        { code: 'I48', label: 'Aritmii (fibrilație atrială)' },
        { code: 'I50.9', label: 'Insuficiență cardiacă' },
        { code: 'I25.1', label: 'Boală coronariană' }
      ]
    },
    metabolic: {
      title: 'Metabolice',
      options: [
        { code: 'E11.9', label: 'Diabet zaharat tip 2' },
        { code: 'E78.5', label: 'Dislipidemie' },
        { code: 'E66.9', label: 'Obezitate' },
        { code: 'E66.01', label: 'Istoric chirurgie bariatrică' }
      ]
    },
    respiratory: {
      title: 'Respiratorii',
      options: [
        { code: 'J45.9', label: 'Astm bronsic' },
        { code: 'J44.9', label: 'BPOC' },
        { code: 'J84.9', label: 'Patologii pulmonare restrictive' }
      ]
    },
    neurologic: {
      title: 'Neurologice & Psihiatrice',
      options: [
        { code: 'I63.9', label: 'Accident vascular cerebral' },
        { code: 'F41.9', label: 'Tulburări anxioase' },
        { code: 'F32.9', label: 'Tulburări depresive' },
        { code: 'F03', label: 'Tulburări cognitive' }
      ]
    },
    other: {
      title: 'Altele',
      options: [
        { code: 'K21.9', label: 'Reflux gastro-esofagian' },
        { code: 'E03.9', label: 'Hipotiroidism' },
        { code: 'I26.9', label: 'Tromboembolism' },
        { code: 'N18.9', label: 'Insuficiență renală cronică' }
      ]
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(comorbidityCategories).map(([category, data]) => (
        <Section key={category} title={data.title}>
          <div className="space-y-2">
            {data.options.map(option => (
              <label key={option.code} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={patient.comorbidities?.[category]?.includes(option.code) || false}
                  onChange={() => editMode && onChange('comorbidities', category, option.code)}
                  disabled={!editMode}
                  className="w-4 h-4 text-[#14b8a6]"
                />
                <span className={!editMode ? 'text-[#065f46]' : ''}>
                  {option.label}
                </span>
              </label>
            ))}
            {category === 'other' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-[#065f46] mb-1">
                  Alte comorbidități (text liber)
                </label>
                <textarea
                  value={patient.comorbidities?.otherText || ''}
                  onChange={(e) => editMode && onChange('comorbidities', 'otherText', e.target.value)}
                  disabled={!editMode}
                  className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6] disabled:bg-gray-50"
                  placeholder="Alte comorbidități relevante..."
                  rows="2"
                />
              </div>
            )}
          </div>
        </Section>
      ))}
      
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <button
          onClick={() => window.location.href = `/patients/${patientId}/visits/new`}
          className="px-6 py-3 bg-[#14b8a6] text-white font-medium rounded-lg hover:bg-[#0d9488] transition-colors inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adaugă vizită
        </button>
      </div>
    </div>
  );
};

// Behavioral Tab Component
const BehavioralTab = ({ patient, editMode, onChange, patientId }) => {
  // Check if patient is a professional driver based on occupation
  const isProfessionalDriver = patient?.occupation?.toLowerCase().includes('șofer') || 
                               patient?.occupation?.toLowerCase().includes('sofer') ||
                               patient?.occupation?.toLowerCase().includes('tir') ||
                               patient?.occupation?.toLowerCase().includes('taximetrist');

  return (
    <div className="space-y-6">
      <Section title="6.1 Somn">
        <Field 
          label="Durata medie somn (ore/noapte)" 
          value={patient.behavioral?.avgSleepDuration} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'avgSleepDuration', v)} 
          type="number" 
          step="0.5"
        />
        <Field 
          label="Ora tipică de culcare" 
          value={patient.behavioral?.bedtimeTypical} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'bedtimeTypical', v)} 
          type="time"
          placeholder="ex: 23:00"
        />
        <Field 
          label="Ora tipică de trezire" 
          value={patient.behavioral?.waketimeTypical} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'waketimeTypical', v)} 
          type="time"
          placeholder="ex: 07:00"
        />
        <SelectField 
          label="Variabilitate somn (zile libere vs. lucrătoare)" 
          value={patient.behavioral?.sleepVariability} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'sleepVariability', v)}
          options={['Constantă', 'Moderată', 'Mare']}
        />
        <CheckboxField 
          label="Somn fragmentat (treziri >3/noapte)" 
          checked={patient.behavioral?.fragmentedSleep} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'fragmentedSleep', v)} 
        />
        <CheckboxField 
          label="Somnolență diurnă (sieste)" 
          checked={patient.behavioral?.hasNaps} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'hasNaps', v)} 
        />
        {patient.behavioral?.hasNaps && (
          <>
            <SelectField 
              label="Frecvență sieste" 
              value={patient.behavioral?.napFrequency} 
              editMode={editMode} 
              onChange={(v) => onChange('behavioral', 'napFrequency', v)}
              options={['Zilnic', 'Ocazional', 'Rar']}
            />
            <Field 
              label="Durată sieste (minute)" 
              value={patient.behavioral?.napDurationMin} 
              editMode={editMode} 
              onChange={(v) => onChange('behavioral', 'napDurationMin', v)} 
              type="number"
            />
          </>
        )}
      </Section>

      <Section title="6.2 Stil de viață">
        <SelectField 
          label="Status fumat" 
          value={patient.behavioral?.smokingStatus} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'smokingStatus', v)}
          options={['Nefumător', 'Fumător activ', 'Fumător pasiv', 'Fost fumător (>6 luni abstinență)']}
        />
        {(patient.behavioral?.smokingStatus === 'Fumător activ' || patient.behavioral?.smokingStatus === 'Fost fumător (>6 luni abstinență)') && (
          <>
            <Field 
              label="Pachete/zi" 
              value={patient.behavioral?.packsPerDay} 
              editMode={editMode} 
              onChange={(v) => onChange('behavioral', 'packsPerDay', v)} 
              type="number"
              step="0.05"
            />
            <Field 
              label="Ani de fumat" 
              value={patient.behavioral?.smokingYears} 
              editMode={editMode} 
              onChange={(v) => onChange('behavioral', 'smokingYears', v)} 
              type="number"
            />
            <Field 
              label="PA (Pachete-Ani)" 
              value={patient.behavioral?.packsPerDay && patient.behavioral?.smokingYears ? (parseFloat(patient.behavioral.packsPerDay) * parseFloat(patient.behavioral.smokingYears)).toFixed(1) : ''} 
              editMode={false} 
              onChange={() => {}} 
              type="number"
              step="0.5"
            />
          </>
        )}
        <SelectField 
          label="Frecvență consum alcool" 
          value={patient.behavioral?.alcoholFrequency} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'alcoholFrequency', v)}
          options={['Niciodată', 'Ocazional', 'Săptămânal', 'Zilnic']}
        />
        <Field 
          label="Cantitate alcool (unități/săptămână)" 
          value={patient.behavioral?.alcoholQuantity} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'alcoholQuantity', v)} 
          type="number"
          placeholder="ex: 5-7"
        />
        <Field 
          label="Consum cafeină (cafele/zi)" 
          value={patient.behavioral?.caffeineIntake} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'caffeineIntake', v)} 
          type="number"
        />
        <SelectField 
          label="Nivel activitate fizică" 
          value={patient.behavioral?.physicalActivityLevel} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'physicalActivityLevel', v)}
          options={['Sedentar', 'Moderat', 'Intens']}
        />
        <Field 
          label="Ore activitate fizică/săptămână" 
          value={patient.behavioral?.physicalActivityHours} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'physicalActivityHours', v)} 
          type="number"
          step="0.5"
        />
      </Section>

      <Section title="6.3 Poziția de somn">
        <SelectField 
          label="Poziție preponderentă" 
          value={patient.behavioral?.sleepPositionPrimary} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'sleepPositionPrimary', v)}
          options={['Dorsal', 'Lateral', 'Mixt']}
        />
        <CheckboxField 
          label="OSA pozițională (dorsal-dependent)" 
          checked={patient.behavioral?.positionalOSA} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'positionalOSA', v)} 
        />
      </Section>

      <Section title="ORL - Anatomie căi aeriene">
        <SelectField 
          label="Mallampati" 
          value={patient.behavioral?.mallampati} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'mallampati', v)}
          options={['I', 'II', 'III', 'IV']}
        />
        <CheckboxField 
          label="Deviație sept nazal" 
          checked={patient.behavioral?.septumDeviation} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'septumDeviation', v)} 
        />
        <CheckboxField 
          label="Macroglosie" 
          checked={patient.behavioral?.macroglossia} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'macroglossia', v)} 
        />
        <CheckboxField 
          label="Hipertrofie amigdaliană" 
          checked={patient.behavioral?.tonsillarHypertrophy} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'tonsillarHypertrophy', v)} 
        />
        <CheckboxField 
          label="Retrognatism/Micrognatie" 
          checked={patient.behavioral?.retrognathia} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'retrognathia', v)} 
        />
        <CheckboxField 
          label="Obstrucție nazală" 
          checked={patient.behavioral?.nasalObstruction} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'nasalObstruction', v)} 
        />
        <CheckboxField 
          label="Rinite cronice/Alergii" 
          checked={patient.behavioral?.chronicRhinitis} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'chronicRhinitis', v)} 
        />
        <Field label="Istoric chirurgie ORL" value={patient.behavioral?.priorENTSurgery} editMode={editMode} onChange={(v) => onChange('behavioral', 'priorENTSurgery', v)} placeholder="ex: Uvulopalatoplastie 2020" />
      </Section>

      <Section title="Risc Rutier (Șoferi profesioniști) - CRITIC LEGAL">
        {isProfessionalDriver ? (
          <>
            <div className="bg-yellow-100 border border-yellow-400 rounded p-3 mb-4">
              <p className="text-sm text-yellow-800 font-medium">⚠️ <strong>Șofer profesionist detectat</strong> - Evaluare risc rutier obligatorie!</p>
            </div>
            <CheckboxField 
              label="Somnolență la volan" 
              checked={patient.behavioral?.drowsyDriving} 
              editMode={editMode} 
              onChange={(v) => onChange('behavioral', 'drowsyDriving', v)} 
            />
            {patient.behavioral?.drowsyDriving && (
              <SelectField 
                label="Frecvența episoadelor de somnolență" 
                value={patient.behavioral?.drowsinessFrequency} 
                editMode={editMode} 
                onChange={(v) => onChange('behavioral', 'drowsinessFrequency', v)}
                options={['Rar', 'Ocazional', 'Frecvent', 'Zilnic']}
              />
            )}
            <Field 
              label="Accidente rutiere (ultimi 3 ani)" 
              value={patient.behavioral?.roadAccidents} 
              editMode={editMode} 
              onChange={(v) => onChange('behavioral', 'roadAccidents', v)} 
              type="number" 
              min="0" 
            />
            <Field 
              label="Ore lucrate în schimburi/săptămână" 
              value={patient.behavioral?.shiftWorkHours} 
              editMode={editMode} 
              onChange={(v) => onChange('behavioral', 'shiftWorkHours', v)} 
              type="number" 
            />
            <SelectField 
              label="Reluarea conducerii după tratament" 
              value={patient.behavioral?.drivingResumedAfterTreatment === null ? '' : patient.behavioral?.drivingResumedAfterTreatment ? 'Da' : 'Nu'} 
              editMode={editMode} 
              onChange={(v) => onChange('behavioral', 'drivingResumedAfterTreatment', v === 'Da' ? true : v === 'Nu' ? false : null)}
              options={['Da', 'Nu']}
            />
          </>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>Pacientul nu este catalogat ca șofer profesionist.</p>
            <p className="text-sm mt-2">Ocupație: {patient.occupation || 'Nespecificată'}</p>
          </div>
        )}
      </Section>
      
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={() => window.location.href = `/patients/${patientId}/visits/new`}
          className="px-6 py-3 bg-[#14b8a6] text-white font-medium rounded-lg hover:bg-[#0d9488] transition-colors flex items-center gap-2 mx-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adaugă vizită
        </button>
      </div>
    </div>
  );
};

// Psychosocial Tab Component
const PsychosocialTab = ({ patient, editMode, onChange, patientId }) => {
  return (
    <div className="space-y-6">
      <Section title="SAQLI - Calitatea Vieții în Apneea de Somn">
        <p className="text-sm text-[#0d9488] mb-4">Sleep Apnea Quality of Life Index (1-7: 1=foarte afectat, 7=deloc afectat)</p>
        
        <div className="mb-4">
          <h4 className="font-semibold text-[#065f46] mb-2">Funcționare Zilnică</h4>
          <Field 
            label="Energie & vitalitate (1-7)" 
            value={patient.psychosocial?.saqliDailyEnergy} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliDailyEnergy', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
          <Field 
            label="Concentrare & atenție (1-7)" 
            value={patient.psychosocial?.saqliDailyConcentration} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliDailyConcentration', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
          <Field 
            label="Productivitate (1-7)" 
            value={patient.psychosocial?.saqliDailyProductivity} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliDailyProductivity', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-[#065f46] mb-2">Interacțiuni Sociale</h4>
          <Field 
            label="Relații apropiate (1-7)" 
            value={patient.psychosocial?.saqliSocialIntimate} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliSocialIntimate', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
          <Field 
            label="Activități sociale (1-7)" 
            value={patient.psychosocial?.saqliSocialActivities} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliSocialActivities', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
          <Field 
            label="Stimă de sine (1-7)" 
            value={patient.psychosocial?.saqliSocialSelfEsteem} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliSocialSelfEsteem', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-[#065f46] mb-2">Funcționare Emoțională</h4>
          <Field 
            label="Dispoziție generală (1-7)" 
            value={patient.psychosocial?.saqliEmotionalMood} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliEmotionalMood', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
          <Field 
            label="Anxietate (1-7)" 
            value={patient.psychosocial?.saqliEmotionalAnxiety} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliEmotionalAnxiety', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
          <Field 
            label="Frustrare (1-7)" 
            value={patient.psychosocial?.saqliEmotionalFrustration} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliEmotionalFrustration', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-[#065f46] mb-2">Simptome</h4>
          <Field 
            label="Somnolență diurnă (1-7)" 
            value={patient.psychosocial?.saqliSymptomsSleepiness} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliSymptomsSleepiness', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
          <Field 
            label="Oboseală (1-7)" 
            value={patient.psychosocial?.saqliSymptomsFatigue} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliSymptomsFatigue', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
          <Field 
            label="Sforăit (1-7)" 
            value={patient.psychosocial?.saqliSymptomsSnoring} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliSymptomsSnoring', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
          <Field 
            label="Treziri nocturne (1-7)" 
            value={patient.psychosocial?.saqliSymptomsAwakenings} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliSymptomsAwakenings', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-[#065f46] mb-2">Impact Tratament</h4>
          <Field 
            label="Satisfacție tratament (1-7)" 
            value={patient.psychosocial?.saqliTreatmentSatisfaction} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliTreatmentSatisfaction', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
          <Field 
            label="Efecte secundare (1-7)" 
            value={patient.psychosocial?.saqliTreatmentSideEffects} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliTreatmentSideEffects', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
          <Field 
            label="Disconfort echipament (1-7)" 
            value={patient.psychosocial?.saqliTreatmentDiscomfort} 
            editMode={editMode} 
            onChange={(v) => onChange('psychosocial', 'saqliTreatmentDiscomfort', v)} 
            type="number" 
            min="1" 
            max="7" 
          />
        </div>
      </Section>

      <Section title="Biomarkeri - Evaluare metabolică & inflamatorie">
        <Field 
          label="CRP - Proteina C Reactivă (mg/L)" 
          value={patient.biomarkers?.crp} 
          editMode={editMode} 
          onChange={(v) => onChange('biomarkers', 'crp', v)} 
          type="number" 
          step="0.1" 
        />
        <p className="text-xs text-[#0d9488] -mt-2">Inflamație: &lt;3 Normal | 3-10 Ușor crescut | &gt;10 Semnificativ</p>
        
        <Field 
          label="HbA1c - Hemoglobină glicozilată (%)" 
          value={patient.biomarkers?.hba1c} 
          editMode={editMode} 
          onChange={(v) => onChange('biomarkers', 'hba1c', v)} 
          type="number" 
          step="0.1" 
        />
        <p className="text-xs text-[#0d9488] -mt-2">Diabet: &lt;5.7% Normal | 5.7-6.4% Prediabet | ≥6.5% Diabet</p>
        
        <Field 
          label="LDL - Colesterol LDL (mg/dL)" 
          value={patient.biomarkers?.ldl} 
          editMode={editMode} 
          onChange={(v) => onChange('biomarkers', 'ldl', v)} 
          type="number" 
        />
        <p className="text-xs text-[#0d9488] -mt-2">&lt;100 Optimal | 100-129 Aproape optimal | ≥130 Crescut</p>
        
        <Field 
          label="HDL - Colesterol HDL (mg/dL)" 
          value={patient.biomarkers?.hdl} 
          editMode={editMode} 
          onChange={(v) => onChange('biomarkers', 'hdl', v)} 
          type="number" 
        />
        <p className="text-xs text-[#0d9488] -mt-2">&lt;40 Scăzut (risc) | 40-60 Normal | &gt;60 Protector</p>
        
        <Field 
          label="Trigliceride (mg/dL)" 
          value={patient.biomarkers?.triglycerides} 
          editMode={editMode} 
          onChange={(v) => onChange('biomarkers', 'triglycerides', v)} 
          type="number" 
        />
        <p className="text-xs text-[#0d9488] -mt-2">&lt;150 Normal | 150-199 Limită | ≥200 Crescut</p>
        
        <Field 
          label="TSH - Hormon stimulant tiroidian (mIU/L)" 
          value={patient.biomarkers?.tsh} 
          editMode={editMode} 
          onChange={(v) => onChange('biomarkers', 'tsh', v)} 
          type="number" 
          step="0.01" 
        />
        <p className="text-xs text-[#0d9488] -mt-2">Hipotiroidismul poate mima OSA: 0.4-4.0 Normal | &gt;4.0 Hipotiroidism</p>
        
        <Field 
          label="Vitamina D (ng/mL)" 
          value={patient.biomarkers?.vitaminD} 
          editMode={editMode} 
          onChange={(v) => onChange('biomarkers', 'vitaminD', v)} 
          type="number" 
          step="0.1" 
        />
        <p className="text-xs text-[#0d9488] -mt-2">Legată de somn & inflamație: &lt;20 Deficit | 20-30 Insuficient | &gt;30 Normal</p>
        
        <Field 
          label="Creatinină serică (mg/dL)" 
          value={patient.biomarkers?.creatinine} 
          editMode={editMode} 
          onChange={(v) => onChange('biomarkers', 'creatinine', v)} 
          type="number" 
          step="0.01" 
        />
        <p className="text-xs text-[#0d9488] -mt-2">Funcție renală: 0.6-1.2 Normal (M) | 0.5-1.1 Normal (F)</p>
      </Section>
      
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <button
          onClick={() => window.location.href = `/patients/${patientId}/visits/new`}
          className="px-6 py-3 bg-[#14b8a6] text-white font-medium rounded-lg hover:bg-[#0d9488] transition-colors inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adaugă vizită
        </button>
      </div>
    </div>
  );
};

// Visits Tab Component
const VisitsTab = ({ visits, patientId, onRefresh }) => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Istoric Vizite</h3>
        <button
          onClick={() => navigate(`/patients/${patientId}/visits/new`)}
          className="px-4 py-2 bg-[#14b8a6] text-white rounded hover:bg-[#0d9488]"
        >
          Adaugă Vizită
        </button>
      </div>

      {visits.length === 0 ? (
        <p className="text-[#0d9488] text-center py-8">Nu există vizite înregistrate</p>
      ) : (
        <div className="space-y-4">
          {visits.map(visit => (
            <div key={visit.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-lg">
                    {new Date(visit.visitDate).toLocaleDateString('ro-RO')}
                  </p>
                  <p className="text-[#0d9488]">Medic: {visit.clinician || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#0d9488]">IAH: <span className="font-semibold">{visit.ahi ?? '-'}</span></p>
                  <p className="text-sm text-[#0d9488]">Complianță: <span className="font-semibold">{visit.cpapCompliancePct ?? '-'}%</span></p>
                </div>
              </div>
              {visit.notes && (
                <p className="mt-2 text-[#065f46] text-sm">{visit.notes}</p>
              )}
              <div className="mt-3">
                <button
                  onClick={() => navigate(`/visits/${visit.id}/edit`)}
                  className="text-[#14b8a6] hover:underline text-sm"
                >
                  Vezi detalii →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Medication Tab Component
const MedicationTab = ({ patient, editMode, onChange, onSave, visits }) => {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">Această secțiune este în curs de dezvoltare.</p>
        <p className="text-sm text-gray-400 mt-2">Se așteaptă feedback de la echipa medicală.</p>
      </div>
    </div>
  );
};

// CPAP Tab Component
const CPAPTab = ({ patient, editMode, onChange, patientId, visits = [] }) => {
  // Derive latest visit metrics
  const latestVisit = Array.isArray(visits) && visits.length > 0
    ? [...visits].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))[0]
    : null;

  return (
    <div className="space-y-6">
      <Section title="Metrici din ultima vizită">
        <Field 
          label="Complianță (%)" 
          value={latestVisit?.cpapCompliancePct !== undefined && latestVisit?.cpapCompliancePct !== null ? `${latestVisit.cpapCompliancePct}%` : ''} 
          editMode={false}
        />
        <Field 
          label="Complianță ≥4h (%)" 
          value={latestVisit?.cpapCompliance4hPct !== undefined && latestVisit?.cpapCompliance4hPct !== null ? `${latestVisit.cpapCompliance4hPct}%` : ''} 
          editMode={false}
        />
        <Field 
          label="Utilizare medie (min)" 
          value={latestVisit?.cpapUsageMin !== undefined && latestVisit?.cpapUsageMin !== null ? `${latestVisit.cpapUsageMin} min` : ''} 
          editMode={false}
        />
        {latestVisit?.cpapComplianceLessThan4h && (
          <div className="bg-red-100 border border-red-400 rounded p-3">
            <p className="text-sm text-red-800 font-medium">⚠️ <strong>ALERT:</strong> Utilizare &lt;4h/noapte - Complianță insuficientă!</p>
          </div>
        )}
        <Field 
          label="Leaks 95th percentile" 
          value={latestVisit?.cpapLeaks95p !== undefined && latestVisit?.cpapLeaks95p !== null ? latestVisit.cpapLeaks95p : ''} 
          editMode={false}
        />
        <Field 
          label="Pressure 95th percentile" 
          value={latestVisit?.cpapPressure95p !== undefined && latestVisit?.cpapPressure95p !== null ? latestVisit.cpapPressure95p : ''} 
          editMode={false}
        />
      </Section>

      <Section title="Dispozitiv CPAP">
        <SelectField 
          label="Brand" 
          value={patient.cpapData?.brand} 
          editMode={editMode} 
          onChange={(v) => onChange('cpapData', 'brand', v)}
          options={['ResMed', 'Philips Respironics', 'Löwenstein Medical', 'Altul']}
        />
        <Field label="Model" value={patient.cpapData?.model} editMode={editMode} onChange={(v) => onChange('cpapData', 'model', v)} />
        <SelectField 
          label="Tip terapie" 
          value={patient.cpapData?.therapyType} 
          editMode={editMode} 
          onChange={(v) => onChange('cpapData', 'therapyType', v)}
          options={['CPAP', 'APAP', 'BiPAP', 'ASV']}
        />
        <Field label="Presiune min (cmH2O)" value={patient.cpapData?.pressureMin} editMode={editMode} onChange={(v) => onChange('cpapData', 'pressureMin', v)} type="number" />
        <Field label="Presiune max (cmH2O)" value={patient.cpapData?.pressureMax} editMode={editMode} onChange={(v) => onChange('cpapData', 'pressureMax', v)} type="number" />
        <Field label="Data început tratament" value={patient.cpapData?.startDate} editMode={editMode} onChange={(v) => onChange('cpapData', 'startDate', v)} type="date" />
      </Section>

      <Section title="Mască">
        <SelectField 
          label="Tip mască" 
          value={patient.cpapData?.maskType} 
          editMode={editMode} 
          onChange={(v) => onChange('cpapData', 'maskType', v)}
          options={['Nazală', 'Oro-nazală', 'Pillow nazal', 'Facială completă', 'Hibrid']}
        />
      </Section>

      <Section title="Setări">
        <CheckboxField 
          label="Umidificare activată" 
          checked={patient.cpapData?.humidificationEnabled} 
          editMode={editMode} 
          onChange={(v) => onChange('cpapData', 'humidificationEnabled', v)} 
        />
        {patient.cpapData?.humidificationEnabled && (
          <Field 
            label="Nivel umidificare (1-5)" 
            value={patient.cpapData?.humidificationLevel} 
            editMode={editMode} 
            onChange={(v) => onChange('cpapData', 'humidificationLevel', v)} 
            type="number" 
            min="1" 
            max="5" 
          />
        )}
        <CheckboxField 
          label="Rampa activată" 
          checked={patient.cpapData?.rampEnabled} 
          editMode={editMode} 
          onChange={(v) => onChange('cpapData', 'rampEnabled', v)} 
        />
        {patient.cpapData?.rampEnabled && (
          <Field 
            label="Timp rampă (min)" 
            value={patient.cpapData?.rampTime} 
            editMode={editMode} 
            onChange={(v) => onChange('cpapData', 'rampTime', v)} 
            type="number" 
          />
        )}
      </Section>

      <Section title="9.2 Probleme tehnice raportate">
        <div className="space-y-2">
          <CheckboxField 
            label="Iritații faciale" 
            checked={patient.cpapData?.technicalProblems?.facialIrritation} 
            editMode={editMode} 
            onChange={(v) => {
              const newProblems = { ...(patient.cpapData?.technicalProblems || {}), facialIrritation: v };
              onChange('cpapData', 'technicalProblems', newProblems);
            }} 
          />
          <CheckboxField 
            label="Senzație de claustrofobie" 
            checked={patient.cpapData?.technicalProblems?.claustrophobia} 
            editMode={editMode} 
            onChange={(v) => {
              const newProblems = { ...(patient.cpapData?.technicalProblems || {}), claustrophobia: v };
              onChange('cpapData', 'technicalProblems', newProblems);
            }} 
          />
          <CheckboxField 
            label="Zgomotul aparatului" 
            checked={patient.cpapData?.technicalProblems?.deviceNoise} 
            editMode={editMode} 
            onChange={(v) => {
              const newProblems = { ...(patient.cpapData?.technicalProblems || {}), deviceNoise: v };
              onChange('cpapData', 'technicalProblems', newProblems);
            }} 
          />
          <CheckboxField 
            label="Secreții nazale" 
            checked={patient.cpapData?.technicalProblems?.nasalSecretions} 
            editMode={editMode} 
            onChange={(v) => {
              const newProblems = { ...(patient.cpapData?.technicalProblems || {}), nasalSecretions: v };
              onChange('cpapData', 'technicalProblems', newProblems);
            }} 
          />
          <CheckboxField 
            label="Aerofagie" 
            checked={patient.cpapData?.technicalProblems?.aerophagia} 
            editMode={editMode} 
            onChange={(v) => {
              const newProblems = { ...(patient.cpapData?.technicalProblems || {}), aerophagia: v };
              onChange('cpapData', 'technicalProblems', newProblems);
            }} 
          />
          <Field 
            label="Alte probleme tehnice" 
            value={patient.cpapData?.technicalProblems?.otherIssues} 
            editMode={editMode} 
            onChange={(v) => {
              const newProblems = { ...(patient.cpapData?.technicalProblems || {}), otherIssues: v };
              onChange('cpapData', 'technicalProblems', newProblems);
            }}
            placeholder="Descrieți alte probleme..."
          />
        </div>
      </Section>

      <Section title="Motive pentru neaderență">
        <div className="space-y-2">
          <CheckboxField 
            label="Uscăciune (gură/nas)" 
            checked={patient.cpapData?.nonAdherenceReasons?.dryness} 
            editMode={editMode} 
            onChange={(v) => {
              const newReasons = { ...(patient.cpapData?.nonAdherenceReasons || {}), dryness: v };
              onChange('cpapData', 'nonAdherenceReasons', newReasons);
            }} 
          />
          <CheckboxField 
            label="Presiune prea mare" 
            checked={patient.cpapData?.nonAdherenceReasons?.pressureTooHigh} 
            editMode={editMode} 
            onChange={(v) => {
              const newReasons = { ...(patient.cpapData?.nonAdherenceReasons || {}), pressureTooHigh: v };
              onChange('cpapData', 'nonAdherenceReasons', newReasons);
            }} 
          />
          <CheckboxField 
            label="Anxietate/Disconfort psihologic" 
            checked={patient.cpapData?.nonAdherenceReasons?.anxiety} 
            editMode={editMode} 
            onChange={(v) => {
              const newReasons = { ...(patient.cpapData?.nonAdherenceReasons || {}), anxiety: v };
              onChange('cpapData', 'nonAdherenceReasons', newReasons);
            }} 
          />
          <Field 
            label="Alte motive" 
            value={patient.cpapData?.nonAdherenceReasons?.other} 
            editMode={editMode} 
            onChange={(v) => {
              const newReasons = { ...(patient.cpapData?.nonAdherenceReasons || {}), other: v };
              onChange('cpapData', 'nonAdherenceReasons', newReasons);
            }}
            placeholder="Descrieți alte motive..."
          />
        </div>
      </Section>
      
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={() => window.location.href = `/patients/${patientId}/visits/new`}
          className="px-6 py-3 bg-[#14b8a6] text-white font-medium rounded-lg hover:bg-[#0d9488] transition-colors flex items-center gap-2 mx-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adaugă vizită
        </button>
      </div>
    </div>
  );
};

// Notes Tab Component
const NotesTab = ({ patient, editMode, onChange, patientId }) => {
  // Parsează notițele existente (JSON array sau text vechi)
  const parseNotes = (notesData) => {
    if (!notesData) return [];
    try {
      const parsed = JSON.parse(notesData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Dacă e text vechi, convertește la primul note
      return notesData.trim() ? [{
        id: Date.now(),
        text: notesData,
        author: 'Doctor',
        timestamp: new Date().toISOString(),
        category: 'general'
      }] : [];
    }
  };

  const [notes, setNotes] = React.useState(() => parseNotes(patient.notes));
  const [newNoteText, setNewNoteText] = React.useState('');
  const [newNoteCategory, setNewNoteCategory] = React.useState('general');
  const [showAddForm, setShowAddForm] = React.useState(false);

  React.useEffect(() => {
    setNotes(parseNotes(patient.notes));
  }, [patient.notes]);

  const categories = {
    general: { label: 'Generală', color: 'blue', icon: '📋' },
    treatment: { label: 'Tratament', color: 'teal', icon: '💊' },
    symptoms: { label: 'Simptome', color: 'yellow', icon: '🩺' },
    followup: { label: 'Urmărire', color: 'green', icon: '📅' },
    adverse: { label: 'Reacții adverse', color: 'red', icon: '⚠️' },
    education: { label: 'Educație pacient', color: 'purple', icon: '📚' }
  };

  const addNote = () => {
    if (!newNoteText.trim()) return;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const newNote = {
      id: Date.now(),
      text: newNoteText.trim(),
      author: user.name || 'Doctor',
      timestamp: new Date().toISOString(),
      category: newNoteCategory
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    onChange('notes', JSON.stringify(updatedNotes));
    setNewNoteText('');
    setShowAddForm(false);
  };

  const deleteNote = (noteId) => {
    if (window.confirm('Sigur doriți să ștergeți această notiță?')) {
      const updatedNotes = notes.filter(n => n.id !== noteId);
      setNotes(updatedNotes);
      onChange('notes', JSON.stringify(updatedNotes));
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-teal-900 mb-1">📋 Notițe Clinice</h3>
              <p className="text-sm text-teal-700 leading-relaxed">
                Adăugați observații medicale, evoluție tratament, reacții adverse. Fiecare notiță este datată automat.
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-teal-600">{notes.length}</div>
            <div className="text-xs text-teal-700">notițe</div>
          </div>
        </div>
      </div>

      {/* Formular adăugare notiță */}
      {editMode && (
        <div className="bg-white border-2 border-teal-300 rounded-lg p-4 shadow-sm">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-medium rounded-lg hover:from-teal-700 hover:to-teal-600 transition-all flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Adaugă notiță nouă</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">📝 Notiță nouă</label>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categorie</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(categories).map(([key, cat]) => (
                    <button
                      key={key}
                      onClick={() => setNewNoteCategory(key)}
                      className={`p-2 text-xs font-medium rounded-lg border-2 transition-all ${
                        newNoteCategory === key
                          ? `border-${cat.color}-500 bg-${cat.color}-50 text-${cat.color}-700`
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div>{cat.icon}</div>
                      <div className="mt-1">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Conținut notiță</label>
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Descrieți observația clinică, evoluția tratamentului, simptomele raportate..."
                  className="w-full p-3 border-2 border-teal-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none text-sm"
                  rows="4"
                />
                <div className="text-xs text-gray-500 mt-1">{newNoteText.length} caractere</div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={addNote}
                  disabled={!newNoteText.trim()}
                  className="flex-1 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Salvează notiță
                </button>
                <button
                  onClick={() => {
                    setNewNoteText('');
                    setShowAddForm(false);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Anulează
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de notițe */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-sm">Nu există notițe pentru acest pacient</p>
            {editMode && (
              <p className="text-gray-400 text-xs mt-1">Apăsați butonul "Adaugă notiță nouă" pentru a începe</p>
            )}
          </div>
        ) : (
          notes.map((note) => {
            const cat = categories[note.category] || categories.general;
            return (
              <div
                key={note.id}
                className={`bg-white border-l-4 border-${cat.color}-500 shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 bg-${cat.color}-100 text-${cat.color}-700 text-xs font-medium rounded`}>
                      {cat.icon} {cat.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(note.timestamp)}
                    </span>
                  </div>
                  {editMode && (
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Șterge notiță"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-2">
                  {note.text}
                </p>

                <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Dr. {note.author}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Statistici */}
      {notes.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Statistici notițe</h4>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(categories).map(([key, cat]) => {
              const count = notes.filter(n => n.category === key).length;
              if (count === 0) return null;
              return (
                <div key={key} className={`bg-${cat.color}-50 rounded p-2 border border-${cat.color}-200`}>
                  <div className="text-xs text-gray-600">{cat.icon} {cat.label}</div>
                  <div className={`text-lg font-bold text-${cat.color}-700`}>{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <button
          onClick={() => window.location.href = `/patients/${patientId}/visits/new`}
          className="px-6 py-3 bg-[#14b8a6] text-white font-medium rounded-lg hover:bg-[#0d9488] transition-colors inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adaugă vizită
        </button>
      </div>
    </div>
  );
};

// History Tab Component
const HistoryTab = ({ logs, patientId, onRefresh }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const deleteAllHistory = async () => {
    if (!window.confirm('⚠️ ATENȚIE: Sigur doriți să ștergeți COMPLET istoricul modificărilor pentru acest pacient?\n\nAceastă acțiune este IREVERSIBILĂ și va șterge toate înregistrările de audit.')) {
      return;
    }

    if (!window.confirm('Confirmați din nou ștergerea istoricului? Această acțiune nu poate fi anulată.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/patients/${patientId}/audit-logs`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('✅ Istoricul a fost șters complet');
        onRefresh(); // Reîncarcă audit logs
      } else {
        const data = await response.json();
        alert(`❌ Eroare: ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting audit logs:', error);
      alert('❌ Eroare la ștergerea istoricului');
    } finally {
      setIsDeleting(false);
    }
  };

  // Mapare câmpuri tehnice la terminologie medicală pentru doctori
  const fieldTranslations = {
    // Date identificare
    firstName: 'Prenume',
    lastName: 'Nume',
    cnp: 'CNP',
    dateOfBirth: 'Data nașterii',
    gender: 'Sex',
    decedat: 'Decedat',
    email: 'Email',
    phone: 'Telefon',
    
    // Biometrie
    heightCm: 'Înălțime (cm)',
    weightKg: 'Greutate (kg)',
    bmi: 'IMC',
    neckCircumferenceCm: 'Circumferință gât (cm)',
    
    // Demografie
    county: 'Județ',
    locality: 'Localitate',
    address: 'Adresă',
    maritalStatus: 'Stare civilă',
    occupation: 'Ocupație',
    educationLevel: 'Nivel educație',
    environmentType: 'Mediu',
    householdSize: 'Persoane în gospodărie',
    childrenCount: 'Număr copii',
    
    // Screening OSA
    stopBangScore: 'STOP-BANG Score',
    epworthScore: 'Epworth Score',
    sleepPosition: 'Poziție somn',
    sasoForm: 'Formă SASO',
    
    // Status
    status: 'Status pacient',
    notes: 'Observații',
    assignedDoctorId: 'Medic asignat',
    
    // Câmpuri JSONB complexe
    comorbidities: 'Comorbidități',
    behavioral: 'Comportament & ORL',
    psychosocial: 'Date Psihosociale',
    biomarkers: 'Biomarkeri',
    medications: 'Medicație',
    familyHistory: 'Istoric Familial',
    cpapData: 'Date CPAP',
    medicalHistory: 'Istoric Medical',
    sleepApneaDetails: 'Detalii Apnee Somn',
    address: 'Adresă'
  };

  const translateFieldName = (field) => {
    return fieldTranslations[field] || field;
  };

  // Dicționar coduri ICD-10 pentru traducere în text lizibil
  const icd10Labels = {
    // Cardiovasculare
    'I10': 'Hipertensiune arterială (HTA)',
    'I10.1': 'HTA rezistentă',
    'I48': 'Aritmii (fibrilație atrială)',
    'I50.9': 'Insuficiență cardiacă',
    'I25.1': 'Boală coronariană',
    // Metabolice
    'E11.9': 'Diabet zaharat tip 2',
    'E78.5': 'Dislipidemie',
    'E66.9': 'Obezitate',
    'E66.01': 'Istoric chirurgie bariatrică',
    // Respiratorii
    'J45.9': 'Astm bronsic',
    'J44.9': 'BPOC',
    'J84.9': 'Patologii pulmonare restrictive',
    // Neurologice & Psihiatrice
    'I63.9': 'Accident vascular cerebral',
    'F41.9': 'Tulburări anxioase',
    'F32.9': 'Tulburări depresive',
    'F03': 'Tulburări cognitive',
    // Altele
    'K21.9': 'Reflux gastro-esofagian',
    'E03.9': 'Hipotiroidism',
    'I26.9': 'Tromboembolism',
    'N18.9': 'Insuficiență renală cronică'
  };

  const formatValue = (value, fieldName) => {
    if (value === null || value === undefined || value === 'N/A') return 'Necompletat';
    if (value === 'true' || value === true) return 'Da';
    if (value === 'false' || value === false) return 'Nu';
    
    // Format dates
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        return new Date(value).toLocaleDateString('ro-RO');
      } catch {
        return value;
      }
    }
    
    // Handle JSON objects - parse and show formatted
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try {
        const parsed = JSON.parse(value);
        
        if (typeof parsed === 'object') {
          // Format specific JSONB fields based on field name
          if (fieldName === 'comorbidities') {
            const categoryNames = {
              cardiovascular: 'Cardiovasculare',
              metabolic: 'Metabolice',
              respiratory: 'Respiratorii',
              neurologic: 'Neurologice',
              other: 'Altele'
            };
            
            const formatted = Object.entries(parsed)
              .filter(([k, v]) => Array.isArray(v) && v.length > 0)
              .map(([category, codes]) => {
                const catName = categoryNames[category] || category;
                const labels = codes.map(code => icd10Labels[code] || code).join(', ');
                return `${catName}: ${labels}`;
              })
              .join('; ');
            return formatted || 'Necompletat';
          }
          
          if (fieldName === 'behavioral') {
            const translations = {
              avgSleepDuration: 'Durata medie somn',
              bedtimeTypical: 'Ora culcare',
              waketimeTypical: 'Ora trezire',
              sleepVariability: 'Variabilitate somn',
              fragmentedSleep: 'Somn fragmentat',
              hasNaps: 'Are somnuri',
              napFrequency: 'Frecvență somnuri',
              napDurationMin: 'Durata somnuri (min)',
              smokingStatus: 'Status fumat',
              cigarettesPerDay: 'Țigări/zi',
              alcoholFrequency: 'Frecvență alcool',
              alcoholQuantity: 'Cantitate alcool',
              caffeineIntake: 'Cafele/zi',
              physicalActivityLevel: 'Nivel activitate fizică',
              physicalActivityHours: 'Ore activitate fizică',
              sleepPositionPrimary: 'Poziție somn principală',
              positionalOSA: 'OSA pozițională',
              mallampati: 'Mallampati',
              septumDeviation: 'Deviație sept',
              macroglossia: 'Macroglosie',
              tonsillarHypertrophy: 'Hipertrofie amigdale',
              retrognathia: 'Retrognaţie',
              nasalObstruction: 'Obstrucție nazală',
              chronicRhinitis: 'Rinită cronică',
              priorENTSurgery: 'Chirurgie ORL anterioară',
              isProfessionalDriver: 'Șofer profesionist',
              drowsyDriving: 'Somnolență la volan',
              drowsinessFrequency: 'Frecvență somnolență',
              roadAccidents: 'Accidente rutiere',
              shiftWorkHours: 'Ore muncă în schimburi'
            };
            
            const formatted = Object.entries(parsed)
              .filter(([k, v]) => v !== null && v !== undefined && v !== '' && v !== false)
              .map(([k, v]) => {
                const label = translations[k] || k;
                const val = v === true ? 'Da' : (v === false ? 'Nu' : v);
                return `${label}: ${val}`;
              })
              .join('; ');
            return formatted || 'Necompletat';
          }
          
          if (fieldName === 'biomarkers') {
            const translations = {
              crp: 'CRP (mg/L)',
              hba1c: 'HbA1c (%)',
              ldl: 'LDL (mg/dL)',
              hdl: 'HDL (mg/dL)',
              triglycerides: 'Trigliceride (mg/dL)',
              tsh: 'TSH (mIU/L)',
              vitaminD: 'Vitamina D (ng/mL)',
              creatinine: 'Creatinină (mg/dL)'
            };
            
            const formatted = Object.entries(parsed)
              .filter(([k, v]) => v !== null && v !== undefined && v !== '')
              .map(([k, v]) => `${translations[k] || k}: ${v}`)
              .join('; ');
            return formatted || 'Necompletat';
          }
          
          if (fieldName === 'medications') {
            const translations = {
              benzodiazepines: 'Benzodiazepine',
              opioids: 'Opioide',
              sedativeAntidepressants: 'Antidepresive sedative',
              antihypertensives: 'Antihipertensive',
              corticosteroids: 'Corticosteroizi',
              antihistamines: 'Antihistaminice',
              hypnotics: 'Hipnotice'
            };
            
            const formatted = Object.entries(parsed)
              .filter(([k, v]) => v !== null && v !== undefined && v !== '')
              .map(([k, v]) => `${translations[k] || k}: ${v}`)
              .join('; ');
            return formatted || 'Necompletat';
          }
          
          if (fieldName === 'psychosocial') {
            const translations = {
              phq2: 'PHQ-2 (depresie)',
              gad2: 'GAD-2 (anxietate)',
              rosenberg: 'Rosenberg (auto-stimă)',
              whoqolPhysical: 'WHOQOL fizic',
              whoqolPsychological: 'WHOQOL psihologic',
              whoqolSocial: 'WHOQOL social',
              whoqolEnvironment: 'WHOQOL mediu',
              socialSupport: 'Suport social',
              treatmentSatisfaction: 'Satisfacție tratament',
              treatmentMotivation: 'Motivație tratament',
              chronicStress: 'Stres cronic'
            };
            
            const formatted = Object.entries(parsed)
              .filter(([k, v]) => v !== null && v !== undefined && v !== '' && v !== false)
              .map(([k, v]) => {
                const label = translations[k] || k;
                const val = v === true ? 'Da' : (v === false ? 'Nu' : v);
                return `${label}: ${val}`;
              })
              .join('; ');
            return formatted || 'Necompletat';
          }
          
          if (fieldName === 'familyHistory') {
            const translations = {
              osaRelatives: 'Rude cu OSA',
              cardiomyopathy: 'Cardiomiopatie',
              diabetes: 'Diabet',
              snoring: 'Sforăit'
            };
            
            const formatted = Object.entries(parsed)
              .filter(([k, v]) => v === true)
              .map(([k, v]) => translations[k] || k)
              .join(', ');
            return formatted || 'Niciun istoric familial';
          }
          
          if (fieldName === 'cpapData') {
            const translations = {
              brand: 'Marcă',
              model: 'Model',
              therapyType: 'Tip terapie',
              pressureMin: 'Presiune min (cmH2O)',
              pressureMax: 'Presiune max (cmH2O)',
              startDate: 'Data început',
              maskType: 'Tip mască',
              humidificationEnabled: 'Umidificare activă',
              humidificationLevel: 'Nivel umidificare',
              rampEnabled: 'Rampă activă',
              rampTime: 'Timp rampă (min)'
            };
            
            const formatted = Object.entries(parsed)
              .filter(([k, v]) => {
                if (k === 'technicalProblems' || k === 'nonAdherenceReasons') return false;
                return v !== null && v !== undefined && v !== '' && v !== false;
              })
              .map(([k, v]) => {
                const label = translations[k] || k;
                const val = v === true ? 'Da' : (v === false ? 'Nu' : v);
                return `${label}: ${val}`;
              })
              .join('; ');
            return formatted || 'Necompletat';
          }
          
          // Generic JSONB formatting for other fields
          const formatted = Object.entries(parsed)
            .filter(([k, v]) => v !== null && v !== undefined && v !== '' && v !== false && (Array.isArray(v) ? v.length > 0 : true))
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('; ');
          return formatted || 'Necompletat';
        }
      } catch {
        // If not valid JSON, return as-is
      }
    }
    
    return value;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200/80 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-[#065f46] mb-2">Istoric Modificări Pacient</h3>
            <p className="text-sm text-[#0d9488]">
              Toate modificările aduse dosarului medical sunt înregistrate pentru audit și conformitate GDPR
            </p>
          </div>
          {logs.length > 0 && (
            <button
              onClick={deleteAllHistory}
              disabled={isDeleting}
              className="ml-4 inline-flex items-center px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-red-200"
              title="Șterge complet istoricul"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {isDeleting ? 'Se șterge...' : 'Șterge istoric'}
            </button>
          )}
        </div>
        
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-[#0d9488] text-lg mb-2">Nu există modificări înregistrate</p>
            <p className="text-[#0d9488] text-sm">
              Modificările viitoare ale datelor pacientului vor apărea aici
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map(log => (
              <div key={log.id} className="border-l-4 border-[#14b8a6] bg-[#f0fdfa] p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold text-[#065f46]">
                      Dr. {log.user?.name || log.userName || 'Utilizator necunoscut'}
                    </span>
                    <span className="text-[#0d9488] ml-2 text-sm">
                      {new Date(log.timestamp).toLocaleString('ro-RO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    log.action === 'create' ? 'bg-green-100 text-green-800' :
                    log.action === 'update' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {log.action === 'create' ? '✅ Pacient înregistrat' : 
                     log.action === 'update' ? '✏️ Date actualizate' : 
                     '🗑️ Șters'}
                  </span>
                </div>
                
                {log.changes && log.changes.length > 0 && (
                  <div className="mt-3 space-y-2 bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs font-semibold text-[#0d9488] uppercase mb-2">
                      Câmpuri modificate ({log.changes.length}):
                    </p>
                    {log.changes.map((change, idx) => (
                      <div key={idx} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                        <div className="font-medium text-[#065f46] mb-1">
                          📋 {translateFieldName(change.field)}
                        </div>
                        <div className="flex items-start gap-2 pl-5">
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Valoare anterioară:</span>
                            <div className="text-red-600 bg-red-50 px-2 py-1 rounded mt-1 line-through">
                              {formatValue(change.oldValue, change.field)}
                            </div>
                          </div>
                          <span className="text-[#0d9488] mt-5">→</span>
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Valoare nouă:</span>
                            <div className="text-green-600 bg-green-50 px-2 py-1 rounded mt-1 font-medium">
                              {formatValue(change.newValue, change.field)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {log.details && (
                  <div className="mt-2 text-sm text-[#0d9488] bg-white p-2 rounded border border-gray-200">
                    <span className="font-medium">Detalii: </span>
                    {log.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Consent Tab Component
const ConsentTab = ({ patient, editMode, onChange }) => {
  const items = [
    {
      key: 'consentMedicalData',
      title: 'Consimțământ prelucrare date medicale',
      description: 'Acord pentru prelucrarea datelor medicale în scop de diagnostic și tratament al apneei în somn.',
      required: true
    },
    {
      key: 'consentDataStorage',
      title: 'Consimțământ stocare date',
      description: 'Acord pentru stocarea datelor în baza de date pentru monitorizare pe termen lung.',
      required: true
    },
    {
      key: 'consentClinicalStudies',
      title: 'Consimțământ studii clinice (opțional)',
      description: 'Acord pentru folosirea datelor anonimizate în studii clinice.',
      required: false
    }
  ];

  return (
    <div className="space-y-6">
      <Section title="Consimțământ GDPR">
        <div className="bg-gradient-to-r from-[#ecfeff] to-[#f0fdfa] border border-[#c7f9e3] rounded-xl p-4 mb-4 shadow-sm">
          <p className="text-sm text-[#065f46] font-medium">Respectăm principiile GDPR.</p>
          <p className="text-sm text-[#0d9488] mt-1">Gestionează acordurile pacientului mai jos. Câmpurile marcate cu * sunt obligatorii.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => {
            const value = patient?.[item.key] ?? false;
            return (
              <div
                key={item.key}
                className={`rounded-xl border p-4 shadow-sm transition ${value ? 'bg-[#ecfdf3] border-[#bbf7d0]' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  {editMode ? (
                    <input
                      type="checkbox"
                      checked={!!value}
                      onChange={(e) => onChange(item.key, e.target.checked)}
                      className="mt-1 w-5 h-5 text-[#14b8a6] rounded focus:ring-2 focus:ring-[#14b8a6]"
                    />
                  ) : (
                    <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${value ? 'bg-[#14b8a6] border-[#14b8a6]' : 'bg-white border-gray-300'}`}>
                      {value && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#065f46]">{item.title}</p>
                      {item.required && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">* obligatoriu</span>}
                    </div>
                    <p className="text-sm text-[#0d9488] mt-1">{item.description}</p>
                    {!editMode && (
                      <p className={`mt-2 inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {value ? 'Acordat' : 'Neacordat'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
};

// Helper Components
const Section = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
    <h4 className="text-lg font-bold mb-6 text-[#065f46] pb-3 border-b border-[#e0f2f1]">{title}</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {children}
    </div>
  </div>
);

const formatDisplayValue = (value, type) => {
  if ((value ?? '') === '') return '-';
  if (type === 'date') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ro-RO');
  }
  return value;
};

const Field = ({ label, value, editMode, onChange, type = 'text', ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-[#065f46] mb-2">{label}</label>
    {editMode ? (
      type === 'date' ? (
        <RomanianDateInput 
          value={value || ''}
          onChange={onChange}
          className="w-full"
          {...props}
        />
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46] focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent"
          {...props}
        />
      )
    ) : (
      <p className="text-[#0d9488] bg-[#f0fdfa] px-3 py-2 rounded-lg">{formatDisplayValue(value, type)}</p>
    )}
  </div>
);

const SelectField = ({ label, value, editMode, onChange, options }) => (
  <div>
    <label className="block text-sm font-semibold text-[#065f46] mb-2">{label}</label>
    {editMode ? (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46] focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent"
      >
        <option value="" disabled>Selectează...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    ) : (
      <p className="text-[#0d9488] bg-[#f0fdfa] px-3 py-2 rounded-lg">{(value ?? '') !== '' ? value : '-'}</p>
    )}
  </div>
);

const CheckboxField = ({ label, checked, editMode, onChange }) => (
  <div className="flex items-center p-2 bg-[#f0fdfa] rounded-lg">
    <input
      type="checkbox"
      checked={checked || false}
      onChange={(e) => editMode && onChange(e.target.checked)}
      disabled={!editMode}
      className="w-4 h-4 text-[#14b8a6] mr-3 rounded"
    />
    <label className="text-sm font-semibold text-[#065f46]">{label}</label>
  </div>
);

export default PatientDetails;
