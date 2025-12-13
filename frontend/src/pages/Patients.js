import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [statusFilter]);

  const fetchPatients = async () => {
    try {
      let url = '/api/patients';
      const params = [];
      if (statusFilter) params.push(`status=${statusFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await axios.get(url);
      setPatients(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await axios.delete(`/api/patients/${id}`);
        fetchPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Failed to delete patient');
      }
    }
  };

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           patient.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return <div className="loading">Loading patients...</div>;
  }

  return (
    <div className="container">
      <div className="flex justify-between align-center mb-3">
        <h2>Patients</h2>
        <Link to="/patients/add" className="btn btn-primary">
          Add New Patient
        </Link>
      </div>

      <div className="card mb-2">
        <div className="flex gap-2">
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ width: '200px', marginBottom: 0 }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Discharged">Discharged</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Diagnosis Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">No patients found</td>
                </tr>
              ) : (
                filteredPatients.map(patient => (
                  <tr key={patient._id}>
                    <td>{patient.firstName} {patient.lastName}</td>
                    <td>{patient.email}</td>
                    <td>{patient.phone}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: patient.status === 'Active' ? '#d4edda' : '#f8d7da',
                        color: patient.status === 'Active' ? '#155724' : '#721c24'
                      }}>
                        {patient.status}
                      </span>
                    </td>
                    <td>
                      {patient.sleepApneaDetails?.diagnosisDate 
                        ? new Date(patient.sleepApneaDetails.diagnosisDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <Link to={`/patients/${patient._id}`} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem' }}>
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(patient._id)}
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Patients;
