import React, { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const getUser = async () => {
    fetch("http://localhost:8080/auth-check", {
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

  useEffect(() => { // trigger on page open
    getUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, getUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
