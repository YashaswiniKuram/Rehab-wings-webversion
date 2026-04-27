import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerPatient, loginPatient, setPassword } from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'set-password'
  const [form, setForm] = useState({ name: '', patient_id: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;

      if (mode === 'register') {
        if (!form.name.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }
        res = await registerPatient({
          name: form.name.trim(),
          patient_id: form.patient_id.trim(),
          password: form.password,
        });
      } else if (mode === 'set-password') {
        res = await setPassword({
          patient_id: form.patient_id.trim(),
          password: form.password,
        });
      } else {
        res = await loginPatient({
          patient_id: form.patient_id.trim(),
          password: form.password,
        });
      }

      // Save token & player info
      const data = res.data;
      localStorage.setItem('token', data.token);
      localStorage.setItem(
        'player',
        JSON.stringify({
          name: data.name,
          patient_id: data.patient_id,
          high_score: data.high_score,
        })
      );

      navigate('/game');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Something went wrong. Please try again.';

      // If desktop patient needs to set password
      if (err.response?.status === 428) {
        setMode('set-password');
        setError('');
      } else {
        setError(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="glass-card p-8 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🐦</div>
            <h1 className="text-2xl font-bold text-slate-100">
              {mode === 'register'
                ? 'Create Account'
                : mode === 'set-password'
                ? 'Set Web Password'
                : 'Welcome Back'}
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              {mode === 'register'
                ? 'Create a new patient account to start playing'
                : mode === 'set-password'
                ? 'Your account was created on the desktop app. Set a password for web access.'
                : 'Sign in with your Patient ID'}
            </p>
          </div>

          {/* Mode Toggle (Login / Register) */}
          {mode !== 'set-password' && (
            <div className="flex bg-slate-900/60 rounded-xl p-1 mb-6">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  mode === 'login'
                    ? 'bg-primary-500/20 text-primary-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Existing Patient
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  mode === 'register'
                    ? 'bg-primary-500/20 text-primary-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                New Patient
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field (register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="label-text">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="input-field"
                  autoComplete="name"
                />
              </div>
            )}

            {/* Patient ID */}
            <div>
              <label htmlFor="patient_id" className="label-text">
                Patient ID
              </label>
              <input
                id="patient_id"
                name="patient_id"
                type="text"
                value={form.patient_id}
                onChange={handleChange}
                placeholder="Enter your Patient ID"
                className="input-field"
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label-text">
                {mode === 'set-password' ? 'Create Password' : 'Password'}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder={
                  mode === 'set-password'
                    ? 'Create a password (min 4 characters)'
                    : 'Enter your password'
                }
                className="input-field"
                required
                minLength={mode === 'register' || mode === 'set-password' ? 4 : 1}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-slide-up">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Please wait...</span>
                </>
              ) : mode === 'register' ? (
                '🚀 Create Account & Play'
              ) : mode === 'set-password' ? (
                '🔐 Set Password & Play'
              ) : (
                '🎮 Login & Play'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
