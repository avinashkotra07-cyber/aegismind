import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ThreatStreamTable from '../components/ThreatStreamTable';
import api from '../services/api';
import { ShieldAlert, RefreshCw, X } from 'lucide-react';

const ThreatLogs = () => {
  const [threats, setThreats] = useState([]);
  const [inspectedThreat, setInspectedThreat] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchThreats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/threats?limit=100');
      setThreats(res.data.threats || []);
    } catch (err) {
      console.error('Failed to load threat logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreats();
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
                <span>THREAT INTELLIGENCE LOGS</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Deep packet & HTTP payload telemetry classification history
              </p>
            </div>

            <button
              onClick={fetchThreats}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Log Stream</span>
            </button>
          </div>

          {/* Threat Stream Table */}
          <ThreatStreamTable threats={threats} onInspect={(threat) => setInspectedThreat(threat)} />
        </main>
      </div>

      {/* Payload Modal */}
      {inspectedThreat && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-cyber-border rounded-2xl max-w-xl w-full p-6 shadow-2xl relative font-mono text-xs text-slate-200">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3 mb-4">
              <h3 className="font-bold text-cyan-400 text-sm">RAW TELEMETRY INSPECTOR</h3>
              <button onClick={() => setInspectedThreat(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400">Incident ID:</span> <code className="text-white">{inspectedThreat.id}</code>
              </div>
              <div>
                <span className="text-slate-400">Client IP:</span> <strong className="text-cyan-300">{inspectedThreat.client_ip}</strong>
              </div>
              <div>
                <span className="text-slate-400">OWASP Mapping:</span> <span className="text-rose-400 font-bold">{inspectedThreat.owasp_mapping} - {inspectedThreat.threat_category}</span>
              </div>
              <div>
                <span className="text-slate-400">Risk Score:</span> <span className="font-bold text-amber-400">{inspectedThreat.risk_score} / 100</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">HTTP Headers Captured:</span>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(inspectedThreat.headers, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">HTTP Payload Captured:</span>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(inspectedThreat.payload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatLogs;
