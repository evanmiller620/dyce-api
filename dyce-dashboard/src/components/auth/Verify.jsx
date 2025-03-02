import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/assets/styles/Verify.css';
import { useAuth } from './AuthContext';
import { useLocation } from 'react-router-dom';
import { useAPIClient } from '../DyceApi';

export const Verify = () => {
  const { setUser } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {};
  const api = useAPIClient();

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Email information is missing. Please go back to registration.");
      return;
    }
    
    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const body = { 
        email: email,
        code: verificationCode 
      }
      const response = await api.verifyEmail(body);
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Verification failed");
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      setError("An error occurred during verification");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Email information is missing. Please go back to registration.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.resendVerification({ email });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to resend verification code");
      } else {
        setError(null);
        setSuccess(false);
        alert("Verification code has been resent to your email");
      }
    } catch (err) {
      setError("An error occurred while trying to resend the code");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="verify-wrapper">
        <h1 className="error-message">Email information missing</h1>
        <p>Please go back to registration</p>
        <button 
          className="verify-button"
          onClick={() => navigate("/register")}
        >
          Go to Registration
        </button>
      </div>
    );
  }

  return (
    <div className="verify-wrapper">
      {success ? (
        <div className="success-container">
          <h1>Email Verified!</h1>
          <p>Your email has been successfully verified.</p>
          <p>Redirecting to login...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <h1 className="error-message">{error}</h1>
          <button 
            className="verify-button"
            onClick={() => setError(null)}
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="verification-container">
          <h1>Verify your email</h1>
          <p>Verification code sent to {email}</p>
          <form onSubmit={handleVerify} className="verification-form">
            <input
              type="text"
              placeholder="Enter verification code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="verification-input"
            />
            <button 
              type="submit" 
              className="verify-button"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>
          <button 
            onClick={handleResend} 
            className="resend-link"
            disabled={loading}
          >
            Resend verification code
          </button>
          <p>Already Verified? <a href='login'>Sign in</a></p>
        </div>
      )}
    </div>
  );
};