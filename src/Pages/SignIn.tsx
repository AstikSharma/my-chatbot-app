import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Send form-encoded data using URLSearchParams
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post('http://localhost:8000/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;

      // Store the JWT in localStorage for future authenticated requests
      localStorage.setItem('token', access_token);

      // Redirect to the chatbot or home page
      navigate('/');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Invalid email or password.');
      } else if (err.response && err.response.status === 404) {
        // Email not found, redirect to the signup page
        setError('Email not found. Redirecting to sign up...');
        setTimeout(() => {
          navigate('/signup');
        }, 2000); // Redirect after 2 seconds
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="container mx-auto max-w-md py-8">
      <h2 className="text-2xl font-bold mb-6">Sign In</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
          Sign In
        </button>
      </form>
    </div>
  );
};

export default SignIn;
