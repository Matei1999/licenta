import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const situations = [
  { key: 'reading', label: 'Stând jos și citind' },
  { key: 'tv', label: 'Urmărind televizorul' },
  { key: 'publicPlace', label: 'Stând inactiv într-un loc public' },
  { key: 'carPassenger', label: 'Pasager într-o mașină (≥1 oră fără pauză)' },
  { key: 'afternoonRest', label: 'Întins după-amiaza pentru odihnă' },
  { key: 'talking', label: 'Stând jos și vorbind cu cineva' },
  { key: 'quietAfterLunch', label: 'Stând liniștit după prânz, fără alcool' },
  { key: 'carStopped', label: 'În mașină, oprit câteva minute în trafic' },
];

const Epworth = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/patients/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatient(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patient:', err);
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  const handleChange = (key, value) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const total = Object.values(scores).reduce((acc, v) => acc + (parseInt(v) || 0), 0);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/patients/${id}`, { epworthScore: total }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Epworth salvat!');
      navigate(`/patients/${id}`);
    } catch (err) {
      console.error('Error saving Epworth:', err);
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
            <h1 className="text-3xl font-bold text-[#065f46]">Scala Epworth</h1>
            <p className="text-[#0d9488]">Pacient: {patient?.firstName} {patient?.lastName}</p>
          </div>
          <button
            onClick={() => navigate(`/patients/${id}`)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >Înapoi</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {situations.map(s => (
          <div key={s.key} className="">
            <p className="text-[#065f46] font-medium mb-2">{s.label}</p>
            <div className="flex gap-3">
              {[0,1,2,3].map(val => (
                <label key={val} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={s.key}
                    value={val}
                    checked={String(scores[s.key] || '') === String(val)}
                    onChange={(e) => handleChange(s.key, parseInt(e.target.value))}
                  />
                  <span>{val}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-4 p-4 bg-[#f0fdfa] rounded border">
          <p className="text-[#065f46] font-semibold">Scor total: {total} / 24</p>
          <p className="text-[#0d9488]">Somnolență: {total >= 16 ? 'Severă' : total >= 11 ? 'Moderată' : total >= 7 ? 'Ușoară' : 'Normală'}</p>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={handleSave} className="px-4 py-2 bg-[#14b8a6] text-white rounded hover:bg-[#0d9488]">Salvează</button>
          <button onClick={() => navigate(`/patients/${id}`)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Anulează</button>
        </div>
      </div>
    </div>
  );
};

export default Epworth;
