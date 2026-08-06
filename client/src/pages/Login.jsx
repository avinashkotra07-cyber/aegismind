import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('admin@aegismind.io');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Cyber Glow Gradients */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-cyber-border shadow-2xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20 mb-4">
            <Shield className="w-8 h-8 text-slate-950 font-bold" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wider text-white font-mono">
            AEGIS<span className="text-cyan-400">MIND</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Autonomous Cyber Defense SOC Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Officer Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                placeholder="admin@aegismind.io"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Security Access Key
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-mono font-bold text-sm hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 mt-6"
          >
            <span>{loading ? 'AUTHENTICATING...' : 'AUTHENTICATE ACCESS'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Creds Hint */}
        <div className="mt-6 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center font-mono text-[11px] text-slate-400 space-y-1">
          <div className="text-cyan-400 font-bold">DEFAULT DEMO CREDENTIALS:</div>
          <div>Admin: <code className="text-white">admin@aegismind.io</code> / <code className="text-white">Admin@123</code></div>
          <div>Analyst: <code className="text-white">analyst@aegismind.io</code> / <code className="text-white">Analyst@123</code></div>
        </div>

        <p className="text-center text-xs text-slate-500 font-mono mt-6">
          Don't have an officer account?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline">
            Register Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
