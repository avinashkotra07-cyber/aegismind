import React, { useState } from 'react';
import { FileCode, Play, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

const DiffViewer = ({ patch, onVerify, onApply, isVerifying, isApplying }) => {
  const [viewMode, setViewMode] = useState('split'); // 'split' or 'unified'

  if (!patch) {
    return (
      <div className="glass-card p-8 rounded-2xl text-center text-slate-500 font-mono">
        Select a proposed patch to inspect AST code diffs and sandbox execution logs.
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl border border-cyber-border overflow-hidden">
      {/* Patch Header */}
      <div className="p-4 border-b border-cyber-border bg-slate-900/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white font-mono text-sm tracking-wide">{patch.file_path}</h3>
            <span
              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                patch.sandbox_test_status === 'PASSED'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : patch.sandbox_test_status === 'FAILED'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              SANDBOX STATUS: {patch.sandbox_test_status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">{patch.explanation}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded transition-colors ${viewMode === 'split' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400'}`}
            >
              Split Diff
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`px-2.5 py-1 rounded transition-colors ${viewMode === 'unified' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400'}`}
            >
              Unified Diff
            </button>
          </div>

          <button
            onClick={() => onVerify && onVerify(patch.id)}
            disabled={isVerifying}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-mono font-bold transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isVerifying ? 'Testing in VM...' : 'Run Sandbox Test'}</span>
          </button>

          <button
            onClick={() => onApply && onApply(patch.id)}
            disabled={isApplying || patch.deployment_status === 'APPLIED'}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-md ${
              patch.deployment_status === 'APPLIED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{patch.deployment_status === 'APPLIED' ? 'PATCH APPLIED' : isApplying ? 'Deploying...' : 'Deploy Hot-Patch'}</span>
          </button>
        </div>
      </div>

      {/* Code Comparison View */}
      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-cyber-border font-mono text-xs">
          {/* Vulnerable Code Column */}
          <div className="bg-rose-950/20 p-4">
            <div className="flex items-center space-x-2 text-rose-400 font-bold mb-3 pb-2 border-b border-rose-900/40">
              <AlertCircle className="w-4 h-4" />
              <span>Vulnerable Code Snippet</span>
            </div>
            <pre className="p-3 rounded-lg bg-[#0a0709] border border-rose-900/30 text-rose-200 overflow-x-auto whitespace-pre-wrap">
              {patch.vulnerable_code}
            </pre>
          </div>

          {/* Remediated Code Column */}
          <div className="bg-emerald-950/20 p-4">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-3 pb-2 border-b border-emerald-900/40">
              <CheckCircle2 className="w-4 h-4" />
              <span>Remediated Secure Code</span>
            </div>
            <pre className="p-3 rounded-lg bg-[#070a08] border border-emerald-900/30 text-emerald-200 overflow-x-auto whitespace-pre-wrap">
              {patch.remediated_code}
            </pre>
          </div>
        </div>
      ) : (
        /* Unified Diff View */
        <div className="p-4 bg-[#0a0f1d] font-mono text-xs">
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre">
            {patch.diff_patch || `--- ${patch.file_path}\n+++ ${patch.file_path}\n- ${patch.vulnerable_code}\n+ ${patch.remediated_code}`}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DiffViewer;
