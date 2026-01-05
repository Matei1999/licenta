
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDateRo } from '../utils/dateUtils';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage, setPatientsPerPage] = useState(10);

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
      // Single call: patients already include latestVisit
      const patientsRes = await axios.get('/api/patients/with-latest', { headers });
      setPatients(patientsRes.data);
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
    
    // Severitate (prefer AHI; fallback to patient.sasoForm)
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(p => {
        const ahi = p.latestVisit?.ahi;
        if (ahi !== null && ahi !== undefined) {
          return filterSeverity === 'moderate' ? (ahi >= 15 && ahi < 30) : (ahi >= 30);
        }
        const saso = p.sasoForm;
        if (!saso) return false;
        if (filterSeverity === 'moderate') return saso === 'Moderată';
        return saso === 'Severă';
      });
    }
    // Complianță (prefer latest visit, fallback to patient.cpapData.compliance)
    const getCompliance = (p) => (
      p.latestVisit?.cpapCompliancePct ?? p.cpapData?.compliance
    );
    if (filterCompliance !== 'all') {
      filtered = filtered.filter(p => {
        const comp = getCompliance(p);
        if (comp === null || comp === undefined) return false;
        return filterCompliance === 'compliant' ? comp >= 70 : comp < 70;
      });
    }
    setFilteredPatients(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };



  const getSeverityLabel = (ahi, saso) => {
    if (ahi !== null && ahi !== undefined) {
      const ahiNum = Number(ahi);
      if (Number.isNaN(ahiNum)) return { label: '-', color: 'gray' };
      if (ahiNum < 30) return { label: 'Moderat', color: 'orange' };
      return { label: 'Sever', color: 'red' };
    }
    if (saso === 'Moderată') return { label: 'Moderat', color: 'orange' };
    if (saso === 'Severă') return { label: 'Sever', color: 'red' };
    return { label: '-', color: 'gray' };
  };

  // Pagination logic
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Build compact pagination items with ellipses
  const getPageItems = (total, current) => {
    const items = [];
    const maxAround = 2; // window size around current
    const add = (val) => items.push(val);
    if (total <= 10) {
      for (let i = 1; i <= total; i++) add(i);
      return items;
    }
    add(1);
    const start = Math.max(2, current - maxAround);
    const end = Math.min(total - 1, current + maxAround);
    if (start > 2) add('…');
    for (let i = start; i <= end; i++) add(i);
    if (end < total - 1) add('…');
    add(total);
    return items;
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
          <button
            onClick={() => navigate('/patients/add')}
            className="px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg hover:from-green-500 hover:to-green-700 flex items-center gap-2 shadow-lg font-semibold transition-all border border-green-500/30"
          >
            <span className="text-lg">➕</span> Pacient Nou
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filtrare Pacienți</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Căutare</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nume sau CNP..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {cnpError && (
                <div className="text-red-500 text-xs mt-1">{cnpError}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Severitate OSA</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toate</option>

                <option value="moderate">Moderat (15-29)</option>
                <option value="severe">Sever (≥30)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Complianță CPAP</label>
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
            <p className="text-sm text[#0d9488]">
              Afișare: <span className="font-semibold">{filteredPatients.length}</span> din <span className="font-semibold">{patients.length}</span> pacienți
            </p>
            <div className="flex items-center gap-3">
              <label className="text-sm text-text-primary">Pe pagină:</label>
              <select
                value={patientsPerPage}
                onChange={(e) => { setPatientsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
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
          <div className="px-6 py-4 bg-bg-surface border-b">
            <h3 className="text-lg font-semibold">Lista Pacienți</h3>
          </div>
          {filteredPatients.length === 0 ? (
            <div className="px-6 py-12 text-center text-primary-hover">
              {patients.length === 0 ? (
                <div>
                  <p className="text-xl mb-2">Nu există pacienți înregistrați</p>
                  <button
                    onClick={() => navigate('/patients/add')}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
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
                <thead className="bg-bg-surface">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">
                      Pacient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">
                      Vârstă
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">
                      IAH
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">
                      Severitate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">
                      Complianță CPAP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">
                      Ultima vizită
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-primary uppercase tracking-wider">
                      Acțiuni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPatients.map(patient => {
                    const age = patient.dateOfBirth 
                      ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / 31557600000)
                      : null;
                    const severity = getSeverityLabel(patient.latestVisit?.ahi, patient.sasoForm);
                    const compliance = patient.latestVisit?.cpapCompliancePct ?? patient.cpapData?.compliance;
                    return (
                      <tr 
                        key={patient.id}
                        className="hover:bg-bg-surface cursor-pointer transition-colors"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-semibold text-text-primary">
                              {patient.firstName} {patient.lastName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-text-primary">
                          {age ? `${age} ani` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-text-primary">
                            {patient.latestVisit?.ahi !== null && patient.latestVisit?.ahi !== undefined
                              ? Number(patient.latestVisit.ahi).toFixed(1)
                              : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            severity.color === 'green' ? 'bg-green-100 text-green-800' :
                            severity.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            severity.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                            severity.color === 'red' ? 'bg-red-100 text-red-800' :
                            'bg-bg-surface text-text-primary'
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
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-hover">
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
          {filteredPatients.length > 0 && (
            <div className="px-6 py-4 bg-bg-surface border-t flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-sm text-text-primary">
                  Afișare {indexOfFirstPatient + 1}-{Math.min(indexOfLastPatient, filteredPatients.length)} din {filteredPatients.length} pacienți
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm text-text-primary">Mergi la:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    defaultValue={currentPage}
                    className="w-20 px-2 py-1 border border-gray-200 rounded text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = Math.max(1, Math.min(totalPages, Number(e.currentTarget.value) || 1));
                        paginate(val);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => paginate(1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-primary text-primary hover:bg-bg-surface'}`}
                >
                  «
                </button>
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-hover'}`}
                >
                  Anterior
                </button>

                {getPageItems(totalPages, currentPage).map((item, idx) => (
                  item === '…' ? (
                    <span key={`dots-${idx}`} className="px-2 text-primary">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => paginate(item)}
                      className={`px-3 py-1 rounded ${
                        currentPage === item
                          ? 'bg-primary text-white'
                          : 'bg-white border border-primary text-primary hover:bg-bg-surface'
                      }`}
                    >
                      {item}
                    </button>
                  )
                ))}

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-hover'}`}
                >
                  Următor
                </button>
                <button
                  onClick={() => paginate(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-primary text-primary hover:bg-bg-surface'}`}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Patients;
