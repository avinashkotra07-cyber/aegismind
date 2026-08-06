import React from 'react';
import { Flame, ShieldCheck } from 'lucide-react';

const HoneypotStatusBadge = ({ isQuarantined }) => {
  if (isQuarantined) {
    return (
      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
        <span>ISOLATED IN HONEYPOT</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      <span>NORMAL TRAFFIC</span>
    </span>
  );
};

export default HoneypotStatusBadge;
