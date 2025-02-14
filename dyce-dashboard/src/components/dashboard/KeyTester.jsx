import React, { useState } from 'react'

export const KeyTester = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useCount, setUseCount] = useState(0);
  const [apiKey, setApiKey] = useState("");

  const useKey = async (apiKey) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/use-api-key', {
        method: 'POST',
        headers: { apikey: apiKey },
      });
      const data = await response.json();
      console.log(data);
      if (!response.ok)
        throw new Error(data.message || "Failed to use API key");
      setError(null);
      setUseCount(data.useCount);
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
        <label>Use count: {useCount}</label>
    </div>
  )
}
