import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = { pending: '#f59e0b', accepted: '#10b981', rejected: '#ef4444', withdrawn: '#94a3b8' };

export function StatusPieChart({ data }) {
  const chartData = data.map((d) => ({ name: d.status, value: d.count }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] || '#6366f1'} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
