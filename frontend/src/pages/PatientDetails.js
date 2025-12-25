import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import RomanianDateInput from '../components/RomanianDateInput';

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
    'Vizite',
    'CPAP',
    'Note',
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

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/patients/${id}`, editedPatient, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPatient(editedPatient);
      setEditMode(false);
      alert('Date salvate cu succes!');
      fetchPatientData();
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
              <p>CNP: {patient.cnp || 'N/A'}</p>
              <p>Data nașterii: {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('ro-RO') : 'N/A'}</p>
              <p>Vârstă: {patient.dateOfBirth ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / 31557600000) : 'N/A'} ani</p>
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
                onClick={() => setEditMode(true)}
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
        {activeTab === 'Personal' && <PersonalTab patient={editMode ? editedPatient : patient} editMode={editMode} onChange={handleFieldChange} />}
        {activeTab === 'Comorbidități' && <ComorbiditiesTab patient={editMode ? editedPatient : patient} editMode={editMode} onChange={handleArrayFieldToggle} />}
        {activeTab === 'Comportament & ORL' && <BehavioralTab patient={editMode ? editedPatient : patient} editMode={editMode} onChange={handleNestedFieldChange} />}
        {activeTab === 'Psihosocial & Bio' && <PsychosocialTab patient={editMode ? editedPatient : patient} editMode={editMode} onChange={handleNestedFieldChange} />}
        {activeTab === 'Medicație' && <MedicationTab patient={editMode ? editedPatient : patient} editMode={editMode} onChange={handleNestedFieldChange} />}
        {activeTab === 'Vizite' && <VisitsTab visits={visits} patientId={id} onRefresh={fetchPatientData} />}
        {activeTab === 'CPAP' && <CPAPTab patient={editMode ? editedPatient : patient} editMode={editMode} onChange={handleNestedFieldChange} />}
        {activeTab === 'Note' && <NotesTab patient={editMode ? editedPatient : patient} editMode={editMode} onChange={handleFieldChange} />}
        {activeTab === 'Istoric' && <HistoryTab logs={auditLogs} patientId={id} onRefresh={fetchAuditLogs} />}
        {activeTab === 'Consimțământ' && <ConsentTab patient={patient} />}
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
        <Field label="BMI" value={patient.bmi ? Number(patient.bmi).toFixed(2) : 'N/A'} editMode={false} />
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
        <SelectField 
          label="Stare civilă" 
          value={patient.maritalStatus} 
          editMode={editMode} 
          onChange={(v) => onChange('maritalStatus', v)}
          options={['Necăsătorit/ă', 'Căsătorit/ă', 'Divorțat/ă', 'Văduv/ă']}
        />
        <Field label="Ocupație" value={patient.occupation} editMode={editMode} onChange={(v) => onChange('occupation', v)} />
        <SelectField 
          label="Nivel educație" 
          value={patient.educationLevel} 
          editMode={editMode} 
          onChange={(v) => onChange('educationLevel', v)}
          options={['Primar', 'Gimnazial', 'Liceal', 'Universitar', 'Postuniversitar']}
        />
        <Field label="Număr persoane în gospodărie" value={patient.householdSize} editMode={editMode} onChange={(v) => onChange('householdSize', v)} type="number" />
        <Field label="Număr copii în gospodărie" value={patient.childrenCount} editMode={editMode} onChange={(v) => onChange('childrenCount', v)} type="number" />
      </Section>

      <Section title="Screening OSA">
        <Field label="STOP-BANG Score (0-8)" value={patient.stopBangScore} editMode={editMode} onChange={(v) => onChange('stopBangScore', v)} type="number" min="0" max="8" />
        <Field label="Epworth Score (0-24)" value={patient.epworthScore} editMode={editMode} onChange={(v) => onChange('epworthScore', v)} type="number" min="0" max="24" />
        <SelectField 
          label="Formă SASO" 
          value={patient.sasoForm} 
          editMode={editMode} 
          onChange={(v) => onChange('sasoForm', v)}
          options={['Ușoară', 'Moderată', 'Severă']}
        />
        <Field 
          label="Clasificare OSA (din ultima vizită)" 
          value={patient.osaClassification || 'N/A'} 
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
const ComorbiditiesTab = ({ patient, editMode, onChange }) => {
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
    </div>
  );
};

// Behavioral Tab Component
const BehavioralTab = ({ patient, editMode, onChange }) => {
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
        <CheckboxField 
          label="Șofer profesionist" 
          checked={patient.behavioral?.isProfessionalDriver} 
          editMode={editMode} 
          onChange={(v) => onChange('behavioral', 'isProfessionalDriver', v)} 
        />
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
      </Section>
    </div>
  );
};

// Psychosocial Tab Component
const PsychosocialTab = ({ patient, editMode, onChange }) => {
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
                  <p className="text-[#0d9488]">Medic: {visit.clinician || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#0d9488]">IAH: <span className="font-semibold">{visit.ahi || 'N/A'}</span></p>
                  <p className="text-sm text-[#0d9488]">Complianță: <span className="font-semibold">{visit.cpapCompliancePct || 'N/A'}%</span></p>
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
const MedicationTab = ({ patient, editMode, onChange }) => {
  return (
    <div className="space-y-6">
      <Section title="Medicație care influențează AHI sau somnolența">
        <p className="text-sm text-[#0d9488] mb-4">Selectați medicamentele pe care pacientul le ia în prezent:</p>
        
        <CheckboxField 
          label="Benzodiazepine" 
          checked={patient.medications?.benzodiazepines} 
          editMode={editMode} 
          onChange={(v) => onChange('medications', 'benzodiazepines', v)} 
        />
        <CheckboxField 
          label="Opioide" 
          checked={patient.medications?.opioids} 
          editMode={editMode} 
          onChange={(v) => onChange('medications', 'opioids', v)} 
        />
        <CheckboxField 
          label="Antidepresive sedative" 
          checked={patient.medications?.sedativeAntidepressants} 
          editMode={editMode} 
          onChange={(v) => onChange('medications', 'sedativeAntidepressants', v)} 
        />
        <CheckboxField 
          label="Antihipertensive (beta-blocante)" 
          checked={patient.medications?.antihypertensives} 
          editMode={editMode} 
          onChange={(v) => onChange('medications', 'antihypertensives', v)} 
        />
        <CheckboxField 
          label="Corticosteroizi" 
          checked={patient.medications?.corticosteroids} 
          editMode={editMode} 
          onChange={(v) => onChange('medications', 'corticosteroids', v)} 
        />
        <CheckboxField 
          label="Antihistaminice sedative" 
          checked={patient.medications?.antihistamines} 
          editMode={editMode} 
          onChange={(v) => onChange('medications', 'antihistamines', v)} 
        />
        <CheckboxField 
          label="Hipnotice non-benzodiazepinice (zolpidem)" 
          checked={patient.medications?.hypnotics} 
          editMode={editMode} 
          onChange={(v) => onChange('medications', 'hypnotics', v)} 
        />
      </Section>
    </div>
  );
};

// CPAP Tab Component
const CPAPTab = ({ patient, editMode, onChange }) => {
  return (
    <div className="space-y-6">
      <Section title="Metrici din ultima vizită">
        <Field 
          label="Complianță (%)" 
          value={patient.cpapData?.compliance !== undefined ? `${patient.cpapData.compliance}%` : 'N/A'} 
          editMode={false}
        />
        <Field 
          label="Complianță >4h (%)" 
          value={patient.cpapData?.compliance4h !== undefined ? `${patient.cpapData.compliance4h}%` : 'N/A'} 
          editMode={false}
        />
        <Field 
          label="Utilizare medie (min)" 
          value={patient.cpapData?.averageUsage !== undefined ? `${patient.cpapData.averageUsage} min` : 'N/A'} 
          editMode={false}
        />
        <Field 
          label="Leaks 95th percentile" 
          value={patient.cpapData?.leaks95p !== undefined ? patient.cpapData.leaks95p : 'N/A'} 
          editMode={false}
        />
        <Field 
          label="Pressure 95th percentile" 
          value={patient.cpapData?.pressure95p !== undefined ? patient.cpapData.pressure95p : 'N/A'} 
          editMode={false}
        />
      </Section>

      <Section title="Dispozitiv CPAP">
        <Field label="Brand" value={patient.cpapData?.brand} editMode={editMode} onChange={(v) => onChange('cpapData', 'brand', v)} />
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
    </div>
  );
};

// Notes Tab Component
const NotesTab = ({ patient, editMode, onChange }) => {
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
    assignedDoctorId: 'Medic asignat'
  };

  const translateFieldName = (field) => {
    return fieldTranslations[field] || field;
  };

  const formatValue = (value) => {
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
                              {formatValue(change.oldValue)}
                            </div>
                          </div>
                          <span className="text-[#0d9488] mt-5">→</span>
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Valoare nouă:</span>
                            <div className="text-green-600 bg-green-50 px-2 py-1 rounded mt-1 font-medium">
                              {formatValue(change.newValue)}
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
const ConsentTab = ({ patient }) => {
  return (
    <div className="space-y-6">
      <Section title="Consimțământ GDPR">
        <div className="bg-[#f0fdfa] border border-gray-200 rounded p-4 mb-4">
          <p className="text-sm text-[#065f46]">
            Conform GDPR, pacientul trebuie să își dea consimțământul pentru prelucrarea datelor medicale.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <input type="checkbox" checked={true} disabled className="mt-1" />
            <div>
              <p className="font-medium">Consimțământ prelucrare date medicale</p>
              <p className="text-sm text-[#0d9488]">
                Pacientul și-a dat acordul pentru prelucrarea datelor medicale în scopul diagnosticării și tratării apneei în somn.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <input type="checkbox" checked={true} disabled className="mt-1" />
            <div>
              <p className="font-medium">Consimțământ stocare date</p>
              <p className="text-sm text-[#0d9488]">
                Pacientul este de acord cu stocarea datelor în baza de date pentru monitorizare pe termen lung.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <input type="checkbox" checked={false} disabled className="mt-1" />
            <div>
              <p className="font-medium">Consimțământ studii clinice (opțional)</p>
              <p className="text-sm text-[#0d9488]">
                Pacientul acceptă ca datele sale anonimizate să fie folosite în studii clinice.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

// Helper Components
const Section = ({ title, children }) => (
  <div className="border-b pb-4">
    <h4 className="text-lg font-semibold mb-3 text-[#065f46]">{title}</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

const Field = ({ label, value, editMode, onChange, type = 'text', ...props }) => (
  <div>
    <label className="block text-sm font-medium text-[#065f46] mb-1">{label}</label>
    {editMode ? (
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
        {...props}
      />
    ) : (
      <p className="text-[#065f46]">{value || 'N/A'}</p>
    )}
  </div>
);

const SelectField = ({ label, value, editMode, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-[#065f46] mb-1">{label}</label>
    {editMode ? (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#14b8a6]"
      >
        <option value="">Selectează...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    ) : (
      <p className="text-[#065f46]">{value || 'N/A'}</p>
    )}
  </div>
);

const CheckboxField = ({ label, checked, editMode, onChange }) => (
  <div className="flex items-center">
    <input
      type="checkbox"
      checked={checked || false}
      onChange={(e) => editMode && onChange(e.target.checked)}
      disabled={!editMode}
      className="w-4 h-4 text-[#14b8a6] mr-2"
    />
    <label className="text-sm font-medium text-[#065f46]">{label}</label>
  </div>
);

export default PatientDetails;
