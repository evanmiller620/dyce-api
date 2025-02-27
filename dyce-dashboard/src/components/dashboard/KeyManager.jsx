import React, { useEffect, useState } from 'react'
import Trash from "@/assets/icons/trash.svg";
import { KeyPopup } from './KeyPopup';

export const KeyManager = ({ wallets }) => {
  const [apiKeys, setApiKeys] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  async function getKeys() {
    const response = await fetch('http://localhost:8080/get-api-keys', {
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Failed to fetch API keys");
    const data = await response.json();
    setApiKeys(data.apiKeys);
  }

  useEffect(() => {
    getKeys();
  }, [showPopup, wallets]);

  const deleteKey = async (name) => {
    const response = await fetch('http://localhost:8080/delete-api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name }),
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Failed to delete API key");
    const data = await response.json();
    setApiKeys(apiKeys.filter(key => key.name !== name));
  }

  const updateWallet = async (keyName, walletName) => {
    const response = await fetch('http://localhost:8080/set-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyName: keyName, walletName: walletName }),
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Failed to set wallet for API key");
    const data = await response.json();
    await getKeys();
  }

  return (
    <div className='manager keys-wrapper'>
      <div className='header-container'>
        <h1>API Keys</h1>
        <button onClick={setShowPopup}>+ Create</button>
        {showPopup && <KeyPopup onClose={() => setShowPopup(false)} />}
      </div>
      <table>
        <colgroup>
          <col style={{ width: "auto" }} />
          <col style={{ width: "110px" }} />
          <col style={{ width: "150px" }} />
          <col style={{ width: "40px" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Wallet</th>
          </tr>
        </thead>
        <tbody>
          {apiKeys.length === 0 ? (
            <tr><td>No API keys created yet.</td></tr>
          ) : (
            apiKeys.map(({name, key, wallet}) => (
              <tr key={key}>
                <td>{name}</td>
                <td>{key}</td>
                <td>
                  <select value={wallet || ""} onChange={(e) => updateWallet(name, e.target.value)}>
                    <option value="" disabled>Select wallet</option>
                    {wallets.map(({name, address}) => (
                      <option key={address}>{name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button id="trash" onClick={() => deleteKey(name)}>
                    <img src={Trash} alt="X" height="24" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
