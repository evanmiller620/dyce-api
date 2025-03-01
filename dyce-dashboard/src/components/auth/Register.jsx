import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import '@/assets/styles/Login.css'
import { PasswordChecklist } from './PasswordChecklist';

async function registerUser(credentials) {
  const response = await fetch('http://localhost:8080/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || `Error: ${response.status}`);
  }
  return data;
}

export const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [valid, setValid] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    if (!valid)
      return setError('Password does not meet requirements!');

    if (password !== confirmPassword)
      return setError('Passwords do not match!');

    setLoading(true);
    try {
      await registerUser({
        email: username,
        password: password
      });
      navigate('/verify', { state: { email: username } });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='login-wrapper'>
      <form onSubmit={handleSubmit}>
        <h1>Register</h1>
        <input type='email' placeholder='Email address' onChange={e => setUsername(e.target.value)} className={error && error.toLowerCase().includes("email") ? 'error' : ''} required />
        <input type='password' placeholder='Password' onChange={e => setPassword(e.target.value)} className={error && error.toLowerCase().includes("password") ? 'error' : ''} required />
        <input type='password' placeholder='Confirm password' onChange={e => setConfirmPassword(e.target.value)} className={error && error.toLowerCase().includes("match") ? 'error' : ''} required />
        <PasswordChecklist password={password} confirmPassword={confirmPassword} onChange={(valid) => setValid(valid)} />
        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={loading}>Submit</button>
        <p>Have an account?<a href='login'>Sign in</a></p>
      </form>
    </div>
  )
}

Register.propTypes = {
  setToken: PropTypes.func.isRequired
}