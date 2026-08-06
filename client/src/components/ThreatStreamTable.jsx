import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Eye, CheckCircle, Flame, Filter, Search } from 'lucide-react';

const ThreatStreamTable = ({ threats = [], onInspect }) => {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const getRiskBadge = (score) => {
    if (score >= 80) {
      return (
        <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center space-x-1 w-max">
          <Flame className="w-3 h-3 text-rose-400" />
          <span>CRITICAL ({score})</span>
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1 w-max">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>HIGH ({score})</span>
        </span>
      );
    }
    if (score >= 30) {
      return (
        <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center space-x-1 w-max">
          <span>MEDIUM ({score})</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 w-max">
        <CheckCircle className="w-3 h-3 text-emerald-400" />
        <span>LOW ({score})</span>
      </span>
    );
  };

  const filteredThreats = threats.filter((threat) => {
    if (filterSeverity === 'CRITICAL' && threat.risk_score < 80) return false;
    if (filterSeverity === 'HIGH' && (threat.risk_score < 60 || threat.risk_score >= 80)) return false;
    if (filterSeverity === 'LOW' && threat.risk_score >= 60) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        threat.client_ip.includes(q) ||
        threat.request_path.toLowerCase().includes(q) ||
        threat.threat_category.toLowerCase().includes(q) ||
        threat.owasp_mapping.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="glass-card rounded-2xl border border-cyber-border overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 border-b border-cyber-border flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/60">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white font-mono text-sm tracking-wide">REAL-TIME THREAT TELEMETRY STREAM</h3>
          <span className="text-xs text-slate-500 font-mono">({filteredThreats.length} events)</span>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search IP, endpoint, OWASP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterSeverity === sev ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-cyber-border bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Client IP</th>
              <th className="py-3 px-4">Endpoint</th>
              <th className="py-3 px-4">Threat Category</th>
              <th className="py-3 px-4">OWASP Mapping</th>
              <th className="py-3 px-4">Risk Score</th>
              <th className="py-3 px-4">Status / Action</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyber-border font-mono text-xs text-slate-300">
            {filteredThreats.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                  No threat incidents match the current query.
                </td>
              </tr>
            ) : (
              filteredThreats.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(t.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">{t.client_ip}</td>
                  <td className="py-3 px-4 text-cyan-300 font-mono">
                    <span className="text-slate-500 font-bold mr-1">{t.request_method}</span>
                    {t.request_path}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{t.threat_category}</td>
                  <td className="py-3 px-4 text-slate-400">{t.owasp_mapping}</td>
                  <td className="py-3 px-4">{getRiskBadge(t.risk_score)}</td>
                  <td className="py-3 px-4">
                    {t.is_quarantined ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        HONEYPOT QUARANTINE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-400">
                        {t.action_taken}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onInspect && onInspect(t)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors"
                      title="Inspect Payload"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ThreatStreamTable;
