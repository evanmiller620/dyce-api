import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../assets/styles/Verify.css'
import { useAuth } from './AuthContext';
import { useLocation } from 'react-router-dom';

export const Verify = () => {
  const { setUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {};

  useEffect(() => {
    const verificationToken = searchParams.get("token");
    if (!verificationToken) {
      if (!email) navigate("/");
      return;
    };
    fetch(`http://localhost:8080/verify-email?token=${verificationToken}`, {
      credentials: 'include',
    })
    .then(response => response.json().then(data => {
      if (!response.ok)
        setError(data.message);
      else {
        setUser(data.user);
        navigate("/dashboard");
      }
    }));
  }, [searchParams, navigate]);

  return (
    <div className='verify-wrapper'>
      {error ? (<h1 className="error-message">{error}</h1>):
      (<>
        <h1>Verify your email</h1>
        <p>Verification email sent to {email}!</p>
        <p>Click the link inside to get started.</p>
        {/* <a onClick={""}>Resend email</a> */}
      </>)}
    </div>
  )
}