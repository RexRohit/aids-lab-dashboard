import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowLeft, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  FileSpreadsheet
} from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await login(username.trim(), password);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.error || 'Invalid credentials. Access denied.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check connection to backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      {/* Back to Public Dashboard button */}
      <div className="absolute top-6 left-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Public Dashboard</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          Admin Portal Authentication
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          AI & DS Laboratory Audit & Cloud Spreadsheet Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/90 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-700/60 backdrop-blur-xl space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Failed</p>
                <p className="mt-0.5 text-rose-300/90">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Username
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Enter administrator username"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter administrator password"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </div>
                ) : (
                  <span>Authenticate as Administrator</span>
                )}
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-700/60 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Persistent Storage: Google Sheets + Live Socket Sync</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
