import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Color palette generator
const getColor = (i) => {
    const palette = ['#a560f2', '#6c5ce7', '#55efc4', '#ffeaa7', '#ff7675', '#fab1a0'];
    return palette[i % palette.length];
  };
  
// Format date as "Apr 5"
const formatDate = (dateString) => {
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const BarGraph = ({ data, apiKeys, formatter, allowDecimals, tooltipFormatter }) => (
  <ResponsiveContainer>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="6 6" stroke="#444" vertical={false} />
      <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} />
      <YAxis tickFormatter={formatter} allowDecimals={allowDecimals} axisLine={false} tickLine={false} />
      <Tooltip formatter={tooltipFormatter ? tooltipFormatter : formatter} />
      {data.length > 0 &&
        apiKeys.map(apiKey => apiKey.name).map((key, idx) => (
          <Bar key={key} dataKey={key} stackId={"usage"} fill={getColor(idx)} />
        ))
      }
    </BarChart>
  </ResponsiveContainer>
);

export const PieGraph = ({ totals, apiKeys, formatter }) => (
  <ResponsiveContainer width={200}>
    <PieChart>
      <Tooltip formatter={formatter} />
      <Pie data={totals} outerRadius="100%" innerRadius="75%" dataKey="value">
        {apiKeys.map((apiKey, idx) => (
          <Cell key={`cell-${idx}`} fill={getColor(idx)} />
        ))}
      </Pie>
      <Legend />
    </PieChart>
  </ResponsiveContainer>
);