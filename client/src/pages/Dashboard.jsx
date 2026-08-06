import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/MetricCard';
import ThreatStreamTable from '../components/ThreatStreamTable';
import { ThreatVectorBarChart, OWASPDistributionPieChart, RiskScoreTimeline } from '../components/AnalyticsCharts';
import { ShieldAlert, Flame, Cpu, ShieldCheck, Activity, X } from 'lucide-react';
import api from '../services/api';
import { telemetryWS } from '../services/websocket';

const Dashboard = () => {
  const [threats, setThreats] = useState([]);
  const [quarantineList, setQuarantineList] = useState([]);
  const [patches, setPatches] = useState([]);
  const [inspectedThreat, setInspectedThreat] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [threatsRes, quarantineRes, patchesRes] = await Promise.all([
        api.get('/threats?limit=50'),
        api.get('/quarantine'),
        api.get('/remediation/patches')
      ]);

      setThreats(threatsRes.data.threats || []);
      setQuarantineList(quarantineRes.data || []);
      setPatches(patchesRes.data || []);
    } catch (err) {
      console.error('Failed to load SOC dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to live WebSocket threat events
    const unsubscribe = telemetryWS.subscribe((event) => {
      if (event.type === 'THREAT_INTERCEPTED') {
        setThreats((prev) => [event.data, ...prev]);
      }
      if (event.type === 'QUARANTINE_ADDED') {
        setQuarantineList((prev) => [event.data, ...prev]);
      }
      if (event.type === 'QUARANTINE_RELEASED') {
        setQuarantineList((prev) => prev.filter((q) => q.ip_address !== event.data.ip_address));
      }
      if (event.type === 'PATCH_PROPOSED') {
        setPatches((prev) => [event.data, ...prev]);
      }
    });

    return unsubscribe;
  }, []);

  const activeQuarantineCount = quarantineList.filter((q) => q.status === 'ACTIVE').length;
  const criticalThreatsCount = threats.filter((t) => t.risk_score >= 80).length;
  const appliedPatchesCount = patches.filter((p) => p.deployment_status === 'APPLIED').length;
  const avgRiskScore = threats.length > 0 ? Math.round(threats.reduce((acc, t) => acc + t.risk_score, 0) / threats.length) : 0;

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col font-sans">
      <Navbar activeQuarantineCount={activeQuarantineCount} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Top Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="TOTAL THREATS INTERCEPTED"
              value={threats.length}
              subtitle="Real-time telemetry payload inspection"
              icon={ShieldAlert}
              color="cyan"
              badge="100% COVERAGE"
            />
            <MetricCard
              title="ACTIVE HONEYPOT QUARANTINES"
              value={activeQuarantineCount}
              subtitle="Rerouted malicious client IPs"
              icon={Flame}
              color="rose"
              badge="AUTO-ISOLATED"
            />
            <MetricCard
              title="AVERAGE RISK INDEX"
              value={`${avgRiskScore}/100`}
              subtitle={`${criticalThreatsCount} Critical (Score >= 80)`}
              icon={Activity}
              color="amber"
              badge="DETERMINISTIC"
            />
            <MetricCard
              title="AI PATCHES DEPLOYED"
              value={appliedPatchesCount}
              subtitle={`${patches.length} Total AST proposed diffs`}
              icon={ShieldCheck}
              color="emerald"
              badge="VM VERIFIED"
            />
          </div>

          {/* Recharts Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-5 rounded-2xl border border-cyber-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white font-mono text-sm tracking-wide">ATTACK VECTOR DISTRIBUTION</h3>
                <span className="text-xs text-slate-500 font-mono">Telemetry Categorization</span>
              </div>
              <ThreatVectorBarChart />
            </div>

            <div className="glass-card p-5 rounded-2xl border border-cyber-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white font-mono text-sm tracking-wide">OWASP TOP 10 BREAKDOWN</h3>
                <span className="text-xs text-slate-500 font-mono">2021 Standard</span>
              </div>
              <OWASPDistributionPieChart />
            </div>
          </div>

          {/* Risk Score Timeline */}
          <div className="glass-card p-5 rounded-2xl border border-cyber-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white font-mono text-sm tracking-wide">SYSTEM RISK TIMELINE (24H)</h3>
              <span className="text-xs text-slate-500 font-mono">Continuous Scoring Telemetry</span>
            </div>
            <RiskScoreTimeline />
          </div>

          {/* Live Threat Stream Table */}
          <ThreatStreamTable threats={threats} onInspect={(threat) => setInspectedThreat(threat)} />
        </main>
      </div>

      {/* Payload Inspection Modal */}
      {inspectedThreat && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-cyber-border rounded-2xl max-w-xl w-full p-6 shadow-2xl relative font-mono text-xs text-slate-200">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3 mb-4">
              <h3 className="font-bold text-cyan-400 text-sm">THREAT PAYLOAD INSPECTOR (#{inspectedThreat.id.substring(0, 8)})</h3>
              <button onClick={() => setInspectedThreat(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400">Client IP:</span> <strong className="text-white">{inspectedThreat.client_ip}</strong>
              </div>
              <div>
                <span className="text-slate-400">Endpoint:</span> <code className="text-cyan-300">{inspectedThreat.request_method} {inspectedThreat.request_path}</code>
              </div>
              <div>
                <span className="text-slate-400">OWASP Classification:</span> <span className="text-rose-400 font-bold">{inspectedThreat.owasp_mapping} - {inspectedThreat.threat_category}</span>
              </div>
              <div>
                <span className="text-slate-400">Risk Score:</span> <span className="font-bold text-amber-400">{inspectedThreat.risk_score} / 100</span>
              </div>
              <div>
                <span className="text-slate-400">User Agent:</span> <span className="text-slate-300">{inspectedThreat.headers?.['user-agent'] || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Raw Payload Context:</span>
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

export default Dashboard;
