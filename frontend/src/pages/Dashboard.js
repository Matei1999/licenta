import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ExportModal from '../components/ExportModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [showExportModal, setShowExportModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    severe: 0,
    compliant: 0,
    nonCompliant: 0,
    avgCompliance: 0,
    histBins: [],
    histTotal: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/patients/stats/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const histMax = stats.histBins?.length ? Math.max(1, ...stats.histBins.map((x) => x.count)) : 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Monitorizare pacienți OSA</p>
            <h1 className="text-3xl font-black text-gray-900 leading-tight">Dashboard - Management OSA</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/patients')}
              className="px-4 py-2 bg-gradient-to-r from-primary to-teal-500 text-white rounded-lg hover:from-teal-600 hover:to-primary-dark flex items-center gap-2 shadow-lg font-semibold transition-all border border-primary/30"
            >
              <span className="text-lg">👥</span> Lista Pacienți
            </button>
            <button
              onClick={() => navigate('/patients/add')}
              className="px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg hover:from-green-500 hover:to-green-700 flex items-center gap-2 shadow-lg font-semibold transition-all border border-green-500/30"
            >
              <span className="text-lg">➕</span> Pacient Nou
            </button>
            <button
              onClick={() => navigate('/data-dictionary')}
              className="px-4 py-2 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-lg hover:from-purple-500 hover:to-purple-700 flex items-center gap-2 shadow-lg font-semibold transition-all border border-purple-500/30"
            >
              <span className="text-lg">📚</span> Dicționar Date
            </button>
          </div>
        </div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary to-teal-600 rounded-2xl shadow-xl p-6 text-white flex flex-col items-center text-center gap-3">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,#ffffff40,transparent_35%),radial-gradient(circle_at_70%_0%,#ffffff20,transparent_45%)]"></div>
            <div className="relative flex flex-col items-center gap-1">
              <p className="text-teal-50 text-sm font-semibold tracking-wide">Total Pacienți</p>
              <p className="text-5xl font-black leading-tight drop-shadow-sm">{stats.total}</p>
              <div className="px-3 py-1 bg-white/15 rounded-full text-xs uppercase tracking-[0.15em]">înregistrați</div>
            </div>
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-white/15 border border-white/30 text-2xl mt-1">👥</div>
          </div>
          <div className="relative bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 font-semibold">Histograma IAH (ultima vizită)</p>
                <p className="text-xs text-gray-500">distribuție pe pacienți</p>
              </div>
              <span className="px-3 py-1 text-xs bg-teal-50 text-teal-700 rounded-full font-semibold shadow-sm">{stats.histTotal} pacienți</span>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end h-48">
              {stats.histBins?.map((b) => {
                const colorMap = {
                  moderate: 'from-amber-300 to-orange-500',
                  severe: 'from-rose-400 to-red-600'
                };
                const barHeight = stats.histTotal ? Math.max(12, Math.round((b.count / histMax) * 100)) : 12;
                return (
                  <div key={b.key} className="flex flex-col items-center gap-2 text-center">
                    <div className="w-full h-36 bg-gray-100 rounded-xl flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-t-xl shadow-inner bg-gradient-to-t ${colorMap[b.key] || 'from-indigo-300 to-indigo-600'}`}
                        style={{ height: `${barHeight}%` }}
                        title={`${b.label}: ${b.count}`}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 font-medium leading-tight">{b.label}</div>
                    <div className="text-sm font-semibold text-gray-900">{b.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-secondary to-blue-600 rounded-2xl shadow-xl p-6 text-white flex flex-col items-center text-center gap-3">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,#ffffff30,transparent_40%)]"></div>
            <div className="relative flex flex-col items-center gap-1">
              <p className="text-blue-50 text-sm font-semibold tracking-wide">Complianță Medie</p>
              <p className="text-5xl font-black leading-tight drop-shadow-sm">{stats.avgCompliance}%</p>
              <div className="px-3 py-1 bg-white/15 rounded-full text-xs uppercase tracking-[0.15em]">utilizare CPAP</div>
            </div>
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-white/15 border border-white/30 text-2xl mt-1">✓</div>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-6 text-white flex flex-col items-center text-center gap-3">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_10%,#ffffff30,transparent_40%)]"></div>
            <div className="relative flex flex-col items-center gap-1">
              <p className="text-red-50 text-sm font-semibold tracking-wide">OSA Sever</p>
              <p className="text-5xl font-black leading-tight drop-shadow-sm">{stats.severe}</p>
              <div className="px-3 py-1 bg-white/15 rounded-full text-xs uppercase tracking-[0.15em]">IAH ≥ 30</div>
            </div>
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-white/15 border border-white/30 text-2xl mt-1">⚠️</div>
          </div>
        </div>
        {/* Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Status Complianță CPAP</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#065f46]">Complianți (≥70%)</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                  {stats.compliant}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#065f46]">Non-complianți (&lt;70%)</span>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
                  {stats.nonCompliant}
                </span>
              </div>
              <div className="mt-4 bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-500"
                  style={{ 
                    width: `${stats.compliant + stats.nonCompliant > 0 ? (stats.compliant / (stats.compliant + stats.nonCompliant) * 100) : 0}%` 
                  }}
                />
              </div>
              <p className="text-sm text-[#0d9488] text-center mt-2">
                {stats.compliant + stats.nonCompliant > 0 
                  ? `${Math.round(stats.compliant / (stats.compliant + stats.nonCompliant) * 100)}%` 
                  : '0%'} rată complianță
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Acțiuni Rapide</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/patients/add')}
                className="w-full px-4 py-3 bg-[#f0fdfa] text-[#14b8a6] rounded-lg hover:bg-[#ccfbf1] text-left flex items-center gap-3"
              >
                <span className="text-xl">➕</span>
                <div>
                  <p className="font-semibold">Adaugă Pacient Nou</p>
                  <p className="text-xs text-[#0d9488]">Înregistrare pacient OSA</p>
                </div>
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-left flex items-center gap-3"
              >
                <span className="text-xl">📊</span>
                <div>
                  <p className="font-semibold">Generează Raport</p>
                  <p className="text-xs text-[#0d9488]">Raport complianță sau IAH</p>
                </div>
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-left flex items-center gap-3"
              >
                <span className="text-xl">📥</span>
                <div>
                  <p className="font-semibold">Export Date</p>
                  <p className="text-xs text-[#0d9488]">Exportă CSV (anonimizat)</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
      />

    </div>
  );
};

export default Dashboard;
