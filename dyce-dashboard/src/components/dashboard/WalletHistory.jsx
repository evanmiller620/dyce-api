import React, { useState, useEffect } from 'react';
import Refresh from "@/assets/icons/refresh.svg";
import { DatePicker } from './DatePicker';
import { useAPIClient } from '../DyceApi';
import { CONTRACT_ADDRESS } from '../../../../dyce-npm-package/APIClient';
import { LineGraph } from './Graphs';

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
      const [tokenData, ethData] = await Promise.all([
        api.getWalletHistory(walletAddress, CONTRACT_ADDRESS),
        api.getWalletHistory(walletAddress)
      ]);
      setTokenBalanceData(tokenData);
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
          <LineGraph data={tokenBalanceData} domain={domain} formatter={formatCurrency} />
        </div>

        <h3 style={{"marginBottom": "10px"}}>ETH Balance</h3>
        <div className='balance-wrapper'>
          <LineGraph data={ethBalanceData} domain={domain} tooltipFormatter={formatEthWithConversion} />
        </div>
      </div>
    </div>
  );
};
