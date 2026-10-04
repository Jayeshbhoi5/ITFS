import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ActivityUploadForm from './ActivityUploadForm';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from "../../firebaseConfig";
import { useUserSession } from '../../UserSessionContext';
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';
import Toast from '../../components/Toast';

const UploadActivity = () => {
  // State management
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => { try { return JSON.parse(sessionStorage.getItem('sidebarOpen')) || false; } catch { return false; } });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptEditMode, setDeptEditMode] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const { user, setUser } = useUserSession();
  useEffect(() => {
    if (!user?.uid || !user?.department) {
      console.warn('User data incomplete - may cause upload issues');
    }
  }, [user]);
  
  // Activity upload handler
  const handleActivityUpload = async (activityData) => {
    try {
      // Ensure required fields have default values if undefined
      const uploadData = {
        ...activityData,
        facultyId: user?.uid || '',
        facultyName: user?.name || '',
        department: user?.department || 'General', // Provide default department
        createdAt: serverTimestamp(),
        status: 'Active',
        totalStudents: 0,
        totalFeedbackReceived: 0,
        averageRating: 0,
        targetBranches: activityData.targetBranches || [],
        targetYears: activityData.targetYears || [],
        targetSemesters: activityData.targetSemesters || []
      };
  
      // Validate required fields
      if (!uploadData.facultyId || !uploadData.facultyName) {
        throw new Error('User information is missing');
      }
  
      const newActivityRef = await addDoc(collection(db, 'activities'), uploadData);
      setShowSuccessPopup(true);
      return newActivityRef.id;
    } catch (error) {
      console.error("Activity upload failed", error);
      throw error;
    }
  };

  // Dark mode toggle
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setDarkModeInStorage(newMode);
    document.documentElement.classList.toggle('dark', newMode);
  };

  // UI toggles
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);

  const handleEditDepartment = () => {
    if (user && (user.role === 'Faculty' || user.role === 'Student')) {
      setShowDeptModal(true);
      setDeptEditMode(true);
    }
  };

  const handleDepartmentSubmit = async (data) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);

    // Close modal instantly with ZERO delay & show toast immediately
    setShowDeptModal(false);
    setDeptEditMode(false);
    setToast({ show: true, message: 'Department updated successfully!', type: 'success' });

    if (setUser) {
      setUser({ ...user, departments: data.departments, primaryDepartment: data.primaryDepartment });
    }

    try {
      await updateDoc(userRef, {
        departments: data.departments,
        primaryDepartment: data.primaryDepartment,
      });
    } catch (err) {
      console.error('Error updating department in Firestore:', err);
      setToast({ show: true, message: 'Failed to update department.', type: 'error' });
    }
  };

  // Dark mode effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    
    const handleStorageChange = (e) => {
      if (e.key === 'darkMode') {
        setDarkMode(e.newValue === 'true');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'} transition-colors duration-300`}>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          darkMode={darkMode}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      {/* Department Selection Modal */}
      <DepartmentSelectionModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onSubmit={handleDepartmentSubmit}
        userType={user?.role === 'Faculty' ? 'faculty' : 'student'}
        currentDepartments={user?.departments || []}
        currentPrimaryDepartment={user?.primaryDepartment || user?.departments?.[0] || ''}
        canEdit={true}
        darkMode={darkMode}
      />
      <Navbar 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        toggleSidebar={toggleSidebar} 
        showProfileMenu={showProfileMenu}
        toggleProfileMenu={toggleProfileMenu} 
        sidebarOpen={sidebarOpen}
        user={user}
        onEditDepartment={handleEditDepartment}
      />

      <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out page-smooth-enter`}>
        <ActivityUploadForm 
          darkMode={darkMode} 
          onUpload={handleActivityUpload}
          onSuccess={() => setShowSuccessPopup(true)}
        />
        
       
      </div>
      
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        darkMode={darkMode}  
        toggleDarkMode={toggleDarkMode} 
        activePage="upload" 
      />
    </div>
  );
};

export default UploadActivity;