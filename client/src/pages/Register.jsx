import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, User, ShieldAlert, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('sec_analyst');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, fullName, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-cyber-border shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20 mb-4">
            <Shield className="w-8 h-8 text-slate-950 font-bold" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wider text-white font-mono">
            REGISTER <span className="text-cyan-400">OFFICER</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Enroll Cyber Security Personnel</p>
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
              Full Officer Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                placeholder="Alex Mercer"
              />
            </div>
          </div>

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
                placeholder="officer@aegismind.io"
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

          <div>
            <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Role Designation
            </label>
            <div className="relative">
              <ShieldAlert className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="sec_analyst">Security Analyst</option>
                <option value="admin">System Administrator</option>
                <option value="auditor">Compliance Auditor</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-mono font-bold text-sm hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 mt-6"
          >
            <span>{loading ? 'REGISTERING...' : 'REGISTER OFFICER ACCOUNT'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 font-mono mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-cyan-400 hover:underline">
            Login Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
