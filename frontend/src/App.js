import React, { useEffect } from 'react';
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
  // Prevent mouse wheel from incrementing/decrementing number inputs globally
  useEffect(() => {
    const handleWheel = (e) => {
      const target = e.target;
      if (target && target.tagName === 'INPUT' && target.getAttribute('type') === 'number') {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Hotjar: inject script when ID is provided (typically in production)
  useEffect(() => {
    const hotjarId = process.env.REACT_APP_HOTJAR_ID;
    const hotjarVersion = process.env.REACT_APP_HOTJAR_VERSION || 6;
    if (!hotjarId) return; // no ID, skip
    if (window.hj && window._hjSettings?.hjid === Number(hotjarId)) return; // already loaded

    /* eslint-disable */
    (function(h, o, t, j, a, r) {
      h.hj = h.hj || function() {
        (h.hj.q = h.hj.q || []).push(arguments);
      };
      h._hjSettings = { hjid: Number(hotjarId), hjsv: hotjarVersion };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script');
      r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
    /* eslint-enable */
  }, []);

  // Contentsquare (per screenshot): load tag if URL is provided
  useEffect(() => {
    const csqUrl = process.env.REACT_APP_CONTENTSQUARE_TAG_URL;
    console.log('Contentsquare URL:', csqUrl);
    if (!csqUrl) {
      console.log('Contentsquare: No URL configured');
      return;
    }
    if (document.querySelector(`script[src="${csqUrl}"]`)) {
      console.log('Contentsquare: Script already loaded');
      return;
    }
    console.log('Contentsquare: Loading script...');
    const script = document.createElement('script');
    script.src = csqUrl;
    script.async = true;
    document.head.appendChild(script);
    console.log('Contentsquare: Script added to head');
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

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
