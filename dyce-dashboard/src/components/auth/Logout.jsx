import React from 'react'
import { useAuth } from './AuthContext';

export const Logout = () => {
  const { setUser } = useAuth();

  const handleLogout = async () => {
    await fetch("http://localhost:8080/logout", {
      method: "POST",
      credentials: "include"
    });
    setUser(null);
  }

  return <button onClick={handleLogout}>Logout</button>;
}
