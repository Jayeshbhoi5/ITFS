import React, { useState, useEffect, useRef } from 'react';
import { FaHome, FaUpload, FaComments, FaCalendarAlt, FaSignOutAlt, FaMoon, FaSun } from 'react-icons/fa';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { useNavigate, Link, useLocation } from 'react-router-dom'; 
import { handleLogout } from './logoutUtils';
import LogoutConfirmation from '../../components/LogoutConfirmation';

const Sidebar = ({ darkMode, sidebarOpen, toggleSidebar, toggleDarkMode, activePage, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && sidebarOpen) {
        toggleSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, toggleSidebar]);

  const handleMouseEnter = () => {
    if (!sidebarOpen) {
      toggleSidebar();
    }
  };

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

  return (
    <>
      <div 
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full transition-transform duration-500 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-16'
        } ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg z-30`}
        onMouseEnter={handleMouseEnter}
      >
        {!sidebarOpen && (
          <div className="flex flex-col items-center pt-16">
            <div className="flex flex-col space-y-5 items-center mt-28">
              <Link to="/faculty-dashboard" className={`p-2 rounded-xl transition-all duration-200 shadow-sm ${
                activePage === "dashboard"
                  ? 'bg-blue-100 text-blue-600 shadow-md'
                  : darkMode ? 'text-white' : 'text-blue-700'
              }`}>
                <FaHome className={`text-xl ${activePage === "dashboard" ? 'text-blue-600' : ''}`} />
              </Link>
              <Link to="/uploadactivity" className={`p-2 rounded-xl transition-all duration-200 shadow-sm ${
                activePage === "upload"
                  ? 'bg-blue-100 text-blue-700 shadow-md'
                  : darkMode ? 'text-white' : 'text-blue-700'
              }`}>
                <FaUpload className={`text-xl ${activePage === "upload" ? 'text-blue-600' : ''}`} />
              </Link>
              <Link to="/studentfeedback" className={`p-2 rounded-xl transition-all duration-200 shadow-sm ${
                activePage === "comments"
                  ? 'bg-blue-100 text-blue-700 shadow-md'
                  : darkMode ? 'text-white' : 'text-blue-700'
              }`}>
                <FaComments className={`text-xl ${activePage === "comments" ? 'text-blue-600' : ''}`} />
              </Link>
            </div>
            
            <div className="absolute bottom-6 flex flex-col space-y-6 items-center">
              <button 
                onClick={toggleDarkMode} 
                className="bg-transparent"
              >
                {darkMode ? <FaSun className="text-xl text-yellow-400" /> : <FaMoon className="text-xl text-black" />}
              </button>
              <button 
                onClick={handleLogoutClick}
                className="bg-transparent text-red-600"
              >
                <FaSignOutAlt className="text-xl" />
              </button>
            </div>
          </div>
        )}
        
        {/* Expanded sidebar */}
        {sidebarOpen && (
          <div className="p-6 mt-16">
            <div className="flex items-center justify-center mb-8">
              <img src="/5.png" alt="KBTCOE Logo" className={`h-12 w-auto ${darkMode ? 'filter brightness-90' : ''}`} />
            </div>
            
            <nav>
              <ul className="space-y-2">
                <li>
                  <Link to="/faculty-dashboard" className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 shadow-sm ${
                    activePage === "dashboard"
                      ? 'bg-blue-100 text-blue-600 shadow-md'
                      : darkMode ? 'text-white hover:bg-gray-700' : 'text-blue-700 hover:bg-gray-100'
                  }`}>
                    <FaHome className={`text-xl ${activePage === "dashboard" ? 'text-blue-600' : ''}`} />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link to="/uploadactivity" className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 shadow-sm ${
                    activePage === "upload"
                      ? 'bg-blue-100 text-blue-600 shadow-md'
                      : darkMode ? 'text-white hover:bg-gray-700' : 'text-blue-700 hover:bg-gray-100'
                  }`}>
                    <FaUpload className={`text-xl ${activePage === "upload" ? 'text-blue-600' : ''}`} />
                    <span className="font-medium">Upload Activity</span>
                  </Link>
                </li>
                <li>
                  <Link to="/studentfeedback" className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 shadow-sm ${
                    activePage === "comments"
                      ? 'bg-blue-100 text-blue-600 shadow-md'
                      : darkMode ? 'text-white hover:bg-gray-700' : 'text-blue-700 hover:bg-gray-100'
                  }`}>
                    <FaComments className={`text-xl ${activePage === "comments" ? 'text-blue-600' : ''}`} />
                    <span className="font-medium">Student Feedbacks</span>
                  </Link>
                </li>
              </ul>
            </nav>
            
            <div className={`absolute bottom-0 left-0 right-0 p-6 space-y-2`}>
              <button 
                onClick={toggleDarkMode}
                className="flex items-center space-x-3 w-full p-3 rounded-lg bg-transparent"
              >
                {darkMode ? <FaSun className="text-xl text-yellow-400" /> : <FaMoon className="text-xl text-black" />}
                <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-black'}`}>
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>
              <button 
                onClick={handleLogoutClick}
                className="flex items-center space-x-3 w-full p-3 rounded-lg bg-transparent text-red-600"
              >
                <FaSignOutAlt className="text-xl" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
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