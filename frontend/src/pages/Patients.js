
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterCompliance, setFilterCompliance] = useState('all');
  const [loading, setLoading] = useState(true);
  const [cnpError, setCnpError] = useState('');
  const [cnpResult, setCnpResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterSeverity, filterCompliance, patients, cnpResult, cnpError]);

  // Căutare după CNP (hash)
  useEffect(() => {
    const tryCnpSearch = async () => {
      setCnpResult(null);
      setCnpError('');
      if (/^\d{13}$/.test(searchTerm)) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.post('/api/patients/search-cnp', { cnp: searchTerm }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCnpResult(response.data);
        } catch (err) {
          setCnpResult(null);
          if (err.response && err.response.status === 404) {
            setCnpError('Nu a fost găsit niciun pacient cu acest CNP.');
          } else if (err.response && err.response.status === 403) {
            setCnpError('Nu aveți drepturi pentru căutare după CNP.');
          } else {
            setCnpError('Eroare la căutarea după CNP.');
          }
        }
      } else {
        setCnpResult(null);
        setCnpError('');
      }
    };
    if (searchTerm && /^\d{13}$/.test(searchTerm)) tryCnpSearch();
    else {
      setCnpResult(null);
      setCnpError('');
    }
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const patientsRes = await axios.get('/api/patients', { headers });
      const allPatients = patientsRes.data;
      // Fetch visits for each patient to get latest metrics
      const patientsWithVisits = await Promise.all(
        allPatients.map(async (patient) => {
          try {
            const visitsRes = await axios.get(`/api/visits?patientId=${patient.id}&limit=1`, { headers });
            const latestVisit = visitsRes.data[0];
            return {
              ...patient,
              latestVisit
            };
          } catch (error) {
            return patient;
          }
        })
      );
      setPatients(patientsWithVisits);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...patients];
    // Căutare după CNP (rezultat direct)
    if (searchTerm && /^\d{13}$/.test(searchTerm)) {
      if (cnpResult) {
        filtered = patients.filter(p => p.id === cnpResult.id);
      } else if (cnpError) {
        filtered = [];
      }
    } else if (searchTerm) {
      // Căutare doar după nume (nu mai include email)
      filtered = filtered.filter(p => 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
      );
    }
    // Severitate
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(p => {
        if (!p.latestVisit?.ahi) return false;
        const ahi = p.latestVisit.ahi;
        switch (filterSeverity) {
          case 'normal': return ahi < 5;
          case 'mild': return ahi >= 5 && ahi < 15;
          case 'moderate': return ahi >= 15 && ahi < 30;
          case 'severe': return ahi >= 30;
          default: return true;
        }
      });
    }
    // Complianță
    if (filterCompliance !== 'all') {
      filtered = filtered.filter(p => {
        if (!p.latestVisit?.cpapCompliancePct) return false;
        if (filterCompliance === 'compliant') {
          return p.latestVisit.cpapCompliancePct >= 70;
        } else {
          return p.latestVisit.cpapCompliancePct < 70;
        }
      });
    }
    setFilteredPatients(filtered);
  };

  const getSeverityLabel = (ahi) => {
    if (!ahi) return { label: 'N/A', color: 'gray' };
    const ahiNum = Number(ahi);
    if (ahiNum < 5) return { label: 'Normal', color: 'green' };
    if (ahiNum < 15) return { label: 'Ușor', color: 'yellow' };
    if (ahiNum < 30) return { label: 'Moderat', color: 'orange' };
    return { label: 'Sever', color: 'red' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Se încarcă...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-main">Lista Pacienți</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/patients/add')}
              className="px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg hover:from-green-500 hover:to-green-700 flex items-center gap-2 shadow-lg font-semibold transition-all border border-green-500/30"
            >
              <span className="text-lg">➕</span> Pacient Nou
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filtrare Pacienți</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-2">Căutare</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nume, CNP, Email..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {cnpError && (
                <div className="text-red-500 text-xs mt-1">{cnpError}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-2">Severitate OSA</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toate</option>
                <option value="normal">Normal (&lt;5)</option>
                <option value="mild">Ușor (5-14)</option>
                <option value="moderate">Moderat (15-29)</option>
                <option value="severe">Sever (≥30)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-2">Complianță CPAP</label>
              <select
                value={filterCompliance}
                onChange={(e) => setFilterCompliance(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toate</option>
                <option value="compliant">Complianți (≥70%)</option>
                <option value="non-compliant">Non-complianți (&lt;70%)</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-[#0d9488]">
              Afișare: <span className="font-semibold">{filteredPatients.length}</span> din <span className="font-semibold">{patients.length}</span> pacienți
            </p>
            {(searchTerm || filterSeverity !== 'all' || filterCompliance !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterSeverity('all');
                  setFilterCompliance('all');
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Resetează filtre
              </button>
            )}
          </div>
        </div>

        {/* Patients List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-[#f0fdfa] border-b">
            <h3 className="text-lg font-semibold">Lista Pacienți</h3>
          </div>
          {filteredPatients.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#0d9488]">
              {patients.length === 0 ? (
                <div>
                  <p className="text-xl mb-2">Nu există pacienți înregistrați</p>
                  <button
                    onClick={() => navigate('/patients/add')}
                    className="mt-4 px-4 py-2 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488]"
                  >
                    Adaugă primul pacient
                  </button>
                </div>
              ) : (
                <p>Nu există pacienți care să corespundă filtrelor</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f0fdfa]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#065f46] uppercase tracking-wider">
                      Pacient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#065f46] uppercase tracking-wider">
                      Vârstă
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#065f46] uppercase tracking-wider">
                      IAH
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#065f46] uppercase tracking-wider">
                      Severitate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#065f46] uppercase tracking-wider">
                      Complianță CPAP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#065f46] uppercase tracking-wider">
                      Ultima vizită
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#065f46] uppercase tracking-wider">
                      Acțiuni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map(patient => {
                    const age = patient.dateOfBirth 
                      ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / 31557600000)
                      : null;
                    const severity = getSeverityLabel(patient.latestVisit?.ahi);
                    const compliance = patient.latestVisit?.cpapCompliancePct;
                    return (
                      <tr 
                        key={patient.id}
                        className="hover:bg-[#f0fdfa] cursor-pointer transition-colors"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-semibold text-[#065f46]">
                              {patient.firstName} {patient.lastName}
                            </div>
                            <div className="text-sm text-[#0d9488]">{patient.email || 'Fără email'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[#065f46]">
                          {age ? `${age} ani` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-[#065f46]">
                            {patient.latestVisit?.ahi ? Number(patient.latestVisit.ahi).toFixed(1) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            severity.color === 'green' ? 'bg-green-100 text-green-800' :
                            severity.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            severity.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                            severity.color === 'red' ? 'bg-red-100 text-red-800' :
                            'bg-[#f0fdfa] text-[#065f46]'
                          }`}>
                            {severity.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {compliance !== null && compliance !== undefined ? (
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${
                                compliance >= 70 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {compliance}%
                              </span>
                              {compliance >= 70 ? (
                                <span className="text-green-500">✓</span>
                              ) : (
                                <span className="text-red-500">✗</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0d9488]">
                          {patient.latestVisit?.visitDate 
                            ? new Date(patient.latestVisit.visitDate).toLocaleDateString('ro-RO')
                            : 'Nicio vizită'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/patients/${patient.id}`);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Vezi →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Patients;
