import React from 'react';

const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'cyan', badge }) => {
  const colorMap = {
    cyan: {
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      glow: 'hover:shadow-cyan-500/10'
    },
    rose: {
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      glow: 'hover:shadow-rose-500/10'
    },
    emerald: {
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      glow: 'hover:shadow-emerald-500/10'
    },
    amber: {
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      glow: 'hover:shadow-amber-500/10'
    }
  };

  const style = colorMap[color] || colorMap.cyan;

  return (
    <div className={`p-5 rounded-2xl glass-card border ${style.border} transition-all duration-300 hover:-translate-y-1 shadow-lg ${style.glow}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl ${style.bg} ${style.text}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-3xl font-extrabold font-mono tracking-tight text-white">{value}</div>
        {badge && (
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${style.bg} ${style.text} border ${style.border}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-2 text-xs text-slate-400 font-mono">{subtitle}</p>}
    </div>
  );
};

export default MetricCard;
