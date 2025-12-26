import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetails from './pages/PatientDetails';
import AddPatient from './pages/AddPatient';
import VisitForm from './pages/VisitForm';
import StopBang from './pages/StopBang';
import Epworth from './pages/Epworth';
import DataDictionary from './pages/DataDictionary';
import Reports from './pages/Reports';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/patients/add" element={<AddPatient />} />
                    <Route path="/patients/:id" element={<PatientDetails />} />
                    <Route path="/patients/:patientId/visits/new" element={<VisitForm />} />
                    <Route path="/visits/:visitId/edit" element={<VisitForm />} />
                    <Route path="/patients/:id/stop-bang" element={<StopBang />} />
                    <Route path="/patients/:id/epworth" element={<Epworth />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/data-dictionary" element={<DataDictionary />} />
                  </Routes>
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
