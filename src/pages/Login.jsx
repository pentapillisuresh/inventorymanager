import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogIn, FiMail, FiLock,  } from 'react-icons/fi';
import { localStorageManager } from '../utils/localStorage';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate inputs
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    // Simulate API call delay
    setTimeout(() => {
      try {
        // Dummy credentials for demonstration
        const dummyCredentials = {
          email: 'manager@store.com',
          password: 'password123'
        };

        if (email === dummyCredentials.email && password === dummyCredentials.password) {
          // Initialize data if needed
          localStorageManager.initializeData();
          localStorageManager.setLoginStatus(true);
          navigate('/');
        } else {
          setError('Invalid credentials. Use: manager@store.com / password123');
        }
      } catch (error) {
        console.error('Login error:', error);
        setError('Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleResetData = () => {
    if (window.confirm('This will reset all data to initial dummy data. Continue?')) {
      localStorageManager.resetToDummyData();
      alert('Data reset successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="bg-primary-600 rounded-t-2xl p-8 text-white">
          <div className="flex items-center justify-center space-x-3 mb-4">
            {/* <FiStore size={32} /> */}
            <h1 className="text-3xl font-bold">Manager Portal</h1>
          </div>
          <p className="text-center text-primary-100">
            Sign in to manage your store operations
          </p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 input-field"
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 input-field"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Demo Credentials */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">Demo Credentials:</p>
              <div className="text-sm space-y-1">
                <p>Email: <span className="font-mono">manager@store.com</span></p>
                <p>Password: <span className="font-mono">password123</span></p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <FiLogIn />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Reset Data Button */}
          <div className="mt-6">
            <button
              onClick={handleResetData}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 underline"
              type="button"
            >
              Reset to initial dummy data
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-gray-600 text-sm">
              This is a demo manager dashboard. Data is stored locally in your browser.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Clear browser data or use reset button above to reset
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;