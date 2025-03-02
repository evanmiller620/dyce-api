import React from 'react'
import { useAuth } from './AuthContext';
import { useAPIClient } from '../DyceApi';
import '@/assets/styles/Logout.css';

export const Logout = () => {
  const { setUser } = useAuth();
  const api = useAPIClient();

  const handleLogout = async () => {
    try {
      await api.specifyEndpoint("logout", "POST");
    }
    catch (error) {
      console.error("Request failed: ", error);
    }
    localStorage.removeItem("accessToken"); // if it's in local storage. chip chop
    setUser(null);
  }

  return <button onClick={handleLogout}>Logout</button>;
}
