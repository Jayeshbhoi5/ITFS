import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { app } from "../firebaseConfig";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useUserSession } from "../UserSessionContext";

const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const HOD_EMAILS = {
  "hod.instru@kbtcoe.org": "Instrumentation and Control Engineering",
  "hod.civil@kbtcoe.org": "Civil Engineering",
  "hod.mech@kbtcoe.org": "Mechanical Engineering",
  "hod.comp@kbtcoe.org": "Computer Engineering",
  "hod.it@kbtcoe.org": "Information Technology",
 "innovativeteachingfeedback@gmail.com": "Computer Engineering",
"hod.entc@kbtcoe.org":"Electronics and Telecommunication Engineering",
"hod.entc@kbtcoe.org":"Electronics and Telecommunication Engineering",

"hod.aids@kbtcoe.org":"Artificial Intelligence and Data Science Engineering",

  "hod.mba@kbtcoe.org": "MBA"
  
};

const SignupPage = ({ onClose, toggleLogin }) => {
  const navigate = useNavigate();
  const { setUser } = useUserSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const createUser = async () => {
    if (!name || !email || !password || !role) {
      setError("Please fill in all fields");
      return;
    }

    const emailLower = email.toLowerCase();
    // Enforce organization email for all roles, except the special email
    if (!emailLower.endsWith("@kbtcoe.org") && emailLower !== "innovativeteachingfeedback@gmail.com") {
      setError("Please use your organization email ending with @kbtcoe.org to access this website.");
      return;
    }
    
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
        createdAt: new Date(),
        displayName: name // Add this line

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
      const userEmail = user.email.toLowerCase();
      // Enforce organization email for Google sign-in, except the special email
      if (!userEmail.endsWith("@kbtcoe.org") && userEmail !== "innovativeteachingfeedback@gmail.com") {
        setError("Please use your organization email ending with @kbtcoe.org to access this website.");
        await auth.signOut();
        setLoading(false);
        return;
      }
      const isHod = HOD_EMAILS.hasOwnProperty(userEmail);
      
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const existingData = userDoc.data();
        if (isHod && (existingData.role !== 'HOD' || existingData.department !== HOD_EMAILS[userEmail])) {
          await updateDoc(userDocRef, {
            role: "HOD",
            department: HOD_EMAILS[userEmail],
            primaryDepartment: HOD_EMAILS[userEmail],
          });
        }
      } else {
        let role = isHod ? "HOD" : (userEmail.endsWith("@kbtcoe.org") && (userEmail.startsWith('kbtug') || userEmail.startsWith('stkbtcoe'))) ? "Student" : "Faculty";
        
        const newUserDoc = {
          name: user.displayName,
          email: user.email,
          role: role,
          createdAt: new Date(),
        };

        if (role === 'HOD') {
          newUserDoc.department = HOD_EMAILS[userEmail];
          newUserDoc.primaryDepartment = HOD_EMAILS[userEmail];
        }
        await setDoc(userDocRef, newUserDoc);
      }

      // Re-fetch the definitive user data and update the session
      const finalUserDoc = await getDoc(userDocRef);
      if (finalUserDoc.exists()) {
        setUser({
          uid: user.uid,
          email: user.email,
          ...finalUserDoc.data()
        });
      }
      
      navigate("/dashboard");

    } catch (error) {
      console.error("Google Sign-In error:", error);
      setError("Google Sign-In failed. Please try again.");
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
        className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold rounded-lg py-0.5 px-4 hover:bg-gray-50 transition duration-200 mb-4 border border-gray-300 shadow-sm"
      >
        <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        <span>Sign up with Google</span>
      </button>
      
      {/* Divider */}
      <div className="relative flex items-center py-0.5 mb-1">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="mx-3 text-gray-500 text-xs">or</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
      {/* Form fields */}
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); createUser(); }}>
        <div>
          <label className="block text-gray-600 text-sm font-semibold mb-1">Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-0.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
        </div>
        
        <div>
          <label className="block text-gray-600 text-sm font-semibold mb-1">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-0.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
        </div>
        
        <div className="relative">
          <label className="block text-gray-600 text-sm font-semibold mb-1">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-0.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 bg-transparent border-none focus:outline-none"
            style={{ top: '22px' }}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        
        <div>
          <label className="block text-gray-600 text-sm font-semibold mb-1">Role</label>
          <select
            onChange={(e) => setRole(e.target.value)}
            value={role}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-0.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          >
            <option value="" disabled>Select your role</option>
            <option value="Faculty">Faculty</option>
            <option value="Student">Student</option>
          </select>
        </div>
        
        <div className="pt-2">
        <button
            type="submit"
          disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-transform duration-200 shadow-md disabled:bg-blue-400"
        >
            {loading ? "Creating Account..." : "SIGN UP"}
        </button>
      </div>
      </form>
      
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