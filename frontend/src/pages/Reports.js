import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDateRo } from '../utils/dateUtils';
import RomanianDateInput from '../components/RomanianDateInput';
import { Chart } from 'chart.js/auto';

const Reports = () => {
  const navigate = useNavigate();
  const [activeReport, setActiveReport] = useState('complete'); // 'complete' | 'compliance'
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showAllPatients, setShowAllPatients] = useState(true);
  const [cnpSearchError, setCnpSearchError] = useState('');
  const [cnpMatch, setCnpMatch] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [showAllDates, setShowAllDates] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchPatients();
    // La intrarea în tab, resetăm filtrul la "Toți pacienții"
    setSelectedPatient('all');
    setPatientSearchTerm('');
    setShowAllPatients(true);
    setCnpMatch(null);
    setCnpSearchError('');
    setShowSuggestions(false);
  }, []);

  useEffect(() => {
    // Așteaptă să fie încărcați pacienții înainte de generare
    if (patients.length === 0) return;

    // Reset previous data to avoid shape mismatches when switching tabs
    setReportData(null);
    setCurrentPage(1);
    
    if (activeReport === 'compliance') {
      generateComplianceReport();
    } else {
      generateCompleteReport();
    }
  }, [activeReport, dateRange, selectedPatient, showAllDates, showAllPatients, patients]);

  // Căutare CNP (13 cifre) via endpoint dedicat; setează selecția dacă există
  useEffect(() => {
    const run = async () => {
      const trimmed = patientSearchTerm.trim();
      if (!/^\d{13}$/.test(trimmed)) {
        setCnpSearchError('');
        // Afișează sugestii doar dacă nu e deja selectat un pacient specific
        setShowSuggestions(selectedPatient === 'all' ? !!trimmed : false);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post('/api/patients/search-cnp', { cnp: trimmed }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const p = res.data;
        setShowAllPatients(false);
        setSelectedPatient(String(p.id));
        setPatientSearchTerm(`${p.firstName} ${p.lastName}`);
        setCnpMatch(p);
        setCnpSearchError('');
        setShowSuggestions(false);
      } catch (err) {
        if (err.response?.status === 404) {
          setCnpSearchError('Nu a fost găsit niciun pacient cu acest CNP.');
          setShowAllPatients(false);
          setSelectedPatient('none');
          setCnpMatch(null);
          setShowSuggestions(false);
          setReportData({
            summary: {
              totalPatients: 0,
              avgIAH: '0.0',
              avgDesatIndex: '0.0',
              avgSpO2Mean: '0.0',
              avgT90: '0.0',
              avgCompliance: '0.0',
              complianceRate: 0
            },
            patients: []
          });
        } else {
          setCnpSearchError('Eroare la căutarea după CNP.');
          setCnpMatch(null);
          setShowSuggestions(false);
        }
      }
    };
    run();
  }, [patientSearchTerm]);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const generateComplianceReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Folosește showAllPatients pentru a determina ce pacienți să analizeze
      let patientsToAnalyze = [];
      if (showAllPatients) {
        patientsToAnalyze = patients;
      } else if (selectedPatient !== 'all') {
        patientsToAnalyze = patients.filter(p => String(p.id) === String(selectedPatient));
      }

      if (patientsToAnalyze.length === 0) {
        setReportData({ patients: [], summary: { total: 0, compliant: 0, nonCompliant: 0, complianceRate: 0 } });
        return;
      }

      const results = await Promise.all(
        patientsToAnalyze.map(async (patient) => {
          try {
            const dateParams = showAllDates ? '' : `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
            const visitsRes = await axios.get(
              `/api/visits?patientId=${patient.id}${dateParams}&limit=10000`,
              { headers }
            );
            
            const visits = visitsRes.data;
            if (visits.length === 0) return null;

            const avgCompliance = visits.reduce((sum, v) => sum + (v.cpapCompliancePct || 0), 0) / visits.length;
            const latestVisit = visits[0];
            
            return {
              patient: `${patient.firstName} ${patient.lastName}`,
              patientId: patient.id,
              visitCount: visits.length,
              avgCompliance: avgCompliance.toFixed(1),
              latestCompliance: latestVisit.cpapCompliancePct,
              latestIAH: latestVisit.ahi,
              isCompliant: avgCompliance >= 70,
              trend: visits.length > 1 ? 
                (latestVisit.cpapCompliancePct > visits[visits.length - 1].cpapCompliancePct ? 'up' : 'down') 
                : 'stable'
            };
          } catch (error) {
            return null;
          }
        })
      );

      const validResults = results.filter(r => r !== null);
      const compliant = validResults.filter(r => r.isCompliant).length;
      const nonCompliant = validResults.length - compliant;

      setReportData({
        patients: validResults,
        summary: {
          total: validResults.length,
          compliant,
          nonCompliant,
          complianceRate: validResults.length > 0 ? ((compliant / validResults.length) * 100).toFixed(1) : 0
        }
      });
    } catch (error) {
      console.error('Error generating compliance report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCompleteReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Folosește showAllPatients pentru a determina ce pacienți să analizeze
      let patientsToAnalyze = [];
      if (showAllPatients) {
        patientsToAnalyze = patients;
      } else if (selectedPatient !== 'all') {
        patientsToAnalyze = patients.filter(p => String(p.id) === String(selectedPatient));
      }

      if (patientsToAnalyze.length === 0) {
        setReportData({
          summary: {
            totalPatients: 0,
            avgIAH: '0.0',
            avgDesatIndex: '0.0',
            avgSpO2Mean: '0.0',
            avgT90: '0.0',
            avgCompliance: '0.0',
            complianceRate: 0
          },
          patients: []
        });
        return;
      }

      const results = await Promise.all(
        patientsToAnalyze.map(async (patient) => {
          try {
            const dateParams = showAllDates ? '' : `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
            const visitsRes = await axios.get(
              `/api/visits?patientId=${patient.id}${dateParams}&limit=10000`,
              { headers }
            );
            const visits = visitsRes.data;
            if (visits.length === 0) return null;

            // latest visit is first because API returns DESC
            const latest = visits[0];
            const avgCompliance = visits.reduce((sum, v) => sum + (v.cpapCompliancePct || 0), 0) / visits.length;

            return {
              patient: `${patient.firstName} ${patient.lastName}`,
              patientId: patient.id,
              latestIAH: latest.ahi ?? null,
              latestDesatIndex: latest.desatIndex ?? null,
              latestSpO2Mean: latest.spo2Mean ?? null,
              latestT90: latest.t90 ?? null,
              latestCompliance: latest.cpapCompliancePct ?? null,
              avgCompliance: avgCompliance.toFixed(1),
              isCompliant: avgCompliance >= 70
            };
          } catch (error) {
            return null;
          }
        })
      );

      const valid = results.filter(r => r !== null);
      const avg = (arr) => arr.length ? (arr.reduce((s, v) => s + parseFloat(v), 0) / arr.length).toFixed(1) : '0.0';

      const avgIAH = avg(valid.filter(v => v.latestIAH !== null).map(v => v.latestIAH));
      const avgDesatIndex = avg(valid.filter(v => v.latestDesatIndex !== null).map(v => v.latestDesatIndex));
      const avgSpO2Mean = avg(valid.filter(v => v.latestSpO2Mean !== null).map(v => v.latestSpO2Mean));
      const avgT90 = avg(valid.filter(v => v.latestT90 !== null).map(v => v.latestT90));
      const avgCompliance = avg(valid.filter(v => v.avgCompliance !== null).map(v => v.avgCompliance));
      const compliant = valid.filter(r => r.isCompliant).length;

      setReportData({
        summary: {
          totalPatients: valid.length,
          avgIAH,
          avgDesatIndex,
          avgSpO2Mean,
          avgT90,
          avgCompliance,
          compliant,
          complianceRate: valid.length > 0 ? ((compliant / valid.length) * 100).toFixed(1) : 0
        },
        patients: valid
      });
    } catch (error) {
      console.error('Error generating complete report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination helper
  const getPageItems = (total, current) => {
    const items = [];
    const maxAround = 2;
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

  const exportToCSV = () => {
    if (!reportData) return;

    let csv = '';
    let filename = '';

    if (activeReport === 'complete' && reportData?.patients) {
      const headers = ['Pacient', 'ID', 'IAH', 'Desat Index', 'SpO2', 'T90 %', 'Complianță %', 'Status'];
      const rows = reportData.patients.map(p => [
        p.patient || '',
        p.patientId || '',
        p.latestIAH || '-',
        p.latestDesatIndex || '-',
        p.latestSpO2Mean || '-',
        p.latestT90 || '-',
        p.avgCompliance || '-',
        p.isCompliant ? 'Compliant' : 'Non-compliant'
      ]);
      csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      filename = `raport_complet_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeReport === 'compliance' && reportData?.patients) {
      const headers = ['Pacient', 'ID', 'Vizite', 'Complianță Medie %', 'Ultima Complianță %', 'Ultimul IAH', 'Status', 'Trend'];
      const rows = reportData.patients.map(p => [
        p.patient || '',
        p.patientId || '',
        p.visitCount || '',
        p.avgCompliance || '-',
        p.latestCompliance || '-',
        p.latestIAH || '-',
        p.isCompliant ? 'Compliant' : 'Non-compliant',
        p.trend === 'up' ? 'Îmbunătățire' : p.trend === 'down' ? 'Deteriorare' : 'Stabil'
      ]);
      csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      filename = `raport_compliantă_${new Date().toISOString().split('T')[0]}.csv`;
    }

    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    }
  };

  const openDashboard = () => {
    if (!reportData) return;

    // Create a temporary canvas for the chart
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    let chartConfig = null;

    if (activeReport === 'complete' && reportData?.patients) {
      // Bar chart pentru raport complet
      chartConfig = {
        type: 'bar',
        data: {
          labels: reportData.patients.map(p => p.patient),
          datasets: [
            {
              label: 'IAH',
              data: reportData.patients.map(p => p.latestIAH || 0),
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1
            },
            {
              label: 'Complianță %',
              data: reportData.patients.map(p => parseFloat(p.avgCompliance) || 0),
              backgroundColor: 'rgba(16, 185, 129, 0.7)',
              borderColor: 'rgb(16, 185, 129)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: 'Raport Complet - IAH & Complianță',
              font: { size: 18 }
            },
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      };
    } else if (activeReport === 'compliance' && reportData?.patients) {
      // Bar chart pentru complianță
      chartConfig = {
        type: 'bar',
        data: {
          labels: reportData.patients.map(p => p.patient),
          datasets: [
            {
              label: 'Complianță Medie %',
              data: reportData.patients.map(p => parseFloat(p.avgCompliance) || 0),
              backgroundColor: reportData.patients.map(p => 
                p.isCompliant ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'
              ),
              borderColor: reportData.patients.map(p => 
                p.isCompliant ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
              ),
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: 'Raport Complianță CPAP',
              font: { size: 18 }
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Complianță %'
              }
            }
          }
        }
      };
    }

    if (chartConfig) {
      const chart = new Chart(ctx, chartConfig);
      
      // Wait for chart to render then download
      setTimeout(() => {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `grafic_${activeReport}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = url;
        link.click();
        
        // Cleanup
        chart.destroy();
      }, 100);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#065f46]">Rapoarte</h1>
          <p className="text-[#0d9488]">Analiză complianță CPAP și evoluție IAH</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openDashboard}
            className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg hover:from-blue-500 hover:to-blue-700 flex items-center gap-2 shadow-lg font-semibold transition-all border border-blue-500/30"
          >
            <span className="text-lg">📊</span> Grafic
          </button>
          <button
            onClick={exportToCSV}
            disabled={!reportData}
            className="px-4 py-2 bg-gradient-to-r from-teal-400 to-teal-600 text-white rounded-lg hover:from-teal-500 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg font-semibold transition-all border border-teal-500/30"
          >
            <span className="text-lg">📥</span> Export CSV
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveReport('complete')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              activeReport === 'complete'
                ? 'bg-[#14b8a6] text-white'
                : 'bg-[#f0fdfa] text-[#0d9488] hover:bg-[#ccfbf1]'
            }`}
          >
            📊 Raport Complet
          </button>
          <button
            onClick={() => setActiveReport('compliance')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              activeReport === 'compliance'
                ? 'bg-[#14b8a6] text-white'
                : 'bg-[#f0fdfa] text-[#0d9488] hover:bg-[#ccfbf1]'
            }`}
          >
            💊 Raport Complianță CPAP
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[#065f46]">
                  Filtru Pacient
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showAllPatients"
                    checked={showAllPatients}
                    onChange={(e) => {
                      setShowAllPatients(e.target.checked);
                      if (e.target.checked) {
                        setSelectedPatient('all');
                        setPatientSearchTerm('');
                        setCnpMatch(null);
                        setCnpSearchError('');
                      }
                    }}
                    className="w-4 h-4 text-[#14b8a6] border-gray-300 rounded focus:ring-[#14b8a6] mr-2"
                  />
                  <label htmlFor="showAllPatients" className="text-sm text-[#0d9488] cursor-pointer">
                    Toți pacienții
                  </label>
                </div>
              </div>
              {!showAllPatients && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Caută pacient (nume sau CNP)..."
                    value={patientSearchTerm}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPatientSearchTerm(val);
                      setCnpMatch(null); // dacă utilizatorul rescrie, eliberăm selecția CNP
                      setShowAllPatients(false);
                      setShowSuggestions(!!val);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#14b8a6] pr-10"
                  />
                  {patientSearchTerm && (
                    <button
                      onClick={() => {
                        setPatientSearchTerm('');
                        setSelectedPatient('all');
                        setCnpSearchError('');
                        setCnpMatch(null);
                        setShowSuggestions(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                  {patientSearchTerm && !cnpMatch && showSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {patients
                        .filter(p => {
                          const searchLower = patientSearchTerm.toLowerCase();
                          const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
                          return fullName.includes(searchLower);
                        })
                        .slice(0, 20)
                        .map(p => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSelectedPatient(String(p.id));
                              setPatientSearchTerm(`${p.firstName} ${p.lastName}`);
                              setShowAllPatients(false);
                              setCnpMatch(null);
                              setCnpSearchError('');
                              setShowSuggestions(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-[#f0fdfa] transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-[#065f46]">
                              {p.firstName} {p.lastName}
                            </div>
                          </button>
                        ))}
                      {patients.filter(p => {
                        const searchLower = patientSearchTerm.toLowerCase();
                        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
                        return fullName.includes(searchLower);
                      }).length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          Nu s-au găsit pacienți
                        </div>
                      )}
                    </div>
                  )}
                  {cnpMatch && (
                    <div className="mt-1 text-sm text-[#065f46] bg-[#f0fdfa] border border-[#14b8a6]/30 rounded px-3 py-2">
                      Pacient selectat prin CNP: <span className="font-semibold">{cnpMatch.firstName} {cnpMatch.lastName}</span>
                    </div>
                  )}
                  {cnpSearchError && (
                    <div className="mt-1 text-sm text-red-600">{cnpSearchError}</div>
                  )}
                </div>
              )}
              {showAllPatients && (
                <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#0d9488] text-center">
                  Toți pacienții ({patients.length})
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-2">Data Start</label>
              <RomanianDateInput
                value={dateRange.start}
                onChange={(val) => setDateRange({ ...dateRange, start: val })}
                className="w-full"
                disabled={showAllDates}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-2">Data Sfârșit</label>
              <RomanianDateInput
                value={dateRange.end}
                onChange={(val) => setDateRange({ ...dateRange, end: val })}
                className="w-full"
                disabled={showAllDates}
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showAllDates"
              checked={showAllDates}
              onChange={(e) => setShowAllDates(e.target.checked)}
              className="w-4 h-4 text-[#14b8a6] border-gray-300 rounded focus:ring-[#14b8a6]"
            />
            <label htmlFor="showAllDates" className="ml-2 text-sm font-medium text-[#065f46]">
              Ignoră perioada (tot istoricul)
            </label>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-xl text-[#0d9488]">Se generează raportul...</div>
        </div>
      ) : (
        <>
          {activeReport === 'complete' && reportData && (
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-[#0d9488] mb-1">Pacienți cu vizite</div>
                  <div className="text-3xl font-bold text-[#065f46]">{reportData?.summary?.totalPatients ?? 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-[#0d9488] mb-1">IAH mediu</div>
                  <div className="text-3xl font-bold text-[#065f46]">{reportData?.summary?.avgIAH ?? '0.0'}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-[#0d9488] mb-1">SpO2 / T90</div>
                  <div className="text-2xl font-bold text-[#065f46]">{reportData?.summary?.avgSpO2Mean ?? '0.0'} / {reportData?.summary?.avgT90 ?? '0.0'}%</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-[#0d9488] mb-1">Complianță medie</div>
                  <div className="text-3xl font-bold text-[#14b8a6]">{reportData?.summary?.avgCompliance ?? '0.0'}%</div>
                </div>
                <div className="bg-green-50 rounded-lg shadow-md p-6">
                  <div className="text-sm text-green-800 mb-1">Rata complianță</div>
                  <div className="text-3xl font-bold text-green-600">{reportData?.summary?.complianceRate ?? 0}%</div>
                </div>
              </div>

              {/* Detail Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#f0fdfa]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Pacient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">IAH</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Desat Index</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">SpO2</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">T90 (%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Complianță</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const allPatients = reportData?.patients ?? [];
                      const indexOfLast = currentPage * itemsPerPage;
                      const indexOfFirst = indexOfLast - itemsPerPage;
                      const currentItems = allPatients.slice(indexOfFirst, indexOfLast);
                      return currentItems.map((p, idx) => (
                        <tr key={idx} className="hover:bg-[#f0fdfa]">
                          <td className="px-6 py-4">
                            <button
                              onClick={() => navigate(`/patients/${p.patientId}`)}
                              className="text-[#14b8a6] hover:underline font-medium"
                            >
                              {p.patient}
                            </button>
                          </td>
                          <td className="px-6 py-4 font-semibold">{p.latestIAH ?? '-'}</td>
                          <td className="px-6 py-4">{p.latestDesatIndex ?? '-'}</td>
                          <td className="px-6 py-4">{p.latestSpO2Mean ?? '-'}</td>
                          <td className="px-6 py-4">{p.latestT90 ?? '-'}</td>
                          <td className="px-6 py-4 font-semibold">{p.avgCompliance ?? '-'}%</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              p.isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {p.isCompliant ? '✓ Compliant' : '✗ Non-compliant'}
                            </span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
                {/* Pagination */}
                {(() => {
                  const allPatients = reportData?.patients ?? [];
                  const totalPages = Math.ceil(allPatients.length / itemsPerPage);
                  if (totalPages <= 1) return null;
                  return (
                    <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Afișare {Math.min((currentPage - 1) * itemsPerPage + 1, allPatients.length)} - {Math.min(currentPage * itemsPerPage, allPatients.length)} din {allPatients.length} pacienți
                      </div>
                      <div className="flex gap-2 items-center">
                        <label className="text-sm text-gray-600">Afișare:</label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <div className="flex gap-1">
                          {getPageItems(totalPages, currentPage).map((item, i) =>
                            item === '…' ? (
                              <span key={`ellipsis-${i}`} className="px-3 py-1">…</span>
                            ) : (
                              <button
                                key={item}
                                onClick={() => setCurrentPage(item)}
                                className={`px-3 py-1 rounded ${currentPage === item ? 'bg-[#14b8a6] text-white' : 'bg-white text-[#0d9488] hover:bg-[#f0fdfa]'} border border-gray-300`}
                              >
                                {item}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
          {activeReport === 'compliance' && reportData && (
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-[#0d9488] mb-1">Total Pacienti</div>
                  <div className="text-3xl font-bold text-[#065f46]">{reportData?.summary?.total ?? 0}</div>
                </div>
                <div className="bg-green-50 rounded-lg shadow-md p-6">
                  <div className="text-sm text-green-800 mb-1">Complianți (≥70%)</div>
                  <div className="text-3xl font-bold text-green-600">{reportData?.summary?.compliant ?? 0}</div>
                </div>
                <div className="bg-red-50 rounded-lg shadow-md p-6">
                  <div className="text-sm text-red-800 mb-1">Non-complianți (&lt;70%)</div>
                  <div className="text-3xl font-bold text-red-600">{reportData?.summary?.nonCompliant ?? 0}</div>
                </div>
                <div className="bg-[#f0fdfa] rounded-lg shadow-md p-6">
                  <div className="text-sm text-[#065f46] mb-1">Rată Complianță</div>
                  <div className="text-3xl font-bold text-[#14b8a6]">{reportData?.summary?.complianceRate ?? 0}%</div>
                </div>
              </div>

              {/* Patient Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#f0fdfa]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Pacient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Nr. Vizite</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Complianță Medie</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Complianță Ultimă</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">IAH Ultim</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const allPatients = reportData?.patients ?? [];
                      const indexOfLast = currentPage * itemsPerPage;
                      const indexOfFirst = indexOfLast - itemsPerPage;
                      const currentItems = allPatients.slice(indexOfFirst, indexOfLast);
                      return currentItems.map((p, idx) => (
                        <tr key={idx} className="hover:bg-[#f0fdfa]">
                          <td className="px-6 py-4">
                            <button
                              onClick={() => navigate(`/patients/${p.patientId}`)}
                              className="text-[#14b8a6] hover:underline font-medium"
                            >
                              {p.patient}
                            </button>
                          </td>
                          <td className="px-6 py-4">{p.visitCount}</td>
                          <td className="px-6 py-4 font-semibold">{p.avgCompliance}%</td>
                          <td className="px-6 py-4">{p.latestCompliance}%</td>
                          <td className="px-6 py-4">{p.latestIAH}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              p.isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {p.isCompliant ? '✓ Compliant' : '✗ Non-compliant'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {p.trend === 'up' && <span className="text-green-600">↑ În creștere</span>}
                            {p.trend === 'down' && <span className="text-red-600">↓ În scădere</span>}
                            {p.trend === 'stable' && <span className="text-[#0d9488]">→ Stabil</span>}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
                {/* Pagination */}
                {(() => {
                  const allPatients = reportData?.patients ?? [];
                  const totalPages = Math.ceil(allPatients.length / itemsPerPage);
                  if (totalPages <= 1) return null;
                  return (
                    <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Afișare {Math.min((currentPage - 1) * itemsPerPage + 1, allPatients.length)} - {Math.min(currentPage * itemsPerPage, allPatients.length)} din {allPatients.length} pacienți
                      </div>
                      <div className="flex gap-2 items-center">
                        <label className="text-sm text-gray-600">Afișare:</label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <div className="flex gap-1">
                          {getPageItems(totalPages, currentPage).map((item, i) =>
                            item === '…' ? (
                              <span key={`ellipsis-${i}`} className="px-3 py-1">…</span>
                            ) : (
                              <button
                                key={item}
                                onClick={() => setCurrentPage(item)}
                                className={`px-3 py-1 rounded ${currentPage === item ? 'bg-[#14b8a6] text-white' : 'bg-white text-[#0d9488] hover:bg-[#f0fdfa]'} border border-gray-300`}
                              >
                                {item}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;


