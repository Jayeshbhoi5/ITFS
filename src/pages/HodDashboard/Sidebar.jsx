import React, { useState, useRef, useEffect } from 'react';
import { FaUsers, FaChartLine, FaSignOutAlt, FaInfoCircle, FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { handleLogout } from '../FacultyDashboard/logoutUtils';
import LogoutConfirmation from '../../components/LogoutConfirmation';

const Sidebar = ({ darkMode, sidebarOpen, activeView, setActiveView, toggleSidebar }) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const sidebarRef = useRef(null);

  // Add click outside functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && sidebarOpen) {
        toggleSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, toggleSidebar]);

  // Add hover functionality
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

  const handleMenuItemClick = (view) => {
    navigate('/hod-dashboard', { state: { activeView: view } });
  };

  const menuItems = [
    { id: 'performance', name: 'Performance', icon: FaChartLine, action: () => handleMenuItemClick('performance') },
    { id: 'management', name: 'Management', icon: FaUsers, action: () => handleMenuItemClick('management') },
   
  ];

  return (
    <>
      <div 
        ref={sidebarRef}
        className={`fixed top-3 left-0 h-full transition-transform duration-500 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-16'
        } ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg z-20`}
        onMouseEnter={handleMouseEnter}
      >
        {/* Collapsed Sidebar */}
        {!sidebarOpen && (
          <div className="flex flex-col items-center pt-20">
            <div className="flex flex-col space-y-5 items-center mt-24">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`p-2 rounded-xl transition-colors duration-200 bg-transparent border-0 ${
                    activeView === item.id
                      ? (darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600')
                      : (darkMode ? 'text-white' : 'text-gray-700')
                  }`}
                  title={item.name}
                >
                  <item.icon className="text-xl" />
                </button>
              ))}
            </div>
            
            <div className="absolute bottom-6 flex flex-col space-y-6 items-center">
              <button 
                onClick={handleLogoutClick}
                className="bg-transparent border-0 text-red-600 hover:text-red-700"
                title="Logout"
              >
                <FaSignOutAlt className="text-xl" />
              </button>
            </div>
          </div>
        )}
        
        {/* Expanded Sidebar */}
        {sidebarOpen && (
          <div className="p-6 pt-20">
            <div className="flex items-center justify-center mb-10">
              <img src="/5.png" alt="KBTCOE Logo" className={`h-12 w-auto ${darkMode ? 'filter brightness-90' : ''}`} />
            </div>
            
            <nav>
              <ul className="space-y-2">
                {menuItems.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={item.action}
                      className={`flex items-center space-x-3 p-3 w-full rounded-xl transition-colors duration-200 bg-transparent border-0 ${
                        activeView === item.id
                          ? (darkMode ? 'bg-blue-900/50 text-blue-300 font-semibold' : 'bg-blue-100 text-blue-600 font-semibold')
                          : (darkMode ? 'text-white hover:text-blue-300' : 'text-gray-700 hover:text-blue-600')
                      }`}
                    >
                      <item.icon className="text-xl" />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className={`absolute bottom-0 left-0 right-0 p-6 space-y-2`}>
              <button onClick={handleLogoutClick} className={`flex items-center space-x-3 w-full p-3 bg-transparent border-0 text-red-600 hover:text-red-700`}>
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

 