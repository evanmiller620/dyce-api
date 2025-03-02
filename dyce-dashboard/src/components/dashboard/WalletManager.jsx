import React, { useEffect, useState } from 'react'
import Trash from "@/assets/icons/trash.svg";
import { WalletPopup } from './WalletPopup';
import { useAPIClient } from '../DyceApi';

export const WalletManager = ({ wallets, setWallets }) => {
  const [showPopup, setShowPopup] = useState(false);
  const api = useAPIClient();

  async function getWallets() {
    try {
      const response = await api.getWallets();
      if (!response.ok) throw new Error("Failed to fetch wallets");
      const data = await response.json();
      setWallets(data.wallets);
    }
    catch (error) {
      console.error("Request failed: ", error);
    }
  }

  useEffect(() => {
    getWallets();
  }, [showPopup]);

  const deleteWallet = async (name) => {
    try {
      const response = await api.deleteWallet(name);
      if (!response.ok) throw new Error("Failed to delete wallet");
      
      setWallets(wallets.filter(key => key.name !== name));
    } catch (error) {
      console.error("Request failed: ", error);
    }
    
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
            {wallets.map(({ name, address }) => (
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