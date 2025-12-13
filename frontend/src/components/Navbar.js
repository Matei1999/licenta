import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-text-main">Sleep Apnea Management</h1>
            <div className="flex space-x-4">
              <Link 
                to="/dashboard" 
                className="px-3 py-2 rounded-md text-sm font-medium text-text-main hover:bg-surface transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                to="/patients" 
                className="px-3 py-2 rounded-md text-sm font-medium text-text-main hover:bg-surface transition-colors"
              >
                Patients
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-text-subtle">{user?.name || 'Matei'}</span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
