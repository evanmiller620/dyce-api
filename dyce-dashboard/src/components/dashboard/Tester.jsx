import React, { useMemo, useState } from 'react'
import Dyce from '../../../../dyce'

export const Tester = () => {
  const [apiKey, setApiKey] = useState("");
  const [wallet, setWallet] = useState("");
  const [amount, setAmount] = useState(0);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const dyce = useMemo(() => new Dyce(apiKey), [apiKey]);

  const onApprove = async () => {
    setLoading(true);
    await dyce.approveSpending(userId, amount);
    setLoading(false);
  }

  const onRequest = async () => {
    setLoading(true);
    await dyce.requestPayment(userId, amount);
    setLoading(false);
  }

  return (
    <div className='manager fake-wrapper'>
      <div className='header-container'>
        <h1>API Test</h1>
      </div>
      <div className='row'>
        <input type='text' placeholder='API Key' onChange={e => setApiKey(e.target.value)}></input>
        <button onClick={() => setWallet(dyce.getWalletAddress())}>Get Wallet Address</button>
        <p>{wallet}</p>
        <input type='text' placeholder='User ID' onChange={e => setUserId(e.target.value)}></input>
        <input type='number' placeholder='Amount' onChange={e => setAmount(e.target.value)}></input>
        <button onClick={onApprove} disabled={loading}>Approve Spending</button>
        <button onClick={onRequest} disabled={loading}>Request Payment</button>
      </div>
    </div>
  )
}