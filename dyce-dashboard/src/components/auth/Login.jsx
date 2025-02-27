import React, { useState } from 'react'
import PropTypes from 'prop-types'
import '@/assets/styles/Login.css'
import { useAuth } from './AuthContext';

async function loginUser(credentials) {
  const response = await fetch('http://localhost:8080/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include',
  });
  
  const data = await response.json();
  if (!response.ok)
    throw new Error(data?.message || `Error: ${response.status}`);
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("userId", data.userId);
  return data;
}

export const Login = () => {
  const { setUser } = useAuth();
  const [username, setUsername] = useState();
  const [password, setPassword] = useState();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await loginUser({
        email: username,
        password: password
      });
      setUser(data.userId);
      window.location.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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