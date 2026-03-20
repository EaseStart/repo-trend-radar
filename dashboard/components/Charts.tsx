'use client';

import { useRouter } from 'next/navigation';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

// Simple Sparkline — reusable
export function Sparkline({ data, color = '#007AFF' }: { data: number[], color?: string }) {
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

// Zone Distribution Chart — clickable bars navigate to filtered repos
const ZONE_COLORS: Record<string, string> = {
  seedling: '#94A3B8',
  rising: '#007AFF',
  breakout: '#F59E0B',
  graduated: '#22C55E',
};

interface ZoneChartProps {
  seedling: number;
  rising: number;
  breakout: number;
  graduated: number;
}

export function ZoneDistributionChart({ seedling, rising, breakout, graduated }: ZoneChartProps) {
  const router = useRouter();
  const data = [
    { zone: 'seedling', label: 'Seedling', count: seedling },
    { zone: 'rising', label: 'Rising', count: rising },
    { zone: 'breakout', label: 'Breakout', count: breakout },
    { zone: 'graduated', label: 'Graduated', count: graduated },
  ];

  function handleClick(entry: { zone: string }) {
    if (entry.zone === 'graduated') {
      router.push('/graduated');
    } else {
      router.push(`/repos?zone=${entry.zone}`);
    }
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis 
          dataKey="label" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748B', fontSize: 12, fontFamily: 'var(--font-sans)' }} 
          dy={10} 
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748B', fontSize: 12, fontFamily: 'var(--font-sans)' }} 
          width={50}
        />
        <Tooltip 
          cursor={{ fill: '#E2E8F0', opacity: 0.3 }} 
          contentStyle={{ 
            borderRadius: '8px', 
            border: '1px solid #E2E8F0', 
            fontFamily: 'var(--font-sans)', 
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }} 
          formatter={(value: number) => [value.toLocaleString(), 'Repos']}
        />
        <Bar 
          dataKey="count" 
          radius={[6, 6, 0, 0]} 
          maxBarSize={60} 
          cursor="pointer"
          onClick={(_, idx) => handleClick(data[idx])}
        >
          {data.map((entry) => (
            <Cell key={entry.zone} fill={ZONE_COLORS[entry.zone] || '#94A3B8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Top Languages Chart — clickable bars navigate to filtered repos
interface LangData {
  language: string;
  count: number;
}

export function TopLanguagesChart({ data }: { data: LangData[] }) {
  const router = useRouter();

  const LANG_COLORS: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    Rust: '#dea584',
    Go: '#00ADD8',
    Java: '#b07219',
    'C++': '#f34b7d',
    Ruby: '#701516',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
  };

  function handleClick(lang: string) {
    router.push(`/repos?language=${encodeURIComponent(lang)}`);
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontFamily: 'var(--font-sans)' }} />
        <YAxis 
          type="category" 
          dataKey="language" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748B', fontSize: 12, fontFamily: 'var(--font-sans)' }} 
          width={80}
        />
        <Tooltip 
          cursor={{ fill: '#E2E8F0', opacity: 0.3 }}
          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontFamily: 'var(--font-sans)', fontSize: '12px' }}
          formatter={(value: number) => [value, 'Repos']}
        />
        <Bar 
          dataKey="count" 
          radius={[0, 6, 6, 0]} 
          maxBarSize={24} 
          cursor="pointer"
          onClick={(entry) => handleClick(entry.language)}
        >
          {data.map((entry) => (
            <Cell key={entry.language} fill={LANG_COLORS[entry.language] || '#94A3B8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
