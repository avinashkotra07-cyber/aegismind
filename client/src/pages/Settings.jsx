import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Sliders, Save, Bell, ShieldCheck, CheckCircle2, Key } from 'lucide-react';

const Settings = () => {
  const [policies, setPolicies] = useState({
    quarantine_threshold: 80,
    auto_patch_threshold: 95,
    honeypot_redirect_enabled: true,
    webhook_url: ''
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await api.get('/policies');
        if (res.data) {
          setPolicies(res.data);
        }
      } catch (err) {
        console.error('Failed to load policies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await api.put('/policies', policies);
      setPolicies(res.data.policy);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      alert('Failed to save policies: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto max-w-4xl">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <span>ZERO-TRUST POLICY & ADVISORY ENGINE</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Tune dynamic threat scoring triggers, honeypot isolation rules, and notification alert webhooks
            </p>
          </div>

          {savedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Zero-Trust Security Policies updated and broadcasted across all nodes!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Threshold Configuration */}
            <div className="glass-card p-6 rounded-2xl border border-cyber-border space-y-5">
              <h3 className="font-bold text-white font-mono text-xs tracking-wider uppercase border-b border-cyber-border pb-3 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>DYNAMIC SCORE THRESHOLDS</span>
              </h3>

              {/* Quarantine Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="text-slate-300 font-semibold">
                    Quarantine Trigger Score Threshold (1-100):
                  </label>
                  <span className="font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/30">
                    {policies.quarantine_threshold} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={policies.quarantine_threshold}
                  onChange={(e) => setPolicies({ ...policies, quarantine_threshold: parseInt(e.target.value, 10) })}
                  className="w-full accent-rose-500"
                />
                <p className="text-[11px] text-slate-500 font-mono">
                  Incoming payloads scoring at or above this value immediately trigger IP quarantine isolation to Honeypot.
                </p>
              </div>

              {/* Auto-Patch Threshold */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="text-slate-300 font-semibold">
                    Autonomous Code Patch Generation Threshold (1-100):
                  </label>
                  <span className="font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30">
                    {policies.auto_patch_threshold} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={policies.auto_patch_threshold}
                  onChange={(e) => setPolicies({ ...policies, auto_patch_threshold: parseInt(e.target.value, 10) })}
                  className="w-full accent-cyan-500"
                />
                <p className="text-[11px] text-slate-500 font-mono">
                  High-severity vulnerabilities at or above this threshold invoke Gemini AI to generate AST-level source code diffs.
                </p>
              </div>
            </div>

            {/* Notification Setup */}
            <div className="glass-card p-6 rounded-2xl border border-cyber-border space-y-4">
              <h3 className="font-bold text-white font-mono text-xs tracking-wider uppercase border-b border-cyber-border pb-3 flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>INCIDENT ADVISORY NOTIFICATIONS</span>
              </h3>

              <div className="font-mono text-xs space-y-2">
                <label className="text-slate-300 font-semibold block">Slack / Teams Incident Alert Webhook URL:</label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={policies.webhook_url || ''}
                  onChange={(e) => setPolicies({ ...policies, webhook_url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-mono font-bold text-xs hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'SAVING POLICIES...' : 'SAVE POLICY CONFIGURATION'}</span>
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Settings;
