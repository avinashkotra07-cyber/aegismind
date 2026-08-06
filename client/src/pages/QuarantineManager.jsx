import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import HoneypotStatusBadge from '../components/HoneypotStatusBadge';
import api from '../services/api';
import { Flame, ShieldOff, Plus, ShieldCheck, RefreshCw } from 'lucide-react';
import { telemetryWS } from '../services/websocket';

const QuarantineManager = () => {
  const [quarantineList, setQuarantineList] = useState([]);
  const [newIp, setNewIp] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchQuarantineList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quarantine');
      setQuarantineList(res.data || []);
    } catch (err) {
      console.error('Failed to load quarantine list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuarantineList();

    const unsubscribe = telemetryWS.subscribe((event) => {
      if (event.type === 'QUARANTINE_ADDED') {
        setQuarantineList((prev) => [event.data, ...prev]);
      }
      if (event.type === 'QUARANTINE_RELEASED') {
        setQuarantineList((prev) =>
          prev.map((q) => (q.ip_address === event.data.ip_address ? { ...q, status: 'RELEASED' } : q))
        );
      }
    });

    return unsubscribe;
  }, []);

  const handleToggle = async (ipAddress, action) => {
    try {
      await api.post('/quarantine/toggle', {
        ip_address: ipAddress,
        action,
        reason: action === 'ADD' ? reason || 'Manual Admin Quarantine Override' : undefined
      });
      fetchQuarantineList();
      if (action === 'ADD') {
        setNewIp('');
        setReason('');
      }
    } catch (err) {
      alert('Operation failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col font-sans">
      <Navbar activeQuarantineCount={quarantineList.filter((q) => q.status === 'ACTIVE').length} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
                <Flame className="w-5 h-5 text-rose-400" />
                <span>DYNAMIC HONEYPOT & QUARANTINE MANAGER</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Automated IP isolation and mock environment redirection for intercepted attackers
              </p>
            </div>

            <button
              onClick={fetchQuarantineList}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Blacklist</span>
            </button>
          </div>

          {/* Manual IP Add Form */}
          <div className="glass-card p-5 rounded-2xl border border-cyber-border font-mono text-xs">
            <h3 className="font-bold text-white text-xs tracking-wider uppercase mb-3 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>MANUALLY ISOLATE ATTACKER IP</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Target IP (e.g. 192.168.1.105)"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="Quarantine Reason / OWASP Category"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleToggle(newIp, 'ADD')}
                disabled={!newIp}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold hover:from-rose-400 hover:to-red-500 transition-all shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                ISOLATE IP TO HONEYPOT
              </button>
            </div>
          </div>

          {/* Quarantined List Table */}
          <div className="glass-card rounded-2xl border border-cyber-border overflow-hidden">
            <div className="p-4 border-b border-cyber-border bg-slate-900/60 flex items-center justify-between">
              <h3 className="font-bold text-white font-mono text-sm tracking-wide">ACTIVE QUARANTINE REGISTRY</h3>
              <span className="text-xs text-slate-500 font-mono">({quarantineList.length} total recorded IPs)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-cyber-border bg-slate-950/60 text-slate-400 text-[11px] uppercase">
                    <th className="py-3 px-4">Quarantined IP</th>
                    <th className="py-3 px-4">Reason / Threat Vector</th>
                    <th className="py-3 px-4">Quarantined Timestamp</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border text-slate-300">
                  {quarantineList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                        No IP addresses are currently quarantined in honeypot.
                      </td>
                    </tr>
                  ) : (
                    quarantineList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white text-sm">{item.ip_address}</td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">{item.reason}</td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {new Date(item.quarantined_at).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <HoneypotStatusBadge isQuarantined={item.status === 'ACTIVE'} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {item.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleToggle(item.ip_address, 'RELEASE')}
                              className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-bold transition-colors"
                            >
                              Release IP
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggle(item.ip_address, 'ADD')}
                              className="px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-bold transition-colors"
                            >
                              Re-Isolate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default QuarantineManager;
