import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import StudentSidebar from './StudentSidebar';
import { useUserSession } from '../../UserSessionContext';
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';
import ModernContactView from '../../components/ModernContactView';
import Toast from '../../components/Toast';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const StudentContactUs = ({ darkMode: propDarkMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => { try { return JSON.parse(sessionStorage.getItem('sidebarOpen')) || false; } catch { return false; } });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, setUser } = useUserSession();
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Always read from prop or localStorage so the value is in sync with other dashboard pages
  const [darkMode, setDarkMode] = useState(
    () => (typeof propDarkMode === 'boolean' ? propDarkMode : getDarkModeFromStorage())
  );

  useEffect(() => {
    if (typeof propDarkMode === 'boolean') {
      setDarkMode(propDarkMode);
    }
  }, [propDarkMode]);

  // Keep in sync if another tab / page updates localStorage or dispatches darkModeChange
  useEffect(() => {
    const onThemeChange = (e) => {
      if (e?.detail?.isDark !== undefined) {
        setDarkMode(e.detail.isDark);
      } else if (e?.key === 'darkMode') {
        setDarkMode(e.newValue === 'enabled');
      }
    };
    window.addEventListener('darkModeChange', onThemeChange);
    window.addEventListener('storage', onThemeChange);
    return () => {
      window.removeEventListener('darkModeChange', onThemeChange);
      window.removeEventListener('storage', onThemeChange);
    };
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    setDarkModeInStorage(next);
  };

  const handleEditDepartment = () => {
    if (user && user.role === 'Student') {
      setShowDeptModal(true);
    }
  };

  const handleDepartmentSubmit = async (data) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const activeAy = data.academicYear || getCurrentAcademicYear();
    const newChangeCount = (user.departmentChangeCount || 0) + 1;

    // Close modal instantly with ZERO delay & show toast immediately
    setShowDeptModal(false);
    setToast({ show: true, message: 'Department updated successfully!', type: 'success' });

    if (setUser) {
      setUser({
        ...user,
        departments: data.departments,
        year: data.year,
        academicYear: activeAy,
        baseYear: data.year,
        yearSelectedAt: data.yearSelectedAt,
        departmentChangeCount: newChangeCount,
      });
    }

    try {
      await updateDoc(userRef, {
        departments: data.departments,
        year: data.year,
        academicYear: activeAy,
        baseYear: data.year,
        yearSelectedAt: data.yearSelectedAt,
        departmentChangeCount: newChangeCount,
      });
    } catch (err) {
      console.error('Error updating department in Firestore:', err);
      setToast({ show: true, message: 'Failed to update department.', type: 'error' });
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-[#384353] text-gray-100' : 'bg-slate-50/50 text-gray-800'
    }`}>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          darkMode={darkMode}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <DepartmentSelectionModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onSubmit={handleDepartmentSubmit}
        userType={'student'}
        currentDepartments={user?.departments || []}
        currentPrimaryDepartment={user?.primaryDepartment || user?.departments?.[0] || ''}
        canEdit={(user?.departmentChangeCount || 0) < 1}
        darkMode={darkMode}
      />
      <Navbar 
        darkMode={darkMode} 
        toggleSidebar={toggleSidebar} 
        showProfileMenu={showProfileMenu}
        toggleProfileMenu={toggleProfileMenu}
        sidebarOpen={sidebarOpen}
        user={user}
        onEditDepartment={handleEditDepartment}
      />
      <div className="flex">
        <StudentSidebar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          toggleDarkMode={toggleDarkMode}
        />
        <div className={`flex-1 min-h-screen pt-4 transition-all duration-300 page-smooth-enter ${sidebarOpen ? 'ml-64' : 'ml-16'} ${darkMode ? 'bg-[#384353]' : 'bg-slate-50/50'}`}>
          <ModernContactView darkMode={darkMode} user={user} />
        </div>
      </div>
    </div>
  );
};

export default StudentContactUs;