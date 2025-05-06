import React, { useEffect, useState } from 'react'
import Trash from "@/assets/icons/trash.svg";
import Rotate from "@/assets/icons/refresh.svg";
import { KeyPopup } from './KeyPopup';
import { RotatePopup } from './RotatePopup';
import { useAPIClient } from '../DyceApi';

export const KeyManager = ({ apiKey, setApiKey }) => {
  const [apiKeys, setApiKeys] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showRotatePopup, setShowRotatePopup] = useState(false);
  const [rotatedKey, setRotatedKey] = useState("");
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
        setApiKey(data.apiKeys[0].name);
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
    if (!response.ok) throw new Error("Failed to delete API key");
    setApiKeys(apiKeys.filter(key => key.name !== name));
    setDeleting(false);
    if (apiKey === name) setApiKey(null);
  }

  const rotateKey = async (name) => {
    setDeleting(true);
    const response = await api.rotateKey(name);
    const data = await response.json();
    if (!response.ok) throw new Error("Failed to rotate API key");
    console.log(data);
    const newKey = data.apiKey;
    console.log(newKey)
    setApiKeys(prevKeys =>
      prevKeys.map(apikey =>
        apikey.name === name ? { ...apikey, key: newKey } : apikey
      )
    );
    setDeleting(false);
    setRotatedKey(newKey);
    setShowRotatePopup(true);
    setDeleting(false);
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
        {showRotatePopup && (
          <RotatePopup
            apiKey={rotatedKey}
            onClose={() => setShowRotatePopup(false)}
          />
        )}
      </div>
      <div className='table-container body-container'>
        {apiKeys.length === 0 ? (
          <h3>No API keys created yet.</h3>
        ) : (
        <table>
          <colgroup>
            <col style={{ width: "auto" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "46px" }} />
            <col style={{ width: "46px" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Wallet</th>
              <th></th>
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
                  <button className="trash" onClick={(e) => {rotateKey(name); e.stopPropagation();}} disabled={deleting} title="Rotate API key">
                    <img src={Rotate} alt="X" height="24" />
                  </button>
                </td>
                <td>
                  <button className="trash" onClick={(e) => {deleteKey(name); e.stopPropagation();}} disabled={deleting} title="Delete API key">
                    <img src={Trash} alt="X" height="24" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  )
}