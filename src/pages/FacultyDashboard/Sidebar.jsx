
import React, { useState, useEffect, useRef } from 'react';
import {
  FaHome,
  FaUpload,
  FaComments,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaUser,
} from 'react-icons/fa';
import { User as UserIcon, MoreVertical } from 'lucide-react';

import { setDarkModeInStorage } from './darkModeUtils';
import { useNavigate, Link } from 'react-router-dom';
import { handleLogout } from './logoutUtils';
import LogoutConfirmation from '../../components/LogoutConfirmation';
import { useUserSession } from '../../UserSessionContext';

const Sidebar = ({
  darkMode,
  sidebarOpen,
  toggleSidebar,
  toggleDarkMode,
  activePage,
  user,
}) => {
  const navigate = useNavigate();
  const session = useUserSession();
  const currentUser = user || session?.user;
  const userName = currentUser?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const sidebarRef = useRef(null);
  const userMenuRef = useRef(null);

  const SIDEBAR_COLLAPSED_W = 64;
  const NAVBAR_H = '4.5rem';

  // Close user 3-dot menu when clicking outside
  useEffect(() => {
    const handleClickOutsideMenu = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutsideMenu);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideMenu);
    };
  }, [showUserMenu]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        sidebarOpen
      ) {
        toggleSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen, toggleSidebar]);

  // Persist sidebar state
  useEffect(() => {
    sessionStorage.setItem(
      'sidebarOpen',
      JSON.stringify(sidebarOpen)
    );
  }, [sidebarOpen]);

  const handleMouseEnter = () => {
    if (!sidebarOpen) toggleSidebar();
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

  const [hoveredKey, setHoveredKey] = useState(null);

  // Fixed icon cell:
  const iconCell = {
    width: '48px',
    minWidth: '48px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  // Navigation styles — surrounded by outline with full light matching fill and highlighted font
  const navLinkStyle = (isActive, isHovered) => ({
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    width: 'calc(100% - 16px)',
    margin: '0 8px',
    boxSizing: 'border-box',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    textDecoration: 'none',

    background: isActive
      ? darkMode
        ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.22) 0%, rgba(2, 132, 199, 0.32) 100%)'
        : 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)'
      : isHovered
      ? darkMode
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(224,242,254,0.45)'
      : 'transparent',

    fontWeight: isActive ? 700 : 500,

    color: isActive
      ? darkMode
        ? '#38bdf8'
        : '#075985'
      : isHovered
      ? darkMode
        ? '#38bdf8'
        : '#0369a1'
      : darkMode
        ? '#cbd5e1'
        : '#075985',

    textShadow: isActive && darkMode ? '0 0 10px rgba(56,189,248,0.35)' : 'none',

    border: isActive
      ? darkMode
        ? '1.5px solid #38bdf8'
        : '1.5px solid #0284c7'
      : darkMode
        ? '1px solid rgba(100,116,139,0.2)'
        : '1px solid rgba(186,230,253,0.55)',

    boxShadow: isActive
      ? darkMode
        ? '0 2px 10px rgba(56,189,248,0.2)'
        : '0 2px 8px rgba(2,132,199,0.12)'
      : 'none',

    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  const iconColor = (isActive, isHovered) =>
    isActive
      ? darkMode
        ? '#38bdf8'
        : '#075985'
      : isHovered
      ? darkMode
        ? '#38bdf8'
        : '#0369a1'
      : darkMode
        ? '#94a3b8'
        : '#0369a1';



  return (
    <>
      {/* Faculty Sidebar */}
      <div
        ref={sidebarRef}
        style={{
          width: sidebarOpen ? '16rem' : '4rem',
          paddingTop: NAVBAR_H,
          boxSizing: 'border-box',
        }}
        className={`fixed top-0 bottom-0 left-0
          transition-all duration-300 ease-in-out
          z-30 select-none flex flex-col
          ${
            darkMode
              ? 'bg-gray-800'
              : 'bg-white'
          }`}
        onMouseEnter={handleMouseEnter}
      >
        {/* Right border — below navbar */}
        <div
          style={{
            position: 'absolute',
            top: NAVBAR_H,
            right: 0,
            bottom: 0,
            width: '1px',
            background: darkMode
              ? '#374151'
              : '#bae6fd',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div
          style={{
            height: '112px',
            minHeight: '112px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src="/5.png"
            alt="KBTCOE Logo"
            style={{
              height: '80px',
              width: '90px',
              objectFit: 'contain',
              opacity: sidebarOpen ? 1 : 0,
              transition: 'opacity 250ms ease',
              pointerEvents: sidebarOpen ? 'auto' : 'none',
            }}
            className={darkMode ? 'filter brightness-90' : ''}
          />
        </div>

        {/* Navigation */}
        <nav
          style={{
            marginTop: '4px',
            padding: 0,
            width: '100%',
          }}
        >
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              width: '100%',
            }}
          >
            {/* Dashboard */}
            <li>
              <Link
                to="/faculty-dashboard"
                title={!sidebarOpen ? 'Dashboard' : undefined}
                style={navLinkStyle(activePage === 'dashboard', hoveredKey === 'dashboard')}
                onMouseEnter={() => setHoveredKey('dashboard')}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <span style={iconCell}>
                  <FaHome
                    style={{
                      color: iconColor(
                        activePage === 'dashboard',
                        hoveredKey === 'dashboard'
                      ),
                      fontSize: '1.15rem',
                    }}
                  />
                </span>

                <span
                  style={{
                    opacity: sidebarOpen ? 1 : 0,
                    transition: 'opacity 200ms ease',
                    whiteSpace: 'nowrap',
                    fontSize: '0.9375rem',
                    fontWeight: activePage === 'dashboard' ? 700 : 500,
                    color: activePage === 'dashboard' ? (darkMode ? '#38bdf8' : '#075985') : undefined,
                  }}
                >
                  Dashboard
                </span>
              </Link>
            </li>

            {/* Upload Activity */}
            <li>
              <Link
                to="/uploadactivity"
                title={
                  !sidebarOpen
                    ? 'Upload Activity'
                    : undefined
                }
                style={navLinkStyle(activePage === 'upload', hoveredKey === 'upload')}
                onMouseEnter={() => setHoveredKey('upload')}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <span style={iconCell}>
                  <FaUpload
                    style={{
                      color: iconColor(
                        activePage === 'upload',
                        hoveredKey === 'upload'
                      ),
                      fontSize: '1.15rem',
                    }}
                  />
                </span>

                <span
                  style={{
                    opacity: sidebarOpen ? 1 : 0,
                    transition: 'opacity 200ms ease',
                    whiteSpace: 'nowrap',
                    fontSize: '0.9375rem',
                    fontWeight: activePage === 'upload' ? 700 : 500,
                    color: activePage === 'upload' ? (darkMode ? '#38bdf8' : '#075985') : undefined,
                  }}
                >
                  Upload Activity
                </span>
              </Link>
            </li>

            {/* Student Feedbacks */}
            <li>
              <Link
                to="/studentfeedback"
                title={
                  !sidebarOpen
                    ? 'Student Feedbacks'
                    : undefined
                }
                style={navLinkStyle(activePage === 'comments', hoveredKey === 'comments')}
                onMouseEnter={() => setHoveredKey('comments')}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <span style={iconCell}>
                  <FaComments
                    style={{
                      color: iconColor(
                        activePage === 'comments',
                        hoveredKey === 'comments'
                      ),
                      fontSize: '1.15rem',
                    }}
                  />
                </span>

                <span
                  style={{
                    opacity: sidebarOpen ? 1 : 0,
                    transition: 'opacity 200ms ease',
                    whiteSpace: 'nowrap',
                    fontSize: '0.9375rem',
                    fontWeight: activePage === 'comments' ? 700 : 500,
                    color: activePage === 'comments' ? (darkMode ? '#38bdf8' : '#075985') : undefined,
                  }}
                >
                  Student Feedbacks
                </span>
              </Link>
            </li>
          </ul>
        </nav>


        {/* Bottom Actions */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: 0,
            right: 0,
            padding: '0 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {/* Dark Mode Toggle */}
          <button
            onClick={() => {
              if (toggleDarkMode) {
                toggleDarkMode();
              }

              setDarkModeInStorage(!darkMode);
            }}
            title={
              !sidebarOpen
                ? darkMode
                  ? 'Light Mode'
                  : 'Dark Mode'
                : undefined
            }
            onMouseEnter={() => setHoveredKey('darkmode')}
            onMouseLeave={() => setHoveredKey(null)}
            style={{
              height: '44px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              background: hoveredKey === 'darkmode'
                ? darkMode
                  ? 'rgba(250,204,21,0.08)'
                  : 'rgba(254,243,199,0.5)'
                : 'transparent',
              border: 'none',
              borderRadius: '0.625rem',
              cursor: 'pointer',
              color: hoveredKey === 'darkmode'
                ? darkMode ? '#fde047' : '#92400e'
                : darkMode ? '#facc15' : '#374151',
              overflow: 'hidden',
              outline: 'none',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: 'none',
            }}
          >
            <span style={iconCell}>
              {darkMode ? (
                <FaSun
                  style={{
                    fontSize: '1.15rem',
                    color: hoveredKey === 'darkmode' ? '#fde047' : '#facc15',
                  }}
                />
              ) : (
                <FaMoon
                  style={{
                    fontSize: '1.15rem',
                  }}
                />
              )}
            </span>

            <span
              style={{
                opacity: sidebarOpen ? 1 : 0,
                transition: 'opacity 200ms ease',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* User Profile Card with 3-Dot Menu */}
          <div ref={userMenuRef} className="relative w-full">
            {/* The 3-Dot Sticky Popup Menu for Logout */}
            {showUserMenu && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: sidebarOpen ? '4px' : '68px',
                  right: sidebarOpen ? '4px' : 'auto',
                  minWidth: '150px',
                  zIndex: 60,
                }}
                className={`p-1.5 rounded-xl border shadow-xl transition-all duration-200 ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                    : 'bg-white border-sky-100 text-slate-800 shadow-[0_4px_20px_rgba(3,105,161,0.15)]'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(false);
                    handleLogoutClick();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer border-0 ${
                    darkMode
                      ? 'text-red-400 bg-transparent hover:bg-red-500/15'
                      : 'text-red-600 bg-transparent hover:bg-red-50'
                  }`}
                >
                  <FaSignOutAlt className="text-sm shrink-0 text-red-500" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Profile Navigation Card */}
            <div
              onClick={() => {
                navigate('/faculty-profile');
              }}
              title={!sidebarOpen ? `${userName} - View Profile` : undefined}
              onMouseEnter={() => setHoveredKey('user-profile')}
              onMouseLeave={() => setHoveredKey(null)}
              style={{
                height: '44px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                background: activePage === 'profile'
                  ? darkMode
                    ? 'rgba(56, 189, 248, 0.15)'
                    : 'rgba(224, 242, 254, 0.6)'
                  : hoveredKey === 'user-profile'
                  ? darkMode
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(224,242,254,0.45)'
                  : 'transparent',
                border: activePage === 'profile'
                  ? darkMode
                    ? '1.5px solid #38bdf8'
                    : '1.5px solid #0284c7'
                  : darkMode
                  ? '1px solid rgba(100,116,139,0.2)'
                  : '1px solid rgba(186,230,253,0.55)',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                boxSizing: 'border-box',
              }}
            >
              {/* Perfectly Centered Avatar Cell (Never shrinks, zero flickering) */}
              <div
                style={{
                  width: '46px',
                  minWidth: '46px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={userName}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    style={{
                      border: darkMode ? '1.5px solid #38bdf8' : '1.5px solid #0284c7',
                      boxShadow: darkMode ? '0 0 10px rgba(56, 189, 248, 0.4)' : '0 2px 6px rgba(2, 132, 199, 0.25)',
                    }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200"
                    style={{
                      background: darkMode
                        ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                        : 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                      boxShadow: darkMode
                        ? '0 0 10px rgba(56, 189, 248, 0.4), inset 0 1px 1px rgba(255,255,255,0.2)'
                        : '0 2px 8px rgba(2, 132, 199, 0.25), inset 0 1px 1px rgba(255,255,255,0.4)',
                      border: darkMode
                        ? '1.5px solid rgba(56, 189, 248, 0.65)'
                        : '1.5px solid #ffffff',
                    }}
                  >
                    <UserIcon className="w-4 h-4 text-white" strokeWidth={2.4} />
                  </div>
                )}
              </div>

              {/* User Name & Role Subtitle (Strictly hidden when collapsed) */}
              <div
                style={{
                  opacity: sidebarOpen ? 1 : 0,
                  visibility: sidebarOpen ? 'visible' : 'hidden',
                  pointerEvents: sidebarOpen ? 'auto' : 'none',
                  transition: 'opacity 180ms ease, visibility 180ms ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'left',
                  minWidth: 0,
                  flex: 1,
                  paddingRight: '4px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: activePage === 'profile'
                      ? darkMode ? '#38bdf8' : '#075985'
                      : darkMode ? '#f1f5f9' : '#0f172a',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {userName}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: darkMode ? '#94a3b8' : '#64748b',
                    fontWeight: 500,
                    lineHeight: 1,
                  }}
                >
                  Faculty
                </div>
              </div>

              {/* Modern 3-Dot Button with Glowing Bloom Shine (No background box) */}
              {sidebarOpen && (
                <button
                  type="button"
                  title="More options"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu((prev) => !prev);
                  }}
                  onMouseEnter={() => setHoveredKey('three-dot')}
                  onMouseLeave={() => setHoveredKey('user-profile')}
                  style={{
                    width: '28px',
                    height: '28px',
                    minWidth: '28px',
                    marginRight: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: showUserMenu || hoveredKey === 'three-dot'
                      ? darkMode ? '#38bdf8' : '#0284c7'
                      : darkMode ? '#94a3b8' : '#64748b',
                    outline: 'none',
                    padding: 0,
                    flexShrink: 0,
                    transition: 'color 0.2s ease, transform 0.2s ease, filter 0.2s ease',
                    transform: hoveredKey === 'three-dot' ? 'scale(1.2)' : 'scale(1)',
                    filter: hoveredKey === 'three-dot' || showUserMenu
                      ? darkMode
                        ? 'drop-shadow(0 0 5px #38bdf8) drop-shadow(0 0 10px rgba(56, 189, 248, 0.9))'
                        : 'drop-shadow(0 0 4px #0284c7) drop-shadow(0 0 8px rgba(14, 165, 233, 0.7))'
                      : 'none',
                  }}
                >
                  <MoreVertical className="w-4 h-4" strokeWidth={2.4} />
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Logout Confirmation */}
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