import React, { useEffect, useState } from 'react'
import Trash from "@/assets/icons/trash.svg";
import { WalletPopup } from './WalletPopup';

export const WalletManager = ({ wallets, setWallets }) => {
  const [showPopup, setShowPopup] = useState(false);

  async function getWallets() {
    const response = await fetch('http://localhost:8080/get-wallets', {
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Failed to fetch wallets");
    const data = await response.json();
    setWallets(data.wallets);
  }

  useEffect(() => {
    getWallets();
  }, [showPopup]);

  const deleteWallet = async (name) => {
    user = localStorage.getItem("userId");
    const response = await fetch('http://localhost:8080/remove-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, user: user }),
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Failed to delete wallet");
    const data = await response.json();
    setWallets(wallets.filter(key => key.name !== name));
  }

  return (
    <div className='manager wallets-wrapper'>
      <div className='header-container'>
        <h1>Wallets</h1>
        <button onClick={setShowPopup}>+ Add</button>
        {showPopup && <WalletPopup onClose={() => setShowPopup(false)} />}
      </div>
      {wallets.length === 0 ? (
        <h3>No wallets added yet.</h3>
      ) : (
        <table>
          <colgroup>
            <col style={{ width: "50%" }} />
            <col style={{ width: "50%" }} />
            <col style={{ width: "80px" }} />
            <col style={{ width: "40px" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map(({name, address}) => (
              <tr key={address}>
                <td>{name}</td>
                <td>{address}</td>
                <td>$0.00</td>
                <td>
                  <button id="trash" onClick={() => deleteWallet(name)}>
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