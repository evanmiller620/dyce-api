import React, { useState } from 'react'
import PropTypes from 'prop-types'
import '@/assets/styles/Login.css'
import { useAuth } from './AuthContext';
import { useAPIClient } from '../DyceApi';
// import { set } from 'zod';

export const Login = () => {
  const { setUser } = useAuth();
  const api = useAPIClient();
  const [username, setUsername] = useState();
  const [password, setPassword] = useState();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);


  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const credentials = {
      email: username,
      password: password
    }
    try {
      const response = await api.login(credentials);
      if (!response.ok) {
        setError(response.message || "Login failed");
        setLoading(false);
        return;
      }
      const data = await response.json();
      if (!data.authenticated) {
        setError(data.message);
      }
      else {
        const accessToken = data.accessToken;
        api.setToken(accessToken);
        localStorage.setItem("accessToken", accessToken);
        setUser(data.userId);
      }
    }
    catch (error) {
      console.error("Request failed: ", error);
    }
    setLoading(false);
  }

  return (
    <div className='login-wrapper'>
      <form onSubmit={handleSubmit}>
        <h1>Sign In</h1>
        <input type='email' placeholder='Email address' onChange={e => setUsername(e.target.value)} required />
        <input type='password' placeholder='Password' onChange={e => setPassword(e.target.value)} className={error && error.toLowerCase().includes("password") ? 'error' : ''} required />
        {error && <p className="error-message">{error}</p>}
        {/* <a href=''>Forgot password?</a> */}
        <button type="submit" disabled={loading}>Submit</button>
        <p>Don't have an account?<a href='register'>Sign up</a></p>
      </form>
    </div>
  )
}

Login.propTypes = {
  setToken: PropTypes.func.isRequired
}