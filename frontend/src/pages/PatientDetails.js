import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import RomanianDateInput from '../components/RomanianDateInput';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
  }, [id]);

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
        {activeTab === 'Istoric' && <HistoryTab logs={auditLogs} />}
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
        { code: 'J84.9', label: 'Restrictive lung disease' }
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
                  {option.code} - {option.label}
                </span>
              </label>
            ))}
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
          label="Somnoroase diurne (sieste)" 
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
          options={['Nefumător', 'Fumător activ', 'Fumător pasiv', 'Fost fumător']}
        />
        {(patient.behavioral?.smokingStatus === 'Fumător activ' || patient.behavioral?.smokingStatus === 'Fost fumător') && (
          <Field 
            label="Țigări/zi" 
            value={patient.behavioral?.cigarettesPerDay} 
            editMode={editMode} 
            onChange={(v) => onChange('behavioral', 'cigarettesPerDay', v)} 
            type="number"
          />
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
      <Section title="Screening Psihologic (Anxietate & Depresie)">
        <Field 
          label="PHQ-2 (0-6) - Screening depresie" 
          value={patient.psychosocial?.phq2} 
          editMode={editMode} 
          onChange={(v) => onChange('psychosocial', 'phq2', v)} 
          type="number" 
          min="0" 
          max="6" 
        />
        <p className="text-xs text-[#0d9488] -mt-2">≥3: Screening pozitiv, recomandă evaluare completă</p>
        
        <Field 
          label="GAD-2 (0-6) - Screening anxietate" 
          value={patient.psychosocial?.gad2} 
          editMode={editMode} 
          onChange={(v) => onChange('psychosocial', 'gad2', v)} 
          type="number" 
          min="0" 
          max="6" 
        />
        <p className="text-xs text-[#0d9488] -mt-2">≥3: Screening pozitiv, recomandă evaluare completă</p>
      </Section>

      <Section title="Evaluare Stimă de Sine">
        <Field 
          label="Rosenberg Self-Esteem Scale (10-40)" 
          value={patient.psychosocial?.rosenberg} 
          editMode={editMode} 
          onChange={(v) => onChange('psychosocial', 'rosenberg', v)} 
          type="number" 
          min="10" 
          max="40" 
        />
        <p className="text-xs text-[#0d9488] -mt-2">&lt;15: Scăzută | 15-25: Normală | &gt;25: Ridicată</p>
      </Section>

      <Section title="Calitate Viață (WHOQOL-BREF)">
        <Field 
          label="Dimensiunea fizică (0-100)" 
          value={patient.psychosocial?.whoqolPhysical} 
          editMode={editMode} 
          onChange={(v) => onChange('psychosocial', 'whoqolPhysical', v)} 
          type="number" 
          min="0" 
          max="100" 
        />
        <Field 
          label="Dimensiunea psihologică (0-100)" 
          value={patient.psychosocial?.whoqolPsychological} 
          editMode={editMode} 
          onChange={(v) => onChange('psychosocial', 'whoqolPsychological', v)} 
          type="number" 
          min="0" 
          max="100" 
        />
        <Field 
          label="Relații sociale (0-100)" 
          value={patient.psychosocial?.whoqolSocial} 
          editMode={editMode} 
          onChange={(v) => onChange('psychosocial', 'whoqolSocial', v)} 
          type="number" 
          min="0" 
          max="100" 
        />
        <Field 
          label="Mediu de viață (0-100)" 
          value={patient.psychosocial?.whoqolEnvironment} 
          editMode={editMode} 
          onChange={(v) => onChange('psychosocial', 'whoqolEnvironment', v)} 
          type="number" 
          min="0" 
          max="100" 
        />
      </Section>

      <Section title="Factori Psihosociali - Influență asupra tratamentului">
        <SelectField 
          label="Suport social perceput" 
          value={patient.psychosocial?.socialSupport} 
          editMode={editMode} 
          onChange={(v) => onChange('psychosocial', 'socialSupport', v)}
          options={['Scăzut', 'Mediu', 'Ridicat']}
        />
        <CheckboxField 
          label="Stres cronic / Burnout" 
          checked={patient.psychosocial?.chronicStress} 
          editMode={editMode} 
          onChange={(v) => onChange('psychosocial', 'chronicStress', v)} 
        />
        <Field 
          label="Satisfacție cu tratamentul (1-10)" 
          value={patient.psychosocial?.treatmentSatisfaction} 
          editMode={editMode} 
          onChange={(v) => onChange('psychosocial', 'treatmentSatisfaction', v)} 
          type="number" 
          min="1" 
          max="10" 
        />
        <Field 
          label="Motivație pentru tratament (1-10)" 
          value={patient.psychosocial?.treatmentMotivation} 
          editMode={editMode} 
          onChange={(v) => onChange('psychosocial', 'treatmentMotivation', v)} 
          type="number" 
          min="1" 
          max="10" 
        />
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
                  onClick={() => navigate(`/visits/${visit.id}`)}
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
  return (
    <div className="space-y-6">
      <Section title="Notițe Clinice">
        <textarea
          value={patient.notes || ''}
          onChange={(e) => editMode && onChange('notes', e.target.value)}
          disabled={!editMode}
          className="w-full p-3 border rounded min-h-[300px] font-mono text-sm"
          placeholder="Adaugă notițe despre pacient..."
        />
      </Section>
    </div>
  );
};

// History Tab Component
const HistoryTab = ({ logs }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Istoric Modificări</h3>
      
      {logs.length === 0 ? (
        <p className="text-[#0d9488] text-center py-8">Nu există modificări înregistrate</p>
      ) : (
        <div className="space-y-4">
          {logs.map(log => (
            <div key={log.id} className="border-l-4 border-[#14b8a6] bg-[#f0fdfa] p-4 rounded">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-semibold">{log.userName}</span>
                  <span className="text-[#0d9488] ml-2">
                    {new Date(log.timestamp).toLocaleString('ro-RO')}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  log.action === 'create' ? 'bg-green-200 text-green-800' :
                  log.action === 'update' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  {log.action === 'create' ? 'Creat' : log.action === 'update' ? 'Modificat' : 'Șters'}
                </span>
              </div>
              
              {log.changes && log.changes.length > 0 && (
                <div className="mt-2 space-y-1">
                  {log.changes.map((change, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{change.field}:</span>
                      <span className="text-red-600 line-through mx-2">{change.oldValue || 'N/A'}</span>
                      →
                      <span className="text-green-600 mx-2">{change.newValue || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
