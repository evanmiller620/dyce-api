import React, { useState, useEffect } from 'react';
import { useAPIClient } from '../DyceApi';
import Refresh from "@/assets/icons/refresh.svg";
import { BarGraph, PieGraph } from './Graphs';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import '@/assets/styles/Calendar.css'
import { DatePicker } from './DatePicker';

export const UsageManager = () => {
  const [usageData, setUsageData] = useState([]);
  const [usageTotals, setUsageTotals] = useState([]);
  const [txData, setTxData] = useState([]);
  const [txTotals, setTxTotals] = useState([]);
  const [feeData, setFeeData] = useState([]);
  const [feeTotals, setFeeTotals] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
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
    getHistory();
  }, []);

  useEffect(() => {
    if (!showCalendar) getHistory();
  }, [showCalendar]);

  async function getHistoryData(getHistory, dates, setData, setTotals, apiKeys) {
    let dataMap = {};
    let totalsMap = {};
    for (const apiKey of apiKeys) {
      const keyName = apiKey.name;
      const history = await getHistory(keyName);
      for (const [dateStr, value] of Object.entries(history)) {
        const date = new Date(dateStr + "T00:00:00");
        const startDate = new Date(range[0].startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(range[0].endDate);
        endDate.setHours(23, 59, 59, 999);
        if (date > endDate || date < startDate) continue;

        if (!dataMap[dateStr]) dataMap[dateStr] = {};
        dataMap[dateStr][keyName] = value;

        if (!totalsMap[keyName]) totalsMap[keyName] = 0;
        totalsMap[keyName] += value;
      }
    }
    for (const date of dates) {
      if (!dataMap[date]) dataMap[date] = {};
    }
    var dataList = Object.entries(dataMap).map(
      ([date, values]) => ({ date, ...values })
    );
    var totalsList = Object.entries(totalsMap).map(
      ([key, value]) => ({ name: key, value })
    );
    dataList.sort((a, b) => new Date(a.date) - new Date(b.date));
    setData(dataList);
    setTotals(totalsList);
  }

  async function getHistory() {
    try {
      setLoading(true);
      const response = await api.getApiKeys();
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setApiKeys(data.apiKeys);

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
      await getHistoryData((key) => api.getUsageHistory(key), dates, setUsageData, setUsageTotals, data.apiKeys);
      await getHistoryData((key) => api.getTxHistory(key), dates, setTxData, setTxTotals, data.apiKeys);
      await getHistoryData((key) => api.getFeeHistory(key), dates, setFeeData, setFeeTotals, data.apiKeys);
      setLoading(false);
    } catch (error) {
      console.error("Request failed: ", error);
    }
  }

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

  return (
    <div className='manager usage-wrapper'>
      <div className='header-container'>
        <h1>Usage</h1>
        <DatePicker range={range} setRange={setRange} show={showCalendar} setShow={setShowCalendar} />
        <button className="refresh" onClick={() => getHistory()} disabled={loading}>
          <img src={Refresh} alt="X" height="24" />
        </button>
      </div>

      <div className='body-container'>
        <h3 style={{"marginBottom": "10px"}}>Requests</h3>
        <div className='col' style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.5 : 1 }}>
          <BarGraph data={usageData} apiKeys={apiKeys} allowDecimals={false} />
          <div className='row'>
            <h3 className='pie-title'>Total</h3>
            <PieGraph totals={usageTotals} apiKeys={apiKeys} />
          </div>
        </div>

        <h3 style={{"marginBottom": "10px"}}>Transfers (USDT)</h3>
        <div className='col' style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.5 : 1 }}>
          <BarGraph data={txData} apiKeys={apiKeys} formatter={formatCurrency} allowDecimals={true} />
          <div className='row'>
            <h3 className='pie-title'>Total</h3>
            <PieGraph totals={txTotals} apiKeys={apiKeys} formatter={formatCurrency} />
          </div>
        </div>
          
        <h3 style={{"marginBottom": "10px"}}>Transfer Fees (ETH)</h3>
        <div className='col' style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.5 : 1 }}>
          <BarGraph data={feeData} apiKeys={apiKeys} formatter={formatEth} allowDecimals={true} tooltipFormatter={formatEthWithConversion} />
          <div className='row'>
            <h3 className='pie-title'>Total</h3>
            <PieGraph totals={feeTotals} apiKeys={apiKeys} formatter={formatEthWithConversion}/>
          </div>
        </div>
      </div>
    </div>
  );
};