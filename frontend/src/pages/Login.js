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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#6a5cf6] via-[#5a65d6] to-[#4f4fb4] px-4 py-10">
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        <div
          className="relative min-h-[260px] lg:min-h-full"
          style={{
            backgroundImage: "url('/login-hero.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/18" aria-hidden="true" />
        </div>

        <div className="bg-gradient-to-br from-white via-[#f7f9ff] to-white p-8 lg:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] text-2xl">
              🩺
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1f2937]">Sleep Apnea Patient Login</h1>
              <p className="text-sm text-[#475569]">Log in to access your sleep data and settings.</p>
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
              className="w-full py-2.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold shadow-md transition"
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
