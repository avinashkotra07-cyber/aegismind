import React, { useState, useEffect } from 'react';
import { Shield, Radio, Flame, User, LogOut, Terminal, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { telemetryWS } from '../services/websocket';
import AttackSimulatorModal from './AttackSimulatorModal';

const Navbar = ({ activeQuarantineCount = 0 }) => {
  const { user, logout } = useAuth();
  const [wsConnected, setWsConnected] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  useEffect(() => {
    const unsubscribe = telemetryWS.subscribeStatus((status) => {
      setWsConnected(status);
    });
    telemetryWS.connect();
    return unsubscribe;
  }, []);

  return (
    <>
      <header className="h-16 border-b border-cyber-border bg-[#0b0f19]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-lg text-white font-mono">AEGIS<span className="text-cyan-400">MIND</span></span>
              <span className="px-2 py-0.5 text-[10px] font-mono tracking-wide font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md uppercase">
                ZERO-TRUST v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Autonomous AI Cyber Defense & Dynamic Remediation Engine</p>
          </div>
        </div>

        {/* Center / Actions */}
        <div className="flex items-center space-x-4">
          {/* Live Telemetry Pulse */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className={wsConnected ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
              {wsConnected ? 'LIVE STREAM ACTIVE' : 'STREAM RECONNECTING'}
            </span>
          </div>

          {/* Active Quarantine Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-400">
            <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            <span>QUARANTINED IPs: <strong className="text-white font-bold">{activeQuarantineCount}</strong></span>
          </div>

          {/* Test Attack Payload Trigger */}
          <button
            onClick={() => setShowSimulator(true)}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-500/20"
          >
            <Terminal className="w-4 h-4" />
            <span className="hidden sm:inline">LAUNCH TEST ATTACK</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
          <div className="text-right hidden md:block">
            <div className="text-sm font-semibold text-slate-200">{user?.full_name || 'Security Admin'}</div>
            <div className="text-[11px] text-cyan-400 font-mono uppercase tracking-wider">{user?.role || 'sec_analyst'}</div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Payload Simulator Modal */}
      {showSimulator && <AttackSimulatorModal onClose={() => setShowSimulator(false)} />}
    </>
  );
};

export default Navbar;
