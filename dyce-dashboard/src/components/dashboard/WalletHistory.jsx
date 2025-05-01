import React, { useState, useEffect } from 'react';
import Refresh from "@/assets/icons/refresh.svg";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DatePicker } from './DatePicker';
import { useAPIClient } from '../DyceApi';
import { CONTRACT_ADDRESS } from '../../../../dyce-npm-package/APIClient';

// Helper to format dates nicely
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

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

export const WalletHistory = ({ walletAddress }) => {
  const [tokenBalanceData, setTokenBalanceData] = useState([]);
  const [ethBalanceData, setEthBalanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState([
    {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  const [domain, setDomain] = useState([range[0].startDate.getTime(), range[0].endDate.getTime()]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [ethUsdPrice, setEthUsdPrice] = useState();
  const api = useAPIClient();

  useEffect(() => {
    if (!showCalendar) setDomain([range[0].startDate.getTime(), range[0].endDate.getTime()]);
  }, [showCalendar]);

  const fetchBalanceHistory = async () => {
    try {
      setLoading(true);
      const tokenData = await api.getWalletHistory(walletAddress, CONTRACT_ADDRESS);
      setTokenBalanceData(tokenData);
      const ethData = await api.getWalletHistory(walletAddress);
      setEthBalanceData(ethData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!walletAddress) return;
    fetchBalanceHistory();
  }, [walletAddress]);

  const getEthUsdPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      setEthUsdPrice(data.ethereum.usd);
    } catch {
      setEthUsdPrice(null);
    }
  };

  useEffect(() => {
    getEthUsdPrice();
  }, []);
  
  const formatEthWithConversion = (num) => {
    if (num === 0) return '0';
    if (ethUsdPrice)
      return num.toExponential(1) + " ≈ $" + (num * ethUsdPrice).toFixed(2);
    else
      return num.toExponential(1);
  }

  const generateDailyTicks = (start, end) => {
    const ticks = [];
    const current = new Date(start);
  
    while (current <= end) {
      ticks.push(current.getTime());
      current.setDate(current.getDate() + 1);
    }
  
    return ticks;
  };

  return (
    <div className="manager key-usage-wrapper">
      <div className='header-container'>
        <h1>History</h1>
        <DatePicker range={range} setRange={setRange} show={showCalendar} setShow={setShowCalendar} />
        <button className="refresh" onClick={() => fetchBalanceHistory()} disabled={loading}>
          <img src={Refresh} alt="X" height="24" />
        </button>
      </div>

      <div className='body-container'>
        <h3 style={{"marginBottom": "10px"}}>USDC Balance</h3>
        <div className='balance-wrapper'>
          <ResponsiveContainer>
            <LineChart data={tokenBalanceData}>
              <CartesianGrid strokeDasharray="6 6" stroke="#ccc" vertical={false} />
              <XAxis
                type="number" scale="time" axisLine={false} tickLine={false}
                domain={domain}
                dataKey="timestamp" tickFormatter={formatDate} tickMargin={15}
                allowDataOverflow={true}
                ticks={generateDailyTicks(domain[0], domain[1])}
              />
              <YAxis tickFormatter={(value) => `${value}`} tickMargin={15} />
              <Tooltip labelFormatter={formatTimestamp} />
              <Line type="linear" dataKey="Balance" stroke="#34b7eb" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <h3 style={{"marginBottom": "10px"}}>ETH Balance</h3>
        <div className='balance-wrapper'>
          <ResponsiveContainer>
            <LineChart data={ethBalanceData}>
              <CartesianGrid strokeDasharray="6 6" stroke="#ccc" vertical={false} />
              <XAxis
                type="number" scale="time" axisLine={false} tickLine={false}
                domain={domain}
                dataKey="timestamp" tickFormatter={formatDate} tickMargin={15}
                allowDataOverflow={true}
                ticks={generateDailyTicks(domain[0], domain[1])}
              />
              <YAxis tickFormatter={(value) => `${value}`} tickMargin={15} />
              <Tooltip formatter={(value) => formatEthWithConversion(value)} labelFormatter={formatTimestamp} />
              <Line type="linear" dataKey="Balance" stroke="#34b7eb" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
