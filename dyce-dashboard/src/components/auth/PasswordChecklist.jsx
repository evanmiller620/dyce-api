import React, { useState, useEffect } from 'react';

export const PasswordChecklist = ({ password, onChange }) => {
  const [isValid, setIsValid] = useState({
    minLength: false,
    specialChar: false,
    capital: false,
    lower: false,
    number: false,
  });

  const checkMinLength = (password) => password.length >= 8;
  const checkSpecialChar = (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const checkCapital = (password) => /[A-Z]/.test(password);
  const checkLower = (password) => /[a-z]/.test(password);
  const checkNumber = (password) => /\d/.test(password);

  useEffect(() => {
    const validState = {
      minLength: checkMinLength(password),
      specialChar: checkSpecialChar(password),
      capital: checkCapital(password),
      lower: checkLower(password),
      number: checkNumber(password),
    };
    setIsValid(validState);
    onChange(validState.minLength && validState.specialChar && validState.capital && validState.lower && validState.number);
  }, [password, onChange]);

  return (
    <div className="password-checklist">
      <p>Password must contain:</p>
      <ul>
        <li className={isValid.minLength ? 'valid' : 'invalid'}>At least 8 characters</li>
        <li className={isValid.specialChar ? 'valid' : 'invalid'}>At least one special character</li>
        <li className={isValid.capital ? 'valid' : 'invalid'}>At least one capital letter</li>
        <li className={isValid.lower ? 'valid' : 'invalid'}>At least one lowercase letter</li>
        <li className={isValid.number ? 'valid' : 'invalid'}>At least one number</li>
      </ul>
    </div>
  );
};