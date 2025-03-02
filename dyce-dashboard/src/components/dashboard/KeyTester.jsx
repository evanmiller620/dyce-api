import React, { useState } from 'react'
import { useAPIClient } from '../DyceApi';


export const KeyTester = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addr, setAddr] = useState("");
  const [apiKey, setApiKey] = useState("");
  const api = useAPIClient();

  const useKey = async (apiKey) => {
    setLoading(true);
    try {
      const response = await api.getWallet(apiKey);
      const data = await response.json();
      console.log(response);
      if (!response.ok)
        throw new Error(data.message || "Failed to get wallet address for API key");
      setError(null);
      setAddr(data.address);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input type='text' placeholder='API key' onChange={e => setApiKey(e.target.value)}></input>
      <button onClick={() => useKey(apiKey)} disabled={loading}>Test</button>
      {error && <p className='error'>{error}</p>}
      <label>Wallet: {addr}</label>
    </div>
  )
}
