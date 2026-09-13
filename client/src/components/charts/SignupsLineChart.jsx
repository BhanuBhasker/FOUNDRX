import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDate } from '../../utils/format.js';

export function SignupsLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="day" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip labelFormatter={formatDate} />
        <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} dot={false} name="Signups" />
      </LineChart>
    </ResponsiveContainer>
  );
}
