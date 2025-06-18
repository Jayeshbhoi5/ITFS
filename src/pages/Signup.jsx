import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "../firebaseConfig";
import { FaGoogle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const SignupPage = ({ onClose, toggleLogin }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const createUser = async () => {
    if (!name || !email || !password || !role) {
      setError("Please fill in all fields");
      return;
    }

    const emailLower = email.toLowerCase();
    
    // Validate student email format
    if (role === "Student") {
      if (!emailLower.endsWith("@kbtcoe.org")) {
        setError("Student email must end with @kbtcoe.org");
        return;
      }
      
      const emailPrefix = emailLower.split("@")[0];
      if (!emailPrefix.startsWith("kbtug") && !emailPrefix.startsWith("stkbtcoe")) {
        setError("Student email must start with 'kbtug' or 'stkbtcoe'");
        return;
      }
    }
    
    setLoading(true);
    setError("");
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role,
        createdAt: new Date()
      });

      alert("Account created successfully!");
      toggleLogin(); // Switch to login modal
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Determine role based on email prefix and domain
      const email = user.email.toLowerCase();
      const isValidStudentEmail = email.endsWith("@kbtcoe.org") && 
        (email.startsWith('kbtug') || email.startsWith('stkbtcoe'));
      const role = isValidStudentEmail ? "Student" : "Faculty";

      // Check if user already exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // New user - save to database
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName,
          email: user.email,
          role: role,
          createdAt: new Date()
        });
      }

      // Navigate based on role
      if (isValidStudentEmail) {
        navigate("/studentdashboard");
      } else {
        navigate("/facultydashboard");
      }

    } catch (error) {
      setError("Google Sign-In failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[400px] overflow-y-auto px-2">
      {error && <div className="bg-red-100 text-red-700 p-1 rounded mb-1.5 text-xs border border-red-200">{error}</div>}
      
      {/* Google button */}
      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-1.5 bg-white text-gray-700 rounded-full py-0.5 px-3 hover:bg-gray-50 transition duration-200 mb-1 text-xs border border-blue-200 shadow-sm"
      >
        <div className="flex items-center justify-center">
          <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>
        <span>Sign up with Google</span>
      </button>
      
      {/* Divider */}
      <div className="relative flex items-center py-0.5 mb-1">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="mx-3 text-gray-500 text-xs">or</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
      {/* Form fields */}
      <div className="space-y-1">
        <div className="mb-1">
          <label className="block text-gray-700 text-xs font-medium">Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          />
        </div>
        
        <div className="mb-1">
          <label className="block text-gray-700 text-xs font-medium">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          />
        </div>
        
        <div className="mb-1">
          <label className="block text-gray-700 text-xs font-medium">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          />
        </div>
        
        <div className="mb-1.5">
          <label className="block text-gray-700 text-xs font-medium">Role</label>
          <select
            onChange={(e) => setRole(e.target.value)}
            value={role}
            className="w-full bg-white border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          >
            <option value="">Select Role</option>
            <option value="Admin">Admin</option>
            <option value="Faculty">Faculty</option>
            <option value="Student">Student</option>
          </select>
        </div>
        
        <button
          onClick={createUser}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-1 rounded hover:bg-blue-700 transition duration-300 text-sm"
        >
          {loading ? "Creating account..." : "SIGN UP"}
        </button>
      </div>
      
      {/* Login link */}
      <div className="mt-1.5 text-center">
        <p className="text-gray-600 text-xs">
          Already have an account? <span onClick={toggleLogin} className="text-blue-600 hover:text-blue-800 cursor-pointer">Log In</span>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;