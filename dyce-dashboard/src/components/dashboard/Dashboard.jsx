import React, { useState } from 'react'
import { Logout } from '@/components/auth/Logout'
import { KeyManager } from './KeyManager'
import { WalletManager } from './WalletManager'
import { UsageManager } from './UsageManager'
import { Tester } from './Tester'
import '@/assets/styles/Dashboard.css'
import Profile from "@/assets/icons/profile.svg";
import Sidebar from './Sidebar'
import { Route, Routes, Navigate } from 'react-router-dom'
import { KeyUsage } from './KeyUsage'

export const Dashboard = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [apiKey, setApiKey] = useState();

  return (
    <div className='db-wrapper'>
      <Sidebar />
      <div className='dashboard-wrapper'>
        <nav>
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
          <Routes>
            <Route path="" element={<Navigate to="keys" replace />} />
            <Route path="/keys" element={<><KeyManager apiKey={apiKey} setApiKey={setApiKey} /><KeyUsage apiKey={apiKey} /></>} />
            <Route path="/wallets" element={<WalletManager />} />
            <Route path="/usage" element={<UsageManager />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
