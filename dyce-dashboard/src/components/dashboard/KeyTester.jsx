import React, { useState } from 'react'

export const KeyTester = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addr, setAddr] = useState("");
  const [apiKey, setApiKey] = useState("");

  const useKey = async (apiKey) => {
    setLoading(true);
    const token = localStorage.getItem("accessToken");
    try {
      const response = await fetch('http://localhost:8080/get-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token}`,
        },
        body: JSON.stringify({ key: apiKey }),
      });
      const data = await response.json();
      console.log(data);
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
