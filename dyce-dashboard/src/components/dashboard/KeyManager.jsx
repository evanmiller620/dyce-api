import React, { useEffect, useState } from 'react'
import Trash from "@/assets/icons/trash.svg";
import Popup from './Popup';

export const KeyManager = () => {
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
  }, [showPopup]);

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

  return (
    <div className='key-manager-wrapper'>
      <div className='header-container'>
        <h1>API Keys</h1>
        <button onClick={setShowPopup}>+ Create</button>
        {showPopup && <Popup onClose={() => setShowPopup(false)} />}
      </div>
      <div className='api-key-list'>
        {apiKeys.length === 0 ? (
          <p>No API keys created yet.</p>
        ) : (
          apiKeys.map(({name, key}) => (
            <div key={key} className='api-key-entry'>
              <label id="name">{name}</label>
              <label id="key">{key}</label>
              <button id="trash" onClick={() => deleteKey(name)}>
                <img src={Trash} alt="X" height="24" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
