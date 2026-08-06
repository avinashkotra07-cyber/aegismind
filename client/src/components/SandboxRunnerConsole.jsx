import React from 'react';
import { Terminal, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const SandboxRunnerConsole = ({ result }) => {
  if (!result) {
    return (
      <div className="glass-card p-6 rounded-2xl border border-cyber-border font-mono text-xs text-slate-500 text-center">
        <Terminal className="w-6 h-6 mx-auto mb-2 text-slate-600" />
        No active sandbox test execution. Click "Run Sandbox Test" to simulate Node:VM AST validation.
      </div>
    );
  }

  const { status, executionTimeMs, logs = [], errorMessage } = result;

  return (
    <div className="glass-card rounded-2xl border border-cyber-border overflow-hidden font-mono text-xs">
      {/* Console Header */}
      <div className="p-3 border-b border-cyber-border bg-slate-950 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white tracking-wider">AEGISMIND NODE:VM SANDBOX CONSOLE</span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1 text-slate-400">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Time: {executionTimeMs || 0}ms</span>
          </span>

          <span
            className={`px-2 py-0.5 rounded font-bold ${
              status === 'PASSED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
          >
            {status === 'PASSED' ? 'PASSED CLEAN' : 'EXECUTION FAILED'}
          </span>
        </div>
      </div>

      {/* Terminal Log Output */}
      <div className="p-4 bg-[#080c14] max-h-64 overflow-y-auto space-y-1.5 text-slate-300">
        {logs.map((log, idx) => {
          let lineClass = 'text-slate-400';
          if (log.includes('✅') || log.includes('Passed')) lineClass = 'text-emerald-400 font-bold';
          if (log.includes('❌') || log.includes('Failed') || log.includes('[ERR]')) lineClass = 'text-rose-400 font-bold';
          if (log.includes('🧪') || log.includes('🔒')) lineClass = 'text-cyan-400';
          if (log.includes('[SANDBOX DB]')) lineClass = 'text-amber-300';

          return (
            <div key={idx} className={`leading-relaxed ${lineClass}`}>
              {log}
            </div>
          );
        })}

        {errorMessage && (
          <div className="mt-3 p-3 rounded bg-rose-950/40 border border-rose-900/50 text-rose-300 font-bold">
            [SANDBOX CRITICAL ERROR] {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default SandboxRunnerConsole;
