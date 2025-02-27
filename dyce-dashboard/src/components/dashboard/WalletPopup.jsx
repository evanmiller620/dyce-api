import { useState } from "react";

export const WalletPopup = ({ onClose }) => {
  const [walletName, setWalletName] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletKey, setWalletKey] = useState("");
  const [error, setError] = useState("");

  const addWallet = async (name) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/add-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, address: walletAddress, key: walletKey }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to add wallet");
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      onClose();
    }
  }

  return (
    <div className="popup-container">
      <div className="popup">
        <form onSubmit={(e) => { e.preventDefault(); addWallet(walletName) }}>
          <div className="row">
            <input type="text" onChange={e => setWalletName(e.target.value)} placeholder="Wallet name" required></input>
            <input type="text" onChange={e => setWalletAddress(e.target.value)} placeholder="Wallet address" required></input>
            <input type="text" onChange={e => setWalletKey(e.target.value)} placeholder="Wallet private key" required></input>
            <div className="col">
              <button type="submit" disabled={loading}>Enter</button>
              <button onClick={onClose} disabled={loading}>Cancel</button>
            </div>
          </div>
        </form>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}