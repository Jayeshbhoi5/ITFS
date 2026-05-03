import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app } from "../firebaseConfig";

const auth = getAuth(app);

const ForgotPassword = ({ onClose, toggleLogin }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link has been sent to your email");
      toggleLogin(); // Go back to login page
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-start">
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm border border-red-200 w-full">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4 text-sm border border-green-200 w-full">
          {message}
        </div>
      )}
      <div className="flex flex-col items-center mt-8 mb-1">
        {!message && (
          <p className="text-gray-600 text-md text-center">
            Enter your email and we'll send you a link to get back into your account.
          </p>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
          <div>
            <label className="block text-gray-600 text-sm font-semibold mb-1">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              required
              disabled={!!message}
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !!message}
              className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-md disabled:bg-blue-400"
            >
              {loading ? "Sending Link..." : "SEND RESET LINK"}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            <span 
              onClick={toggleLogin}
              className="text-blue-600 hover:text-blue-700 cursor-pointer font-semibold"
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