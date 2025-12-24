import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const StopBang = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // STOP-BANG inputs
  const [inputs, setInputs] = useState({
    snoring: false,
    tiredness: false,
    observedApnea: false,
    hypertension: false,
    bmiOver35: false, // auto
    ageOver50: false, // auto
    neckOver40: false, // auto when available
    maleGender: false // auto
  });

  const calcAge = (dob) => {
    if (!dob) return null;
    try {
      const d = new Date(dob);
      const diffYears = Math.floor((Date.now() - d.getTime()) / 31557600000);
      return diffYears;
    } catch (_) {
      return null;
    }
  };

  const calcBmi = (heightCm, weightKg) => {
    if (!heightCm || !weightKg) return null;
    const hM = Number(heightCm) / 100;
    const bmi = Number(weightKg) / (hM * hM);
    return Number.isFinite(bmi) ? bmi : null;
  };

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/patients/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatient(res.data);
        // Pre-populate autos
        const age = calcAge(res.data.dateOfBirth);
        const bmi = calcBmi(res.data.heightCm, res.data.weightKg);
        const neck = res.data.neckCircumferenceCm;
        setInputs(prev => ({
          ...prev,
          bmiOver35: bmi ? bmi >= 35 : false,
          ageOver50: age ? age >= 50 : false,
          neckOver40: neck ? Number(neck) > 40 : false,
          maleGender: res.data.gender === 'Male'
        }));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patient:', err);
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  const score = Object.values(inputs).filter(Boolean).length;

  const handleToggle = (key) => {
    setInputs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/patients/${id}`, { stopBangScore: score }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/patients/${id}/epworth`);
    } catch (err) {
      console.error('Error saving STOP-BANG:', err);
      alert('Eroare la salvare');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Se încarcă...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#065f46]">Chestionar STOP-BANG</h1>
            <p className="text-[#0d9488]">Pacient: {patient?.firstName} {patient?.lastName}</p>
          </div>
          <button
            onClick={() => navigate(`/patients/${id}`)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >Înapoi</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        {/* Manual items */}
        <div className="flex items-center justify-between">
          <span className="text-[#065f46] font-medium">S: Sforăit puternic?</span>
          <button onClick={() => handleToggle('snoring')} className={`px-3 py-1 rounded ${inputs.snoring ? 'bg-[#14b8a6] text-white' : 'bg-gray-200'}`}>{inputs.snoring ? 'Da' : 'Nu'}</button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#065f46] font-medium">T: Somnolență/oboseală diurnă?</span>
          <button onClick={() => handleToggle('tiredness')} className={`px-3 py-1 rounded ${inputs.tiredness ? 'bg-[#14b8a6] text-white' : 'bg-gray-200'}`}>{inputs.tiredness ? 'Da' : 'Nu'}</button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#065f46] font-medium">O: A fost observată apnee în somn?</span>
          <button onClick={() => handleToggle('observedApnea')} className={`px-3 py-1 rounded ${inputs.observedApnea ? 'bg-[#14b8a6] text-white' : 'bg-gray-200'}`}>{inputs.observedApnea ? 'Da' : 'Nu'}</button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#065f46] font-medium">P: Hipertensiune arterială tratată?</span>
          <button onClick={() => handleToggle('hypertension')} className={`px-3 py-1 rounded ${inputs.hypertension ? 'bg-[#14b8a6] text-white' : 'bg-gray-200'}`}>{inputs.hypertension ? 'Da' : 'Nu'}</button>
        </div>

        {/* Auto-derived items */}
        <div className="flex items-center justify-between">
          <span className="text-[#065f46] font-medium">B: BMI ≥ 35 (auto)</span>
          <span className={`px-3 py-1 rounded ${inputs.bmiOver35 ? 'bg-[#14b8a6] text-white' : 'bg-gray-200'}`}>{inputs.bmiOver35 ? 'Da' : 'Nu'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#065f46] font-medium">A: Vârstă ≥ 50 ani (auto)</span>
          <span className={`px-3 py-1 rounded ${inputs.ageOver50 ? 'bg-[#14b8a6] text-white' : 'bg-gray-200'}`}>{inputs.ageOver50 ? 'Da' : 'Nu'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#065f46] font-medium">N: Circumferință gât {'>'} 40cm (auto)</span>
          <span className={`px-3 py-1 rounded ${inputs.neckOver40 ? 'bg-[#14b8a6] text-white' : 'bg-gray-200'}`}>{inputs.neckOver40 ? 'Da' : 'Nu'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#065f46] font-medium">G: Sex masculin (auto)</span>
          <span className={`px-3 py-1 rounded ${inputs.maleGender ? 'bg-[#14b8a6] text-white' : 'bg-gray-200'}`}>{inputs.maleGender ? 'Da' : 'Nu'}</span>
        </div>

        <div className="mt-6 p-4 bg-[#f0fdfa] rounded border">
          <p className="text-[#065f46] font-semibold">Scor: {score} / 8</p>
          <p className="text-[#0d9488]">Risc: {score >= 5 ? 'Ridicat' : score >= 3 ? 'Intermediar' : 'Scăzut'}</p>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={handleSave} className="px-4 py-2 bg-[#14b8a6] text-white rounded hover:bg-[#0d9488]">Next: Epworth</button>
          <button onClick={() => navigate(`/patients/${id}`)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Anulează</button>
        </div>
      </div>
    </div>
  );
};

export default StopBang;
