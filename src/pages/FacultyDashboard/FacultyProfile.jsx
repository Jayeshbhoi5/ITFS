import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';
import LogoutConfirmation from '../../components/LogoutConfirmation';
import Toast from '../../components/Toast';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { handleLogout } from './logoutUtils';
import { useUserSession } from '../../UserSessionContext';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { getActionCodeSettings } from '../../utils/authConfig';
import {
  FaUser,
  FaEnvelope,
  FaUniversity,
  FaBuilding,
  FaIdCard,
  FaPhoneAlt,
  FaBriefcase,
  FaLightbulb,
  FaKey,
  FaSignOutAlt,
  FaCheckCircle,
  FaEdit,
  FaShieldAlt,
  FaGraduationCap,
  FaSave,
  FaPaperPlane,
  FaLock,
} from 'react-icons/fa';

const COLLEGE_NAME = "Maratha Vidya Prasarak Samaj's Karmaveer Adv. Baburao Ganpatrao Thakare College of Engineering";

const FacultyProfile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUserSession();

  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('sidebarOpen')) || false;
    } catch {
      return false;
    }
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'academic' | 'department' | 'security'
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Detect if user signed in with Google
  const isGoogleAccount = Boolean(
    user?.isGoogleUser === true ||
    user?.authProvider === 'google' ||
    user?.provider === 'google' ||
    auth.currentUser?.providerData?.some((p) => p.providerId === 'google.com')
  );

  // Form State for Faculty details
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    designation: '',
    specialization: '',
    phone: '',
  });

  // Sync state with user data and enforce Google name lock
  useEffect(() => {
    if (user) {
      // If user signed in with Google, always adopt name fetched from Google
      const resolvedName = (isGoogleAccount && auth.currentUser?.displayName)
        ? auth.currentUser.displayName
        : (user.name || user.displayName || '');

      setFormData({
        name: resolvedName,
        employeeId: user.employeeId || user.facultyId || '',
        designation: user.designation || '',
        specialization: user.specialization || '',
        phone: user.phone || user.mobile || '',
      });

      // If user is signed in with Google, ensure Firestore doc marks isGoogleUser: true and syncs Google name immediately
      if (isGoogleAccount && user.uid) {
        const userRef = doc(db, 'users', user.uid);
        const syncUpdates = {};
        if (!user.isGoogleUser || user.authProvider !== 'google') {
          syncUpdates.isGoogleUser = true;
          syncUpdates.authProvider = 'google';
        }
        if (auth.currentUser?.displayName && user.name !== auth.currentUser.displayName) {
          syncUpdates.name = auth.currentUser.displayName;
          syncUpdates.displayName = auth.currentUser.displayName;
        }
        if (Object.keys(syncUpdates).length > 0) {
          setDoc(userRef, syncUpdates, { merge: true }).catch((err) =>
            console.warn('Could not sync Google status to Firestore:', err)
          );
        }
      }
    }
  }, [user, isGoogleAccount]);

  // Listen to dark mode events dispatched by sidebar or header
  useEffect(() => {
    const handleDarkChange = (e) => {
      if (e?.detail?.isDark !== undefined) {
        setDarkMode(e.detail.isDark);
      }
    };
    window.addEventListener('darkModeChange', handleDarkChange);
    return () => window.removeEventListener('darkModeChange', handleDarkChange);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    setDarkModeInStorage(next);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const showToastMsg = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Prevent changing name if it's managed by Google
    if (name === 'name' && isGoogleAccount) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Update profile in Firestore
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      const resolvedName = isGoogleAccount
        ? (auth.currentUser?.displayName || user.name || user.displayName || formData.name.trim())
        : (formData.name.trim() || user.name || user.displayName || '');

      const updatedFields = {
        name: resolvedName,
        displayName: resolvedName,
        employeeId: formData.employeeId.trim(),
        facultyId: formData.employeeId.trim(),
        designation: formData.designation.trim(),
        specialization: formData.specialization.trim(),
        phone: formData.phone.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (isGoogleAccount) {
        updatedFields.isGoogleUser = true;
        updatedFields.authProvider = 'google';
      }

      // Guaranteed save to Firestore using setDoc with merge: true
      await setDoc(userRef, updatedFields, { merge: true });

      if (auth.currentUser && updatedFields.displayName && !isGoogleAccount) {
        try {
          await updateProfile(auth.currentUser, { displayName: updatedFields.displayName });
        } catch (pErr) {
          console.warn('Could not update auth displayName:', pErr);
        }
      }

      if (setUser) {
        setUser({
          ...user,
          ...updatedFields,
        });
      }

      showToastMsg('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving faculty profile:', error);
      showToastMsg('Failed to update profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle department modal updates
  const handleDepartmentUpdate = async (data) => {
    if (!user) return;

    // Close modal instantly with ZERO delay & show toast immediately
    setShowDeptModal(false);
    showToastMsg('Department updated successfully!', 'success');

    if (setUser) {
      setUser({
        ...user,
        departments: data.departments,
        primaryDepartment: data.primaryDepartment,
      });
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        departments: data.departments,
        primaryDepartment: data.primaryDepartment,
      });
    } catch (error) {
      console.error('Error updating department in Firestore:', error);
      showToastMsg('Failed to update department.', 'error');
    }
  };

  // Handle password reset email request (Forgot password method)
  const handleSendPasswordReset = async () => {
    if (!user?.email) {
      showToastMsg('No email address found for this user.', 'error');
      return;
    }

    setIsSendingReset(true);
    try {
      const actionCodeSettings = getActionCodeSettings('/reset-password');
      try {
        await sendPasswordResetEmail(auth, user.email.trim(), actionCodeSettings);
      } catch (actErr) {
        await sendPasswordResetEmail(auth, user.email.trim());
      }
      setResetEmailSent(true);
      showToastMsg('Password reset link sent to your registered email!', 'success');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      showToastMsg(error.message || 'Failed to send password reset email.', 'error');
    } finally {
      setIsSendingReset(false);
    }
  };

  const displayName = formData.name || user?.name || user?.displayName || 'Faculty Member';
  const displayEmail = user?.email || 'No email registered';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-[#f8fcff] text-slate-800'
      }`}
    >
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          darkMode={darkMode}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Navigation Bar */}
      <Navbar
        darkMode={darkMode}
        toggleSidebar={toggleSidebar}
        showProfileMenu={showProfileMenu}
        toggleProfileMenu={toggleProfileMenu}
        sidebarOpen={sidebarOpen}
        user={user}
        onEditDepartment={() => setShowDeptModal(true)}
      />

      {/* Sidebar */}
      <Sidebar
        darkMode={darkMode}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleDarkMode={toggleDarkMode}
        activePage="profile"
      />

      {/* Main Content Area: Stretches full-width left-to-right */}
      <main
        className={`flex-1 p-4 sm:p-6 md:p-8 transition-all duration-300 ease-in-out page-smooth-enter ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        <div className="w-full space-y-4">
          {/* Header Card with College Logo in place of Avatar */}
          <div
            className={`w-full rounded-2xl p-4 sm:p-5 md:py-4.5 md:px-6 border transition-all duration-300 relative overflow-hidden ${
              darkMode
                ? 'bg-gray-800 text-gray-100 border-gray-700 shadow-md'
                : 'bg-white text-slate-800 border-sky-100 shadow-[0_2px_15px_-3px_rgba(3,105,161,0.06)]'
            }`}
          >
            {/* Top theme accent bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                darkMode ? 'bg-sky-500' : 'bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600'
              }`}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              {/* College Logo + User Details */}
              <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                {/* College Logo in place of Avatar */}
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-2 flex items-center justify-center shrink-0 border transition-colors ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 shadow-inner'
                      : 'bg-white border-sky-100 shadow-sm'
                  }`}
                >
                  <img
                    src="/5.png"
                    alt="KBTCOE Logo"
                    className="w-full h-full object-contain drop-shadow-sm"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1
                      style={{ color: darkMode ? '#38bdf8' : '#0369a1' }}
                      className="text-2xl sm:text-2xl md:text-3xl font-extrabold tracking-tight truncate"
                    >
                      {displayName}
                    </h1>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        darkMode
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {user?.role || 'Faculty'}
                    </span>
                  </div>

                  <p className={`text-sm sm:text-base mt-1 font-medium truncate ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                    {displayEmail}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-xs sm:text-sm font-semibold text-sky-700 dark:text-sky-300">
                    <FaUniversity className="shrink-0 text-sky-600 dark:text-sky-400" />
                    <span className="truncate">{COLLEGE_NAME}</span>
                  </div>
                </div>
              </div>

              {/* Header Action: Logout Button */}
              <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className={`inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${
                    darkMode
                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                  }`}
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation Bar: Super Slim & Modern */}
          <div
            className={`w-full rounded-xl p-1 border shadow-xs flex flex-wrap gap-1 transition-colors ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-sky-100'
            }`}
          >
            {[
              { id: 'personal', label: 'Personal Info', icon: FaIdCard },
              { id: 'academic', label: 'Academic Details', icon: FaGraduationCap },
              { id: 'department', label: 'Department Settings', icon: FaBuilding },
              { id: 'security', label: 'Change Password', icon: FaKey },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={
                    isActive
                      ? {
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          boxShadow: '0 1px 4px rgba(2, 132, 199, 0.25)',
                        }
                      : {}
                  }
                  className={`flex-1 min-w-[120px] h-8 sm:h-9 flex items-center justify-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'font-bold'
                      : darkMode
                      ? 'text-gray-300 hover:bg-gray-700/60 hover:text-white'
                      : 'text-slate-700 hover:bg-sky-50 hover:text-[#0284c7]'
                  }`}
                >
                  <Icon className="text-xs sm:text-sm shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Personal Info */}
          {activeTab === 'personal' && (
            <div
              className={`w-full rounded-2xl p-6 sm:p-8 border shadow-sm transition-colors ${
                darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-slate-800 border-sky-100'
              }`}
            >
              <div className="pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold">Personal
                   Information</h2>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Full Name */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${isGoogleAccount ? 'text-slate-400' : 'text-sky-600 dark:text-sky-400'}`}>
                        {isGoogleAccount ? <FaLock className="text-sm" /> : <FaUser className="text-sm" />}
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        readOnly={isGoogleAccount}
                        disabled={isGoogleAccount}
                        placeholder="Enter full name"
                        style={{ paddingLeft: '2.5rem' }}
                        className={`w-full pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all ${
                          isGoogleAccount
                            ? darkMode
                              ? 'bg-gray-900 border-gray-700 text-gray-400 cursor-not-allowed opacity-80'
                              : 'bg-sky-50/50 border-sky-100 text-slate-600 cursor-not-allowed opacity-80'
                            : darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                            : 'bg-white border-sky-200 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 mb-1.5">
                      Official Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <FaEnvelope className="text-sm" />
                      </div>
                      <input
                        type="email"
                        value={displayEmail}
                        readOnly
                        disabled
                        style={{ paddingLeft: '2.5rem' }}
                        className={`w-full pr-4 py-2.5 rounded-xl text-sm font-medium border cursor-not-allowed opacity-75 ${
                          darkMode
                            ? 'bg-gray-900 border-gray-700 text-gray-400'
                            : 'bg-sky-50/50 border-sky-100 text-slate-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Faculty / Employee ID */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 mb-1.5">
                      Faculty / Employee ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600 dark:text-sky-400">
                        <FaIdCard className="text-sm" />
                      </div>
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleInputChange}
                        placeholder="e.g. EMP-1024"
                        style={{ paddingLeft: '2.5rem' }}
                        className={`w-full pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                            : 'bg-white border-sky-200 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 mb-1.5">
                      Designation
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600 dark:text-sky-400">
                        <FaBriefcase className="text-sm" />
                      </div>
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation}
                        onChange={handleInputChange}
                        placeholder="e.g. Assistant Professor"
                        style={{ paddingLeft: '2.5rem' }}
                        className={`w-full pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                            : 'bg-white border-sky-200 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Specialization / Domain */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 mb-1.5">
                      Area of Specialization
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600 dark:text-sky-400">
                        <FaLightbulb className="text-sm" />
                      </div>
                      <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        placeholder="e.g. AI, Cloud Computing, VLSI"
                        style={{ paddingLeft: '2.5rem' }}
                        className={`w-full pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                            : 'bg-white border-sky-200 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Contact / Phone */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 mb-1.5">
                      Contact / Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600 dark:text-sky-400">
                        <FaPhoneAlt className="text-sm" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. +91 9876543210"
                        style={{ paddingLeft: '2.5rem' }}
                        className={`w-full pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                            : 'bg-white border-sky-200 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{ backgroundColor: '#0284c7' }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:bg-[#0369a1] transition-all duration-200 disabled:opacity-60 cursor-pointer"
                  >
                    <FaSave />
                    <span>{isSaving ? 'Updating...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Academic Details */}
          {activeTab === 'academic' && (
            <div
              className={`w-full rounded-2xl p-6 sm:p-8 border shadow-sm transition-colors ${
                darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-slate-800 border-sky-100'
              }`}
            >
              <div className="pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold">Academic Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* College Info */}
                <div
                  className={`p-5 rounded-xl border ${
                    darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-sky-50/50 border-sky-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2 text-sky-600 dark:text-sky-400">
                    <FaUniversity className="text-lg" />
                    <span className="text-xs font-bold uppercase tracking-wider">Institution / College</span>
                  </div>
                  <p className="text-sm font-semibold leading-relaxed">{COLLEGE_NAME}</p>
                </div>

                {/* Role */}
                <div
                  className={`p-5 rounded-xl border ${
                    darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-sky-50/50 border-sky-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2 text-sky-600 dark:text-sky-400">
                    <FaGraduationCap className="text-lg" />
                    <span className="text-xs font-bold uppercase tracking-wider">Account Role</span>
                  </div>
                  <p className="text-base font-bold text-sky-700 dark:text-sky-300">{user?.role || 'Faculty Member'}</p>
                </div>

                {/* Primary Department */}
                <div
                  className={`p-5 rounded-xl border ${
                    darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-sky-50/50 border-sky-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2 text-sky-600 dark:text-sky-400">
                    <FaBuilding className="text-lg" />
                    <span className="text-xs font-bold uppercase tracking-wider">Primary Department</span>
                  </div>
                  <p className="text-base font-bold text-sky-700 dark:text-sky-300">
                    {user?.primaryDepartment || user?.departments?.[0] || 'Not Selected'}
                  </p>
                </div>

                {/* All Assigned Departments */}
                <div
                  className={`p-5 rounded-xl border ${
                    darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-sky-50/50 border-sky-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2 text-sky-600 dark:text-sky-400">
                    <FaBuilding className="text-lg" />
                    <span className="text-xs font-bold uppercase tracking-wider">Assigned Department(s)</span>
                  </div>
                  {user?.departments && user.departments.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.departments.map((dept, index) => (
                        <span
                          key={index}
                          style={{
                            backgroundColor: dept === (user.primaryDepartment || user.departments[0])
                              ? '#0284c7'
                              : darkMode ? '#0f172a' : '#ffffff',
                            color: dept === (user.primaryDepartment || user.departments[0])
                              ? '#ffffff'
                              : darkMode ? '#e2e8f0' : '#1e293b',
                            borderColor: darkMode ? '#334155' : '#cbd5e1',
                          }}
                          className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border"
                        >
                          {dept}
                          {dept === (user.primaryDepartment || user.departments[0]) && ' (Primary)'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 font-semibold mt-1">No departments currently assigned</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Department Settings */}
          {activeTab === 'department' && (
            <div
              className={`w-full rounded-2xl p-6 sm:p-8 border shadow-sm transition-colors ${
                darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-slate-800 border-sky-100'
              }`}
            >
              <div className="pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold">Department Settings</h2>
              </div>

              <div
                className={`w-full p-6 rounded-2xl border mb-6 ${
                  darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-sky-50/30 border-sky-100'
                }`}
              >
                <div className="space-y-4 my-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                      Primary Department:
                    </span>
                    <span className="text-base font-bold text-sky-600 dark:text-sky-400">
                      {user?.primaryDepartment || user?.departments?.[0] || 'Not set'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 block mb-2">
                      All Registered Departments:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {user?.departments?.map((dept, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                            color: darkMode ? '#7dd3fc' : '#0369a1',
                            borderColor: darkMode ? '#334155' : '#cbd5e1',
                          }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border"
                        >
                          {dept}
                        </span>
                      )) || <span className="text-sm text-slate-400">None</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowDeptModal(true)}
                    style={{ backgroundColor: '#0284c7' }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:bg-[#0369a1] transition-all duration-200 cursor-pointer"
                  >
                    <FaEdit />
                    <span>Edit Department Selection</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Change Password (Forgot Password Email Method) */}
          {activeTab === 'security' && (
            <div
              className={`w-full rounded-2xl p-6 sm:p-8 border shadow-sm transition-colors ${
                darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-slate-800 border-sky-100'
              }`}
            >
              <div className="pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold">Password & Security</h2>
              </div>

              <div
                className={`w-full max-w-xl p-6 rounded-2xl border ${
                  darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-sky-50/40 border-sky-100'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-3 text-sky-600 dark:text-sky-400">
                  <FaShieldAlt className="text-xl" />
                  <h3 className="text-base font-bold">Send Password Reset Link</h3>
                </div>

                <div
                  className={`p-3.5 rounded-xl font-mono text-sm font-semibold mb-5 border ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-sky-300'
                      : 'bg-white border-sky-200 text-sky-900'
                  }`}
                >
                  {displayEmail}
                </div>

                {resetEmailSent && (
                  <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2.5">
                    <FaCheckCircle className="shrink-0 text-base" />
                    <span>
                      Password reset link has been dispatched to your email! Please check your inbox.
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSendPasswordReset}
                  disabled={isSendingReset}
                  style={{ backgroundColor: '#0284c7' }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:bg-[#0369a1] transition-all duration-200 disabled:opacity-60 cursor-pointer"
                >
                  <FaPaperPlane />
                  <span>{isSendingReset ? 'Sending link...' : 'Send Password Reset Link'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmation
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout(navigate);
        }}
        darkMode={darkMode}
      />

      {/* Department Selection Modal */}
      <DepartmentSelectionModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onSubmit={handleDepartmentUpdate}
        userType="faculty"
        currentDepartments={user?.departments || []}
        currentPrimaryDepartment={user?.primaryDepartment || user?.departments?.[0] || ''}
        canEdit={true}
        darkMode={darkMode}
      />
    </div>
  );
};

export default FacultyProfile;
