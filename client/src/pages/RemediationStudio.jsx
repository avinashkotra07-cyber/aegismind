import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import DiffViewer from '../components/DiffViewer';
import SandboxRunnerConsole from '../components/SandboxRunnerConsole';
import api from '../services/api';
import { Cpu, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { telemetryWS } from '../services/websocket';

const RemediationStudio = () => {
  const [patches, setPatches] = useState([]);
  const [selectedPatch, setSelectedPatch] = useState(null);
  const [sandboxResult, setSandboxResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const fetchPatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/remediation/patches');
      const data = res.data || [];
      setPatches(data);
      if (data.length > 0 && !selectedPatch) {
        setSelectedPatch(data[0]);
      }
    } catch (err) {
      console.error('Failed to load code patches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatches();

    const unsubscribe = telemetryWS.subscribe((event) => {
      if (event.type === 'PATCH_PROPOSED') {
        setPatches((prev) => [event.data, ...prev]);
        setSelectedPatch((curr) => curr || event.data);
      }
    });

    return unsubscribe;
  }, []);

  const handleVerifySandbox = async (patchId) => {
    setIsVerifying(true);
    setSandboxResult(null);
    try {
      const res = await api.post('/remediation/verify', { patch_id: patchId });
      setSandboxResult(res.data);
      
      // Update patch list state
      setPatches((prev) =>
        prev.map((p) => (p.id === patchId ? { ...p, sandbox_test_status: res.data.status } : p))
      );
      if (selectedPatch?.id === patchId) {
        setSelectedPatch((prev) => ({ ...prev, sandbox_test_status: res.data.status }));
      }
    } catch (err) {
      setSandboxResult({
        status: 'FAILED',
        executionTimeMs: 0,
        logs: ['❌ Verification API Failed'],
        errorMessage: err.response?.data?.error || err.message
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleApplyPatch = async (patchId) => {
    setIsApplying(true);
    try {
      const res = await api.post('/remediation/apply', { patch_id: patchId });
      
      setPatches((prev) =>
        prev.map((p) => (p.id === patchId ? { ...p, deployment_status: 'APPLIED' } : p))
      );
      if (selectedPatch?.id === patchId) {
        setSelectedPatch((prev) => ({ ...prev, deployment_status: 'APPLIED' }));
      }
      alert(res.data.message);
    } catch (err) {
      alert('Failed to deploy patch: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span>AI SOURCE CODE REMEDIATION STUDIO</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                AST-level automated secure patch generation, Node:VM sandbox testing, and zero-downtime hot-patching
              </p>
            </div>

            <button
              onClick={fetchPatches}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Patches</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Patches List Sidebar */}
            <div className="lg:col-span-1 glass-card p-4 rounded-2xl border border-cyber-border space-y-3">
              <h3 className="font-bold text-white font-mono text-xs tracking-wider uppercase border-b border-cyber-border pb-2">
                PROPOSED AI PATCHES ({patches.length})
              </h3>

              <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
                {patches.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono p-4 text-center italic">
                    No proposed code patches yet. Trigger an attack via the Launch Test Attack modal.
                  </div>
                ) : (
                  patches.map((p) => {
                    const isSelected = selectedPatch?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPatch(p);
                          setSandboxResult(null);
                        }}
                        className={`w-full p-3 rounded-xl text-left font-mono transition-all border ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-white shadow-md shadow-cyan-500/10'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold truncate text-cyan-300">{p.file_path}</div>
                        <div className="flex items-center justify-between mt-2 text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold ${
                              p.sandbox_test_status === 'PASSED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            VM: {p.sandbox_test_status}
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold ${
                              p.deployment_status === 'APPLIED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {p.deployment_status}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Main Diff & Sandbox Console Panel */}
            <div className="lg:col-span-3 space-y-6">
              {/* Interactive Diff Viewer */}
              <DiffViewer
                patch={selectedPatch}
                onVerify={handleVerifySandbox}
                onApply={handleApplyPatch}
                isVerifying={isVerifying}
                isApplying={isApplying}
              />

              {/* Sandbox Terminal Logs Console */}
              <SandboxRunnerConsole result={sandboxResult} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RemediationStudio;
