import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Color palette generator
const getColor = (i) => {
    const palette = ['#34b7eb', '#a560f2', '#6c5ce7', '#55efc4', '#ffeaa7', '#ff7675', '#fab1a0'];
    return palette[i % palette.length];
  };
  
// Format date as "Apr 5"
const formatDate = (dateString) => {
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const BarGraph = ({ data, apiKeys, formatter, allowDecimals, tooltipFormatter }) => {
  let max = Math.max(
    ...data.map(entry =>
      apiKeys.reduce((sum, key) => sum + (entry[key.name] || 0), 0)
    )
  );
  max = max <= 0 ? 1 : max;
  
  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 30, left: 0 }} barGap={10}>
        <ReferenceLine
          y={max} stroke="#999" strokeDasharray="6 6"
          label={(props) => {
            const { viewBox } = props;
            const x = viewBox.x + 5;
            const y = viewBox.y;
            return (
              <text x={x} y={y} dy={-8} fill="#999" fontSize={16} textAnchor="start">
                {formatter ? formatter(max) : max}
              </text>
            );
          }}
        />
        <XAxis
          dataKey="date" axisLine={false} tickLine={false} interval={0} tickMargin={15}
          tick={({ x, y, payload }) => {
            const first = payload.value === data[0]?.date;
            const last = payload.value === data[data.length - 1]?.date;
            if (!first && !last) return null;
            return (
              <text x={x} y={y} textAnchor={first ? "middle" : "middle"} fill="#666" fontSize={14}>
                {formatDate(payload.value)}
              </text>
            );
          }}
        />
        <YAxis tickFormatter={formatter} tick={false} domain={[0, max]} allowDecimals={allowDecimals} axisLine={false} tickLine={false} width={5} />
        <Tooltip formatter={tooltipFormatter ? tooltipFormatter : formatter} filterNull={true} contentStyle={{borderRadius: '10px'}} />
        {data.length > 0 &&
          apiKeys.map((apiKey, idx) => (
            <Bar
              key={apiKey.name} dataKey={apiKey.name}
              stackId={"usage"} fill={getColor(idx)}
              minPointSize={1}
            >
              {data.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={!entry[apiKey.name] ? (idx > 0 && Object.keys(entry).length > 1 ? getColor(idx - 1) : "#aaa") : getColor(idx)}
                  stroke={!entry[apiKey.name] ? (idx > 0 && Object.keys(entry).length > 1 ? getColor(idx - 1) : "#aaa") : getColor(idx)}
                />
              ))}
            </Bar>
          ))
        }
      </BarChart>
    </ResponsiveContainer>
  );
}

export const PieGraph = ({ totals, apiKeys, formatter, innerFormatter }) => {
  const totalValue = totals.reduce((sum, item) => sum + item.value, 0);
  return (
    <ResponsiveContainer width={200}>
      <PieChart>
        <Tooltip formatter={formatter} />
        <Pie data={totals} outerRadius="100%" innerRadius="75%" dataKey="value">
          {apiKeys.map((apiKey, idx) => (
            <Cell key={`cell-${idx}`} fill={getColor(idx)} />
          ))}
        </Pie>
        <text x="50%" y="50%" dy="-0.15em" textAnchor="middle" fontSize={24} fill="#999">
          {innerFormatter ? innerFormatter(totalValue) : (formatter ? formatter(totalValue) : totalValue)}
        </text>
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatTimestampDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const LineGraph = ({ data, domain, formatter, tooltipFormatter }) => (
  <ResponsiveContainer>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="6 6" stroke="#ccc" vertical={false} />
      <XAxis
        type="number" scale="time" axisLine={true} tickLine={false}
        domain={domain}
        dataKey="timestamp" tickFormatter={formatTimestampDate} tickMargin={15}
        allowDataOverflow={true}
        ticks={[domain[0], domain[1]]}
        tick={({ x, y, payload }) => {
          const first = payload.value === domain[0];
          const last = payload.value === domain[1];
          return (
            <text x={x} y={y} textAnchor={first ? "start" : "middle"} fill="#666">
              {formatTimestampDate(payload.value)}
            </text>
          );
        }}
      />
      <YAxis tickFormatter={formatter} tickLine={false} />
      <Tooltip labelFormatter={formatTimestamp} formatter={tooltipFormatter ? tooltipFormatter : formatter} />
      <Line type="linear" dataKey="Balance" stroke="#34b7eb" strokeWidth={3} dot={false} />
    </LineChart>
  </ResponsiveContainer>
)