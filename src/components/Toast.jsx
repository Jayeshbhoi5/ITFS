import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const Toast = ({ message, type = 'error', onClose, darkMode: propDarkMode }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500); // Auto-close after 4.5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const isDark = (typeof propDarkMode === 'boolean') 
    ? propDarkMode 
    : (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) || 
      (typeof localStorage !== 'undefined' && localStorage.getItem('darkMode') === 'enabled');

  const isSuccess = type === 'success';
  const isInfo = type === 'info';

  const themeStyles = isDark
    ? {
        backgroundColor: isSuccess ? '#064e3b' : isInfo ? '#0c4a6e' : '#450a0a',
        color: isSuccess ? '#ecfdf5' : isInfo ? '#f0f9ff' : '#fef2f2',
        border: isSuccess ? '1.5px solid #059669' : isInfo ? '1.5px solid #0284c7' : '1.5px solid #b91c1c',
        borderLeft: isSuccess ? '5px solid #34d399' : isInfo ? '5px solid #38bdf8' : '5px solid #ef4444',
        iconColor: isSuccess ? '#34d399' : isInfo ? '#38bdf8' : '#f87171',
        boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.6), 0 0 15px rgba(56, 189, 248, 0.15)'
      }
    : {
        backgroundColor: isSuccess ? '#ecfdf5' : isInfo ? '#f0f9ff' : '#fee2e2',
        color: isSuccess ? '#065f46' : isInfo ? '#075985' : '#991b1b',
        border: isSuccess ? '1.5px solid #34d399' : isInfo ? '1.5px solid #38bdf8' : '1.5px solid #f87171',
        borderLeft: isSuccess ? '5px solid #059669' : isInfo ? '5px solid #0284c7' : '5px solid #dc2626',
        iconColor: isSuccess ? '#059669' : isInfo ? '#0284c7' : '#dc2626',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.15)'
      };

  return (
    <div 
      className="fixed max-w-sm w-full animate-fade-slide-in"
      style={{ 
        position: 'fixed',
        top: '24px', 
        right: '24px', 
        zIndex: 99999999, 
        pointerEvents: 'auto', 
        animation: 'fadeSlideIn 0.25s ease-out forwards' 
      }}
    >
      <div
        className="flex items-start gap-3 p-3.5 rounded-xl shadow-xl transition-all backdrop-blur-md"
        style={{
          backgroundColor: themeStyles.backgroundColor,
          color: themeStyles.color,
          border: themeStyles.border,
          borderLeft: themeStyles.borderLeft,
          boxShadow: themeStyles.boxShadow
        }}
      >
        <div 
          className="mt-0.5 flex-shrink-0 text-lg" 
          style={{ color: themeStyles.iconColor }}
        >
          {isSuccess ? (
            <FaCheckCircle />
          ) : isInfo ? (
            <FaInfoCircle />
          ) : (
            <FaExclamationCircle />
          )}
        </div>
        <div 
          className="flex-1 text-xs font-semibold leading-relaxed" 
          style={{ color: themeStyles.color }}
        >
          {message}
        </div>
        <button
          onClick={onClose}
          style={{ 
            color: themeStyles.color, 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer' 
          }}
          className="hover:opacity-70 transition-opacity text-base leading-none p-0.5"
          aria-label="Close notification"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default Toast; 