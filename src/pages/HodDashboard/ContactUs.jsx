import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useUserSession } from '../../UserSessionContext';
import { getDarkModeFromStorage } from '../FacultyDashboard/darkModeUtils';
import ModernContactView from '../../components/ModernContactView';

const HodContactUs = ({ darkMode: propDarkMode }) => {
  const [darkMode, setDarkMode] = useState(
    () => (typeof propDarkMode === 'boolean' ? propDarkMode : getDarkModeFromStorage())
  );

  useEffect(() => {
    if (typeof propDarkMode === 'boolean') {
      setDarkMode(propDarkMode);
    }
  }, [propDarkMode]);

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

  const [sidebarOpen, setSidebarOpen] = useState(() => { try { return JSON.parse(sessionStorage.getItem('sidebarOpen')) || false; } catch { return false; } });
  const { user } = useUserSession();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-[#384353] text-gray-100' : 'bg-slate-50/50 text-gray-800'
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
          <div className="pt-4 page-smooth-enter">
            <ModernContactView darkMode={darkMode} user={user} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default HodContactUs;