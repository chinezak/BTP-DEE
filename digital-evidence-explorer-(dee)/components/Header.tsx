
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="flex items-center justify-between h-16 bg-white border-b border-btp-gray-200 px-4 md:px-8">
      <div>
        <h1 className="text-xl font-semibold text-btp-blue">Digital Evidence Explorer</h1>
      </div>
      <div className="flex items-center">
        {user && (
          <div className="text-right mr-4">
            <p className="font-semibold text-btp-gray-800">{user.name}</p>
            <p className="text-sm text-btp-gray-600">{user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="p-2 rounded-full text-btp-gray-600 hover:bg-btp-gray-200 hover:text-btp-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-btp-light-blue"
          aria-label="Logout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            {ICONS.logout}
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
