import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (activeReport === 'compliance') {
      generateComplianceReport();
    } else if (activeReport === 'iah-evolution') {
      generateIAHEvolutionReport();
    } else {
      generateSummaryReport();
    }
  }, [activeReport, dateRange, selectedPatient]);

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
            const visitsRes = await axios.get(
              `/api/visits?patientId=${patient.id}&startDate=${dateRange.start}&endDate=${dateRange.end}`,
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
            const visitsRes = await axios.get(
              `/api/visits?patientId=${patient.id}&startDate=${dateRange.start}&endDate=${dateRange.end}&limit=100`,
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

      const patientId = selectedPatient === 'all' ? patients[0]?.id : selectedPatient;
      if (!patientId) {
        setLoading(false);
        return;
      }

      const visitsRes = await axios.get(
        `/api/visits?patientId=${patientId}&startDate=${dateRange.start}&endDate=${dateRange.end}`,
        { headers }
      );

      const visits = visitsRes.data.reverse(); // Oldest first
      
      if (visits.length === 0) {
        setReportData({ visits: [], trend: 'no-data' });
        setLoading(false);
        return;
      }

      const firstIAH = visits[0].ahi;
      const lastIAH = visits[visits.length - 1].ahi;
      const change = ((lastIAH - firstIAH) / firstIAH * 100).toFixed(1);
      
      let trend = 'stable';
      if (Math.abs(change) > 10) {
        trend = change < 0 ? 'improving' : 'worsening';
      }

      const patient = patients.find(p => p.id === patientId);

      setReportData({
        patient: patient ? `${patient.firstName} ${patient.lastName}` : 'Pacient',
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
      });
    } catch (error) {
      console.error('Error generating IAH evolution report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverity = (ahi) => {
    if (!ahi) return { label: 'N/A', color: 'gray' };
    if (ahi < 5) return { label: 'Normal', color: 'green' };
    if (ahi < 15) return { label: 'Ușor', color: 'yellow' };
    if (ahi < 30) return { label: 'Moderat', color: 'orange' };
    return { label: 'Sever', color: 'red' };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#065f46]">Rapoarte</h1>
          <p className="text-[#0d9488]">Analiză complianță CPAP și evoluție IAH</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-[#f0fdfa] text-[#0d9488] hover:bg-[#ccfbf1] rounded-lg"
        >
          ← Înapoi la Dashboard
        </button>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#065f46] mb-2">
              {activeReport === 'iah-evolution' ? 'Pacient (obligatoriu)' : 'Filtru Pacient'}
            </label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#14b8a6]"
            >
              {(activeReport === 'compliance' || activeReport === 'summary') && <option value="all">Toți pacienții</option>}
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#065f46] mb-2">Data Start</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#14b8a6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#065f46] mb-2">Data Sfârșit</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#14b8a6]"
            />
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
                  <div className="text-3xl font-bold text-[#065f46]">{reportData.summary.totalPatients}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-[#0d9488] mb-1">IAH mediu (ultima vizita)</div>
                  <div className="text-3xl font-bold text-[#065f46]">{reportData.summary.avgIAH}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-[#0d9488] mb-1">Indice desaturare mediu</div>
                  <div className="text-3xl font-bold text-[#065f46]">{reportData.summary.avgDesatIndex}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-[#0d9488] mb-1">SpO2 medie / T90 mediu</div>
                  <div className="text-3xl font-bold text-[#065f46]">{reportData.summary.avgSpO2Mean} / {reportData.summary.avgT90}%</div>
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
                        <td className="px-6 py-4 font-semibold">{p.latestIAH ?? 'N/A'}</td>
                        <td className="px-6 py-4">{p.latestDesatIndex ?? 'N/A'}</td>
                        <td className="px-6 py-4">{p.latestSpO2Mean ?? 'N/A'}</td>
                        <td className="px-6 py-4">{p.latestT90 ?? 'N/A'}</td>
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
                  <div className="text-sm text-[#0d9488] mb-1">Total Pacienți</div>
                  <div className="text-3xl font-bold text-[#065f46]">{reportData.summary.total}</div>
                </div>
                <div className="bg-green-50 rounded-lg shadow-md p-6">
                  <div className="text-sm text-green-800 mb-1">Complianți (≥70%)</div>
                  <div className="text-3xl font-bold text-green-600">{reportData.summary.compliant}</div>
                </div>
                <div className="bg-red-50 rounded-lg shadow-md p-6">
                  <div className="text-sm text-red-800 mb-1">Non-complianți (&lt;70%)</div>
                  <div className="text-3xl font-bold text-red-600">{reportData.summary.nonCompliant}</div>
                </div>
                <div className="bg-[#f0fdfa] rounded-lg shadow-md p-6">
                  <div className="text-sm text-[#065f46] mb-1">Rată Complianță</div>
                  <div className="text-3xl font-bold text-[#14b8a6]">{reportData.summary.complianceRate}%</div>
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
                              <td className="px-6 py-4">{visit.ahiResidual || 'N/A'}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${severity.color}-100 text-${severity.color}-800`}>
                                  {severity.label}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {visit.compliance ? (
                                  <span className={`font-semibold ${visit.compliance >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                    {visit.compliance}%
                                  </span>
                                ) : 'N/A'}
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


