import React, { useState } from 'react';
import { FaHome, FaClipboardList, FaClipboardCheck, FaHourglassHalf, FaCalendarAlt, FaSignOutAlt, FaMoon, FaSun } from 'react-icons/fa';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { handleLogout } from './logoutUtils';
import LogoutConfirmation from '../../components/LogoutConfirmation';

const StudentSidebar = ({ toggleDarkMode, darkMode, setDarkMode, sidebarOpen, toggleSidebar, activePage = "dashboard" }) => {
  const navigate = useNavigate(); // Initialize useNavigate hook
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

  return (
    <>
      {/* Collapsed sidebar */}
      {!sidebarOpen && (
        <div 
          className={`fixed inset-y-0 left-0 w-16 z-30 shadow-md flex flex-col items-center pt-16 transition-colors duration-300 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}
          onMouseEnter={() => toggleSidebar()}
        >
          <div className="flex flex-col space-y-5 items-center mt-28">
            <div className={`p-2 rounded-full transition-all duration-300 ${
              activePage === "dashboard" 
                ? (darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700') 
                : (darkMode ? 'text-white-400 hover:bg-gray-600' : 'bg-white text-blue-700 hover:bg-blue-50')
            }`}>
              <FaHome className="text-xl" />
            </div>
            <div className={`p-2 rounded-full transition-all duration-300 ${
              activePage === "all-activities" 
                ? (darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700') 
                : (darkMode ? 'text-white-400 hover:bg-gray-600' : 'bg-white text-blue-700 hover:bg-blue-50')
            }`}>
              <FaClipboardList className="text-xl" />
            </div>
         {/*}   <div className={`p-2 rounded-full transition-all duration-300 ${
              activePage === "pending" 
                ? (darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700') 
                : (darkMode ? 'text-white-400 hover:bg-gray-600' : 'bg-white text-blue-700 hover:bg-blue-50')
            }`}>
              <FaHourglassHalf className="text-xl" />
            </div>
            <div className={`p-2 rounded-full transition-all duration-300 ${
              activePage === "submitted" 
                ? (darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700')
                : (darkMode ? 'text-white-400 hover:bg-gray-600' : 'bg-white text-blue-700 hover:bg-blue-50')
            }`}>
              <FaClipboardCheck className="text-xl" />
            </div>
            */}
         {/*   <div className={`p-2 rounded-full transition-all duration-300 ${
              activePage === "calendar" 
                ? (darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700')
                : (darkMode ? 'text-white-400 hover:bg-gray-600' : 'bg-white text-blue-700 hover:bg-blue-50')
            }`}>
              <FaCalendarAlt className="text-xl" />
            </div>*/}
          </div>
          
          <div className="absolute bottom-6 flex flex-col space-y-6 items-center">
            <div 
              onClick={() => setDarkMode(!darkMode)} 
              className={`p-2 rounded-full cursor-pointer transition-all duration-300 ${
                darkMode ? "text-yellow-400 hover:bg-gray-600" : "bg-white text-black-700 hover:bg-blue-50"
              }`}
            >
              {darkMode ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
            </div>
            <div 
              onClick={handleLogoutClick}
              className={`p-2 rounded-full cursor-pointer transition-all duration-300 ${
                darkMode ? 'text-red-400 hover:bg-gray-600' : 'bg-white text-red-700 hover:bg-blue-50'
              }`}
            >
              <FaSignOutAlt className="text-xl" />
            </div>
          </div>
        </div>
      )}
      
      {/* Expanded sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        transition duration-300 ease-in-out z-30 w-64 mt-16 shadow-md ${
          darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
        }`}
        onMouseLeave={() => sidebarOpen && toggleSidebar()}
      >
        <div className="p-6">
          <div className="flex items-center justify-center mb-8">
            <img src="/5.png" alt="KBTCOE Logo" className={`h-12 w-auto ${darkMode ? 'filter brightness-90' : ''}`} />
          </div>
          
          <nav>
            <ul className="space-y-2">
              <li>
                <a href="/studentdashboard" className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                  activePage === "dashboard"
                    ? (darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700')
                    : (darkMode ? 'text-white-400 hover:bg-gray-700' : 'text-blue-700 hover:bg-blue-50')
                }`}>
                  <FaHome className="text-xl" />
                  <span className="font-medium">Dashboard</span>
                </a>
              </li>
              <li>
                <a href="/AllActivitiesPage" className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                  activePage === "all-activities"
                    ? (darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700')
                    : (darkMode ? 'text-white-400 hover:bg-gray-700' : 'text-blue-700 hover:bg-blue-50')
                }`}>
                  <FaClipboardList className="text-xl" />
                  <span className="font-medium">All Activities</span>
                </a>
              </li>
         { /*    <li>
                <a href="/PendingFeedbackPage" className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                  activePage === "pending"
                    ? (darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700')
                    : (darkMode ? 'text-white-400 hover:bg-gray-700' : 'text-blue-700 hover:bg-blue-50')
                }`}>
                  <FaHourglassHalf className="text-xl" />
                  <span className="font-medium">Pending Feedback</span>
                </a>
              </li>
              <li>
                <a href="/SubmittedFeedbackPage" className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                  activePage === "submitted"
                    ? (darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700')
                    : (darkMode ? 'text-white-400 hover:bg-gray-700' : 'text-blue-700 hover:bg-blue-50')
                }`}>
                  <FaClipboardCheck className="text-xl" />
                  <span className="font-medium">Submitted Feedback</span>
                </a>
              </li>
              */}
        {/*      <li>
                <a href="/calendar" className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                  activePage === "calendar"
                    ? (darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700')
                    : (darkMode ? 'text-white-400 hover:bg-gray-700' : 'text-blue-700 hover:bg-blue-50')
                }`}>
                  <FaCalendarAlt className="text-xl" />
                  <span className="font-medium">Calendar</span>
                </a>
              </li>*/}
            </ul>
          </nav>
          
          <div className={`absolute bottom-0 left-0 right-0 p-6 space-y-2 border-t ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button 
              onClick={toggleDarkMode}
              style={{ 
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                border: 'none',
                outline: 'none'
              }} 
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-300 ${
                darkMode 
                  ? 'text-yellow-400 hover:bg-gray-700' 
                  : 'text-black-700 hover:bg-blue-50'
              } border-0 outline-none focus:outline-none focus:ring-0 shadow-none`}
            >
              {darkMode ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
              <span className="font-medium" style={{ backgroundColor: 'transparent' }}>
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>
            <button 
              onClick={handleLogoutClick}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-300 ${
                darkMode 
                  ? 'text-red-400 bg-transparent hover:bg-gray-800'
                  : 'text-red-700 bg-transparent hover:bg-gray-100'
              }`}
            >
              <FaSignOutAlt className="text-xl" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
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