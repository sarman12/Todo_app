import React, { useState, useEffect } from 'react';
import { BsGoogle } from 'react-icons/bs';
import { FaFacebook } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Loading state

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleRegister = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!username) {
      setErrorMessage('Username is required.');
      return;
    }
    if (!email) {
      setErrorMessage('Email is required.');
      return;
    }
    if (!fullName) {
      setErrorMessage('Full Name is required.');
      return;
    }
    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }
    if (!confirmPassword) {
      setErrorMessage('Please confirm your password.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    try {
      const response = await axios.post('https://todoapi-gamma.vercel.app//register', {
        username,
        email,
        password,
      });

      if (response.status === 201) {
        setSuccessMessage('User registered successfully');
        setErrorMessage('');
        setUsername('');
        setEmail('');
        setFullName('');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      // Handle server-side errors
      setErrorMessage(error.response?.data?.error || 'Registration failed. Please try again.');
      setSuccessMessage('');
    }
  };

  if (isLoading) {
    return (
      <div className="loader">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="login_container">
      <div className="login_content">
        <h1>Register New Account</h1>
        <div className="input_field">
          <input
            type="text"
            placeholder="User Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {errorMessage && <p style={{ color: 'red' , fontSize:'20px'}}>{errorMessage}</p>}
        {successMessage && <p style={{ color: 'green', fontSize:'20px' }}>{successMessage}</p>}
        <div className="btn_group">
          <button onClick={handleRegister} className="primary_btn">Register</button>
          <button onClick={() => navigate('/login')} className="secondary_btn">Login</button>
        </div>
        <p className="or_text">or</p>
        <div className="social">
          <BsGoogle className="social_icon" />
          <FaFacebook className="social_icon" />
        </div>
      </div>
    </div>
  );
}

export default Register;
