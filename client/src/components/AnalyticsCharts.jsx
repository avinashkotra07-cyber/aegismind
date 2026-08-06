import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

export const ThreatVectorBarChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { name: 'SQL Injection', count: 18 },
    { name: 'Command Injection', count: 12 },
    { name: 'XSS Vector', count: 9 },
    { name: 'SSRF Attack', count: 7 },
    { name: 'Path Traversal', count: 5 }
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontFamily="monospace" />
          <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
          />
          <Bar dataKey="count" fill="#00f2fe" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const OWASPDistributionPieChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { name: 'A03: Injection', value: 45 },
    { name: 'A10: SSRF', value: 20 },
    { name: 'A01: Access Control', value: 18 },
    { name: 'A07: Auth Failure', value: 17 }
  ];

  const COLORS = ['#f43f5e', '#38bdf8', '#fbbf24', '#34d399'];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RiskScoreTimeline = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { time: '00:00', risk: 15 },
    { time: '04:00', risk: 22 },
    { time: '08:00', risk: 88 },
    { time: '12:00', risk: 95 },
    { time: '16:00', risk: 64 },
    { time: '20:00', risk: 35 }
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="monospace" />
          <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" domain={[0, 100]} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
          />
          <Area type="monotone" dataKey="risk" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#riskGlow)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
