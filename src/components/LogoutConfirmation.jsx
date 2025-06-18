import React from 'react';
import { FaSignOutAlt } from 'react-icons/fa';

const LogoutConfirmation = ({ isOpen, onClose, onConfirm, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className={`relative z-50 w-full max-w-md mx-4 p-6 rounded-lg shadow-xl ${
        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
      }`}>
        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            darkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <FaSignOutAlt className="text-3xl text-red-500" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Logout Confirmation</h2>
          <p className={`text-center mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Are you sure you want to logout?
          </p>

          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmation; 