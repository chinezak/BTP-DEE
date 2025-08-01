
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter a valid email.');
      return;
    }
    // Simple validation, in real app this would be more robust
    login(email);
    navigate('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-btp-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-btp-blue">Digital Evidence Explorer</h1>
            <p className="mt-2 text-btp-gray-600">British Transport Police</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-btp-gray-700">
              Email Address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-btp-gray-300 rounded-md shadow-sm placeholder-btp-gray-400 focus:outline-none focus:ring-btp-light-blue focus:border-btp-light-blue"
                placeholder="investigator@btp.police.uk"
              />
               <p className="mt-1 text-xs text-btp-gray-500">Hint: use 'admin@btp.police.uk' for Admin role.</p>
            </div>
          </div>

          <div>
            <label htmlFor="password"className="block text-sm font-medium text-btp-gray-700">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-btp-gray-300 rounded-md shadow-sm placeholder-btp-gray-400 focus:outline-none focus:ring-btp-light-blue focus:border-btp-light-blue"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </div>
        </form>
         <div className="text-center text-xs text-btp-gray-500">
          <p>This is a demonstration system. Use your official credentials to sign in.</p>
          <p className="mt-2 font-semibold">Simulated Google Identity Platform</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
