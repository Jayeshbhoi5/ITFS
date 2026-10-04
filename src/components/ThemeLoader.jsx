import React from 'react';
import { getDarkModeFromStorage } from '../pages/FacultyDashboard/darkModeUtils';

/**
 * Brand-matched loader — no text. Use for auth/session gates and brief route transitions.
 */
const ThemeLoader = ({
  fullScreen = true,
  darkMode: darkModeProp,
  className = '',
}) => {
  const darkMode = darkModeProp ?? getDarkModeFromStorage();

  const rootClass = [
    'theme-loader',
    darkMode ? 'theme-loader--dark' : '',
    fullScreen ? 'theme-loader--fullscreen' : 'theme-loader--inline',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} role="status" aria-label="Loading">
      <div className="theme-loader__orb" aria-hidden="true">
        <span className="theme-loader__ring" />
        <span className="theme-loader__ring theme-loader__ring--inner" />
        <span className="theme-loader__dot" />
      </div>
    </div>
  );
};

export default ThemeLoader;
