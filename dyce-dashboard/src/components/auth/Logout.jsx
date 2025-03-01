import React from 'react'
import { useAuth } from './AuthContext';
import '@/assets/styles/Logout.css';

export const Logout = () => {
  const { setUser } = useAuth();

  const handleLogout = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      return;
    }

    fetch("http://localhost:8080/logout", {
      method: "POST",
      headers: { Authorization: `${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(null);
        }
      });
    // localStorage.removeItem("accessToken");
    setUser(null);
  }

  return <button onClick={handleLogout}>Logout</button>;
}
