// darkModeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';

// Create context
export const DarkModeContext = createContext();

// Create provider component
export const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage on component mount
  useEffect(() => {
    const isDarkMode = getDarkModeFromStorage();
    setDarkMode(isDarkMode);
    
    // Apply dark mode class to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle function
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setDarkModeInStorage(newMode);
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// Custom hook for using dark mode
export const useDarkMode = () => useContext(DarkModeContext);