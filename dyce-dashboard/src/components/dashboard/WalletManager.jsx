import React, { useEffect, useState } from 'react'
import Trash from "@/assets/icons/trash.svg";
import Refresh from "@/assets/icons/refresh.svg";
import { WalletPopup } from './WalletPopup';
import { useAPIClient } from '../DyceApi';

export const WalletManager = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [wallets, setWallets] = useState([]);
  const api = useAPIClient();

  async function getWallets() {
    setRefreshing(true);
    try {
      const response = await api.getWallets();
      if (!response.ok) throw new Error("Failed to fetch wallets");
      const data = await response.json();
      setWallets(data.wallets);
    }
    catch (error) {
      console.error("Request failed: ", error);
    }
    setRefreshing(false);
  }

  useEffect(() => {
    getWallets();
  }, [showPopup]);

  const deleteWallet = async (name) => {
    setDeleting(true);
    try {
      const response = await api.deleteWallet(name);
      if (!response.ok) throw new Error("Failed to delete wallet");
      
      setWallets(wallets.filter(key => key.name !== name));
    } catch (error) {
      console.error("Request failed: ", error);
    } finally {
      setDeleting(false);
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
      <div className='table-container'>
        <table>
          <colgroup>
            <col style={{ width: "50%" }} />
            <col style={{ width: "50%" }} />
            <col style={{ width: "84px" }} />
            <col style={{ width: "46px" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Balance</th>
              <th>
                <button className="refresh" onClick={() => getWallets()} disabled={refreshing}>
                  <img src={Refresh} alt="X" height="24" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {wallets.map(({ name, address, balance }) => (
              <tr key={address}>
                <td>{name}</td>
                <td>{address}</td>
                <td>{balance}</td>
                <td>
                  <button className="trash" onClick={() => deleteWallet(name)} disabled={deleting}>
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