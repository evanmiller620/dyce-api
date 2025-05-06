import { useState } from "react";
import Copy from "@/assets/icons/copy.svg";
import { useAPIClient } from '../DyceApi';


export const KeyPopup = ({ onClose }) => {
  const [keyName, setKeyName] = useState("");
  const [keyReady, setKeyReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const api = useAPIClient();

  const createKey = async (name) => {
    setLoading(true);
    const user = localStorage.getItem("userId");
    try {
      const response = await api.generateApiKey(name, user);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to create API key");
      setKeyReady(true);
      setApiKey(data.apiKey);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const showKey = async (name) => {
    setKeyReady(true);
    setApiKey(name);
    setError(null);
  }

  const handleClose = async e => {
    e.preventDefault();
    setKeyReady(false);
    onClose();
  }

  return (
    <div className="popup-container">
      <div className="popup">
        {!keyReady ? (
          <form className="col" onSubmit={(e) => { e.preventDefault(); createKey(keyName) }}>
            <input type="text" onChange={e => setKeyName(e.target.value)} placeholder="Key name" required></input>
            <button type="submit" disabled={loading}>Enter</button>
            <button onClick={onClose}>Cancel</button>
          </form>
        ) : (
          <>
            <div className="col">
              <input className="copy" type="text" value={apiKey} readOnly />
              <button className="copy" onClick={() => navigator.clipboard.writeText(apiKey)}>
                <img src={Copy} alt="X" height="24" />
              </button>
              <button onClick={handleClose}>Done</button>
            </div>
            <p>You will not be able to view your key again,</p>
            <p>please copy it somewhere safe.</p>
          </>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}