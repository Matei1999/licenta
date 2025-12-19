import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [statusFilter]);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = '/api/patients';
      const params = [];
      if (statusFilter) params.push(`status=${statusFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Sigur doriți să ștergeți acest pacient?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/patients/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Eroare la ștergerea pacientului');
      }
    }
  };

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const emailMatch = patient.email ? patient.email.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return fullName.includes(searchTerm.toLowerCase()) || emailMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-[#0d9488]">Se încarcă pacienții...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#065f46]">Lista Pacienți</h1>
            <p className="text-[#0d9488] mt-1">Gestionează pacienții cu apnee de somn</p>
          </div>
          <Link
            to="/patients/add"
            className="px-6 py-3 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488] font-semibold transition-colors"
          >
            ➕ Adaugă Pacient Nou
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200/80">
          <h3 className="text-lg font-semibold text-[#065f46] mb-4">Filtrare</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-2">Căutare</label>
              <input
                type="text"
                placeholder="Nume, prenume sau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46] focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#065f46] mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-[#f0fdfa] text-[#065f46] focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent"
              >
                <option value="">Toate statusurile</option>
                <option value="Active">Activ</option>
                <option value="Inactive">Inactiv</option>
                <option value="Discharged">Externat</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-[#0d9488]">
              Afișare: <span className="font-semibold">{filteredPatients.length}</span> din <span className="font-semibold">{patients.length}</span> pacienți
            </p>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200/80">
          <div className="px-6 py-4 bg-[#f0fdfa] border-b border-gray-200/80">
            <h3 className="text-lg font-semibold text-[#065f46]">Pacienți Înregistrați</h3>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#0d9488]">
              {patients.length === 0 ? (
                <div>
                  <p className="text-xl mb-2">Nu există pacienți înregistrați</p>
                  <Link
                    to="/patients/add"
                    className="mt-4 inline-block px-4 py-2 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488]"
                  >
                    Adaugă primul pacient
                  </Link>
                </div>
              ) : (
                <p>Nu există pacienți care să corespundă criteriilor de filtrare</p>
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
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#065f46] uppercase tracking-wider">
                      Vârstă
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#065f46] uppercase tracking-wider">
                      Sex
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#065f46] uppercase tracking-wider">
                      Status
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
                            {patient.cnp && (
                              <div className="text-sm text-[#0d9488]">CNP: {patient.cnp}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-[#065f46]">{patient.email || 'Fără email'}</div>
                            <div className="text-[#0d9488]">{patient.phone || 'Fără telefon'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[#065f46]">
                          {age ? `${age} ani` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[#065f46]">
                          {patient.gender === 'Male' ? 'Masculin' : patient.gender === 'Female' ? 'Feminin' : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            patient.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : patient.status === 'Inactive'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {patient.status === 'Active' ? 'Activ' : patient.status === 'Inactive' ? 'Inactiv' : patient.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/patients/${patient.id}`);
                              }}
                              className="px-3 py-1 bg-[#14b8a6] text-white rounded hover:bg-[#0d9488] font-medium"
                            >
                              Vezi
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(patient.id);
                              }}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 font-medium"
                            >
                              Șterge
                            </button>
                          </div>
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
