import React, { useEffect, useState } from 'react'
import Trash from "@/assets/icons/trash.svg";
import { KeyPopup } from './KeyPopup';
import { useAPIClient } from '../DyceApi';

export const KeyManager = ({ apiKey, setApiKey }) => {
  const [apiKeys, setApiKeys] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [wallets, setWallets] = useState([]);
  const api = useAPIClient();

  async function getKeys() {
    // const token = localStorage.getItem("accessToken");
    try {
      const response = await api.getApiKeys();
      if (!response.ok) throw new Error("Failed to fetch API keys");
      const data = await response.json();
      setApiKeys(data.apiKeys);
      if (!data.apiKeys.some(k => k.name === apiKey))
        setApiKey(data.apiKeys[0]?.name ?? null);
      await getWallets();
    }
    catch (error) {
      console.error("Failed to get API keys: ", error);
    }
  }

  async function getWallets() {
    try {
      const response = await api.getWallets();
      if (!response.ok) throw new Error("Failed to fetch wallets");
      const data = await response.json();
      setWallets(data.wallets);
    }
    catch (error) {
      console.error("Failed to get wallets: ", error);
    }
  }

  useEffect(() => {
    getKeys();
  }, [showPopup]);

  const deleteKey = async (name) => {
    setDeleting(true);
    const response = await api.deleteApiKey(name);
    const data = await response.json();
    if (!response.ok) throw new Error("Failed to delete API key");
    setApiKeys(apiKeys.filter(key => key.name !== name));
    setDeleting(false);
    if (apiKey === name) setApiKey(null);
  }

  const updateWallet = async (keyName, walletName) => {
    const response = await api.updateWallet(keyName, walletName);
    if (!response.ok) throw new Error("Failed to set wallet for API key");
    await getKeys();
  }

  return (
    <div className='manager keys-wrapper'>
      <div className='header-container'>
        <h1>API Keys</h1>
        <button onClick={setShowPopup}>+ Create</button>
        {showPopup && <KeyPopup onClose={() => setShowPopup(false)} />}
      </div>
      {apiKeys.length === 0 ? (
        <h3>No API keys created yet.</h3>
      ) : (
      <div className='table-container'>
        <table>
          <colgroup>
            <col style={{ width: "auto" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "46px" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Wallet</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.map(({ name, key, wallet }) => (
              <tr key={key} className={apiKey === name ? 'selected' : ''} onClick={() => setApiKey(name)}>
                <td>{name}</td>
                <td>{key}</td>
                <td>
                  <select value={wallet || ""} onChange={(e) => updateWallet(name, e.target.value)} onClick={(e) => e.stopPropagation()}>
                    <option value="" disabled>Select wallet</option>
                    {wallets.map(({ name, address }) => (
                      <option key={address}>{name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="trash" onClick={() => {deleteKey(name); e.stopPropagation();}} disabled={deleting}>
                    <img src={Trash} alt="X" height="24" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}