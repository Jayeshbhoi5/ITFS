import React, { useState, useEffect } from "react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

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
    <div className={`afm-root w-full h-full flex flex-col justify-center ${mounted ? "afm-mounted" : ""}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        .afm-root { font-family: 'Inter', system-ui, sans-serif; }
        .afm-heading { font-family: 'Outfit', 'Inter', system-ui, sans-serif; letter-spacing: -0.01em; }

        .afm-field {
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.45s ease, transform 0.45s ease;
        }
        .afm-mounted .afm-field { opacity: 1; transform: translateY(0); }
        .afm-mounted .afm-field.d1 { transition-delay: 0.03s; }
        .afm-mounted .afm-field.d2 { transition-delay: 0.07s; }
        .afm-mounted .afm-field.d3 { transition-delay: 0.11s; }
        .afm-mounted .afm-field.d4 { transition-delay: 0.15s; }
        .afm-mounted .afm-field.d5 { transition-delay: 0.19s; }
        .afm-mounted .afm-field.d6 { transition-delay: 0.23s; }

        .afm-input {
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 197, 224, 0.55);
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
        }
        .afm-input:focus {
          outline: none;
          border-color: #0ea5e9;
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15);
        }

        .afm-btn-primary {
          background: linear-gradient(135deg, #0284c7, #075985);
          box-shadow: 0 10px 22px rgba(7, 89, 133, 0.4);
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .afm-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #0369a1, #0c4a6e);
          transform: translateY(-1px);
          box-shadow: 0 14px 26px rgba(12, 74, 110, 0.5);
        }
        .afm-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .afm-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

        .afm-btn-google {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 197, 224, 0.6);
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .afm-btn-google:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(56, 189, 248, 0.25);
        }
        .afm-btn-google:disabled { opacity: 0.7; cursor: not-allowed; }

        .afm-link {
          position: relative;
          transition: color 0.2s ease;
        }
        .afm-link::after {
          content: '';
          position: absolute;
          left: 0; bottom: -2px;
          width: 0%; height: 1.5px;
          background: currentColor;
          transition: width 0.25s ease;
        }
        .afm-link:hover::after { width: 100%; }

        .afm-error {
          animation: afm-shake 0.4s ease;
        }
        @keyframes afm-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .afm-field { transition: none !important; opacity: 1 !important; transform: none !important; }
          .afm-error { animation: none !important; }
        }
      `}</style>

      {error && (
        <div className="afm-error bg-red-50/80 backdrop-blur-sm text-red-700 p-2 rounded-lg mb-2 text-xs border border-red-200/70">
          {error}
        </div>
      )}

      {/* Google button */}
      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="afm-btn-google afm-field d1 w-full flex items-center justify-center gap-3 text-sky-800 font-semibold rounded-xl py-2 px-4 mb-3"
      >
        <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Sign up with Google</span>
      </button>

      {/* Divider */}
      <div className="afm-field d2 relative flex items-center mb-3">
        <div className="flex-grow border-t border-sky-200"></div>
        <span className="mx-3 text-sky-500 text-xs">or</span>
        <div className="flex-grow border-t border-sky-200"></div>
      </div>

      {/* Form fields */}
      <form className="space-y-2.5" onSubmit={(e) => { e.preventDefault(); createUser(); }}>
        <div className="afm-field d3">
          <label className="block text-sky-800 text-xs font-semibold mb-1">Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="afm-input w-full rounded-lg px-3.5 py-2 text-sm text-sky-900 placeholder-sky-400"
          />
        </div>

        <div className="afm-field d4">
          <label className="block text-sky-800 text-xs font-semibold mb-1">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="afm-input w-full rounded-lg px-3.5 py-2 text-sm text-sky-900 placeholder-sky-400"
          />
        </div>

        <div className="afm-field d5 relative">
          <label className="block text-sky-800 text-xs font-semibold mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="afm-input w-full rounded-lg px-3.5 py-2 pr-10 text-sm text-sky-900 placeholder-sky-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sky-500 hover:text-sky-700 bg-transparent border-none focus:outline-none transition-colors"
            >
              {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
            </button>
          </div>
        </div>

        <div className="afm-field d6">
          <label className="block text-sky-800 text-xs font-semibold mb-1">Role</label>
          <select
            onChange={(e) => setRole(e.target.value)}
            value={role}
            className="afm-input w-full rounded-lg px-3.5 py-2 text-sm text-sky-900"
          >
            <option value="" disabled>Select your role</option>
            <option value="Faculty">Faculty</option>
            <option value="Student">Student</option>
          </select>
        </div>

        <div className="afm-field d6 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="afm-btn-primary w-full text-white font-semibold py-2.5 rounded-xl"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </div>
      </form>

      {/* Login link */}
      <div className="afm-field d6 mt-2.5 text-center">
        <p className="text-sky-800/70 text-xs">
          Already have an account?{" "}
          <span onClick={toggleLogin} className="afm-link text-sky-600 hover:text-sky-700 cursor-pointer font-semibold">
            Log In
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;