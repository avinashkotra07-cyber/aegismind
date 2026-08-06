import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Radio, ShieldAlert, Cpu, Flame, Sliders, Activity } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { path: '/dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
    { path: '/interceptor', label: 'Traffic Interceptor', icon: Radio },
    { path: '/threats', label: 'Threat Intelligence', icon: ShieldAlert },
    { path: '/remediation', label: 'AI Patch Studio', icon: Cpu },
    { path: '/quarantine', label: 'Quarantine & Honeypot', icon: Flame },
    { path: '/settings', label: 'Policy Engine', icon: Sliders }
  ];

  return (
    <aside className="w-64 bg-[#0b0f19] border-r border-cyber-border min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div className="px-3 py-2 text-[11px] font-mono font-bold tracking-widest text-slate-500 uppercase">
          NAVIGATION SOC
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer System Widget */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span>AI ENGINE</span>
          <span className="text-cyan-400 font-bold">GEMINI 2.5</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>SANDBOX</span>
          <span className="text-emerald-400 font-bold">NODE:VM</span>
        </div>
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center space-x-1">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>PROTECTION</span>
          </span>
          <span className="text-emerald-400 font-bold">100% ACTIVE</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
