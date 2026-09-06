import React, { useState, useEffect, useRef } from 'react';
import { FaHome, FaClipboardList, FaClipboardCheck, FaHourglassHalf, FaCalendarAlt, FaSignOutAlt, FaMoon, FaSun } from 'react-icons/fa';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { useNavigate, Link } from 'react-router-dom';
import { handleLogout } from './logoutUtils';
import LogoutConfirmation from '../../components/LogoutConfirmation';

const StudentSidebar = ({ toggleDarkMode, darkMode, setDarkMode, sidebarOpen, toggleSidebar, activePage = "dashboard" }) => {
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
        style={{ width: sidebarOpen ? '16rem' : '4rem', paddingTop: '4.5rem' }}
        className={`fixed inset-y-0 left-0 transition-all duration-300 ease-in-out z-30 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-lg select-none flex flex-col`}
        onMouseEnter={handleMouseEnter}
      >
        {/* Top Logo Section: exactly 120px height to lock the nav tabs at the exact same Y position */}
        <div style={{ height: '120px', minHeight: '120px' }} className="flex items-center justify-center overflow-hidden">
          <img 
            src="/5.png" 
            alt="KBTCOE Logo" 
            style={{ 
              height: '88px', 
              width: '100px', 
              objectFit: 'contain',
              opacity: sidebarOpen ? 1 : 0,
              transform: sidebarOpen ? 'translateY(0)' : 'translateY(-6px)',
              transition: sidebarOpen ? 'opacity 250ms ease-in-out, transform 250ms ease-out' : 'none',
              pointerEvents: sidebarOpen ? 'auto' : 'none'
            }}
            className={`${darkMode ? 'filter brightness-90' : ''}`} 
          />
        </div>

        {/* Navigation items - unified so icons never change position */}
        <nav className="px-2 mt-2">
          <ul className="space-y-2">
            <li>
              <Link 
                to="/student-dashboard" 
                title={!sidebarOpen ? "Dashboard" : undefined}
                style={{ height: '44px' }}
                className={`flex items-center w-full rounded-xl transition-all duration-200 shadow-sm overflow-hidden ${
                  activePage === "dashboard"
                    ? (darkMode ? 'bg-blue-900/50 text-blue-300 shadow-md' : 'bg-blue-100 text-blue-700 shadow-md')
                    : (darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-400' : 'text-blue-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow')
                }`}
              >
                <div style={{ width: '48px', height: '44px', minWidth: '48px' }} className="flex items-center justify-center shrink-0">
                  <FaHome className={`text-xl ${activePage === "dashboard" ? (darkMode ? 'text-blue-400' : 'text-blue-600') : ''}`} />
                </div>
                <span 
                  style={{ opacity: sidebarOpen ? 1 : 0 }}
                  className={`font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${
                    !sidebarOpen ? 'pointer-events-none' : ''
                  }`}
                >
                  Dashboard
                </span>
              </Link>
            </li>
            <li>
              <Link 
                to="/AllActivitiesPage" 
                title={!sidebarOpen ? "All Activities" : undefined}
                style={{ height: '44px' }}
                className={`flex items-center w-full rounded-xl transition-all duration-200 shadow-sm overflow-hidden ${
                  activePage === "all-activities"
                    ? (darkMode ? 'bg-blue-900/50 text-blue-300 shadow-md' : 'bg-blue-100 text-blue-700 shadow-md')
                    : (darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-400' : 'text-blue-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow')
                }`}
              >
                <div style={{ width: '48px', height: '44px', minWidth: '48px' }} className="flex items-center justify-center shrink-0">
                  <FaClipboardList className={`text-xl ${activePage === "all-activities" ? (darkMode ? 'text-blue-400' : 'text-blue-600') : ''}`} />
                </div>
                <span 
                  style={{ opacity: sidebarOpen ? 1 : 0 }}
                  className={`font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${
                    !sidebarOpen ? 'pointer-events-none' : ''
                  }`}
                >
                  All Activities
                </span>
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* Bottom Actions - unified so icons never change position */}
        <div className="absolute bottom-6 left-0 right-0 px-2 space-y-2">
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            title={!sidebarOpen ? (darkMode ? "Light Mode" : "Dark Mode") : undefined}
            style={{ height: '44px', backgroundColor: 'transparent' }}
            className={`flex items-center w-full rounded-xl transition-all duration-200 overflow-hidden ${
              darkMode ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-800'
            }`}
          >
            <div style={{ width: '48px', height: '44px', minWidth: '48px' }} className="flex items-center justify-center shrink-0">
              {darkMode ? <FaSun className="text-xl text-yellow-400" /> : <FaMoon className="text-xl text-gray-800" />}
            </div>
            <span 
              style={{ opacity: sidebarOpen ? 1 : 0 }}
              className={`font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${
                !sidebarOpen ? 'pointer-events-none' : ''
              }`}
            >
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
          <button 
            onClick={handleLogoutClick}
            title={!sidebarOpen ? "Logout" : undefined}
            style={{ height: '44px', backgroundColor: 'transparent' }}
            className={`flex items-center w-full text-red-600 rounded-xl transition-all duration-200 overflow-hidden ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <div style={{ width: '48px', height: '44px', minWidth: '48px' }} className="flex items-center justify-center shrink-0">
              <FaSignOutAlt className="text-xl" />
            </div>
            <span 
              style={{ opacity: sidebarOpen ? 1 : 0 }}
              className={`font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${
                !sidebarOpen ? 'pointer-events-none' : ''
              }`}
            >
              Logout
            </span>
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

export default StudentSidebar;