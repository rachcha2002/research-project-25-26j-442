import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import GoogleLoginButton from '../ui/GoogleLoginButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/doctors/login', { email, password });
      login(res.data.doctor, res.data.token);
      if (res.data.doctor.account_status === 'Inactive') {
        navigate('/complete-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👣</div>
          <h1 className="text-3xl mb-2 dark:text-white">Peditrack</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-red-500 text-center">{error}</div>}
          <div>
            <label htmlFor="email" className="block mb-2 text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            className="mb-2 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </button>
        </form>
        <div className="mt-6">
          <GoogleLoginButton />
        </div>
        <div className="mt-4 text-center">
          <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
          <a href="/register" className="text-indigo-600 hover:underline">Register</a>
        </div>
      </div>
    </div>
  );
}