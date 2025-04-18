import React, { useState, useEffect } from 'react';
import { useAPIClient } from '../DyceApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Refresh from "@/assets/icons/refresh_dark.svg";

export const UsageManager = () => {
  const [usageData, setUsageData] = useState([]);
  const [txData, setTxData] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useAPIClient();

  useEffect(() => {
    getHistory();
  }, []);

  async function getUsageHistory(keyName) {
    try {
      const res = await api.getUsageHistory(keyName);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data.useCounts;
    } catch (error) {
      console.error("Failed to get usage history: ", error);
    }
  }

  async function getTxHistory(keyName) {
    try {
      const res = await api.getTxHistory(keyName);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data.txAmounts;
    } catch (error) {
      console.error("Failed to get usage history: ", error);
    }
  }

  async function getHistory() {
    try {
      setLoading(true);
      const response = await api.getApiKeys();
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setApiKeys(data.apiKeys);

      let usageMap = {};
      let txMap = {};
      for (const apiKey of data.apiKeys) {
        const keyName = apiKey.name;
        const useCounts = await getUsageHistory(keyName);
        for (const [date, count] of Object.entries(useCounts)) {
          if (!usageMap[date]) usageMap[date] = {};
          usageMap[date][keyName] = count;
        }
        const txAmounts = await getTxHistory(keyName);
        for (const [date, amount] of Object.entries(txAmounts)) {
          if (!txMap[date]) txMap[date] = {};
          txMap[date][keyName] = amount;
        }
      }
      
      const getLastNDays = (n) => {
        const dates = [];
        for (let i = n - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
      };

      const dates = getLastNDays(10);
      for (const date of dates) {
        if (!usageMap[date]) usageMap[date] = {};
        if (!txMap[date]) txMap[date] = {};
      }

      var usageList = Object.entries(usageMap).map(([date, values]) => ({ date, ...values }));
      var txList = Object.entries(txMap).map(([date, values]) => ({ date, ...values }));
      usageList = usageList.filter(item => dates.includes(item.date));
      txList = txList.filter(item => dates.includes(item.date));
      usageList.sort((a, b) => new Date(a.date) - new Date(b.date));
      txList.sort((a, b) => new Date(a.date) - new Date(b.date));
      setUsageData(usageList);
      setTxData(txList);
      setLoading(false);
    } catch (error) {
      console.error("Request failed: ", error);
    }
  }

  // Format date as "Apr 5"
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format USDT amount as "$1.50K"
  const formatCurrency = (num) => {
    if (num === 0) return '$0';
    if (Math.abs(num) >= 100_000_000)
      return `$${(num / 1_000_000).toFixed(0)}M`;
    if (Math.abs(num) >= 1_000_000)
      return `$${(num / 1_000_000).toFixed(1)}M`;
    if (Math.abs(num) >= 100_000)
      return `$${(num / 1_000).toFixed(0)}K`;
    if (Math.abs(num) >= 1_000)
      return `$${(num / 1_000).toFixed(1)}K`;
    if (Math.abs(num) >= 100)
      return `$${Number(num).toFixed(0)}`;
    return `$${Number(num).toFixed(2)}`;
  }

  return (
    <div className='manager usage-wrapper'>
      <div className='header-container'>
        <h1>Usage</h1>
        <button className="refresh" onClick={() => getHistory()} disabled={loading}>
          <img src={Refresh} alt="X" height="24" />
        </button>
      </div>

      <h3>Requests</h3>
      <ResponsiveContainer style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.5 : 1 }}>
        <BarChart data={usageData}>
          <CartesianGrid strokeDasharray="6 6" stroke="#444" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false}/>
          <Tooltip />
          {usageData.length > 0 &&
            apiKeys.map(apiKey => apiKey.name).map((key, idx) => (
              <Bar key={key} dataKey={key} stackId="usage" fill={getColor(idx)} />
            ))}
        </BarChart>
      </ResponsiveContainer>

      <h3>Transfers</h3>
      <ResponsiveContainer style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.5 : 1 }}>
        <BarChart data={txData}>
          <CartesianGrid strokeDasharray="6 6" stroke="#444" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatCurrency} axisLine={false} tickLine={false} />
          <Tooltip formatter={(value) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}/>
          {txData.length > 0 &&
            apiKeys.map(apiKey => apiKey.name).map((key, idx) => (
              <Bar key={key} dataKey={key} stackId="tx" fill={getColor(idx)} name={key} />
            ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Color palette generator
const getColor = (i) => {
  const palette = ['#a560f2', '#6c5ce7', '#55efc4', '#ffeaa7', '#ff7675', '#fab1a0'];
  return palette[i % palette.length];
};
