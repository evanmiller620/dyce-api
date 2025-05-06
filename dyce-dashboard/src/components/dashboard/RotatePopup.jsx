import { useState } from "react";
import Copy from "@/assets/icons/copy.svg";

export const RotatePopup = ({ onClose, apiKey }) => {

  const handleClose = async (e) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="popup-container">
      <div className="popup">
        <>
          <div className="col">
            <input className="copy" type="text" value={apiKey} readOnly />
            <button className="copy" onClick={() => navigator.clipboard.writeText(apiKey)}>
              <img src={Copy} alt="Copy" height="24" />
            </button>
            <button onClick={handleClose}>Done</button>
          </div>
          <p>You will not be able to view your key again,</p>
          <p>please copy it somewhere safe.</p>
        </>
      </div>
    </div>
  );
};
