import React, { createContext, useState } from 'react';
import { useAPIClient } from '../DyceApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const api = useAPIClient();

  const getUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await api.authCheck(token);
      const data = await response.json();
      if (data.authenticated) setUser(data.user);
      else {
        setUser(null);
        console.error("User not authenticated");
        console.log(data);
      }
    }
    catch (error) {
      console.error("Request failed: ", error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, getUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
