import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDateRo } from '../utils/dateUtils';
import RomanianDateInput from '../components/RomanianDateInput';
import { Chart } from 'chart.js/auto';

const Reports = () => {
  const navigate = useNavigate();
  const [activeReport, setActiveReport] = useState('summary'); // 'summary' | 'compliance' | 'iah-evolution'
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [showAllDates, setShowAllDates] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    // Reset previous data to avoid shape mismatches when switching tabs
    setReportData(null);
    if (activeReport === 'compliance') {
      generateComplianceReport();
    } else if (activeReport === 'iah-evolution') {
      generateIAHEvolutionReport();
    } else {
      generateSummaryReport();
    }
  }, [activeReport, dateRange, selectedPatient, showAllDates]);

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

      let patientsToAnalyze = patients;
      if (selectedPatient !== 'all') {
        patientsToAnalyze = patients.filter(p => p.id === selectedPatient);
      }

      const results = await Promise.all(
        patientsToAnalyze.map(async (patient) => {
          try {
            const dateParams = showAllDates ? '' : `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
            const visitsRes = await axios.get(
              `/api/visits?patientId=${patient.id}${dateParams}`,
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

  const generateSummaryReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      let patientsToAnalyze = patients;
      if (selectedPatient !== 'all') {
        patientsToAnalyze = patients.filter(p => String(p.id) === String(selectedPatient));
      }

      const results = await Promise.all(
        patientsToAnalyze.map(async (patient) => {
          try {
            const dateParams = showAllDates ? '' : `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
            const visitsRes = await axios.get(
              `/api/visits?patientId=${patient.id}${dateParams}&limit=100`,
              { headers }
            );
            const visits = visitsRes.data;
            if (visits.length === 0) return null;

            // latest visit is first because API returns DESC
            const latest = visits[0];

            return {
              patient: `${patient.firstName} ${patient.lastName}`,
              patientId: patient.id,
              latestIAH: latest.ahi ?? null,
              latestDesatIndex: latest.desatIndex ?? null,
              latestSpO2Mean: latest.spo2Mean ?? null,
              latestT90: latest.t90 ?? null
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

      setReportData({
        summary: {
          totalPatients: valid.length,
          avgIAH,
          avgDesatIndex,
          avgSpO2Mean,
          avgT90
        },
        patients: valid
      });
    } catch (error) {
      console.error('Error generating summary report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateIAHEvolutionReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      let patientsToAnalyze = patients;
      if (selectedPatient !== 'all') {
        patientsToAnalyze = patients.filter(p => String(p.id) === String(selectedPatient));
      }

      if (patientsToAnalyze.length === 0) {
        setLoading(false);
        return;
      }

      const dateParams = showAllDates ? '' : `&startDate=${dateRange.start}&endDate=${dateRange.end}`;

      const results = await Promise.all(
        patientsToAnalyze.map(async (patient) => {
          try {
            const visitsRes = await axios.get(
              `/api/visits?patientId=${patient.id}${dateParams}`,
              { headers }
            );

            const visits = visitsRes.data.reverse(); // Oldest first
            
            if (visits.length === 0) return null;

            const firstIAH = visits[0].ahi;
            const lastIAH = visits[visits.length - 1].ahi;
            const change = ((lastIAH - firstIAH) / firstIAH * 100).toFixed(1);
            
            let trend = 'stable';
            if (Math.abs(change) > 10) {
              trend = change < 0 ? 'improving' : 'worsening';
            }

            return {
              patient: `${patient.firstName} ${patient.lastName}`,
              patientId: patient.id,
              visits: visits.map(v => ({
                date: v.visitDate,
                iah: v.ahi,
                ahiResidual: v.ahiResidual,
                compliance: v.cpapCompliancePct,
                severity: getSeverity(v.ahi)
              })),
              trend,
              change,
              firstIAH,
              lastIAH
            };
          } catch (error) {
            return null;
          }
        })
      );

      const validResults = results.filter(r => r !== null);

      if (selectedPatient === 'all') {
        setReportData({
          multiPatient: true,
          patients: validResults
        });
      } else if (validResults.length > 0) {
        setReportData({
          multiPatient: false,
          ...validResults[0]
        });
      } else {
        setReportData({ visits: [], trend: 'no-data' });
      }
    } catch (error) {
      console.error('Error generating IAH evolution report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverity = (ahi) => {
    if (!ahi) return { label: '-', color: 'gray' };
    if (ahi < 30) return { label: 'Moderat', color: 'orange' };
    return { label: 'Sever', color: 'red' };
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csv = '';
    let filename = '';

    if (activeReport === 'summary' && reportData?.patients) {
      const headers = ['Pacient', 'ID', 'IAH Mediu', 'Desat Index', 'SpO2 Mediu', 'T90'];
      const rows = reportData.patients.map(p => [
        p.patient || '',
        p.patientId || '',
        p.latestIAH || '-',
        p.latestDesatIndex || '-',
        p.latestSpO2Mean || '-',
        p.latestT90 || '-'
      ]);
      csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      filename = `raport_rezumat_${new Date().toISOString().split('T')[0]}.csv`;
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
    } else if (activeReport === 'iah-evolution') {
      if (reportData?.multiPatient && reportData?.patients) {
        // Export pentru toți pacienții - rezumat
        const headers = ['Pacient', 'ID', 'Vizite', 'IAH Inițial', 'IAH Curent', 'Schimbare %', 'Trend'];
        const rows = reportData.patients.map(p => [
          p.patient || '',
          p.patientId || '',
          p.visits?.length || 0,
          p.firstIAH || '-',
          p.lastIAH || '-',
          p.change || '-',
          p.trend === 'improving' ? 'Îmbunătățire' : p.trend === 'worsening' ? 'Agravare' : 'Stabil'
        ]);
        csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        filename = `raport_evolutie_iah_toti_${new Date().toISOString().split('T')[0]}.csv`;
      } else if (reportData?.visits) {
        // Export pentru un singur pacient - detaliat
        const headers = ['Data', 'IAH', 'IAH Rezidual', 'Complianță CPAP %', 'Severitate'];
        const rows = reportData.visits.map(v => [
          formatDateRo(v.date) || '',
          v.iah || '-',
          v.ahiResidual || '-',
          v.compliance || '-',
          v.severity?.label || '-'
        ]);
        csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        filename = `raport_evolutie_iah_${new Date().toISOString().split('T')[0]}.csv`;
      }
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

    if (activeReport === 'summary' && reportData?.patients) {
      // Bar chart pentru rezumat IAH & Saturație
      chartConfig = {
        type: 'bar',
        data: {
          labels: reportData.patients.map(p => p.patient),
          datasets: [
            {
              label: 'IAH Mediu',
              data: reportData.patients.map(p => p.latestIAH || 0),
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1
            },
            {
              label: 'SpO2 Mediu',
              data: reportData.patients.map(p => p.latestSpO2Mean || 0),
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
              text: 'Rezumat IAH & Saturație - Toți Pacienții',
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
    } else if (activeReport === 'iah-evolution') {
      if (reportData?.multiPatient && reportData?.patients) {
        // Bar chart pentru schimbarea IAH la toți pacienții
        chartConfig = {
          type: 'bar',
          data: {
            labels: reportData.patients.map(p => p.patient),
            datasets: [
              {
                label: 'Schimbare IAH %',
                data: reportData.patients.map(p => parseFloat(p.change) || 0),
                backgroundColor: reportData.patients.map(p => 
                  parseFloat(p.change) < 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'
                ),
                borderColor: reportData.patients.map(p => 
                  parseFloat(p.change) < 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
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
                text: 'Evoluție IAH - Schimbare Procentuală',
                font: { size: 18 }
              },
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                title: {
                  display: true,
                  text: 'Schimbare %'
                }
              }
            }
          }
        };
      } else if (reportData?.visits) {
        // Line chart pentru evoluția IAH în timp (un pacient)
        chartConfig = {
          type: 'line',
          data: {
            labels: reportData.visits.map(v => formatDateRo(v.date)),
            datasets: [
              {
                label: 'IAH',
                data: reportData.visits.map(v => v.iah || 0),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              },
              {
                label: 'IAH Rezidual',
                data: reportData.visits.map(v => v.ahiResidual || 0),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: false,
            plugins: {
              title: {
                display: true,
                text: `Evoluție IAH - ${reportData.patient}`,
                font: { size: 18 }
              },
              legend: {
                display: true,
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'IAH'
                }
              }
            }
          }
        };
      }
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
            onClick={() => setActiveReport('summary')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              activeReport === 'summary'
                ? 'bg-[#14b8a6] text-white'
                : 'bg-[#f0fdfa] text-[#0d9488] hover:bg-[#ccfbf1]'
            }`}
          >
            📄 Rezumat IAH & Saturatie
          </button>
          <button
            onClick={() => setActiveReport('compliance')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              activeReport === 'compliance'
                ? 'bg-[#14b8a6] text-white'
                : 'bg-[#f0fdfa] text-[#0d9488] hover:bg-[#ccfbf1]'
            }`}
          >
            📊 Raport Complianță CPAP
          </button>
          <button
            onClick={() => setActiveReport('iah-evolution')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              activeReport === 'iah-evolution'
                ? 'bg-[#14b8a6] text-white'
                : 'bg-[#f0fdfa] text-[#0d9488] hover:bg-[#ccfbf1]'
            }`}
          >
            📈 Evoluție IAH
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-2">
                Filtru Pacient
              </label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#14b8a6]"
              >
                <option value="all">Toți pacienții</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
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
              Afișează toate datele (din totdeauna)
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
          {activeReport === 'summary' && reportData && (
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-[#0d9488] mb-1">Pacienti cu date</div>
                  <div className="text-3xl font-bold text-[#065f46]">{reportData?.summary?.totalPatients ?? 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-[#0d9488] mb-1">IAH mediu (ultima vizita)</div>
                  <div className="text-3xl font-bold text-[#065f46]">{reportData?.summary?.avgIAH ?? '0.0'}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-[#0d9488] mb-1">Indice desaturare mediu</div>
                  <div className="text-3xl font-bold text-[#065f46]">{reportData?.summary?.avgDesatIndex ?? '0.0'}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-[#0d9488] mb-1">SpO2 medie / T90 mediu</div>
                  <div className="text-3xl font-bold text-[#065f46]">{reportData?.summary?.avgSpO2Mean ?? '0.0'} / {reportData?.summary?.avgT90 ?? '0.0'}%</div>
                </div>
              </div>

              {/* Detail Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#f0fdfa]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Pacient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">IAH Ultim</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Indice Desaturare</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">SpO2 Medie</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">T90 (%)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(reportData?.patients ?? []).map((p, idx) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    {(reportData?.patients ?? []).map((p, idx) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport === 'iah-evolution' && (
            <div>
              {loading ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14b8a6] mx-auto"></div>
                  <p className="mt-4 text-[#0d9488]">Se generează raportul...</p>
                </div>
              ) : reportData && reportData.trend === 'no-data' ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <div className="text-xl text-[#0d9488]">Nu există vizite în perioada selectată</div>
                </div>
              ) : reportData && reportData.multiPatient ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-[#065f46]">Evoluție IAH - Toți Pacienții</h2>
                    <p className="text-[#0d9488] mt-1">{reportData.patients.length} pacienți cu date de evoluție</p>
                  </div>
                  <table className="w-full">
                    <thead className="bg-[#f0fdfa]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Pacient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Vizite</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">IAH Inițial</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">IAH Curent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Schimbare</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.patients.map((p, idx) => (
                        <tr key={idx} className="hover:bg-[#f0fdfa]">
                          <td className="px-6 py-4">
                            <button
                              onClick={() => navigate(`/patients/${p.patientId}`)}
                              className="text-[#14b8a6] hover:underline font-medium"
                            >
                              {p.patient}
                            </button>
                          </td>
                          <td className="px-6 py-4">{p.visits.length}</td>
                          <td className="px-6 py-4 font-semibold">{p.firstIAH}</td>
                          <td className="px-6 py-4 font-semibold">{p.lastIAH}</td>
                          <td className="px-6 py-4">
                            <span className={`font-bold ${p.change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {p.change}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {p.trend === 'improving' && <span className="text-green-600 font-medium">↓ Îmbunătățire</span>}
                            {p.trend === 'worsening' && <span className="text-red-600 font-medium">↑ Agravare</span>}
                            {p.trend === 'stable' && <span className="text-[#0d9488] font-medium">→ Stabil</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : reportData && reportData.visits ? (
                <>
                  {/* Summary */}
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold text-[#065f46] mb-4">
                      {reportData.patient} - Evoluție IAH
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-[#0d9488] mb-1">IAH Inițial</div>
                        <div className="text-2xl font-bold text-[#065f46]">{reportData.firstIAH}</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#0d9488] mb-1">IAH Curent</div>
                        <div className="text-2xl font-bold text-[#065f46]">{reportData.lastIAH}</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#0d9488] mb-1">Schimbare</div>
                        <div className={`text-2xl font-bold ${reportData.change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {reportData.change}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-[#0d9488] mb-1">Trend</div>
                        <div className="text-2xl font-bold">
                          {reportData.trend === 'improving' && <span className="text-green-600">✓ Îmbunătățire</span>}
                          {reportData.trend === 'worsening' && <span className="text-red-600">⚠ Agravare</span>}
                          {reportData.trend === 'stable' && <span className="text-[#0d9488]">→ Stabil</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visit Timeline */}
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-[#f0fdfa]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Data Vizită</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">IAH</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">IAH Rezidual</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Severitate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#0d9488] uppercase">Complianță CPAP</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.visits.map((visit, idx) => {
                          const severity = visit.severity;
                          return (
                            <tr key={idx} className="hover:bg-[#f0fdfa]">
                              <td className="px-6 py-4 font-medium">{visit.date}</td>
                              <td className="px-6 py-4 text-lg font-bold">{visit.iah}</td>
                              <td className="px-6 py-4">{visit.ahiResidual || '-'}</td>
                              <td className="px-6 py-4">
                                {severity ? (
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${severity.color}-100 text-${severity.color}-800`}>
                                    {severity.label}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="px-6 py-4">
                                {visit.compliance ? (
                                  <span className={`font-semibold ${visit.compliance >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                    {visit.compliance}%
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <div className="text-xl text-[#0d9488]">Selectează un pacient pentru a genera raportul</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;


