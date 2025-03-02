import React, { useEffect, useState } from 'react'
import Trash from "@/assets/icons/trash.svg";
import { KeyPopup } from './KeyPopup';
import { useAPIClient } from '../DyceApi';


export const KeyManager = ({ wallets }) => {
  const [apiKeys, setApiKeys] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const api = useAPIClient();

  async function getKeys() {
    // const token = localStorage.getItem("accessToken");
    try {
      const response = await api.getApiKeys();
      if (!response.ok) throw new Error("Failed to fetch API keys");
      const data = await response.json();
      setApiKeys(data.apiKeys);
    }
    catch (error) {
      console.error("Request failed: ", error);
    }
  }

  useEffect(() => {
    getKeys();
  }, [showPopup, wallets]);

  const deleteKey = async (name) => {
    const response = await api.deleteApiKey(name);
    const data = await response.json();
    if (!response.ok) throw new Error("Failed to delete API key");
    setApiKeys(apiKeys.filter(key => key.name !== name));
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
            {apiKeys.map(({ name, key, wallet }) => (
              <tr key={key}>
                <td>{name}</td>
                <td>{key}</td>
                <td>
                  <select value={wallet || ""} onChange={(e) => updateWallet(name, e.target.value)}>
                    <option value="" disabled>Select wallet</option>
                    {wallets.map(({ name, address }) => (
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
