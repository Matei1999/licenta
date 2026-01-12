import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#6f7ff9] via-[#7e96ff] to-[#8bb4ff] px-4 py-12">
      <div className="w-full max-w-6xl bg-white rounded-[28px] overflow-hidden grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]" style={{boxShadow: '0 22px 55px rgba(36, 53, 122, 0.45), 0 10px 26px rgba(36, 53, 122, 0.25)'}}>
        <div
          className="relative min-h-[320px] lg:min-h-full"
          style={{
            backgroundImage: "url('/login-hero-new.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: 'inset 0 0 0 rgba(0,0,0,0)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-[#d8e5ff]/35 to-transparent mix-blend-screen" aria-hidden="true" />
        </div>

        <div className="bg-gradient-to-br from-white via-[#f7f9ff] to-white p-8 lg:p-10 flex flex-col justify-center" style={{boxShadow: 'inset -2px 0 12px rgba(17, 24, 39, 0.06)'}}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/12 flex items-center justify-center text-[#1f4fd1] text-2xl">
              🩺
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a]">Sleep Apnea Patient Login</h1>
              <p className="text-sm text-[#334155]">Log in to access your sleep data and settings.</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#0f172a]">Email</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">✉️</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#0f172a]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-[#0f172a]">Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">🔒</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#0f172a]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#3b82f6] hover:bg-[#2d6ef4] text-white font-semibold shadow-md transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
