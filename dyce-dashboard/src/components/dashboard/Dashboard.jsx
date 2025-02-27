import React, { useState } from 'react'
import { Logout } from '@/components/auth/Logout'
import { KeyManager } from './KeyManager'
import '@/assets/styles/Dashboard.css'
import { KeyTester } from './KeyTester'
import { WalletManager } from './WalletManager'

export const Dashboard = () => {
  const [wallets, setWallets] = useState([]);

  return (
    <div>
      <h1>Dyce API Dashboard</h1>
      <div className='managers-wrapper'>
        <KeyManager wallets={wallets}/>
        <WalletManager wallets={wallets} setWallets={setWallets}/>
        <KeyTester />
      </div>
      <Logout />
    </div>
  )
}
