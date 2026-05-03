import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-close after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className="fixed top-5 right-5 z-50">
      <div
        className={`flex items-center gap-4 p-4 rounded-lg shadow-lg text-white ${
          isSuccess ? 'bg-green-500' : 'bg-red-500'
        }`}
      >
        {isSuccess ? (
          <FaCheckCircle className="h-6 w-6" />
        ) : (
          <FaExclamationCircle className="h-6 w-6" />
        )}
        <p className="font-semibold">{message}</p>
      </div>
    </div>
  );
};

export default Toast; 