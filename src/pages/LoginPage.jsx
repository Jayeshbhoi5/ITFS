import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../firebaseConfig";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const auth = getAuth(app);
const db = getFirestore(app);

const LoginPage = ({ toggleSignup, onClose, toggleForgotPassword }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginUser = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    // Enforce organization email for login, except the special email
    if (!email.toLowerCase().endsWith("@kbtcoe.org") && email.toLowerCase() !== "innovativeteachingfeedback@gmail.com") {
      setError("Please use your organization email ending with @kbtcoe.org to access this website.");
      return;
    }

    setError("");
    setLoading(true);
    
    try {
      // Check if the user signed up with Google
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods.includes('google.com') && !signInMethods.includes('password')) {
        setError("This account was created using Google. Please use the 'Sign in with Google' button or create a password via 'Forgot Password'.");
        setLoading(false);
        return;
      }

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
        
      if (userData.role === 'Student') {
        navigate("/student-dashboard");
      } else if (userData.role === 'Faculty') {
        navigate("/faculty-dashboard");
      } else if (userData.role === 'HOD') {
        navigate("/hod-dashboard");
      }
      else {
        // Fallback redirection if role is not defined or unexpected
        navigate("/");
      }
    } catch (err) {
      // Avoid showing a generic error if we've already set a specific one
      if (!error) {
      setError("Invalid email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-start">
      {error && <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm border border-red-200 w-full">{error}</div>}
      <div className="flex-1 flex flex-col justify-center">
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); loginUser(); }}>
          <div>
            <label className="block text-gray-600 text-sm font-semibold mb-1">Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            required
          />
        </div>
          <div className="relative">
            <label className="block text-gray-600 text-sm font-semibold mb-1">Password</label>
          <input
              type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            required
          />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 bg-transparent border-none focus:outline-none"
              style={{ top: '28px' }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
        </div>
          <div className="pt-2">
        <button
              type="submit"
          disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-md disabled:bg-blue-400"
        >
          {loading ? "Logging in..." : "LOG IN"}
        </button>
      </div>
        </form>
        <div className="mt-6 text-center">
          <p 
            onClick={toggleForgotPassword} 
            className="text-blue-600 hover:text-blue-700 text-sm cursor-pointer font-semibold"
          >
            Forgot Password?
        </p>
      </div>
        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <span onClick={toggleSignup} className="text-blue-600 hover:text-blue-700 cursor-pointer font-semibold">
              Create Account
            </span>
        </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;