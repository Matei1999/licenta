import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ExportModal from '../components/ExportModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterCompliance, setFilterCompliance] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    severe: 0,
    compliant: 0,
    nonCompliant: 0,
    avgAhi: 0,
    avgCompliance: 0
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-main">Dashboard - Management OSA</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/patients/add')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 shadow-sm font-medium transition-colors"
            >
              <span className="text-lg">+</span> Pacient Nou
            </button>
            <button
              onClick={() => navigate('/data-dictionary')}
              className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 shadow-sm font-medium transition-colors"
            >
              📚 Dicționar Date
            </button>
          </div>
        </div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-primary to-teal-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-50 text-sm font-medium">Total Pacienți</p>
                <p className="text-4xl font-bold mt-2">{stats.total}</p>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-3xl">👥</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-highlight-bg to-yellow-100 rounded-xl shadow-lg p-6 border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-highlight-text text-sm font-medium">IAH Mediu</p>
                <p className="text-4xl font-bold mt-2 text-highlight-text">{stats.avgAhi}</p>
                <p className="text-xs text-highlight-text/80 mt-1">evenimente/oră</p>
              </div>
              <div className="w-16 h-16 bg-highlight-text/10 rounded-full flex items-center justify-center">
                <span className="text-3xl">📊</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-secondary to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-50 text-sm font-medium">Complianță Medie</p>
                <p className="text-4xl font-bold mt-2">{stats.avgCompliance}%</p>
                <p className="text-xs text-blue-50 mt-1">utilizare CPAP</p>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-50 text-sm font-medium">OSA Sever</p>
                <p className="text-4xl font-bold mt-2">{stats.severe}</p>
                <p className="text-xs text-red-50 mt-1">IAH ≥ 30</p>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
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
