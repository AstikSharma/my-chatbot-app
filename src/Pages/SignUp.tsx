import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Send signup request to backend
      const response = await axios.post('http://localhost:8000/users/', {
        name,
        email,
        password,
      });

      if (response.status === 200) {
        navigate('/login'); // Redirect to login page after successful sign-up
      }
    } catch (err) {
      console.error(err);
      // Show appropriate error message based on the status code
      if (err.response && err.response.status === 400) {
        setError('Email already exists. Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000); // Redirect after 2 seconds
      } else {
        setError('Error creating account. Please try again.');
      }
    }
  };

  return (
    <div className="container mx-auto max-w-md py-8">
      <h2 className="text-2xl font-bold mb-6">Sign Up</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
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
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignUp;
