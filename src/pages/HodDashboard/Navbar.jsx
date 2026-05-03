import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaUser } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { useUserSession } from '../../UserSessionContext';
import { handleLogout } from '../FacultyDashboard/logoutUtils';
import LogoutConfirmation from '../../components/LogoutConfirmation';
import kbtcoeLogo from '../../assets/kbtcoesample.jpg';

const Navbar = ({ darkMode, toggleSidebar }) => {
  const navigate = useNavigate();
  const { user: sessionUser } = useUserSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setShowProfileMenu(false);
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
    if (sessionUser?.name) return sessionUser.name;
    if (sessionUser?.displayName) return sessionUser.displayName;
    const namePart = email.split('@')[0];
    return namePart.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  const displayName = getNameFromEmail(sessionUser?.email);

  return (
    <>
      <nav className={`w-full py-2 px-6 flex justify-between items-center fixed top-0 left-0 right-0 z-30 ${
        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
      } shadow-md`}>
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar} 
            className="mr-4 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent border-none text-blue-600 dark:text-blue-200"
            aria-label="Toggle sidebar"
          >
            <FaBars className="text-2xl" />
          </button>
          <h1 className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
            Innovative Teaching Feedback
          </h1>
          <h2 className={`text-xl font-semibold ml-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
           ( Admin Dashboard )
          </h2>
        </div>
       
        <div className="flex items-center space-x-6">
          <Link to="/hod-dashboard/about" className={`font-medium transition-colors ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>About Us</Link>
          <Link to="/hod-dashboard/contact" className={`font-medium transition-colors ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Contact Us</Link>
          
          <div className="relative" ref={profileMenuRef}>
            <button 
              onClick={() => setShowProfileMenu(prev => !prev)}
              className={`focus:outline-none flex items-center space-x-2 rounded-full p-2 transition-all duration-300 bg-transparent ${
                darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-500 hover:bg-gray-100'
              }`}
              aria-label="Profile"
            >
              <FaUser className="text-xl" />
            </button>
            
            {showProfileMenu && (
              <div className={`absolute right-0 mt-2 w-72 rounded-md shadow-lg py-1 z-50 ${
                darkMode ? 'bg-gray-700 text-gray-100 ring-1 ring-gray-600' : 'bg-white text-gray-700 ring-1 ring-black ring-opacity-5'
              }`}>
                {sessionUser && (
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                    <div className="font-medium text-base truncate">{displayName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 break-all">{sessionUser.email}</div>
                    {sessionUser.role && (
                      <div className="mt-1 inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {sessionUser.role}
                      </div>
                    )}
                  </div>
                )}
                <button 
                  onClick={handleLogoutClick}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors duration-200 rounded-md bg-transparent ${
                    darkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-700 hover:bg-red-100'
                  }`}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <LogoutConfirmation
        isOpen={showLogoutConfirm}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        darkMode={darkMode}
      />
    </>
  );
};

export default Navbar; 