import React, { useState } from 'react'
import { Logout } from '@/components/auth/Logout'
import { KeyManager } from './KeyManager'
import { WalletManager } from './WalletManager'
import { UsageManager } from './UsageManager'
import { Tester } from './Tester'
import '@/assets/styles/Dashboard.css'
import Profile from "@/assets/icons/profile.svg";

export const Dashboard = () => {
  const [wallets, setWallets] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className='row'>
      <nav>
        <button id="profile" style={{visibility:"hidden"}}>
          <img src={Profile} height="32" />
        </button>
        <a style={{visibility:"hidden"}}>Dashboard</a>
        <a style={{visibility:"hidden"}}>Docs</a>
        <h1 className='title'>Dashboard</h1>
        <a href='dashboard'>Dashboard</a>
        <a href='dashboard'>Docs</a>
        <button id="profile" onClick={() => setShowMenu(!showMenu)}>
          <img src={Profile} height="32" />
        </button>
        {showMenu &&
        <div id="menu">
          <Logout />
        </div>}
      </nav>
      <div className='managers-wrapper'>
        <KeyManager wallets={wallets}/>
        <WalletManager wallets={wallets} setWallets={setWallets}/>
        <UsageManager />
        {/* <Tester /> */}
      </div>
    </div>
  )
}
