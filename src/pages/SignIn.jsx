import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const SignIn = () => {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'signup', 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login, register } = useContext(AuthContext);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (activeTab === 'signup') {
        await register(name, email, password);
        navigate('/');
      } else {
        // login or admin
        const userInfo = await login(email, password);
        
        if (userInfo.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome to Jobbazzar</h2>
        
        <div className="flex border-b mb-6">
          <button 
            className={`flex-1 py-2 text-center font-medium ${activeTab === 'login' ? 'text-[#5b61f4] border-b-2 border-[#5b61f4]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button 
            className={`flex-1 py-2 text-center font-medium ${activeTab === 'signup' ? 'text-[#5b61f4] border-b-2 border-[#5b61f4]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('signup')}
          >
            Signup
          </button>
          <button 
            className={`flex-1 py-2 text-center font-medium ${activeTab === 'admin' ? 'text-[#5b61f4] border-b-2 border-[#5b61f4]' : 'text-gray-500'}`}
            onClick={() => {
              setActiveTab('admin');
              setEmail('gumansingh.oditechglobal@gmail.com');
              setPassword('123456');
            }}
          >
            Admin
          </button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5b61f4]"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5b61f4]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5b61f4]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-[#5b61f4] text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {activeTab === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-900">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
