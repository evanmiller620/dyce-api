import React, { useEffect } from 'react'
import { useAuth } from './AuthContext';
import { Login } from './Login';

export const ProtectedRoute = ({ children }) => {
  const { user, getUser } = useAuth();

  useEffect(() => {
    getUser();
  }, [location.pathname]);

  if (!user) return <Login />;
  return children;
}