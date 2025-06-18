import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app } from "../firebaseConfig";

const auth = getAuth(app);

const ForgotPassword = ({ onClose, toggleLogin }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset link has been sent to your email");
      toggleLogin(); // Go back to login page
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[500px] overflow-y-auto px-2">
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm border border-red-200">
          {error}
        </div>
      )}
      
      <div className="space-y-3 mt-3">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <button
          onClick={handleResetPassword}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition duration-300"
        >
          {loading ? "Sending reset link..." : "RESET PASSWORD"}
        </button>

        <div className="mt-3 text-center">
          <p className="text-gray-600 text-sm">
            Remember your password?{" "}
            <span 
              onClick={toggleLogin}
              className="text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Back to Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;