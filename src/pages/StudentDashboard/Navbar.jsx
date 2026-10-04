import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaBell, FaUser, FaIdCard, FaPen, FaSignOutAlt } from 'react-icons/fa';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { handleLogout } from './logoutUtils';
import { useUserSession } from '../../UserSessionContext';
import LogoutConfirmation from '../../components/LogoutConfirmation';

const Navbar = ({ darkMode, toggleSidebar, showProfileMenu, toggleProfileMenu, sidebarOpen, user: propUser, onEditDepartment }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isProfileActive = location.pathname === '/student-profile' || location.pathname === '/profile';
  const { user: sessionUser } = useUserSession();
  const user = propUser || sessionUser;
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const profileMenuRef = useRef(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
  const navLinkClass = "px-3 py-2 rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold tracking-wide transition-all duration-200 border border-transparent";
  const navLinkStyle = {
    color: darkMode ? '#e2e8f0' : '#075985',
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    toggleProfileMenu();
  };

  // Helper to display department
  const renderDepartments = () => {
    if (!user?.departments || user.departments.length === 0) return <span style={{ fontSize: '10.5px', color: '#ef4444' }}>Not set</span>;
    return <div style={{ fontSize: '10.5px', lineHeight: 1.35, marginTop: '2px', color: darkMode ? '#93c5fd' : '#4b5563' }}>{user.departments[0]}</div>;
  };

  return (
    <>
     <nav
  className={`w-full py-3.5 pr-6 pl-0 flex justify-between items-center sticky top-0 z-50 ${
    darkMode
      ? 'bg-gray-800 text-gray-100 border-b border-gray-700'
      : 'bg-white text-slate-800 border-b border-sky-100 shadow-[0_2px_15px_-3px_rgba(3,105,161,0.06)]'
  } transition-colors duration-300`}
>
        <div className={`absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none ${
          darkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 opacity-60'
        }`} style={{ zIndex: 1 }}></div>
        <div className="flex items-center gap-3">
          <div style={{ width: '64px', minWidth: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button
              onClick={toggleSidebar}
              style={{ color: darkMode ? '#7dd3fc' : '#0369a1' }}
              className="focus:outline-none p-1.5 rounded-lg bg-transparent hover:bg-blue-50 border-none transition-colors"
              aria-label="Toggle sidebar"
            >
              <FaBars className="text-xl" />
            </button>
          </div>

        <div className="flex items-center">
  <h1
    style={{
      fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
      fontWeight: 800,
      letterSpacing: "-0.02em",
      lineHeight: 1.2,
      display: "inline-block",
      color: darkMode ? '#38bdf8' : '#0369a1',
      textShadow: darkMode
        ? '0 0 16px rgba(56, 189, 248, 0.4), 0 1px 2px rgba(0, 0, 0, 0.4)'
        : '0 1px 2px rgba(2, 132, 199, 0.15)',
      transition: "all 0.3s ease",
    }}
    className="text-lg sm:text-base md:text-xl lg:text-2xl focus:outline-none hover:drop-shadow-[0_0_6px_rgba(14,165,233,0.45)] select-none"
  >
    Innovative Teaching Feedback
  </h1>
</div>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2">
          <Link
            to="/student-dashboard"
            style={navLinkStyle}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#0284c7'; e.currentTarget.style.backgroundColor = darkMode ? 'rgba(125,211,252,0.08)' : 'rgba(2,132,199,0.07)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = darkMode ? '#e2e8f0' : '#075985'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            className={navLinkClass}
          >
            Home
          </Link>
          <Link
            to="/student-about"
            style={navLinkStyle}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#0284c7'; e.currentTarget.style.backgroundColor = darkMode ? 'rgba(125,211,252,0.08)' : 'rgba(2,132,199,0.07)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = darkMode ? '#e2e8f0' : '#075985'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            className={navLinkClass}
          >
            About Us
          </Link>
          <Link
            to="/student/contact"
            style={navLinkStyle}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#0284c7'; e.currentTarget.style.backgroundColor = darkMode ? 'rgba(125,211,252,0.08)' : 'rgba(2,132,199,0.07)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = darkMode ? '#e2e8f0' : '#075985'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            className={navLinkClass}
          >
            Contact Us
          </Link>
          
          <div className="relative profile-menu-container" ref={profileMenuRef}>
            <button 
              onClick={handleProfileClick} 
              style={{
                backgroundColor: isProfileActive
                  ? '#0284c7'
                  : darkMode ? '#1e293b' : '#e0f2fe',
                color: isProfileActive
                  ? '#ffffff'
                  : darkMode ? '#7dd3fc' : '#0284c7',
                border: isProfileActive
                  ? '2px solid #38bdf8'
                  : darkMode ? '1px solid #334155' : '1.5px solid #bae6fd',
                boxShadow: isProfileActive
                  ? '0 0 12px rgba(2, 132, 199, 0.5)'
                  : '0 2px 6px rgba(2, 132, 199, 0.15)'
              }}
              className={`focus:outline-none hover:outline-none outline-none border-0 ring-0 flex items-center space-x-1 rounded-full p-2.5 transition-all duration-300 hover:scale-105 ${
                isProfileActive ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : ''
              }`}
              aria-label="Profile"
              title="User Profile"
            >
              <FaUser className="text-lg" />
            </button>
            
{showProfileMenu && (
  <div
    style={{
      backgroundColor: darkMode ? '#0f172a' : '#ffffff',
      border: darkMode ? '1px solid rgba(51,65,85,0.8)' : '1px solid rgba(186,230,253,0.7)',
      boxShadow: darkMode
        ? '0 20px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(56,189,248,0.08)'
        : '0 16px 40px rgba(7,89,133,0.13), 0 2px 8px rgba(56,189,248,0.08), 0 0 0 1px rgba(186,230,253,0.5)',
      animation: 'profileDropIn 0.2s cubic-bezier(0.16,1,0.3,1)',
    }}
    className={`absolute right-0 mt-2 w-80 rounded-2xl py-1 z-[200] overflow-hidden transition-colors duration-300 ${
      darkMode ? 'text-slate-100' : 'text-slate-700'
    }`}
  >
    <style>{`
      @keyframes profileDropIn {
        from { opacity: 0; transform: scale(0.96) translateY(-6px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
    `}</style>

    {user && (
      <div
        style={{ padding: '10px 14px 9px' }}
        className={`border-b transition-colors duration-300 ${
          darkMode ? 'border-slate-700/70' : 'border-sky-100'
        }`}
      >
        {/* Name row */}
        <div
          style={{ fontSize: '14.5px', fontFamily: "'Outfit','Inter',system-ui,sans-serif", letterSpacing: '-0.01em' }}
          className={`font-bold truncate ${darkMode ? 'text-slate-100' : 'text-sky-950'}`}
        >
          {displayName}
        </div>

        {/* Email */}
        <div
          style={{ fontSize: '11.5px', marginTop: '2px' }}
          className={`break-all leading-tight ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
        >
          {user.email || 'No email provided'}
        </div>

        {/* Role badge */}
        {user.role && (
          <div
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              marginTop: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '9999px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              background: darkMode ? 'rgba(56,189,248,0.12)' : 'rgba(224,242,254,0.9)',
              color: darkMode ? '#7dd3fc' : '#0369a1',
              border: darkMode ? '1px solid rgba(56,189,248,0.25)' : '1px solid rgba(125,211,252,0.6)',
            }}
          >
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: darkMode ? '#38bdf8' : '#0284c7',
              flexShrink: 0,
            }} />
            {user.role}
          </div>
        )}

        {/* Department */}
        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
            color: darkMode ? '#e2e8f0' : '#0f172a', flexShrink:0,
          }}>
            DEPT
          </span>
          {user?.departments && user.departments.length > 0 ? (
            <span style={{ fontSize:'12px', fontWeight:700, color: darkMode ? '#e2e8f0' : '#0c2340' }}>
              {user.departments[0]}
            </span>
          ) : (
            <span style={{ fontSize: '11px', color: '#ef4444' }}>Not set</span>
          )}
        </div>
      </div>
    )}

    {/* ── Menu items ── */}
    <div style={{ padding: '4px 0' }}>

      {/* My Profile */}
      <button
        onClick={() => { if (showProfileMenu) toggleProfileMenu(); navigate('/student-profile'); }}
        style={{ color: darkMode ? '#38bdf8' : '#0284c7', backgroundColor: 'transparent', fontSize: '13px', width: '100%' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = darkMode ? 'rgba(56,189,248,0.1)' : 'rgba(224,242,254,0.85)';
          e.currentTarget.style.color = darkMode ? '#7dd3fc' : '#0369a1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = darkMode ? '#38bdf8' : '#0284c7';
        }}
        className="flex items-center gap-3 text-left px-4 py-2 font-semibold border-0 outline-none cursor-pointer transition-all duration-150"
      >
        <FaIdCard style={{ color: 'inherit', fontSize: '15px', flexShrink: 0 }} />
        <span style={{ color: 'inherit', fontSize: '13px' }}>My Profile</span>
      </button>

      {/* Edit Department */}
      <button
        onClick={onEditDepartment}
        disabled={user?.departmentChangeCount >= 1}
        style={{
          color: user?.departmentChangeCount >= 1 ? (darkMode ? '#475569' : '#94a3b8') : (darkMode ? '#38bdf8' : '#0284c7'),
          backgroundColor: 'transparent',
          fontSize: '13px', width: '100%',
        }}
        onMouseEnter={(e) => {
          if (user?.departmentChangeCount >= 1) return;
          e.currentTarget.style.backgroundColor = darkMode ? 'rgba(56,189,248,0.1)' : 'rgba(224,242,254,0.85)';
          e.currentTarget.style.color = darkMode ? '#7dd3fc' : '#0369a1';
        }}
        onMouseLeave={(e) => {
          if (user?.departmentChangeCount >= 1) return;
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = darkMode ? '#38bdf8' : '#0284c7';
        }}
        className={`flex items-center gap-3 text-left px-4 py-2 font-semibold border-0 outline-none transition-all duration-150 ${
          user?.departmentChangeCount >= 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        }`}
      >
        <FaPen style={{ color: 'inherit', fontSize: '13px', flexShrink: 0 }} />
        <span style={{ color: 'inherit', fontSize: '13px' }}>Edit Department</span>
      </button>

      {/* Divider before logout */}
      <div style={{ margin: '4px 14px', height: '1px', background: darkMode ? 'rgba(51,65,85,0.6)' : 'rgba(186,230,253,0.6)' }} />

      {/* Logout */}
      <button
        onClick={handleLogoutClick}
        style={{ color: darkMode ? '#f87171' : '#dc2626', backgroundColor: 'transparent', fontSize: '13px', width: '100%' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = darkMode ? 'rgba(239,68,68,0.1)' : 'rgba(254,242,242,0.9)';
          e.currentTarget.style.color = darkMode ? '#fca5a5' : '#b91c1c';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = darkMode ? '#f87171' : '#dc2626';
        }}
        className="flex items-center gap-3 text-left px-4 py-2 font-semibold border-0 outline-none cursor-pointer transition-all duration-150"
      >
        <FaSignOutAlt style={{ color: 'inherit', fontSize: '15px', flexShrink: 0 }} />
        <span style={{ color: 'inherit', fontSize: '13px' }}>Logout</span>
      </button>

    </div>
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