import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useUserSession } from '../../UserSessionContext';
import { getDarkModeFromStorage } from '../FacultyDashboard/darkModeUtils';
import ModernContactView from '../../components/ModernContactView';

const HodContactUs = () => {
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useUserSession();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-gray-100' : 'bg-slate-50/50 text-gray-800'
    }`}>
      <Navbar 
        darkMode={darkMode}
        toggleSidebar={toggleSidebar} 
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar} 
          darkMode={darkMode} 
          activeView={null}
          setActiveView={() => {}}
        />
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="pt-16 sm:pt-20">
            <ModernContactView darkMode={darkMode} user={user} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default HodContactUs;