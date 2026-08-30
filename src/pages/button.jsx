import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded font-medium transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
