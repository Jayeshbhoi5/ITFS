import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaUser, FaIdCard, FaPen, FaSignOutAlt } from 'react-icons/fa';
import { handleLogout } from './logoutUtils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserSession } from '../../UserSessionContext';
import LogoutConfirmation from '../../components/LogoutConfirmation';
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';
import Toast from '../../components/Toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const Navbar = ({ darkMode, toggleSidebar, showProfileMenu, toggleProfileMenu, sidebarOpen, user: propUser, onEditDepartment }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isProfileActive = location.pathname === '/faculty-profile' || location.pathname === '/profile';
  const { user: sessionUser, setUser: setSessionUser } = useUserSession();
  const user = propUser || sessionUser;
  const profileMenuRef = useRef(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        if (showProfileMenu) toggleProfileMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu, toggleProfileMenu]);

  const handleProfileClick   = (e) => { e.stopPropagation(); toggleProfileMenu(); };
  const handleLogoutClick    = () => setShowLogoutConfirm(true);
  const handleConfirmLogout  = () => { handleLogout(navigate); setShowLogoutConfirm(false); };
  const handleCancelLogout   = () => setShowLogoutConfirm(false);

  const handleDepartmentUpdate = async (data) => {
    if (!user) return;

    // Close modal instantly with ZERO delay & show toast immediately
    setShowDepartmentModal(false);
    setToast({ show: true, message: 'Department updated successfully!', type: 'success' });

    if (setSessionUser) setSessionUser({ ...user, departments: data.departments, primaryDepartment: data.primaryDepartment });

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { departments: data.departments, primaryDepartment: data.primaryDepartment });
    } catch (error) {
      console.error('Error updating departments in Firestore:', error);
      setToast({ show: true, message: 'Failed to update department. Please try again.', type: 'error' });
    }
  };

  const getNameFromEmail = (email) => {
    if (user?.name) return user.name;
    if (user?.displayName) return user.displayName;
    if (!email) return 'User';
    const namePart = email.split('@')[0];
    return namePart.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const displayName = getNameFromEmail(user?.email);
  const navLinkClass = "px-3 py-2 rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold tracking-wide transition-all duration-200 border border-transparent";
  const navLinkStyle = { color: darkMode ? '#e2e8f0' : '#075985' };

  return (
    <>
      <nav className={`w-full py-3.5 pr-6 pl-0 flex justify-between items-center sticky top-0 z-50 ${
        darkMode
          ? 'bg-gray-800 text-gray-100 border-b border-gray-700'
          : 'bg-white text-slate-800 border-b border-sky-100 shadow-[0_2px_15px_-3px_rgba(3,105,161,0.06)]'
      } transition-colors duration-300 relative`}>

        <div className={`absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none ${
          darkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 opacity-60'
        }`} style={{ zIndex: 1 }} />

        {/* LEFT */}
        <div className="flex items-center gap-3">
          <div style={{ width:'64px', minWidth:'64px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <button onClick={toggleSidebar}
              style={{ color: darkMode ? '#7dd3fc' : '#0369a1' }}
              className="focus:outline-none p-1.5 rounded-lg bg-transparent hover:bg-blue-50 border-none transition-colors"
              aria-label="Toggle sidebar">
              <FaBars className="text-xl" />
            </button>
          </div>
          <div className="flex items-center">
            <h1 style={{
              fontFamily:"'Outfit','Inter',system-ui,sans-serif", fontWeight:800,
              letterSpacing:'-0.02em', lineHeight:1.2, display:'inline-block',
              color: darkMode ? '#38bdf8' : '#0369a1',
              textShadow: darkMode ? '0 0 16px rgba(56,189,248,0.4),0 1px 2px rgba(0,0,0,0.4)' : '0 1px 2px rgba(2,132,199,0.15)',
              transition:'all 0.3s ease',
            }} className="text-lg sm:text-base md:text-xl lg:text-2xl focus:outline-none hover:drop-shadow-[0_0_6px_rgba(14,165,233,0.45)] select-none">
              Innovative Teaching Feedback
            </h1>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <Link to="/faculty-dashboard" style={navLinkStyle}
            onMouseEnter={e => { e.currentTarget.style.color='#0284c7'; e.currentTarget.style.backgroundColor=darkMode?'rgba(125,211,252,0.08)':'rgba(2,132,199,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.color=darkMode?'#e2e8f0':'#075985'; e.currentTarget.style.backgroundColor='transparent'; }}
            className={navLinkClass}>Home</Link>
          <Link to="/faculty-about" style={navLinkStyle}
            onMouseEnter={e => { e.currentTarget.style.color='#0284c7'; e.currentTarget.style.backgroundColor=darkMode?'rgba(125,211,252,0.08)':'rgba(2,132,199,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.color=darkMode?'#e2e8f0':'#075985'; e.currentTarget.style.backgroundColor='transparent'; }}
            className={navLinkClass}>About Us</Link>
          <Link to="/faculty/contact" style={navLinkStyle}
            onMouseEnter={e => { e.currentTarget.style.color='#0284c7'; e.currentTarget.style.backgroundColor=darkMode?'rgba(125,211,252,0.08)':'rgba(2,132,199,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.color=darkMode?'#e2e8f0':'#075985'; e.currentTarget.style.backgroundColor='transparent'; }}
            className={navLinkClass}>Contact Us</Link>

          {/* Profile button + dropdown */}
          <div className="relative profile-menu-container" ref={profileMenuRef}>
            <button onClick={handleProfileClick}
              style={{
                backgroundColor: isProfileActive ? '#0284c7' : darkMode ? '#1e293b' : '#e0f2fe',
                color: isProfileActive ? '#ffffff' : darkMode ? '#7dd3fc' : '#0284c7',
                border: isProfileActive ? '2px solid #38bdf8' : darkMode ? '1px solid #334155' : '1.5px solid #bae6fd',
                boxShadow: isProfileActive ? '0 0 12px rgba(2,132,199,0.5)' : '0 2px 6px rgba(2,132,199,0.15)',
              }}
              className={`focus:outline-none hover:outline-none outline-none border-0 ring-0 flex items-center space-x-1 rounded-full p-2.5 transition-all duration-300 hover:scale-105 ${
                isProfileActive ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : ''
              }`}
              aria-label="Profile" title="User Profile">
              <FaUser className="text-lg" />
            </button>

            {/* ═══════════ DROPDOWN ═══════════ */}
            {showProfileMenu && (
              <div style={{
                backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                border: darkMode ? '1px solid rgba(51,65,85,0.8)' : '1px solid rgba(186,230,253,0.7)',
                boxShadow: darkMode
                  ? '0 20px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(56,189,248,0.08)'
                  : '0 16px 40px rgba(7,89,133,0.13), 0 2px 8px rgba(56,189,248,0.08), 0 0 0 1px rgba(186,230,253,0.5)',
                animation: 'fNavDrop 0.2s cubic-bezier(0.16,1,0.3,1)',
              }} className={`absolute right-0 mt-2 w-80 rounded-2xl py-1 z-[200] overflow-hidden transition-colors duration-300 ${
                darkMode ? 'text-slate-100' : 'text-slate-700'
              }`}>
                <style>{`
                  @keyframes fNavDrop {
                    from { opacity: 0; transform: scale(0.96) translateY(-6px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                  }
                `}</style>

                {/* User info */}
                {user && (
                  <div style={{ padding:'10px 14px 9px' }}
                    className={`border-b transition-colors duration-300 ${darkMode ? 'border-slate-700/70' : 'border-sky-100'}`}>

                    {/* Name */}
                    <div style={{ fontSize:'14.5px', fontFamily:"'Outfit','Inter',system-ui,sans-serif", letterSpacing:'-0.01em' }}
                      className={`font-bold truncate ${darkMode ? 'text-slate-100' : 'text-sky-950'}`}>
                      {displayName}
                    </div>

                    {/* Email */}
                    <div style={{ fontSize:'11.5px', marginTop:'2px' }}
                      className={`break-all leading-tight ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {user.email || 'No email provided'}
                    </div>

                    {/* Role badge */}
                    {user.role && (
                      <div style={{
                        fontSize:'10px', padding:'2px 8px', marginTop:'6px',
                        display:'inline-flex', alignItems:'center', gap:'4px',
                        borderRadius:'9999px', fontWeight:600, letterSpacing:'0.02em',
                        background: darkMode ? 'rgba(56,189,248,0.12)' : 'rgba(224,242,254,0.9)',
                        color: darkMode ? '#7dd3fc' : '#0369a1',
                        border: darkMode ? '1px solid rgba(56,189,248,0.25)' : '1px solid rgba(125,211,252,0.6)',
                      }}>
                        <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: darkMode ? '#38bdf8' : '#0284c7', flexShrink:0 }} />
                        {user.role}
                      </div>
                    )}

                    {/* Department */}
                    <div style={{ marginTop:'6px' }}>
                      {(() => {
                        const primary = user?.primaryDepartment || user?.departments?.[0];
                        const others = user?.departments?.filter(d => d !== primary) || [];
                        return primary ? (
                          <>
                            {/* Same line: DEPT label · bold name · PRIMARY pill */}
                            <div style={{ display:'flex', alignItems:'center', gap:'5px', flexWrap:'wrap' }}>
                              <span style={{
                                fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
                                color: darkMode ? '#e2e8f0' : '#0f172a', flexShrink:0,
                              }}>DEPT</span>
                              <span style={{
                                fontSize:'12px', fontWeight:700,
                                color: darkMode ? '#e2e8f0' : '#0c2340',
                              }}>{primary}</span>
                              <span style={{
                                fontSize:'8px', fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase',
                                padding:'1.5px 5px', borderRadius:'4px',
                                background: darkMode ? 'rgba(2,132,199,0.18)' : 'rgba(224,242,254,0.95)',
                                color: darkMode ? '#38bdf8' : '#0284c7',
                                border: darkMode ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(125,211,252,0.7)',
                                flexShrink:0,
                              }}>PRIMARY</span>
                            </div>
                            {/* Other depts below, muted, comma-separated */}
                            {others.length > 0 && (
                              <div style={{
                                fontSize:'10.5px', marginTop:'2px', lineHeight:1.4,
                                color: darkMode ? '#64748b' : '#64748b',
                              }}>{others.join(', ')}</div>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize:'11px', color:'#ef4444' }}>Dept not set</span>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Menu items */}
                <div style={{ padding:'4px 0' }}>

                  {/* My Profile */}
                  <button
                    onClick={() => { if (showProfileMenu) toggleProfileMenu(); navigate('/faculty-profile'); }}
                    style={{ color: darkMode ? '#38bdf8' : '#0284c7', backgroundColor:'transparent', fontSize:'13px', width:'100%' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? 'rgba(56,189,248,0.1)' : 'rgba(224,242,254,0.85)'; e.currentTarget.style.color = darkMode ? '#7dd3fc' : '#0369a1'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = darkMode ? '#38bdf8' : '#0284c7'; }}
                    className="flex items-center gap-3 w-full text-left px-4 py-2 font-semibold border-0 outline-none cursor-pointer transition-all duration-150">
                    <FaIdCard style={{ color:'inherit', fontSize:'15px', flexShrink:0 }} />
                    <span style={{ color:'inherit', fontSize:'13px' }}>My Profile</span>
                  </button>

                  {/* Edit Department — faculty only */}
                  {user?.role === 'Faculty' && (
                    <button
                      onClick={() => { if (showProfileMenu) toggleProfileMenu(); if (onEditDepartment) onEditDepartment(); else setShowDepartmentModal(true); }}
                      style={{ color: darkMode ? '#38bdf8' : '#0284c7', backgroundColor:'transparent', fontSize:'13px', width:'100%' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? 'rgba(56,189,248,0.1)' : 'rgba(224,242,254,0.85)'; e.currentTarget.style.color = darkMode ? '#7dd3fc' : '#0369a1'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = darkMode ? '#38bdf8' : '#0284c7'; }}
                      className="flex items-center gap-3 w-full text-left px-4 py-2 font-semibold border-0 outline-none cursor-pointer transition-all duration-150">
                      <FaPen style={{ color:'inherit', fontSize:'13px', flexShrink:0 }} />
                      <span style={{ color:'inherit', fontSize:'13px' }}>Edit Department</span>
                    </button>
                  )}

                  {/* Divider */}
                  <div style={{ margin:'4px 14px', height:'1px', background: darkMode ? 'rgba(51,65,85,0.6)' : 'rgba(186,230,253,0.6)' }} />

                  {/* Logout */}
                  <button
                    onClick={handleLogoutClick}
                    style={{ color: darkMode ? '#f87171' : '#dc2626', backgroundColor:'transparent', fontSize:'13px', width:'100%' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? 'rgba(239,68,68,0.1)' : 'rgba(254,242,242,0.9)'; e.currentTarget.style.color = darkMode ? '#fca5a5' : '#b91c1c'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = darkMode ? '#f87171' : '#dc2626'; }}
                    className="flex items-center gap-3 w-full text-left px-4 py-2 font-semibold border-0 outline-none cursor-pointer transition-all duration-150">
                    <FaSignOutAlt style={{ color:'inherit', fontSize:'15px', flexShrink:0 }} />
                    <span style={{ color:'inherit', fontSize:'13px' }}>Logout</span>
                  </button>

                </div>
              </div>
            )}
            {/* ════════════════════════════════ */}

          </div>
        </div>
      </nav>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          darkMode={darkMode}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}

      <LogoutConfirmation
        isOpen={showLogoutConfirm}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        darkMode={darkMode}
      />

      {user?.role === 'Faculty' && (
        <DepartmentSelectionModal
          isOpen={showDepartmentModal}
          onClose={() => setShowDepartmentModal(false)}
          onSubmit={handleDepartmentUpdate}
          userType="faculty"
          currentDepartments={user.departments || []}
          currentPrimaryDepartment={user.primaryDepartment || user.departments?.[0] || ''}
          canEdit={true}
          darkMode={darkMode}
        />
      )}
    </>
  );
};

export default Navbar;
