import React, { useState, useEffect } from 'react';
import Refresh from "@/assets/icons/refresh.svg";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DatePicker } from './DatePicker';

// Helper to format dates nicely
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Helper to format ETH balance
const formatEth = (value) => {
  return parseFloat(value).toFixed(4) + ' ETH';
};

export const WalletHistory = ({ walletAddress }) => {
  const [balanceData, setBalanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState([
    {
      startDate: new Date(new Date().setDate(new Date().getDate() - 14)),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (!walletAddress) return;

    const fetchBalanceHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Example API endpoint (you'll need to use your real provider)
        // const response = await fetch(`https://api.example.com/wallet/${walletAddress}/balance-history`);
        // if (!response.ok) throw new Error('Failed to fetch');

        // const data = await response.json();
        // Expected format: [{ date: '2025-04-01', balance: 0.5 }, ...]
        const data = [
          {date: '2025-4-20', balance: 0},
          {date: '2025-4-22', balance: 0.3},
          {date: '2025-4-24', balance: 0.2},
          {date: '2025-4-26', balance: 0.5},
          {date: '2025-4-28', balance: 0.8}
        ];

        // Sort by date ascending just in case
        data.sort((a, b) => new Date(a.date) - new Date(b.date));

        setBalanceData(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load balance history.');
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceHistory();
  }, [walletAddress]);

  return (
    <div className="manager key-usage-wrapper">
      <div className='header-container'>
        <h1>History</h1>
        <DatePicker range={range} setRange={setRange} show={showCalendar} setShow={setShowCalendar} />
        <button className="refresh" onClick={() => getHistory()} disabled={loading}>
          <img src={Refresh} alt="X" height="24" />
        </button>
      </div>

      <div className='body-container'>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={balanceData}>
            <CartesianGrid strokeDasharray="6 6" stroke="#ccc" />
            <XAxis dataKey="date" tickFormatter={formatDate} />
            <YAxis tickFormatter={(value) => `${value} ETH`} />
            <Tooltip formatter={(value) => formatEth(value)} labelFormatter={formatDate} />
            <Line type="monotone" dataKey="balance" stroke="#6c5ce7" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
