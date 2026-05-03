import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaBell, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { handleLogout } from './logoutUtils';
import { Link, useNavigate } from 'react-router-dom';
import { useUserSession } from '../../UserSessionContext';
import LogoutConfirmation from '../../components/LogoutConfirmation';
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import AboutUs from '../AboutUs';

const Navbar = ({ darkMode, setDarkMode, toggleSidebar, showProfileMenu, toggleProfileMenu, sidebarOpen, user, onEditDepartment }) => {
  const navigate = useNavigate();
  const { user: sessionUser, setUser: setSessionUser } = useUserSession();
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const profileMenuRef = useRef(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        if (showProfileMenu) {
          toggleProfileMenu();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu, toggleProfileMenu]);

  const handleProfileLinkClick = (e) => {
    e.preventDefault();
    setShowProfileInfo(!showProfileInfo);
  };
  
  const handleProfileClick = (e) => {
    e.stopPropagation();
    toggleProfileMenu();
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

  const handleDepartmentUpdate = async (data) => {
    if (!sessionUser) return;
    
    const userRef = doc(db, 'users', sessionUser.uid);
    try {
      await updateDoc(userRef, {
        departments: data.departments,
        primaryDepartment: data.primaryDepartment
      });

      // Update the session context immediately
      const updatedUser = {
        ...sessionUser,
        departments: data.departments,
        primaryDepartment: data.primaryDepartment
      };
      setSessionUser(updatedUser);

      console.log('User departments updated successfully!');
      setShowDepartmentModal(false); // Close modal on success
    } catch (error) {
      console.error('Error updating departments:', error);
    }
  };

  const getNameFromEmail = (email) => {
    if (!email) return 'User';
    // First try to get the name from Firestore
    if (sessionUser?.name) {
      return sessionUser.name;
    }
    // If no name in Firestore, try Google display name
    if (sessionUser?.displayName) {
      return sessionUser.displayName;
    }
    // If neither exists, use the email prefix
    const namePart = email.split('@')[0];
    return namePart
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const displayName = getNameFromEmail(sessionUser?.email);

  // Helper to display departments
  const renderDepartments = () => {
    if (!user?.departments || user.departments.length === 0) return <span className="text-red-500">Not set</span>;
    if (user.role === 'Faculty') {
      return (
        <div className="mt-1 text-xs text-blue-700 dark:text-blue-200">
          <div><b>Primary:</b> {user.primaryDepartment || user.departments[0]}</div>
          <div><b>All:</b> {user.departments.join(', ')}</div>
        </div>
      );
    }
    return <div className="mt-1 text-xs text-blue-700 dark:text-blue-200">{user.departments[0]}</div>;
  };

  return (
    <>
      <nav className={`w-full py-4 px-6 flex justify-between items-center sticky top-0 z-40 ${
        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
      } transition-colors duration-300 relative`}>
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${
          darkMode ? 'shadow-md' : 'shadow-md shadow-gray-300'
        }`} style={{ left: sidebarOpen ? '16rem' : '4rem' }}></div>
        
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar} 
            className="mr-4 focus:outline-none p-0 bg-transparent border-none text-blue-600 dark:text-blue-200"
            aria-label="Toggle sidebar"
          >
            <FaBars className="text-xl" />
          </button>

          <h1 className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'} transition-colors duration-300`}>
            Innovative Teaching Feedback
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link to="/faculty-dashboard" className={`${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'} transition-colors duration-300`}>
            Home
          </Link>
          <Link to="/about" className={`${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'} transition-colors duration-300`}>
            About Us
          </Link>
          <Link to="/contact" className={`${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'} transition-colors duration-300`}>
            Contact Us
          </Link>
          
        
          
          <div className="relative profile-menu-container" ref={profileMenuRef}>
            <button 
              onClick={handleProfileClick} 
              className={`focus:outline-none hover:outline-none outline-none border-0 ring-0 flex items-center space-x-1 rounded-full p-2 transition-all duration-300 ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-blue-400' : 'bg-white hover:bg-blue-50 text-blue-700'
              }`}
              aria-label="Profile"
            >
              <FaUser className="text-xl" />
            </button>
            
            {showProfileMenu && (
              <div className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 z-[100] ${
                darkMode ? 'bg-gray-700 text-gray-100 ring-1 ring-gray-600' : 'bg-white text-gray-700 ring-1 ring-black ring-opacity-5'
              } transition-colors duration-300`}>
                {sessionUser && (
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                    <div className="font-medium text-base truncate">
                      {displayName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 break-all">
                      {sessionUser.email || 'No email provided'}
                    </div>
                    {sessionUser.role && (
                      <div className="mt-1 inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {sessionUser.role}
                      </div>
                    )}
                    {/* Department display */}
                    <div className="mt-2">
                      <span className="font-semibold text-xs">Department(s):</span>
                      {renderDepartments()}
                    </div>
                  </div>
                )}
                {/* Edit Department Option */}
                {sessionUser?.role === 'Faculty' && (
                  <button
                    onClick={() => setShowDepartmentModal(true)}
                    className={`block w-full text-left px-4 py-2 text-sm border-0 ${
                      darkMode
                        ? 'text-blue-400 hover:bg-gray-800 bg-transparent'
                        : 'text-blue-700 hover:bg-gray-100 bg-transparent'
                    } transition-colors duration-300`}
                  >
                    Edit Department
                  </button>
                )}
                <button 
                  onClick={handleLogoutClick}
                  className={`block w-full text-left px-4 py-2 text-sm border-0 ${
                    darkMode 
                      ? 'text-red-400 bg-transparent hover:bg-gray-800'  
                      : 'text-red-700 bg-transparent hover:bg-gray-100'  
                  } transition-colors duration-300`}
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
      {sessionUser?.role === 'Faculty' && (
        <DepartmentSelectionModal
          isOpen={showDepartmentModal}
          onClose={() => setShowDepartmentModal(false)}
          onSubmit={handleDepartmentUpdate}
          userType="faculty"
          currentDepartments={sessionUser.departments || []}
          canEdit={true}
        />
      )}
    </>
  );
};

export default Navbar;