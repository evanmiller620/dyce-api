import React, { useState } from 'react'
import { Logout } from '@/components/auth/Logout'
import { KeyManager } from './KeyManager'
import '@/assets/styles/Dashboard.css'
import { WalletManager } from './WalletManager'
import { Tester } from './Tester'

export const Dashboard = () => {
  const [wallets, setWallets] = useState([]);

  return (
    <div>
      <h1 className='title'>Dashboard</h1>
      <div className='managers-wrapper'>
        <KeyManager wallets={wallets}/>
        <WalletManager wallets={wallets} setWallets={setWallets}/>
        <Tester />
      </div>
      {/* <Logout /> */}
    </div>
  )
}
