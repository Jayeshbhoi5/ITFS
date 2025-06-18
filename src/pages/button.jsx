export function Button({ children, className = "", ...props }) {
    return (
      <button
        className={`px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
  