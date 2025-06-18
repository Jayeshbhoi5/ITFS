import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUserGraduate, FaSignOutAlt } from 'react-icons/fa';
import LogoutConfirmation from '../../components/LogoutConfirmation';
import { handleLogout } from './logoutUtils';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '../../UserSessionContext';

const Sidebar = ({ darkMode, sidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUserSession();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    handleLogout(navigate);
    setShowLogoutConfirm(false);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const getNameFromEmail = (email) => {
    if (!email) return 'User';
    // First try to get the name from Firestore
    if (user?.name) {
      return user.name;
    }
    // If no name in Firestore, try Google display name
    if (user?.displayName) {
      return user.displayName;
    }
    // If neither exists, use the email prefix
    const namePart = email.split('@')[0];
    return namePart
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const displayName = getNameFromEmail(user?.email);

  return (
    <>
      <div className={`fixed top-0 left-0 h-full transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      } ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg z-30`}>
        {/* User Profile Section */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              darkMode ? 'bg-blue-600' : 'bg-blue-100'
            }`}>
              <span className={`text-lg font-semibold ${
                darkMode ? 'text-white' : 'text-blue-700'
              }`}>
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            {sidebarOpen && (
              <div>
                <div className="font-medium text-sm truncate">
                  {displayName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || 'No email provided'}
                </div>
                {user?.role && (
                  <div className="mt-1 inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {user.role}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="p-4 space-y-2">
          <Link
            to="/StudentDashboard"
            className={`flex items-center space-x-3 p-2 rounded-lg ${
              location.pathname === '/StudentDashboard'
                ? darkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700'
                : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaHome className="text-lg" />
            {sidebarOpen && <span>Dashboard</span>}
          </Link>
          <Link
            to="/StudentFeedback"
            className={`flex items-center space-x-3 p-2 rounded-lg ${
              location.pathname === '/StudentFeedback'
                ? darkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700'
                : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaUserGraduate className="text-lg" />
            {sidebarOpen && <span>Feedback</span>}
          </Link>
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={handleLogoutClick}
            className={`w-full flex items-center space-x-3 p-2 rounded-lg ${
              darkMode
                ? 'text-red-400 hover:bg-gray-700'
                : 'text-red-600 hover:bg-gray-100'
            }`}
          >
            <FaSignOutAlt className="text-lg" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      <LogoutConfirmation
        isOpen={showLogoutConfirm}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        darkMode={darkMode}
      />
    </>
  );
};

export default Sidebar; 