import React, { useState } from 'react';
import { X, Send, Terminal, Flame, Zap } from 'lucide-react';
import api from '../services/api';

const AttackSimulatorModal = ({ onClose }) => {
  const [ip, setIp] = useState('192.168.1.105');
  const [method, setMethod] = useState('POST');
  const [path, setPath] = useState('/api/v1/users/search');
  const [payloadText, setPayloadText] = useState('{\n  "username": "admin\' OR \'1\'=\'1\' --"\n}');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const presets = [
    {
      label: 'SQL Injection Bypass',
      ip: '192.168.1.105',
      method: 'POST',
      path: '/api/v1/users/search',
      body: '{\n  "username": "admin\' OR \'1\'=\'1\' --"\n}'
    },
    {
      label: 'Remote Command Execution (RCE)',
      ip: '10.0.4.88',
      method: 'POST',
      path: '/api/v1/system/exec',
      body: '{\n  "command": "ping 127.0.0.1; cat /etc/passwd"\n}'
    },
    {
      label: 'Server-Side Request Forgery (SSRF)',
      ip: '172.16.0.42',
      method: 'POST',
      path: '/api/v1/fetch-url',
      body: '{\n  "target_url": "http://169.254.169.254/latest/meta-data/"\n}'
    },
    {
      label: 'Cross-Site Scripting (XSS)',
      ip: '192.168.1.200',
      method: 'POST',
      path: '/api/v1/comments',
      body: '{\n  "comment": "<script>alert(document.cookie)</script>"\n}'
    }
  ];

  const handleApplyPreset = (p) => {
    setIp(p.ip);
    setMethod(p.method);
    setPath(p.path);
    setPayloadText(p.body);
    setResponse(null);
  };

  const handleExecuteAttack = async () => {
    setLoading(true);
    setResponse(null);
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(payloadText);
      } catch (e) {
        parsedPayload = { raw_payload: payloadText };
      }

      const res = await api.post('/threats/analyze', {
        client_ip: ip,
        request_method: method,
        request_path: path,
        payload: parsedPayload,
        headers: { 'user-agent': 'AegisMind-TestSuite/1.0 (Attacker-Simulated)' }
      });

      setResponse(res.data);
    } catch (err) {
      setResponse(err.response?.data || { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b0f19] border border-cyber-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyber-border pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white font-mono text-base">LIVE THREAT INJECTION SIMULATOR</h3>
              <p className="text-xs text-slate-400">Dispatch malicious payloads to verify AegisMind Telemetry Interceptor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Attack Vector Presets */}
        <div className="mb-4">
          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
            SELECT PRESET ATTACK VECTOR
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(preset)}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 text-left text-xs font-mono text-slate-300 hover:text-cyan-300 transition-all flex items-center justify-between"
              >
                <span>{preset.label}</span>
                <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-3 gap-3 mb-3 font-mono text-xs">
          <div>
            <label className="text-slate-400 mb-1 block">Simulated IP</label>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-slate-400 mb-1 block">HTTP Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 mb-1 block">Target Path</label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* JSON Payload Editor */}
        <div className="mb-4 font-mono text-xs">
          <label className="text-slate-400 mb-1 block">HTTP Body Payload (JSON)</label>
          <textarea
            rows={4}
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleExecuteAttack}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-mono font-bold text-xs hover:from-rose-400 hover:to-red-500 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-rose-500/20 disabled:opacity-50"
        >
          <Flame className="w-4 h-4" />
          <span>{loading ? 'ANALYZING THREAT PAYLOAD...' : 'DISPATCH ATTACK PAYLOAD'}</span>
        </button>

        {/* Result Output */}
        {response && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto">
            <div className="text-cyan-400 font-bold mb-2">⚡ TELEMETRY RESPONSE:</div>
            <pre className="whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttackSimulatorModal;
