import React, { useState, useEffect } from 'react';
import { useAPIClient } from '../DyceApi';
import Refresh from "@/assets/icons/refresh.svg";
import { BarGraph } from './Graphs';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import '@/assets/styles/Calendar.css'
import { DatePicker } from './DatePicker';

export const KeyUsage = ({ apiKey }) => {
  const [usageData, setUsageData] = useState([]);
  const [txData, setTxData] = useState([]);
  const [feeData, setFeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ethUsdPrice, setEthUsdPrice] = useState();
  const [range, setRange] = useState([
    {
      startDate: new Date(new Date().setDate(new Date().getDate() - 14)),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  const [showCalendar, setShowCalendar] = useState(false);
  const api = useAPIClient();

  useEffect(() => {
    if (apiKey) getHistory();
  }, [apiKey]);

  useEffect(() => {
    if (!showCalendar && apiKey) getHistory();
  }, [showCalendar]);

  async function getHistoryData(getHistory, dates, setData, keyName) {
    let dataMap = {};
    const history = await getHistory(keyName);
    for (const [dateStr, value] of Object.entries(history)) {
      const date = new Date(dateStr + "T00:00:00Z");
      const startDate = new Date(range[0].startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(range[0].endDate);
      endDate.setHours(23, 59, 59, 999);
      if (date > endDate || date < startDate) continue;
      dataMap[dateStr] = {};
      dataMap[dateStr][keyName] = value;
    }
    for (const date of dates) {
      if (!dataMap[date]) dataMap[date] = 0;
    }
    var dataList = Object.entries(dataMap).map(
      ([date, values]) => ({ date, ...values })
    );
    dataList.sort((a, b) => new Date(a.date) - new Date(b.date));
    setData(dataList);
  }

  async function getHistory() {
    try {
      setLoading(true);

      const getDaysBetween = (startDate, endDate) => {
        const dates = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          dates.push(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
        }
        return dates;
      };

      const { startDate, endDate } = range[0];
      const dates = getDaysBetween(startDate, endDate);
      await Promise.all([
        await getHistoryData((key) => api.getUsageHistory(key), dates, setUsageData, apiKey),
        await getHistoryData((key) => api.getTxHistory(key), dates, setTxData, apiKey),
        await getHistoryData((key) => api.getFeeHistory(key), dates, setFeeData, apiKey),
      ]);
      setLoading(false);
    } catch (error) {
      console.error("Request failed: ", error);
    }
  }

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

  // Format ETH amount
  const formatEth = (num) => {
    if (num === 0) return '0';
    return num.toExponential(1);
  }

  const formatEthWithConversion = (num) => {
    if (num === 0) return '0';
    if (ethUsdPrice)
      return num.toExponential(1) + " ≈ $" + (num * ethUsdPrice).toFixed(2);
    else
      return num.toExponential(1);
  }

  const getTotal = (data, key) =>
    data.reduce((sum, d) => sum + (typeof d[key] === 'number' ? d[key] : 0), 0);

  return (
    <div className='manager usage-wrapper key-usage-wrapper'>
      <div className='header-container'>
        <h1>History</h1>
        <DatePicker range={range} setRange={setRange} show={showCalendar} setShow={setShowCalendar} />
        <button className="refresh" onClick={() => getHistory()} disabled={loading}>
          <img src={Refresh} alt="X" height="24" />
        </button>
      </div>

      <div className='body-container'>
        <div className="graph-header">
          <h3 style={{"marginBottom": "10px"}}>Requests</h3>
          <label>Total: {getTotal(usageData, apiKey)}</label>
        </div>
        <div className='col' style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.5 : 1 }}>
          <BarGraph data={usageData} apiKeys={[{name: apiKey}]} allowDecimals={false} />
        </div>

        <div className="graph-header">
          <h3 style={{"marginBottom": "10px"}}>Transfers (USDC)</h3>
          <label>Total: {formatCurrency(getTotal(txData, apiKey))}</label>
        </div>
        <div className='col' style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.5 : 1 }}>
          <BarGraph data={txData} apiKeys={[{name: apiKey}]} formatter={formatCurrency} allowDecimals={true} />
        </div>

        <div className='graph-header'>
          <h3 style={{"marginBottom": "10px"}}>Transfer Fees (ETH)</h3>
          <label>Total: {formatEthWithConversion(getTotal(feeData, apiKey))}</label>
        </div>
        <div className='col' style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.5 : 1 }}>
          <BarGraph data={feeData} apiKeys={[{name: apiKey}]} formatter={formatEth} allowDecimals={true} tooltipFormatter={formatEthWithConversion} />
        </div>
      </div>
    </div>
  );
};