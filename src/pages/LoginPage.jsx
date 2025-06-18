import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../firebaseConfig";

const auth = getAuth(app);
const db = getFirestore(app);

const LoginPage = ({ toggleSignup, onClose, toggleForgotPassword }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginUser = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setError("");
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        setError("User profile not found");
        return;
      }

      const userData = userDoc.data();
      const userEmail = userData.email.toLowerCase();
      
      // Validate student email format
      if (userData.role === "Student") {
        if (!userEmail.endsWith("@kbtcoe.org")) {
          setError("Invalid student email format");
          return;
        }
        
        const emailPrefix = userEmail.split("@")[0];
        if (!emailPrefix.startsWith("kbtug") && !emailPrefix.startsWith("stkbtcoe")) {
          setError("Invalid student email format");
          return;
        }
      }
      
      // Navigate based on role and email format
      const isValidStudentEmail = userEmail.endsWith("@kbtcoe.org") && 
        (userEmail.startsWith('kbtug') || userEmail.startsWith('stkbtcoe'));
        
      if (isValidStudentEmail) {
        navigate("/studentdashboard");
      } else {
        navigate("/facultydashboard");
      }
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[400px] overflow-y-auto px-2">
      {error && <div className="bg-red-100 text-red-700 p-1 rounded mb-1.5 text-xs border border-red-200">{error}</div>}
      
      {/* Form fields */}
      <div className="space-y-2">
        <div className="mb-2">
          <label className="block text-gray-700 text-xs font-medium">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            required
          />
        </div>
        
        <div className="mb-2">
          <label className="block text-gray-700 text-xs font-medium">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            required
          />
        </div>
        
        <button
          onClick={loginUser}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-1 rounded hover:bg-blue-700 transition duration-300 text-sm"
        >
          {loading ? "Logging in..." : "LOG IN"}
        </button>
      </div>
      
      <div className="mt-2 text-center">
        <p className="text-blue-600 hover:text-blue-800 text-xs">
          <span onClick={toggleForgotPassword} className="cursor-pointer">Forgot Password?</span>
        </p>
      </div>
      
      {/* Signup link */}
      <div className="mt-2 text-center">
        <p className="text-gray-600 text-xs">
          Don't have an account? <span onClick={toggleSignup} className="text-blue-600 hover:text-blue-800 cursor-pointer">Create Account</span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;