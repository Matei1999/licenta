import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDateRo } from '../utils/dateUtils';
import RomanianDateInput from '../components/RomanianDateInput';
import { Chart } from 'chart.js/auto';

const Reports = () => {
  // Helper: format numbers to 1 decimal, show '-' when missing
  const fmt = (v, decimals = 1) => {
    if (v === null || v === undefined || v === '-') return '-';
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(decimals) : '-';
  };
  const navigate = useNavigate();
  const [activeReport, setActiveReport] = useState('complete'); // 'complete' | 'individual'
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
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
  const [showAllDates, setShowAllDates] = useState(true); // Default to true to show all patient data
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
    
    // Re-fetch la focus pentru a prinde pacienți noi
    const handleFocus = () => {
      fetchPatients();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Generate report on mount if complete report is already selected
  useEffect(() => {
    if (activeReport === 'complete') {
      generateCompleteReport();
    }
  }, []);

  // Regenerate when pagination changes or patient selection changes
  useEffect(() => {
    if (reportData) {
      if (activeReport === 'complete') {
        generateCompleteReport();
      } else if (activeReport === 'individual') {
        generateIndividualReport();
      }
    }
  }, [currentPage, itemsPerPage, selectedPatient, showAllDates, dateRange.start, dateRange.end]);

  // Căutare după CNP (13 cifre) sau după nume
  useEffect(() => {
    const run = async () => {
      const trimmed = patientSearchTerm.trim();
      
      // Dacă nu e nimic introdus, resetează
      if (!trimmed) {
        setCnpSearchError('');
        setCnpMatch(null);
        setShowSuggestions(false);
        setSelectedPatient('all'); // Reset to show all patients
        setShowAllPatients(true);
        return;
      }
      
      // Verifică dacă e CNP (13 cifre)
      if (/^\d{13}$/.test(trimmed)) {
        setCnpMatch(null);
        setCnpSearchError('');
        try {
          const token = localStorage.getItem('token');
          const res = await axios.post('/api/patients/search-cnp', { cnp: trimmed }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const p = res.data;
          setCnpMatch(p);
          setShowAllPatients(false);
          setSelectedPatient(String(p.id));
          setCnpSearchError('');
          setShowSuggestions(false);
        } catch (err) {
          setCnpMatch(null);
          if (err.response?.status === 404) {
            setCnpSearchError('Nu a fost găsit niciun pacient cu acest CNP.');
          } else if (err.response?.status === 403) {
            setCnpSearchError('Nu aveți drepturi pentru căutare după CNP.');
          } else {
            setCnpSearchError('Eroare la căutarea după CNP.');
          }
          setShowAllPatients(false);
          setSelectedPatient('none');
          setShowSuggestions(false);
        }
      } else {
        // Nu e CNP, afișează sugestii pentru căutare după nume
        setCnpSearchError('');
        setCnpMatch(null);
        setShowSuggestions(selectedPatient === 'all' ? true : false);
      }
    };
    run();
  }, [patientSearchTerm, selectedPatient]);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/patients/with-latest', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data);
      setLoadingPatients(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setLoadingPatients(false);
    }
  };

  const generateIndividualReport = async () => {
    console.log('🔵 generateIndividualReport called', { currentPage, itemsPerPage, selectedPatient, showAllDates, dateRange });
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const params = {
        page: currentPage,
        limit: itemsPerPage === 'all' ? 10000 : parseInt(itemsPerPage)
      };

      // Add patient filter if not 'all'
      if (selectedPatient && selectedPatient !== 'all') {
        params.patientId = selectedPatient;
      }

      // Add date range if not showing all dates
      if (!showAllDates && dateRange.start && dateRange.end) {
        params.startDate = dateRange.start;
        params.endDate = dateRange.end;
      }

      console.log('🔵 Making request to /api/patients/reports/individual', params);

      // Use optimized endpoint with pagination
      const response = await axios.get('/api/patients/reports/individual', {
        params,
        headers
      });

      console.log('🟢 Individual report response:', response.data);

      const { summary, patients: reportPatients } = response.data;

      setReportData({
        summary: {
          total: summary.total,
          compliant: summary.compliant,
          nonCompliant: summary.nonCompliant,
          complianceRate: summary.complianceRate,
          currentPage: summary.currentPage,
          totalPages: summary.totalPages,
          pageSize: summary.pageSize,
          totalPatients: summary.totalPatients
        },
        patients: reportPatients
      });
      
      console.log('🟢 Individual report data set successfully');
    } catch (error) {
      console.error('🔴 Error generating individual report:', error);
      console.error('🔴 Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCompleteReport = async () => {
    console.log('🔵 generateCompleteReport called', { currentPage, itemsPerPage });
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      console.log('🔵 Making request to /api/patients/reports/complete', { page: currentPage, limit: itemsPerPage });
      
      // Use optimized endpoint with pagination
      const response = await axios.get('/api/patients/reports/complete', {
        params: {
          page: currentPage,
          limit: itemsPerPage === 'all' ? 10000 : parseInt(itemsPerPage)
        },
        headers
      });

      console.log('🟢 Response received:', response.data);

      const { summary, patients: reportPatients } = response.data;

      setReportData({
        summary: {
          totalPatients: summary.totalPatients,
          avgIAH: summary.avgIAH,
          avgDesatIndex: summary.avgDesatIndex,
          avgSpO2Mean: summary.avgSpO2Mean,
          avgT90: summary.avgT90,
          avgCompliance: summary.avgCompliance,
          complianceRate: summary.complianceRate,
          currentPage: summary.currentPage,
          totalPages: summary.totalPages,
          pageSize: summary.pageSize
        },
        patients: reportPatients
      });
      
      console.log('🟢 Report data set successfully');
    } catch (error) {
      console.error('🔴 Error generating complete report:', error);
      console.error('🔴 Error details:', error.response?.data || error.message);
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

  const exportToCSV = async () => {
    if (!reportData) return;

    let csv = '';
    let filename = '';

    if (activeReport === 'complete' && reportData?.patients) {
      // Export complet cu toate datele pacienților și toate vizitele
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Header pentru CSV
      const csvHeaders = [
        'Pacient ID', 'Nume Pacient', 'CNP', 'Data Nașterii', 'Vârstă', 'Gen', 'Telefon', 'Email',
        'Data Vizită', 'IAH', 'IAH NREM', 'IAH REM', 'IAH Rezidual',
        'Indice Desaturare', 'SpO2 Min', 'SpO2 Max', 'SpO2 Medie',
        'T90', 'T45', 'Povară Hipoxică',
        'SASO Formă', 'STOP-BANG Score', 'Epworth Score',
        'Presiune CPAP', 'Complianță CPAP %', 'Ore Utilizare Medie',
        'Tensiune Sistolică', 'Tensiune Diastolică', 'Frecvență Cardiacă',
        'Greutate', 'Înălțime', 'BMI', 'Circumferință Gât',
        'Fumez', 'Pachete/Zi', 'Pachete-An', 'Alcool Frecvență',
        'HTA', 'Diabet', 'Dislipidemic', 'Obezitate', 'Boli Cardiovasculare',
        'Alte Comorbiditați', 'Medicație',
        'Notă Clinică'
      ];

      const allRows = [];

      // Pentru fiecare pacient, obținem toate vizitele
      for (const patientData of reportData.patients) {
        try {
          // Obținem datele complete ale pacientului
          const patientRes = await axios.get(`/api/patients/${patientData.patientId}`, { headers });
          const patient = patientRes.data;

          // Obținem toate vizitele pacientului
          const visitsRes = await axios.get(`/api/visits?patientId=${patientData.patientId}&limit=10000`, { headers });
          const visits = Array.isArray(visitsRes.data) ? visitsRes.data : visitsRes.data.visits || [];

          if (visits.length === 0) {
            // Dacă nu are vizite, adaugăm doar datele de bază ale pacientului
            allRows.push([
              patient.id,
              `${patient.firstName} ${patient.lastName}`,
              patient.cnp && patient.cnp.length === 13 ? patient.cnp : 'Criptat',
              patient.dateOfBirth || '-',
              patient.age || '-',
              patient.gender || '-',
              patient.phone || '-',
              patient.email || '-',
              '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-',
              '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-',
              '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'
            ]);
          } else {
            // Pentru fiecare vizită, adaugăm un rând
            visits.forEach(visit => {
              allRows.push([
                patient.id,
                `${patient.firstName} ${patient.lastName}`,
                patient.cnp && patient.cnp.length === 13 ? patient.cnp : 'Criptat',
                patient.dateOfBirth || '-',
                patient.age || '-',
                patient.gender || '-',
                patient.phone || '-',
                patient.email || '-',
                visit.visitDate || '-',
                visit.ahi || '-',
                visit.ahiNrem || '-',
                visit.ahiRem || '-',
                visit.ahiResidual || '-',
                visit.desatIndex || '-',
                visit.spo2Min || '-',
                visit.spo2Max || '-',
                visit.spo2Mean || '-',
                visit.t90 || '-',
                visit.t45 || '-',
                visit.hypoxicBurden || '-',
                visit.screening?.sasoForm || '-',
                visit.screening?.stopBangScore || '-',
                visit.screening?.epworthScore || '-',
                visit.cpapPressure || '-',
                visit.cpapCompliancePct || '-',
                visit.cpapAvgUsageHours || '-',
                visit.bloodPressureSystolic || '-',
                visit.bloodPressureDiastolic || '-',
                visit.heartRate || '-',
                visit.weight || '-',
                visit.height || '-',
                visit.bmi || '-',
                visit.neckCircumference || '-',
                visit.behavioral?.smoking ? 'Da' : 'Nu',
                visit.behavioral?.packetsPerDay || '-',
                visit.behavioral?.packYears || '-',
                visit.behavioral?.alcoholFrequency || '-',
                visit.comorbidities?.hypertension ? 'Da' : 'Nu',
                visit.comorbidities?.diabetes ? 'Da' : 'Nu',
                visit.comorbidities?.dyslipidemia ? 'Da' : 'Nu',
                visit.comorbidities?.obesity ? 'Da' : 'Nu',
                visit.comorbidities?.cardiovascularDisease ? 'Da' : 'Nu',
                visit.comorbidities?.otherText || '-',
                Array.isArray(patient.medications) ? patient.medications.filter(m => m.isActive).map(m => m.customName || m.name).join('; ') : '-',
                visit.clinicalNotes || '-'
              ]);
            });
          }
        } catch (error) {
          console.error(`Error fetching data for patient ${patientData.patientId}:`, error.message);
          // Continue with next patient even if one fails
        }
      }

      if (allRows.length === 0) {
        alert('Nu s-au putut obține date pentru export. Verificați conexiunea și încercați din nou.');
        return;
      }

      csv = [
        csvHeaders.join(','),
        ...allRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      filename = `raport_complet_toate_datele_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeReport === 'individual' && reportData?.patients) {
      const headers = ['Pacient', 'ID', 'Vizite', 'Complianță Medie %', 'Ultima Complianță %', 'Complianță ≥4h (%)', 'Complianță <4h (%)', 'Ultimul IAH', 'AHI Rezidual (ev/h)', 'Status', 'Trend'];
      const rows = reportData.patients.map(p => [
        p.patient || '',
        p.patientId || '',
        p.visitCount || '',
        p.avgCompliance || '-',
        p.latestCompliance || '-',
        p.latestCompliance4h || '-',
        p.latestComplianceLess4h || '-',
        p.latestIAH || '-',
        p.latestAHIResidual || '-',
        p.isCompliant ? 'Compliant' : 'Necompliant',
        p.trend === 'up' ? 'Îmbunătățire' : p.trend === 'down' ? 'Deteriorare' : 'Stabil'
      ]);
      csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      filename = `raport_compliantă_${new Date().toISOString().split('T')[0]}.csv`;
    }

    if (csv) {
      // Add UTF-8 BOM so Excel opens it correctly with proper character encoding
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csv;
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
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
      // Sortare pacienți după IAH descendent
      const sortedPatients = [...reportData.patients].sort((a, b) => (b.latestIAH || 0) - (a.latestIAH || 0));
      
      // Bar chart pentru raport complet
      chartConfig = {
        type: 'bar',
        data: {
          labels: sortedPatients.map((p, idx) => `P${idx + 1}`), // Etichetă generică fără nume
          datasets: [
            {
              label: 'IAH',
              data: sortedPatients.map(p => p.latestIAH || 0),
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1
            },
            {
              label: 'Complianță %',
              data: sortedPatients.map(p => parseFloat(p.avgCompliance) || 0),
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
              text: 'Raport Complet - IAH & Complianță (Sortat după IAH)',
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
            },
            x: {
              display: false // Ascunde etichetele de pe axa X
            }
          }
        }
      };
    } else if (activeReport === 'individual' && reportData?.patients) {
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
          <h1 className="text-3xl font-bold text-text-primary">Rapoarte</h1>
          <p className="text-primary-hover">Analiză complianță CPAP și evoluție IAH</p>
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
        {/* CSV Import Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <span className="text-blue-600 text-lg flex-shrink-0">ℹ️</span>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-2">📥 Instrucțiuni Export CSV:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>NU deschideți direct</strong> - fișierul CSV nu se deschide corect în Excel din cauza codării de caractere (ș, ț, ă, etc.)</li>
              <li><strong>Importați în Excel</strong>: File → Open → Selectați fișierul CSV → La dialog, selectați <code className="bg-blue-100 px-1 rounded">UTF-8</code> ca encoding</li>
              <li>Sau: Deschideți Excel → Data → From Text/CSV → Alegeți fișierul și selectați UTF-8</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setActiveReport('complete');
              setReportData(null);
              setCurrentPage(1);
              generateCompleteReport();
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              activeReport === 'complete'
                ? 'bg-primary text-white'
                : 'bg-bg-surface text-primary-hover hover:bg-primary-light'
            }`}
          >
            📊 Raport Complet
          </button>
          <button
            onClick={() => {
              setActiveReport('individual');
              setReportData(null);
              setCurrentPage(1);
              generateIndividualReport();
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              activeReport === 'individual'
                ? 'bg-primary text-white'
                : 'bg-bg-surface text-primary-hover hover:bg-primary-light'
            }`}
          >
            👤 Raport Individual
          </button>
        </div>

        {/* Filters - shown only in individual report tab */}
        {activeReport === 'individual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Filtru Pacient
              </label>
              <div>
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary pr-10"
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
                            className="w-full px-4 py-2 text-left hover:bg-bg-surface transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-text-primary">
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
                    <div className="mt-1 text-sm text-text-primary bg-bg-surface border border-primary/30 rounded px-3 py-2">
                      Pacient selectat prin CNP: <span className="font-semibold">{cnpMatch.firstName} {cnpMatch.lastName}</span>
                    </div>
                  )}
                  {cnpSearchError && (
                    <div className="mt-1 text-sm text-red-600">{cnpSearchError}</div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Data Start</label>
              <RomanianDateInput
                value={dateRange.start}
                onChange={(val) => setDateRange({ ...dateRange, start: val })}
                className="w-full"
                disabled={showAllDates}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Data Sfârșit</label>
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
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="showAllDates" className="ml-2 text-sm font-medium text-text-primary">
              Ignoră perioada (tot istoricul)
            </label>
          </div>
          
          <div className="mt-6 p-4 bg-bg-surface border border-primary/30 rounded-lg">
            <p className="text-sm text-primary-hover">
              💡 <em>Notă:</em> Filtrele de mai sus se aplică automat la acest raport individual.
            </p>
          </div>
        </div>
        )}
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-xl text-primary-hover">Se generează raportul...</div>
        </div>
      ) : (
        <>
          {activeReport === 'complete' && reportData && (
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-primary-hover mb-1">Total Pacienti</div>
                  <div className="text-2xl font-bold text-text-primary">{reportData?.summary?.totalPatients ?? 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-primary-hover mb-1">IAH mediu</div>
                  <div className="text-3xl font-bold text-text-primary">{reportData?.summary?.avgIAH ?? '0.0'}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-primary-hover mb-1">SpO2 / T90</div>
                  <div className="text-2xl font-bold text-text-primary">{reportData?.summary?.avgSpO2Mean ?? '0.0'} / {reportData?.summary?.avgT90 ?? '0.0'}%</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-primary-hover mb-1">Complianță medie</div>
                  <div className="text-3xl font-bold text-primary">{reportData?.summary?.avgCompliance ?? '0.0'}%</div>
                </div>
                <div className="bg-green-50 rounded-lg shadow-md p-6">
                  <div className="text-sm text-green-800 mb-1">Rata complianță</div>
                  <div className="text-3xl font-bold text-green-600">{reportData?.summary?.complianceRate ?? 0}%</div>
                </div>
              </div>

              {/* Detail Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-bg-surface">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-hover uppercase">Pacient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-hover uppercase">IAH</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-hover uppercase">Desat Index</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-hover uppercase">SpO2</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-hover uppercase">T90 (%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-hover uppercase">Complianță</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-hover uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(reportData?.patients ?? []).map((p, idx) => (
                      <tr key={idx} className="hover:bg-bg-surface">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`/patients/${p.patientId}`)}
                            className="text-primary hover:underline font-medium"
                          >
                            {p.patient}
                          </button>
                        </td>
                        <td className="px-6 py-4 font-semibold">{fmt(p.latestIAH)}</td>
                        <td className="px-6 py-4">{fmt(p.latestDesatIndex)}</td>
                        <td className="px-6 py-4">{fmt(p.latestSpO2Mean)}</td>
                        <td className="px-6 py-4">{fmt(p.latestT90)}</td>
                        <td className="px-6 py-4 font-semibold">{fmt(p.avgCompliance)}%</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            p.isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {p.isCompliant ? '✓' : '✗'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Server-side Pagination */}
                {reportData?.summary && (
                  <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Afișare {((reportData.summary.currentPage - 1) * reportData.summary.pageSize) + 1} - {Math.min(reportData.summary.currentPage * reportData.summary.pageSize, reportData.summary.totalPatients)} din {reportData.summary.totalPatients} pacienți
                    </div>
                    <div className="flex gap-2 items-center">
                      <label className="text-sm text-gray-600">Afișare:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value="all">Toți</option>
                      </select>
                      <div className="flex gap-1">
                        {getPageItems(reportData.summary.totalPages, reportData.summary.currentPage).map((item, i) =>
                          item === '…' ? (
                            <span key={`ellipsis-${i}`} className="px-3 py-1">…</span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => setCurrentPage(item)}
                              className={`px-3 py-1 rounded ${reportData.summary.currentPage === item ? 'bg-primary text-white' : 'bg-white text-primary-hover hover:bg-bg-surface'} border border-gray-300`}
                            >
                              {item}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeReport === 'individual' && reportData && (
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-primary-hover mb-1">Pacienti cu vizite / Total</div>
                  <div className="text-3xl font-bold text-text-primary">{reportData?.summary?.total ?? 0} / {patients.length}</div>
                </div>
                <div className="bg-green-50 rounded-lg shadow-md p-6">
                  <div className="text-sm text-green-800 mb-1">Complianți (≥70%)</div>
                  <div className="text-3xl font-bold text-green-600">{reportData?.summary?.compliant ?? 0}</div>
                </div>
                <div className="bg-red-50 rounded-lg shadow-md p-6">
                  <div className="text-sm text-red-800 mb-1">Non-complianți (&lt;70%)</div>
                  <div className="text-3xl font-bold text-red-600">{reportData?.summary?.nonCompliant ?? 0}</div>
                </div>
                <div className="bg-bg-surface rounded-lg shadow-md p-6">
                  <div className="text-sm text-text-primary mb-1">Rată Complianță</div>
                  <div className="text-3xl font-bold text-primary">{reportData?.summary?.complianceRate ?? 0}%</div>
                </div>
              </div>

              {/* Patient Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-bg-surface">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-hover uppercase">Pacient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-hover uppercase">Nr. Vizite</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-hover uppercase">Complianță Totală (%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-hover uppercase">Complianță ≥4h (%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-hover uppercase">Complianță &lt;4h (%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-hover uppercase">AHI Rezidual (ev/h)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-hover uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(reportData?.patients ?? []).map((p, idx) => (
                      <tr key={idx} className="hover:bg-bg-surface">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`/patients/${p.patientId}`)}
                            className="text-primary hover:underline font-medium"
                          >
                            {p.patient}
                          </button>
                        </td>
                        <td className="px-6 py-4">{p.visitCount}</td>
                        <td className="px-6 py-4 font-semibold">{fmt(p.latestCompliance)}%</td>
                        <td className="px-6 py-4 font-semibold">{fmt(p.latestCompliance4h)}%</td>
                        <td className="px-6 py-4 font-semibold">{fmt(p.latestComplianceLess4h)}%</td>
                        <td className="px-6 py-4 font-semibold">{fmt(p.latestAHIResidual)} ev/h</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            p.isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {p.isCompliant ? '✓' : '✗'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Server-side Pagination */}
                {reportData?.summary && (
                  <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Afișare {((reportData.summary.currentPage - 1) * reportData.summary.pageSize) + 1} - {Math.min(reportData.summary.currentPage * reportData.summary.pageSize, reportData.summary.totalPatients)} din {reportData.summary.totalPatients} pacienți
                    </div>
                    <div className="flex gap-2 items-center">
                      <label className="text-sm text-gray-600">Afișare:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value="all">Toți</option>
                      </select>
                      <div className="flex gap-1">
                        {getPageItems(reportData.summary.totalPages, reportData.summary.currentPage).map((item, i) =>
                          item === '…' ? (
                            <span key={`ellipsis-${i}`} className="px-3 py-1">…</span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => setCurrentPage(item)}
                              className={`px-3 py-1 rounded ${reportData.summary.currentPage === item ? 'bg-primary text-white' : 'bg-white text-primary-hover hover:bg-bg-surface'} border border-gray-300`}
                            >
                              {item}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;


