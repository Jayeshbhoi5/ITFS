import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaClipboardList, FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa';
import LogoutConfirmation from '../../components/LogoutConfirmation';
import { handleLogout } from './logoutUtils';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '../../UserSessionContext';

const Sidebar = ({ darkMode, sidebarOpen, toggleSidebar, toggleDarkMode, activePage }) => {
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
    if (user?.name) return user.name;
    if (user?.displayName) return user.displayName;
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
        <div className="flex flex-col pt-4">
          {/* Dashboard Link */}
          <Link
            to="/StudentDashboard"
            className={`flex items-center p-4 relative group ${
              activePage === 'dashboard'
                ? darkMode
                  ? 'text-white bg-blue-600/10'
                  : 'text-blue-700 bg-blue-100'
                : darkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-700 hover:text-blue-700 hover:bg-gray-100'
            }`}
          >
            {/* Circular highlight indicator */}
            {activePage === 'dashboard' && (
              <span className={`absolute left-0 w-1.5 h-10 rounded-r-full ${
                darkMode ? 'bg-blue-400' : 'bg-blue-600'
              }`}></span>
            )}
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              activePage === 'dashboard'
                ? darkMode
                  ? 'bg-blue-600'
                  : 'bg-blue-200'
                : darkMode
                  ? 'group-hover:bg-gray-700'
                  : 'group-hover:bg-gray-100'
            }`}>
              <FaHome className="text-xl" />
            </div>
            {sidebarOpen && <span className="ml-3">Dashboard</span>}
          </Link>

          {/* All Activities Link */}
          <Link
            to="/AllActivitiesPage"
            className={`flex items-center p-4 relative group ${
              activePage === 'activities'
                ? darkMode
                  ? 'text-white bg-blue-600/10'
                  : 'text-blue-700 bg-blue-100'
                : darkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-700 hover:text-blue-700 hover:bg-gray-100'
            }`}
          >
            {/* Circular highlight indicator */}
            {activePage === 'activities' && (
              <span className={`absolute left-0 w-1.5 h-10 rounded-r-full ${
                darkMode ? 'bg-blue-400' : 'bg-blue-600'
              }`}></span>
            )}
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              activePage === 'activities'
                ? darkMode
                  ? 'bg-blue-600'
                  : 'bg-blue-200'
                : darkMode
                  ? 'group-hover:bg-gray-700'
                  : 'group-hover:bg-gray-100'
            }`}>
              <FaClipboardList className="text-xl" />
            </div>
            {sidebarOpen && <span className="ml-3">All Activities</span>}
          </Link>
        </div>

        {/* Bottom Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <button
            onClick={toggleDarkMode}
            className={`w-full flex items-center p-4 rounded-lg group ${
              darkMode
                ? 'text-yellow-400 hover:bg-gray-700'
                : 'text-gray-800 hover:bg-gray-100'
            }`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              darkMode ? 'group-hover:bg-gray-700' : 'group-hover:bg-gray-100'
            }`}>
              {darkMode ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
            </div>
            {sidebarOpen && <span className="ml-3">Dark Mode</span>}
          </button>

          <button 
  onClick={handleLogoutClick}
  className="flex items-center space-x-3 w-full p-3 text-red-700 bg-transparent border-0 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
  style={{ backgroundColor: 'transparent' }}
>
  <FaSignOutAlt className="text-xl" />
  <span>Logout</span>
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