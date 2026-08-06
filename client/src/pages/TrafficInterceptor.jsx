import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { telemetryWS } from '../services/websocket';
import {
  Radio,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  Play,
  Pause,
  RefreshCw,
  Terminal,
  Cpu,
  Flame,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  X
} from 'lucide-react';

const TrafficInterceptor = () => {
  const [mode, setMode] = useState('ACTIVE_BLOCK');
  const [stats, setStats] = useState({ total_packets_inspected: 142, total_threats_blocked: 29 });
  const [packets, setPackets] = useState([]);
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  // Replay packet state
  const [replayIp, setReplayIp] = useState('192.168.1.105');
  const [replayMethod, setReplayMethod] = useState('POST');
  const [replayPath, setReplayPath] = useState('/api/v1/users/search');
  const [replayPayload, setReplayPayload] = useState('{\n  "username": "admin\' OR \'1\'=\'1\' --"\n}');
  const [replaying, setReplaying] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/interceptor/status');
      if (res.data) {
        setMode(res.data.mode || 'ACTIVE_BLOCK');
        setStats({
          total_packets_inspected: res.data.total_packets_inspected || 142,
          total_threats_blocked: res.data.total_threats_blocked || 29
        });
      }
    } catch (err) {
      console.error('Failed to load interceptor status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const unsubscribe = telemetryWS.subscribe((event) => {
      if (event.type === 'PACKET_INTERCEPTED' && !isPaused) {
        setPackets((prev) => [event.data, ...prev.slice(0, 49)]);
        setStats((prev) => ({
          total_packets_inspected: prev.total_packets_inspected + 1,
          total_threats_blocked: event.data.action === 'BLOCKED' ? prev.total_threats_blocked + 1 : prev.total_threats_blocked
        }));
      }

      if (event.type === 'INTERCEPTOR_MODE_CHANGED') {
        setMode(event.data.mode);
      }
    });

    return unsubscribe;
  }, [isPaused]);

  const handleModeChange = async (newMode) => {
    try {
      const res = await api.put('/interceptor/mode', { mode: newMode });
      setMode(res.data.state.mode);
    } catch (err) {
      alert('Failed to change interceptor mode: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleReplay = async () => {
    setReplaying(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(replayPayload);
      } catch (e) {
        parsed = { raw: replayPayload };
      }

      const res = await api.post('/interceptor/replay', {
        client_ip: replayIp,
        request_method: replayMethod,
        request_path: replayPath,
        payload: parsed,
        headers: { 'user-agent': 'AegisMind-TrafficInterceptor/1.0' }
      });

      setSelectedPacket(res.data);
    } catch (err) {
      alert('Packet replay failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setReplaying(false);
    }
  };

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
                <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                <span>ZERO-TRUST TRAFFIC INTERCEPTOR & PACKET INSPECTOR</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Real-time HTTP payload inspection pipeline, active packet filtering, and OWASP semantic risk scoring
              </p>
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                isPaused
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-cyan-400'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isPaused ? 'RESUME PACKET STREAM' : 'PAUSE PACKET STREAM'}</span>
            </button>
          </div>

          {/* Operational Mode Selector Bar */}
          <div className="glass-card p-5 rounded-2xl border border-cyber-border font-mono text-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-slate-400 uppercase text-[11px] font-bold block mb-1">INTERCEPTOR OPERATING MODE</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-bold text-sm">CURRENT MODE:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                      mode === 'ACTIVE_BLOCK'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/10'
                        : mode === 'ZERO_TRUST_STRICT'
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    {mode.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Mode Options */}
              <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => handleModeChange('ACTIVE_BLOCK')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === 'ACTIVE_BLOCK'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ACTIVE PROTECTION
                </button>
                <button
                  onClick={() => handleModeChange('PASSIVE_MONITOR')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === 'PASSIVE_MONITOR'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PASSIVE MONITOR
                </button>
                <button
                  onClick={() => handleModeChange('ZERO_TRUST_STRICT')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === 'ZERO_TRUST_STRICT'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  STRICT ZERO-TRUST
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Visual Traffic Pipeline Diagram */}
          <div className="glass-card p-6 rounded-2xl border border-cyber-border space-y-4">
            <h3 className="font-bold text-white font-mono text-xs tracking-wider uppercase border-b border-cyber-border pb-3 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>LIVE TRAFFIC INSPECTION PIPELINE</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center font-mono text-xs">
              {/* Step 1: Ingress */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="font-bold text-white text-xs">1. HTTP INGRESS</div>
                <p className="text-[10px] text-slate-400">Captures Headers, Query Params, Body & IP</p>
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-cyan-500 z-10 font-bold">
                  <ArrowRight className="w-5 h-5 animate-pulse" />
                </div>
              </div>

              {/* Step 2: Packet Filter */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
                  <Filter className="w-4 h-4" />
                </div>
                <div className="font-bold text-white text-xs">2. PACKET FILTER</div>
                <p className="text-[10px] text-slate-400">Sanitizes payload structure & AST signatures</p>
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-cyan-500 z-10 font-bold">
                  <ArrowRight className="w-5 h-5 animate-pulse" />
                </div>
              </div>

              {/* Step 3: AI Risk Scoring */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="font-bold text-white text-xs">3. GEMINI AI SCORING</div>
                <p className="text-[10px] text-slate-400">Calculates Risk Index (0-100) & OWASP vector</p>
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-cyan-500 z-10 font-bold">
                  <ArrowRight className="w-5 h-5 animate-pulse" />
                </div>
              </div>

              {/* Step 4: Decision & Action */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="font-bold text-white text-xs">4. HONEYPOT / ALLOW</div>
                <p className="text-[10px] text-slate-400">Reroutes threats to Honeypot or releases clean payload</p>
              </div>
            </div>
          </div>

          {/* Main Grid: Live Packet Stream Table & Replay Studio */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Packet Stream (2 Cols) */}
            <div className="lg:col-span-2 glass-card rounded-2xl border border-cyber-border overflow-hidden">
              <div className="p-4 border-b border-cyber-border bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center space-x-2 font-mono text-xs font-bold text-white">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span>LIVE INTERCEPTED PACKET STREAM</span>
                  <span className="text-slate-500">({packets.length} buffered)</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-cyber-border bg-slate-950/60 text-slate-400 text-[11px] uppercase">
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Client IP</th>
                      <th className="py-3 px-4">Endpoint</th>
                      <th className="py-3 px-4">Risk Score</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border text-slate-300">
                    {packets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                          Waiting for live HTTP request packets. Use the Replay Studio or Launch Test Attack tool.
                        </td>
                      </tr>
                    ) : (
                      packets.map((pkt, idx) => (
                        <tr key={pkt.id || idx} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {new Date(pkt.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">{pkt.client_ip}</td>
                          <td className="py-3 px-4 text-cyan-300">
                            <span className="text-slate-500 font-bold mr-1">{pkt.method}</span>
                            {pkt.path}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                pkt.risk_score >= 80
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : pkt.risk_score >= 40
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {pkt.risk_score} / 100
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                pkt.action === 'BLOCKED'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : pkt.action === 'QUARANTINED'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400'
                              }`}
                            >
                              {pkt.action || 'PASSED'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedPacket(pkt)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold transition-colors"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Replay & Packet Crafting Studio (1 Col) */}
            <div className="glass-card p-5 rounded-2xl border border-cyber-border font-mono text-xs space-y-4">
              <h3 className="font-bold text-white text-xs tracking-wider uppercase border-b border-cyber-border pb-3 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>PACKET CRAFTING & REPLAY STUDIO</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 block mb-1">Source Client IP</label>
                  <input
                    type="text"
                    value={replayIp}
                    onChange={(e) => setReplayIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Method</label>
                    <select
                      value={replayMethod}
                      onChange={(e) => setReplayMethod(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="POST">POST</option>
                      <option value="GET">GET</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Target Path</label>
                    <input
                      type="text"
                      value={replayPath}
                      onChange={(e) => setReplayPath(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">JSON Body Payload</label>
                  <textarea
                    rows={4}
                    value={replayPayload}
                    onChange={(e) => setReplayPayload(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={handleReplay}
                  disabled={replaying}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{replaying ? 'INTERCEPTING PACKET...' : 'DISPATCH TEST PACKET'}</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Packet Inspector Modal */}
      {selectedPacket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-cyber-border rounded-2xl max-w-xl w-full p-6 shadow-2xl relative font-mono text-xs text-slate-200">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3 mb-4">
              <h3 className="font-bold text-cyan-400 text-sm">PACKET DEEP INSPECTOR (#{selectedPacket.id})</h3>
              <button onClick={() => setSelectedPacket(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400">Timestamp:</span> <span className="text-white">{new Date(selectedPacket.timestamp).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400">Client IP:</span> <strong className="text-cyan-300">{selectedPacket.client_ip}</strong>
              </div>
              <div>
                <span className="text-slate-400">Request:</span> <code className="text-cyan-300">{selectedPacket.method} {selectedPacket.path}</code>
              </div>
              <div>
                <span className="text-slate-400">Risk Score:</span> <span className="font-bold text-amber-400">{selectedPacket.risk_score || selectedPacket.analysis?.risk_score} / 100</span>
              </div>
              <div>
                <span className="text-slate-400">OWASP Mapping:</span> <span className="text-rose-400 font-bold">{selectedPacket.owasp_mapping || selectedPacket.analysis?.owasp_mapping} - {selectedPacket.threat_category || selectedPacket.analysis?.threat_category}</span>
              </div>
              <div>
                <span className="text-slate-400">Action Result:</span> <span className="font-bold text-rose-300">{selectedPacket.action || selectedPacket.verdict}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Payload Content:</span>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedPacket.body || selectedPacket.payload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficInterceptor;
