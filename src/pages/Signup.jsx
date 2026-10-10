import React, { useState, useEffect } from "react";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile, sendEmailVerification, updatePassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { app } from "../firebaseConfig";
import { FaGoogle, FaEye, FaEyeSlash, FaCheckCircle, FaSpinner, FaRedo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useUserSession } from "../UserSessionContext";
import { validateSignupInput, validateCollegeEmail, HOD_EMAILS } from "../utils/emailValidation";
import Toast from "../components/Toast";
import { getActionCodeSettings } from "../utils/authConfig";

const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const SignupPage = ({ onClose, toggleLogin }) => {
  const navigate = useNavigate();
  const { setUser } = useUserSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Inline verification states
  // 'unverified' | 'sending' | 'sent' | 'checking' | 'verified'
  const [emailVerifyStatus, setEmailVerifyStatus] = useState('unverified');
  const [createdUserRef, setCreatedUserRef] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Toast notification state: { show: boolean, message: string, type: 'error' | 'success' | 'info' }
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });

  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  // Cooldown countdown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Reset verify status if email changed
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailVerifyStatus !== 'unverified') {
      setEmailVerifyStatus('unverified');
      setCreatedUserRef(null);
    }
  };

  // Auto-check verification status while status is 'sent' or 'checking'
  useEffect(() => {
    if (emailVerifyStatus !== 'sent' && emailVerifyStatus !== 'checking') return;

    let isMounted = true;

    const checkVerification = async () => {
      try {
        const user = auth.currentUser || createdUserRef;
        if (!user) return;

        // Ensure user matches the typed email
        if (user.email && user.email.toLowerCase() !== email.trim().toLowerCase()) {
          return;
        }

        await user.reload();
        if (user.emailVerified && isMounted) {
          setEmailVerifyStatus('verified');
          showToast("Email verified successfully! You can now complete your sign up.", "success");
        }
      } catch (e) {
        console.warn("Auto-check verification error:", e);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(checkVerification, 2000);

    // Also check immediately when user switches back to this tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVerification();
      }
    };
    const handleFocus = () => {
      checkVerification();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [emailVerifyStatus, createdUserRef, email]);

  // Inline "Verify" / Send Verification Email handler
  const handleInlineSendVerification = async () => {
    if (!email || !email.trim()) {
      showToast("Please enter your email address first");
      return;
    }

    const emailCheck = validateCollegeEmail(email, role);
    if (!emailCheck.isValid) {
      showToast(emailCheck.error);
      return;
    }

    setEmailVerifyStatus('sending');

    try {
      // Temporary password if user hasn't typed one yet, or use user's password
      const tempPassword = password && password.length >= 6 ? password : "TempPassword@123";
      
      let user = auth.currentUser;
      // If we don't have a current user matching this email, create or authenticate
      if (!user || user.email?.toLowerCase() !== email.trim().toLowerCase()) {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email.trim(), tempPassword);
          user = userCred.user;
          setCreatedUserRef(user);
        } catch (authErr) {
          if (authErr.code === 'auth/email-already-in-use') {
            // Attempt to sign in to existing unverified user with temp password or typed password
            try {
              const signinCred = await signInWithEmailAndPassword(auth, email.trim(), tempPassword);
              user = signinCred.user;
              setCreatedUserRef(user);
            } catch (loginErr) {
              try {
                const fallbackCred = await signInWithEmailAndPassword(auth, email.trim(), "TempPassword@123");
                user = fallbackCred.user;
                setCreatedUserRef(user);
              } catch (fallbackErr) {
                showToast("This email already has an account. Please log in instead.");
                setEmailVerifyStatus('unverified');
                return;
              }
            }
          } else {
            throw authErr;
          }
        }
      }

      // Check if already verified
      await user.reload();
      if (user.emailVerified) {
        setEmailVerifyStatus('verified');
        showToast("Email verified successfully! You can now complete your sign up.", "success");
        return;
      }

      // Send verification email
      const actionCodeSettings = getActionCodeSettings('/verify-email');

      try {
        await sendEmailVerification(user, actionCodeSettings);
      } catch (sendErr) {
        await sendEmailVerification(user);
      }

      setEmailVerifyStatus('sent');
      setResendCooldown(60);
      showToast(`Verification email sent to ${email.trim()}! Please verify the link.`, "success");
    } catch (err) {
      console.error("Verification email error:", err);
      showToast(err.message || "Failed to send verification email. Please try again.");
      setEmailVerifyStatus('unverified');
    }
  };

  // Check verification status inline ("Check" button)
  const handleCheckInlineVerification = async () => {
    setEmailVerifyStatus('checking');

    try {
      const user = auth.currentUser || createdUserRef;
      if (!user) {
        showToast("Please click 'Verify' to send a verification link first.");
        setEmailVerifyStatus('unverified');
        return;
      }

      await user.reload();

      if (user.emailVerified) {
        setEmailVerifyStatus('verified');
        showToast("Email verified successfully! You can now complete your sign up.", "success");
      } else {
        setEmailVerifyStatus('sent');
        showToast("Email not verified yet. Please open the link received in your inbox.", "info");
      }
    } catch (err) {
      console.error("Check status error:", err);
      showToast(err.message || "Error checking verification status.");
      setEmailVerifyStatus('sent');
    }
  };

  const createUser = async () => {
    // Validate all inputs
    const validation = validateSignupInput({
      name,
      email,
      password,
      confirmPassword,
      role
    });

    if (!validation.isValid) {
      showToast(validation.error);
      return;
    }

    // Require email verification
    const currentUser = auth.currentUser || createdUserRef;
    if (currentUser) {
      await currentUser.reload();
    }

    const isVerified = currentUser && currentUser.emailVerified;

    if (emailVerifyStatus !== 'verified' && !isVerified) {
      showToast("Please verify your email address before creating your account.");
      return;
    }

    setLoading(true);

    try {
      let user = currentUser;

      // Ensure chosen password is set on the account
      if (password && password.length >= 6) {
        try {
          await updatePassword(user, password.trim());
        } catch (pwErr) {
          console.warn("Could not update auth password in createUser:", pwErr);
        }
      }

      // Update display name
      try {
        await updateProfile(user, { displayName: name.trim() });
      } catch (pErr) {
        console.warn("Could not update displayName:", pErr);
      }

      // Save user in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        email: email.trim(),
        role: role,
        createdAt: new Date(),
        displayName: name.trim()
      });

      // Save auth_status as hasPassword: true
      try {
        await setDoc(doc(db, "auth_status", email.trim().toLowerCase()), {
          email: email.trim().toLowerCase(),
          hasPassword: true,
          authProvider: 'manual',
          updatedAt: new Date()
        }, { merge: true });
      } catch (statusErr) {
        console.warn("Could not save auth_status in manual signup:", statusErr);
      }

      localStorage.setItem(`has_password_${email.trim().toLowerCase()}`, 'true');
      localStorage.setItem(`google_only_${email.trim().toLowerCase()}`, 'false');

      showToast("Account created and verified successfully!", "success");

      setTimeout(() => {
        toggleLogin(); // Switch to login modal
      }, 1000);
    } catch (error) {
      console.error("Signup error:", error);
      showToast(error.message || "Failed to finalize account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userEmail = (user.email || "").toLowerCase();
      // Enforce organization email for Google sign-in, except the special email
      if (
        !userEmail.endsWith("@kbtcoe.org") &&
        userEmail !== "innovativeteachingfeedback@gmail.com" &&
        userEmail !== "jwj475.mail@gmail.com"
      ) {
        showToast("Please use a valid college email address to access this website.");
        await auth.signOut();
        setLoading(false);
        return;
      }
      const isHod = HOD_EMAILS.hasOwnProperty(userEmail);

      let userDocRef = doc(db, "users", user.uid);
      let userDoc = null;
      try {
        userDoc = await getDoc(userDocRef);
      } catch (getErr) {
        console.warn("Could not get user doc by uid:", getErr);
      }

      // If document by user.uid not found, try to find existing account or create new one
      if (!userDoc || !userDoc.exists()) {
        let existingData = null;
        try {
          const q = query(collection(db, "users"), where("email", "==", user.email));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            existingData = qSnap.docs[0].data();
          }
        } catch (queryErr) {
          console.warn("Email lookup query skipped (security rules or index):", queryErr);
        }

        let determinedRole = existingData?.role;
        if (!determinedRole) {
          if (isHod) {
            determinedRole = "HOD";
          } else if (userEmail.endsWith("@kbtcoe.org")) {
            determinedRole = (userEmail.startsWith('kbtug') || userEmail.startsWith('stkbtcoe')) ? "Student" : "Faculty";
          } else {
            determinedRole = role || "Student";
          }

        
        }

        const resolvedName = user.displayName || existingData?.name || userEmail.split('@')[0] || "User";

        const newUserDoc = {
          name: resolvedName,
          displayName: resolvedName,
          email: user.email,
          role: determinedRole,
          isGoogleUser: true,
          authProvider: 'google',
          createdAt: existingData?.createdAt || new Date(),
          updatedAt: new Date()
        };

        if (determinedRole === 'HOD') {
          newUserDoc.department = HOD_EMAILS[userEmail] || "";
          newUserDoc.primaryDepartment = HOD_EMAILS[userEmail] || "";
        }

        await setDoc(userDocRef, newUserDoc, { merge: true });
        userDoc = await getDoc(userDocRef);
      }

      // If user exists, ALWAYS adopt name fetched from Google (replacing manual signup name)
      if (userDoc && userDoc.exists()) {
        const existingData = userDoc.data();
        const updatePayload = {};

        if (user.displayName && existingData.name !== user.displayName) {
          updatePayload.name = user.displayName;
          updatePayload.displayName = user.displayName;
        }

        // When a user logs in with Google, always mark them as Google user so name is locked
        if (!existingData.isGoogleUser || existingData.authProvider !== 'google') {
          updatePayload.isGoogleUser = true;
          updatePayload.authProvider = 'google';
        }

        if (isHod && (existingData.role !== 'HOD' || existingData.department !== HOD_EMAILS[userEmail])) {
          updatePayload.role = "HOD";
          updatePayload.department = HOD_EMAILS[userEmail] || "";
          updatePayload.primaryDepartment = HOD_EMAILS[userEmail] || "";
        }

        if (Object.keys(updatePayload).length > 0) {
          try {
            await updateDoc(userDocRef, updatePayload);
          } catch (uErr) {
            console.warn("Could not update user doc:", uErr);
          }
        }

        // Also update Auth profile displayName
        if (user.displayName) {
          try {
            await updateProfile(user, { displayName: user.displayName });
          } catch (pErr) {
            console.warn("Could not update auth profile displayName:", pErr);
          }
        }
      }

      // Re-fetch the definitive user data and update the session
      let userData = {};
      try {
        const finalUserDoc = await getDoc(userDocRef);
        if (finalUserDoc.exists()) {
          userData = finalUserDoc.data();
        }
      } catch (fErr) {
        console.warn("Could not fetch final user doc:", fErr);
      }
      
      const rawRole = userData.role || (role || 'Student');
      const normalizedRole = rawRole.toLowerCase() === 'hod' ? 'HOD' :
                             rawRole.toLowerCase() === 'faculty' ? 'Faculty' : 'Student';

      const finalName = user.displayName || userData.name || userEmail.split('@')[0] || "User";

      setUser({
        uid: user.uid,
        email: user.email,
        emailVerified: true,
        isGoogleUser: true,
        ...userData,
        role: normalizedRole,
        name: finalName,
        displayName: finalName
      });

      // Check if user currently has a password linked in Firebase Auth
      const hasPasswordLinked = Boolean(user.providerData && user.providerData.some(p => p.providerId === 'password'));

      // Always synchronize Firestore auth_status and localStorage with the real Firebase provider state
      try {
        const authStatusRef = doc(db, "auth_status", userEmail);
        await setDoc(authStatusRef, {
          email: userEmail,
          hasPassword: hasPasswordLinked,
          authProvider: 'google',
          updatedAt: new Date()
        });
      } catch (authStatusErr) {
        console.warn("Could not save auth_status in Google signup:", authStatusErr);
      }

      localStorage.setItem(`google_user_${userEmail}`, 'true');
      localStorage.setItem(`google_only_${userEmail}`, hasPasswordLinked ? 'false' : 'true');
      localStorage.setItem(`has_password_${userEmail}`, hasPasswordLinked ? 'true' : 'false');
      sessionStorage.removeItem('itfs_student_academic_year_filter');
      sessionStorage.removeItem('itfs_student_class_name_filter');
      sessionStorage.removeItem('itfs_student_filter_is_manual');
      sessionStorage.removeItem('itfs_student_filter_uid');

      const welcomeDisplayName = finalName || user.displayName || 'User';
      sessionStorage.setItem('pending_welcome_toast', JSON.stringify({
        name: welcomeDisplayName,
        role: normalizedRole,
        timestamp: Date.now()
      }));
      window.dispatchEvent(new CustomEvent('auth_welcome_toast', {
        detail: { name: welcomeDisplayName, role: normalizedRole }
      }));

      if (onClose) {
        onClose();
      }

      if (normalizedRole === 'HOD') {
        navigate("/hod-dashboard");
      } else if (normalizedRole === 'Faculty') {
        navigate("/faculty-dashboard");
      } else {
        navigate("/student-dashboard");
      }

    } catch (error) {
      console.error("Google Sign-In error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      showToast(error.message || "Google Sign-In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className={`afm-root w-full flex flex-col ${mounted ? "afm-mounted" : ""}`}>
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
        .afm-input:-webkit-autofill,
        .afm-input:-webkit-autofill:hover,
        .afm-input:-webkit-autofill:focus,
        .afm-input:-webkit-autofill:active {
          -webkit-text-fill-color: #0c4a6e !important;
          -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
          box-shadow: 0 0 0px 1000px #ffffff inset !important;
          border-color: rgba(148, 197, 224, 0.75) !important;
          caret-color: #0284c7 !important;
          transition: background-color 5000s ease-in-out 0s;
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

        /* White scrollbar */
        .afm-white-scroll {
          scrollbar-width: thin !important;
          scrollbar-color: #ffffff rgba(14, 165, 233, 0.08) !important;
          scroll-behavior: smooth;
          overscroll-behavior: contain;
        }
        .afm-white-scroll::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
          display: block !important;
        }
        .afm-white-scroll::-webkit-scrollbar-track {
          background: rgba(14, 165, 233, 0.05) !important;
          border-radius: 9999px !important;
          margin: 6px 0 !important;
        }
        .afm-white-scroll::-webkit-scrollbar-thumb {
          background: #ffffff !important;
          border-radius: 9999px !important;
          border: 1.5px solid rgba(148, 163, 184, 0.4) !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16) !important;
          cursor: pointer !important;
        }
        .afm-white-scroll::-webkit-scrollbar-thumb:hover {
          background: #f8fafc !important;
          border-color: rgba(100, 116, 139, 0.6) !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .afm-field { transition: none !important; opacity: 1 !important; transform: none !important; }
          .afm-error { animation: none !important; }
        }
      `}</style>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: "", type: "error" })}
        />
      )}

      {/* Google button */}
      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="afm-btn-google afm-field d1 w-full flex items-center justify-center gap-3 text-sky-800 font-semibold rounded-xl py-2 px-4 mb-2 mt-7 text-xs md:text-sm"
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
      <div className="afm-field d2 relative flex items-center mb-2">
        <div className="flex-grow border-t border-sky-200"></div>
        <span className="mx-3 text-sky-500 text-xs">or</span>
        <div className="flex-grow border-t border-sky-200"></div>
      </div>

      {/* Form fields */}
      <form noValidate className="space-y-2" onSubmit={(e) => { e.preventDefault(); createUser(); }}>
        <div className="afm-field d3">
          <label className="block text-sky-800 text-xs font-semibold mb-1">Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ minHeight: '42px' }}
            className="afm-input w-full rounded-xl px-3.5 py-2.5 text-sm text-sky-900 placeholder-sky-400"
          />
        </div>

        {/* Email with Inline Verify Button on the Right */}
        <div className="afm-field d4">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sky-800 text-xs font-semibold">Email</label>
            {emailVerifyStatus === 'verified' && (
              <span className="flex items-center text-xs text-emerald-700 font-semibold gap-1">
                <FaCheckCircle className="text-emerald-500 text-xs" />
                <span>Email verified successfully.</span>
              </span>
            )}
            {(emailVerifyStatus === 'sent' || emailVerifyStatus === 'checking' || emailVerifyStatus === 'sending') && (
              <div className="flex items-center gap-1.5 text-xs text-sky-800">
                <span className="text-sky-700 text-xs font-medium">Link sent</span>
                <span className="text-sky-300">·</span>
                <button
                  type="button"
                  onClick={handleInlineSendVerification}
                  disabled={resendCooldown > 0}
                  className="text-xs text-sky-700 hover:text-sky-900 font-semibold underline flex items-center gap-0.5 disabled:opacity-60"
                >
                  <FaRedo className="text-[10px]" />
                  <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend"}</span>
                </button>
              </div>
            )}
          </div>
          <div className="relative flex items-center">
            <input
              type="email"
              placeholder="Enter your college email"
              value={email}
              onChange={handleEmailChange}
              disabled={emailVerifyStatus === 'verified'}
              style={{ minHeight: '42px' }}
              className="afm-input w-full rounded-xl px-3.5 py-2.5 pr-24 text-sm text-sky-900 placeholder-sky-400 disabled:bg-emerald-50/50"
            />

            {/* Inline Verify Button / Status Tab */}
            <div className="absolute right-2 flex items-center">
              {emailVerifyStatus === 'verified' ? (
                <div 
                  className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm"
                  style={{ backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #7dd3fc' }}
                >
                  <FaCheckCircle className="text-emerald-500 text-sm" />
                  <span>Verified</span>
                </div>
              ) : (emailVerifyStatus === 'sending' || emailVerifyStatus === 'checking' || emailVerifyStatus === 'sent') ? (
                <div
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm"
                  style={{ backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #7dd3fc' }}
                  title="Verification in progress. Checking automatically..."
                >
                  <FaSpinner className="animate-spin text-sky-600 text-xs" />
                  <span>Verifying...</span>
                </div>
              ) : (email && email.trim().length > 0) ? (
                <button
                  type="button"
                  onClick={handleInlineSendVerification}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition-all cursor-pointer hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none' }}
                >
                  Verify
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="afm-field d5 relative">
            <label className="block text-sky-800 text-xs font-semibold mb-1">Password</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ minHeight: '42px' }}
                className="afm-input w-full rounded-xl px-3.5 py-2.5 pr-10 text-sm text-sky-900 placeholder-sky-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 pr-3 flex items-center text-sky-500 hover:text-sky-700 bg-transparent border-none focus:outline-none transition-colors"
              >
                {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>

          <div className="afm-field d5 relative">
            <label className="block text-sky-800 text-xs font-semibold mb-1">Confirm Password</label>
            <div className="relative flex items-center">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ minHeight: '42px' }}
                className="afm-input w-full rounded-xl px-3.5 py-2.5 pr-10 text-sm text-sky-900 placeholder-sky-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 pr-3 flex items-center text-sky-500 hover:text-sky-700 bg-transparent border-none focus:outline-none transition-colors"
              >
                {showConfirmPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <div className="afm-field d6">
          <label className="block text-sky-800 text-xs font-semibold mb-1">Role</label>
          <select
            onChange={(e) => setRole(e.target.value)}
            value={role}
            style={{ minHeight: '42px' }}
            className="afm-input w-full rounded-xl px-3.5 py-2.5 text-sm text-sky-900"
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
            className="afm-btn-primary w-full text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #0284c7, #075985)',
              color: '#ffffff',
              boxShadow: '0 10px 22px rgba(7, 89, 133, 0.4)'
            }}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </div>
      </form>

      {/* Login link */}
      <div className="afm-field d6 mt-2 text-center pb-1">
        <p className="text-sky-800/70 text-xs">
          Already have an account?{" "}
          <span 
            onClick={() => {
              if (toggleLogin) toggleLogin();
              else navigate('/');
            }} 
            className="afm-link text-sky-600 hover:text-sky-700 cursor-pointer font-semibold"
          >
            Log In
          </span>
        </p>
      </div>
    </div>
  );

  const isStandalone = !onClose && !toggleLogin;

  useEffect(() => {
    if (isStandalone) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') navigate('/');
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isStandalone, navigate]);

  if (isStandalone) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center p-3 md:p-4 bg-sky-950/60 backdrop-blur-md overflow-y-auto cursor-pointer"
        onClick={(e) => {
          if (e.target === e.currentTarget) navigate('/');
        }}
      >
        <style>{`
          .itf-modal {
            background: rgba(255, 255, 255, 0.98);
            border: 1px solid rgba(224, 242, 254, 0.9);
            box-shadow: 0 35px 80px -15px rgba(3, 105, 161, 0.5), 0 0 0 1px rgba(125, 211, 252, 0.3);
          }
          .itf-modal-caption {
            background: linear-gradient(to top, rgba(3, 25, 41, 0.85) 0%, rgba(3, 25, 41, 0.25) 55%, transparent 100%);
          }
        `}</style>
        <div 
          className="itf-modal rounded-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row shadow-2xl bg-white my-auto cursor-default"
          style={{ width: "900px", height: "600px", maxHeight: "calc(100vh - 1.5rem)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="hidden md:block w-1/2 relative">
            <img src="/8.png" alt="KBTCOE Campus" className="w-full h-full object-cover" loading="eager" decoding="sync" />
            <div className="absolute inset-0 itf-modal-caption" />
            <div className="absolute bottom-5 left-5 right-5">
              <p className="itf-heading text-white text-lg font-semibold">KBTCOE</p>
              <p className="text-white/80 text-sm mt-1">Be part of a transparent feedback community.</p>
            </div>
          </div>
          <div className="w-full md:w-1/2 pl-4 pt-3.5 pb-2.5 pr-1.5 md:pl-5 md:pt-4 md:pb-3 md:pr-2 flex flex-col h-full min-h-0 bg-white">
            <div className="flex items-start justify-between mb-8 shrink-0 pr-2.5 md:pr-3">
              <div className="flex items-center gap-3">
                <img src="/5.png" alt="KBTCOE Logo" className="w-11 h-11 bg-white object-contain p-1 flex-shrink-0" loading="eager" decoding="sync" />
                <div>
                  <h2 className="itf-heading text-xl md:text-2xl font-bold text-sky-900 leading-tight">Create Account</h2>
                  <p className="text-sky-600 text-xs mt-0.5">Sign up with your organization email</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/')} 
                className="text-sky-400 hover:text-sky-700 text-xl bg-transparent leading-none transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto afm-white-scroll pr-2 md:pr-3">
              {formContent}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return formContent;
};

export default SignupPage;