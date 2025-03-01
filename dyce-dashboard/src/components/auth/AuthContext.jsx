import React, { createContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const getUser = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      return;
    }
    fetch("http://localhost:8080/auth-check", {
      headers: { Authorization: `${token}` },
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) setUser(data.user);
        else setUser(null);
      })
      .catch(() => {
        setUser(null);
      });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, getUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
