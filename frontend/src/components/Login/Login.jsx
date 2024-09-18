import React, { useState, useEffect } from 'react';
import './Login.css';
import { BsGoogle } from 'react-icons/bs';
import { FaFacebook } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); 
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      setSuccessMessage('');
      return;
    }

    try {
      const response = await axios.post('https://todoapi-gamma.vercel.app//login', {
        email,
        password,
      });

      if (response.status === 200) {
        const { token, username } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        setSuccessMessage('Login Successful, redirecting to the dashboard');
        setErrorMessage('');

        setTimeout(() => {
          navigate('/todo');
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      setErrorMessage('Login failed, please try again');
    }
  };

  return (
    <div className="login_container">
      {isLoading ? (
        <div className="loader">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="login_content">
          <h1>Login to Your Account</h1>
          <div className="input_field">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {errorMessage && <p style={{ color: 'red', fontSize:'20px' }}>{errorMessage}</p>}
          {successMessage && <p style={{ color: 'green', fontSize:'20px' }}>{successMessage}</p>}

          <div className="btn_group">
            <button onClick={handleLogin} className="primary_btn">Submit</button>
            <button onClick={() => navigate('/register')} className="secondary_btn">Register</button>
          </div>
          <p className="or_text">or</p>
          <p style={{ fontSize: '18px' }} className="or_text">sign up with</p>
          <div className="social">
            <BsGoogle className="social_icon" />
            <FaFacebook className="social_icon" />
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
