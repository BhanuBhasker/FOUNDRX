import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function SkillPopularityChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="skill_name" width={100} tick={{ fontSize: 12 }} />
        <Tooltip cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey="user_count" fill="#4f46e5" radius={[0, 6, 6, 0]} name="Users" />
      </BarChart>
    </ResponsiveContainer>
  );
}
