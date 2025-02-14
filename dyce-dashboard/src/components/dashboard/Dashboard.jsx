import React from 'react'
import { Logout } from '@/components/auth/Logout'
import { KeyManager } from './KeyManager'
import '@/assets/styles/Dashboard.css'
import { KeyTester } from './KeyTester'

export const Dashboard = () => {
  return (
    <div>
      <h1>Dyce API Dashboard</h1>
      <KeyManager />
      {/* <KeyTester /> */}
      {/* <Logout /> */}
    </div>
  )
}
