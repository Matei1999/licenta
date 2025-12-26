import React, { useState } from 'react';

const ExportModal = ({ isOpen, onClose }) => {
  const [options, setOptions] = useState({
    anonymizeNames: false,
    removeCNP: true,
    pseudonymize: false,
    includeVisits: true
  });
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        anonymizeNames: options.anonymizeNames.toString(),
        pseudonymize: options.pseudonymize.toString(),
        includeVisits: options.includeVisits.toString()
      });

      const response = await fetch(`/api/export/patients?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pacienti_osa_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('Eroare la export. Verifică consola pentru detalii.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Export Date CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Informații:</strong> Exportul va include toți pacienții din sistem cu opțiunile selectate mai jos.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeVisits}
                onChange={(e) => setOptions({ ...options, includeVisits: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-700">Include datele vizitelor</span>
                <p className="text-xs text-gray-500">Adaugă IAH, complianță și alte metrici din ultima vizită</p>
              </div>
            </label>

            <div className="border-t pt-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">🔒 Opțiuni Anonimizare (GDPR)</p>
              
              <label className="flex items-center space-x-3 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={options.anonymizeNames}
                  onChange={(e) => setOptions({ ...options, anonymizeNames: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <div>
                  <span className="text-gray-700">Anonimizează nume</span>
                  <p className="text-xs text-gray-500">Exclude prenume și nume din export</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-not-allowed mb-2">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  disabled
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <div>
                  <span className="text-gray-700">CNP exclus implicit (GDPR)</span>
                  <p className="text-xs text-gray-500">CNP nu este exportat indiferent de opțiuni</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.pseudonymize}
                  onChange={(e) => setOptions({ ...options, pseudonymize: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <div>
                  <span className="text-gray-700">Pseudonimizează ID-uri</span>
                  <p className="text-xs text-gray-500">Înlocuiește UUID cu SUBJ-001, SUBJ-002, etc.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={exporting}
          >
            Anulează
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {exporting ? 'Se exportă...' : '📥 Exportă CSV'}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Fișierul CSV va fi compatibil cu Excel și poate fi deschis cu UTF-8
        </p>
      </div>
    </div>
  );
};

export default ExportModal;
