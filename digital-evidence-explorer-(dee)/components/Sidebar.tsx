
import React from 'react';
import { NavLink } from 'react-router-dom';
import { ICONS } from '../constants';

const SidebarIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        {children}
    </svg>
);


const Sidebar: React.FC = () => {
    const navLinkClasses = 'flex items-center px-4 py-3 text-btp-gray-200 hover:bg-btp-light-blue hover:text-white rounded-md transition-colors';
    const activeNavLinkClasses = 'bg-btp-light-blue text-white';

  return (
    <div className="hidden md:flex flex-col w-64 bg-btp-blue text-white">
      <div className="flex items-center justify-center h-16 border-b border-btp-light-blue">
        <h2 className="text-2xl font-bold text-white">BTP</h2>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}
        >
            <SidebarIcon>{ICONS.dashboard}</SidebarIcon>
            <span className="ml-3">Dashboard</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
