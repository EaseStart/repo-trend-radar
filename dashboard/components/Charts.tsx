'use client';

import { LineChart, Line, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from 'recharts';

// Simple Sparkline
export function Sparkline({ data, color = '#007AFF', filled = false }: { data: number[], color?: string, filled?: boolean }) {
  const chartData = data.map((value, i) => ({ index: i, value }));
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2} 
          dot={false} 
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Main Analytics Line Chart
export function MainLineChart() {
  const data = [
    { name: 'Jan', commits: 65, stars: 28 },
    { name: 'Feb', commits: 59, stars: 48 },
    { name: 'Mar', commits: 80, stars: 40 },
    { name: 'Apr', commits: 81, stars: 19 },
    { name: 'May', commits: 56, stars: 86 },
    { name: 'Jun', commits: 55, stars: 27 },
    { name: 'Jul', commits: 40, stars: 90 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'var(--font-mono)' }} dy={10} />
        <Tooltip cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontFamily: 'var(--font-mono)', fontSize: '10px' }} />
        <Line type="monotone" dataKey="commits" stroke="#007AFF" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="stars" stroke="#22C55E" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Radar Health Chart
export function RadarHealthChart() {
  const data = [
    { subject: 'Docs', A: 98, fullMark: 100 },
    { subject: 'Speed', A: 70, fullMark: 100 },
    { subject: 'Issues', A: 62, fullMark: 100 },
    { subject: 'PRs', A: 85, fullMark: 100 },
    { subject: 'Commits', A: 90, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#E2E8F0" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 'bold' }} />
        <Radar name="Repo" dataKey="A" stroke="#007AFF" fill="#007AFF" fillOpacity={0.1} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Contributor Bar Chart
export function ContributorBarChart() {
  const data = [
    { name: 'W1', users: 45 },
    { name: 'W2', users: 67 },
    { name: 'W3', users: 42 },
    { name: 'W4', users: 88 },
    { name: 'W5', users: 31 },
    { name: 'W6', users: 56 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'var(--font-mono)' }} dy={5} />
        <Tooltip cursor={{ fill: '#E2E8F0', opacity: 0.5 }} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontFamily: 'var(--font-mono)', fontSize: '10px' }} />
        <Bar dataKey="users" fill="#E2E8F0" radius={[4, 4, 4, 4]} activeBar={{ fill: '#007AFF' }} />
      </BarChart>
    </ResponsiveContainer>
  );
}
