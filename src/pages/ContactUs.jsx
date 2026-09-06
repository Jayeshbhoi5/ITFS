import React, { useState } from 'react';
import Navbar from './FacultyDashboard/Navbar';
import Sidebar from './FacultyDashboard/Sidebar';
import { useUserSession } from '../UserSessionContext';
import DepartmentSelectionModal from '../components/DepartmentSelectionModal';
import ModernContactView from '../components/ModernContactView';
import { getDarkModeFromStorage } from './FacultyDashboard/darkModeUtils';

const ContactUs = ({ darkMode: propDarkMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user } = useUserSession();
  const [showDeptModal, setShowDeptModal] = useState(false);

  const darkMode = propDarkMode !== undefined ? propDarkMode : getDarkModeFromStorage();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleEditDepartment = () => {
    if (user && (user.role === 'Faculty' || user.role === 'Student')) {
      setShowDeptModal(true);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-gray-100' : 'bg-slate-50/50 text-gray-800'
    }`}>
      {/* Department Selection Modal */}
      <DepartmentSelectionModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onSubmit={() => setShowDeptModal(false)}
        userType={user?.role === 'Faculty' ? 'faculty' : 'student'}
        currentDepartments={user?.departments || []}
        canEdit={true}
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
        <Sidebar 
          darkMode={darkMode} 
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <ModernContactView darkMode={darkMode} user={user} />
        </div>
      </div>
    </div>
  );
};

export default ContactUs;