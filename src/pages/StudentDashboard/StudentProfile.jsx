import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './StudentSidebar';
import Navbar from './Navbar';
import DepartmentSelectionModal, { computeCurrentYearAndAcademic, getCurrentAcademicYear } from '../../components/DepartmentSelectionModal';
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
  FaCalendarAlt,
  FaKey,
  FaSignOutAlt,
  FaCheckCircle,
  FaEdit,
  FaShieldAlt,
  FaGraduationCap,
  FaSave,
  FaPaperPlane,
  FaLayerGroup,
  FaVenusMars,
  FaVenus,
  FaMars,
  FaTransgender,
  FaLock,
  FaHashtag,
} from 'react-icons/fa';

const COLLEGE_NAME = "Maratha Vidya Prasarak Samaj's Karmaveer Adv. Baburao Ganpatrao Thakare College of Engineering";

const StudentProfile = () => {
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

  // Form State for Student details
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    rollNo: '',
    division: '',
    semester: '',
    phone: '',
    dob: '',
    gender: '',
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
        studentId: user.studentId || user.prn || '',
        rollNo: user.rollNo || user.rollNumber || '',
        division: user.division || '',
        semester: user.semester || '',
        phone: user.phone || user.mobile || '',
        dob: user.dob || user.dateOfBirth || '',
        gender: user.gender || '',
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
        studentId: formData.studentId.trim(),
        prn: formData.studentId.trim(),
        rollNo: formData.rollNo.trim(),
        division: formData.division.trim(),
        semester: formData.semester.trim(),
        phone: formData.phone.trim(),
        dob: formData.dob.trim(),
        gender: formData.gender.trim(),
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
          console.warn("Could not update auth displayName:", pErr);
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
      console.error('Error saving student profile:', error);
      showToastMsg('Failed to update profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle department modal updates
  const handleDepartmentUpdate = async ({ departments, year, academicYear, yearSelectedAt }) => {
    if (!user) return;
    const currentAy = academicYear || getCurrentAcademicYear();
    const newChangeCount = 1;

    // Close modal instantly with ZERO delay & show toast immediately
    setShowDeptModal(false);
    showToastMsg('Department updated successfully!', 'success');

    if (setUser) {
      setUser({
        ...user,
        departments,
        departmentChangeCount: newChangeCount,
        academicYear: currentAy,
        ...(year ? { year, baseYear: year, yearSelectedAt } : {}),
      });
    }

    try {
      if (year) {
        sessionStorage.setItem('itfs_student_class_name_filter', year);
      }
      sessionStorage.setItem('itfs_student_academic_year_filter', currentAy);
      sessionStorage.removeItem('itfs_student_filter_is_manual');
      sessionStorage.setItem('itfs_student_filter_uid', user.uid);
    } catch {}

    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        departments,
        departmentChangeCount: newChangeCount,
        academicYear: currentAy,
      };
      if (year) {
        updateData.year = year;
        updateData.baseYear = year;
        updateData.yearSelectedAt = yearSelectedAt;
      }
      await updateDoc(userRef, updateData);
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

  // Computed academic details
  const computedInfo = (user?.baseYear || user?.year) && user?.yearSelectedAt
    ? computeCurrentYearAndAcademic(user.baseYear || user.year, user.yearSelectedAt)
    : null;

  const currentYearDisplay = computedInfo?.currentYear || user?.baseYear || user?.year || 'Not Set';
  const academicYearDisplay = getCurrentAcademicYear();
  const departmentDisplay = user?.departments?.[0] || 'Not Selected';
  const canEditDepartment = (user?.departmentChangeCount || 0) < 1;

  const displayName = formData.name || user?.name || user?.displayName || 'Student';
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
        onEditDepartment={() => {
          if (canEditDepartment) setShowDeptModal(true);
        }}
      />

      {/* Sidebar */}
      <Sidebar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
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
                {/* College Logo */}
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
                      {user?.role || 'Student'}
                    </span>
                    {currentYearDisplay && currentYearDisplay !== 'Not Set' && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          darkMode
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {currentYearDisplay}
                      </span>
                    )}
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
                <h2 className="text-xl font-bold">Personal Information</h2>
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

                  {/* Official Email (Read-only) */}
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

                  {/* Student ID */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 mb-1.5">
                      Student ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600 dark:text-sky-400">
                        <FaIdCard className="text-sm" />
                      </div>
                      <input
                        type="text"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleInputChange}
                        placeholder="e.g. KBTUG123456"
                        style={{ paddingLeft: '2.5rem' }}
                        className={`w-full pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                            : 'bg-white border-sky-200 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Roll Number */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 mb-1.5">
                      Roll Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600 dark:text-sky-400">
                        <FaHashtag className="text-sm" />
                      </div>
                      <input
                        type="text"
                        name="rollNo"
                        value={formData.rollNo}
                        onChange={handleInputChange}
                        placeholder="e.g. 42"
                        style={{ paddingLeft: '2.5rem' }}
                        className={`w-full pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                            : 'bg-white border-sky-200 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Division */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 mb-1.5">
                      Division
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600 dark:text-sky-400">
                        <FaLayerGroup className="text-sm" />
                      </div>
                      <input
                        type="text"
                        name="division"
                        value={formData.division}
                        onChange={handleInputChange}
                        placeholder="e.g. A, B, C"
                        style={{ paddingLeft: '2.5rem' }}
                        className={`w-full pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                            : 'bg-white border-sky-200 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Semester */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 mb-1.5">
                      Semester
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600 dark:text-sky-400">
                        <FaGraduationCap className="text-sm" />
                      </div>
                      <input
                        type="text"
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        placeholder="e.g. Sem 5"
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
                  <div>
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

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 mb-1.5">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600 dark:text-sky-400">
                        <FaCalendarAlt className="text-sm" />
                      </div>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        style={{ paddingLeft: '2.5rem' }}
                        className={`w-full pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                            : 'bg-white border-sky-200 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 mb-1.5">
                      Gender
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        {formData.gender === 'Male' ? (
                          <FaMars className="text-sm text-sky-600 dark:text-sky-400" />
                        ) : formData.gender === 'Female' ? (
                          <FaVenus className="text-sm text-pink-500 dark:text-pink-400" />
                        ) : formData.gender === 'Other' ? (
                          <FaTransgender className="text-sm text-purple-500 dark:text-purple-400" />
                        ) : (
                          <FaVenusMars className="text-sm text-sky-600 dark:text-sky-400" />
                        )}
                      </div>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        style={{ paddingLeft: '2.5rem' }}
                        className={`w-full pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all cursor-pointer ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                            : 'bg-white border-sky-200 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                        }`}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male ♂</option>
                        <option value="Female">Female ♀</option>
                        <option value="Other">Other ⚧</option>
                      </select>
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

                {/* Enrolled Department */}
                <div
                  className={`p-5 rounded-xl border ${
                    darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-sky-50/50 border-sky-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2 text-sky-600 dark:text-sky-400">
                    <FaBuilding className="text-lg" />
                    <span className="text-xs font-bold uppercase tracking-wider">Enrolled Department</span>
                  </div>
                  <p className="text-base font-bold text-sky-700 dark:text-sky-300">{departmentDisplay}</p>
                </div>

                {/* Class / Year (FE, SE, TE, BE) */}
                <div
                  className={`p-5 rounded-xl border ${
                    darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-sky-50/50 border-sky-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2 text-sky-600 dark:text-sky-400">
                    <FaGraduationCap className="text-lg" />
                    <span className="text-xs font-bold uppercase tracking-wider">Current Year / Class</span>
                  </div>
                  <p className="text-base font-bold text-sky-700 dark:text-sky-300">{currentYearDisplay}</p>
                </div>

                {/* Academic Year */}
                <div
                  className={`p-5 rounded-xl border ${
                    darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-sky-50/50 border-sky-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2 text-sky-600 dark:text-sky-400">
                    <FaCalendarAlt className="text-lg" />
                    <span className="text-xs font-bold uppercase tracking-wider">Academic Year</span>
                  </div>
                  <p className="text-base font-bold text-sky-700 dark:text-sky-300">{academicYearDisplay}</p>
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
                      Department:
                    </span>
                    <span className="text-base font-bold text-sky-600 dark:text-sky-400">
                      {departmentDisplay}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                      Status:
                    </span>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        canEditDepartment
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {canEditDepartment ? '1 department change allowed' : 'Department finalized'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (canEditDepartment) setShowDeptModal(true);
                    }}
                    disabled={!canEditDepartment}
                    style={canEditDepartment ? { backgroundColor: '#0284c7' } : {}}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      canEditDepartment
                        ? 'text-white hover:bg-[#0369a1] shadow-md cursor-pointer'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <FaEdit />
                    <span>Edit Department</span>
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
        userType="student"
        currentDepartments={user?.departments || []}
        currentPrimaryDepartment={user?.primaryDepartment || user?.departments?.[0] || ''}
        currentYear={user?.year || user?.baseYear || ''}
        canEdit={canEditDepartment}
        darkMode={darkMode}
      />
    </div>
  );
};

export default StudentProfile;
