import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, fetchSignInMethodsForEmail, signInWithPopup, GoogleAuthProvider, sendEmailVerification, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { app } from "../firebaseConfig";
import { FaEye, FaEyeSlash, FaEnvelope, FaExclamationCircle, FaCheckCircle, FaSpinner, FaRedo } from "react-icons/fa";
import { validateCollegeEmail, HOD_EMAILS } from "../utils/emailValidation";
import { useUserSession } from "../UserSessionContext";

import Toast from "../components/Toast";
import { getActionCodeSettings } from "../utils/authConfig";

const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const LoginPage = ({ toggleSignup, onClose, toggleForgotPassword }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUserSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Google-only user detection and inline verification state
  const [isGoogleOnly, setIsGoogleOnly] = useState(false);
  const [emailVerifyStatus, setEmailVerifyStatus] = useState('idle'); // 'idle' | 'unverified' | 'sending' | 'sent' | 'checking' | 'verified'
  const [resendCooldown, setResendCooldown] = useState(0);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });

  const formatErrorMessage = (msg) => {
    if (!msg) return "An unexpected error occurred. Please try again.";
    if (typeof msg !== 'string') return String(msg);

    if (msg.includes('auth/invalid-email')) {
      return "Please enter a valid email address.";
    }
    if (msg.includes('auth/user-not-found')) {
      return "No account found with this email address.";
    }
    if (msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
      return "Incorrect email or password. If you signed in with Google, please verify your email to set a password.";
    }
    if (msg.includes('auth/too-many-requests')) {
      return "Too many failed attempts. Please try again later.";
    }
    if (msg.includes('auth/network-request-failed')) {
      return "Network error. Please check your internet connection.";
    }
    return msg.replace(/^Firebase:\s*Error\s*\((.*?)\)\.?/i, (match, p1) => {
      if (p1 === 'auth/invalid-email') return "Please enter a valid email address.";
      if (p1 === 'auth/user-not-found') return "No account found with this email.";
      if (p1 === 'auth/wrong-password' || p1 === 'auth/invalid-credential') return "Incorrect email or password.";
      return p1.replace(/^auth\//, '').replace(/-/g, ' ');
    }).trim();
  };

  const showToast = (message, type = "error") => {
    const formatted = type === 'error' ? formatErrorMessage(message) : message;
    setToast({ show: true, message: formatted, type });
  };

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  // Check if redirected from reset password page with prefilled verified email
  useEffect(() => {
    if (location.state?.verifiedEmail) {
      const vEmail = location.state.verifiedEmail.trim().toLowerCase();
      setEmail(vEmail);
      setIsGoogleOnly(false);
      setEmailVerifyStatus('idle');
      localStorage.setItem(`has_password_${vEmail}`, 'true');
      localStorage.setItem(`google_only_${vEmail}`, 'false');
      showToast("Password set successfully! Enter your password to log in.", "success");
    }
  }, [location.state]);

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Real-time cross-tab signaling: Auto-hide verify button the instant password is set in another tab
  useEffect(() => {
    const handleAuthSignal = (data) => {
      if (data?.type === 'PASSWORD_VERIFIED') {
        const verifiedEmail = (data.email || '').trim().toLowerCase();
        const currentEmail = (email || '').trim().toLowerCase();
        if (!currentEmail || currentEmail === verifiedEmail) {
          if (verifiedEmail && !currentEmail) {
            setEmail(verifiedEmail);
          }
          setIsGoogleOnly(false);
          setEmailVerifyStatus('idle');
          localStorage.setItem(`has_password_${verifiedEmail}`, 'true');
          localStorage.setItem(`google_only_${verifiedEmail}`, 'false');
          showToast("Password set successfully! Enter your password to log in.", "success");
        }
      }
    };

    let bc = null;
    try {
      bc = new BroadcastChannel('itfs_auth');
      bc.onmessage = (event) => {
        handleAuthSignal(event.data);
      };
    } catch (bcErr) {
      console.warn("BroadcastChannel error:", bcErr);
    }

    const handleStorage = (e) => {
      if (e.key === 'password_verified_signal' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleAuthSignal({ type: 'PASSWORD_VERIFIED', email: parsed.email });
        } catch (err) {
          console.warn("Error parsing storage signal:", err);
        }
      }
    };

    const handleFocus = () => {
      if (emailVerifyStatus === 'sent' || emailVerifyStatus === 'checking' || emailVerifyStatus === 'sending') {
        const signal = localStorage.getItem('password_verified_signal');
        if (signal) {
          try {
            const parsed = JSON.parse(signal);
            const currentEmail = (email || '').trim().toLowerCase();
            const signalEmail = (parsed.email || '').trim().toLowerCase();
            if (!currentEmail || currentEmail === signalEmail) {
              if (signalEmail && !currentEmail) {
                setEmail(signalEmail);
              }
              setIsGoogleOnly(false);
              setEmailVerifyStatus('idle');
              localStorage.setItem(`has_password_${signalEmail}`, 'true');
              localStorage.setItem(`google_only_${signalEmail}`, 'false');
              showToast("Password set successfully! Enter your password to log in.", "success");
            }
          } catch (e) {}
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [email, emailVerifyStatus]);

  // Auto-polling: When link is sent, poll every 2 seconds to check if user finished setting password
  useEffect(() => {
    if (emailVerifyStatus !== 'sent' && emailVerifyStatus !== 'checking') return;

    const interval = setInterval(async () => {
      const emailLower = (email || '').trim().toLowerCase();

      // 1. Check localStorage signal from ResetPasswordPage
      const signal = localStorage.getItem('password_verified_signal');
      if (signal) {
        try {
          const parsed = JSON.parse(signal);
          if (!emailLower || emailLower === parsed.email?.toLowerCase()) {
            setIsGoogleOnly(false);
            setEmailVerifyStatus('idle');
            localStorage.setItem(`has_password_${emailLower}`, 'true');
            localStorage.setItem(`google_only_${emailLower}`, 'false');
            showToast("Password set successfully! Enter your password to log in.", "success");
            return;
          }
        } catch (e) {}
      }

      // 2. Check direct localStorage flag
      if (emailLower && localStorage.getItem(`has_password_${emailLower}`) === 'true') {
        setIsGoogleOnly(false);
        setEmailVerifyStatus('idle');
        showToast("Password set successfully! Enter your password to log in.", "success");
        return;
      }

      // 3. Direct Firestore check (in case user reset password in another tab, device or browser)
      try {
        if (emailLower) {
          const authStatusSnap = await getDoc(doc(db, "auth_status", emailLower));
          if (authStatusSnap && authStatusSnap.exists() && authStatusSnap.data().hasPassword === true) {
            localStorage.setItem(`has_password_${emailLower}`, 'true');
            localStorage.setItem(`google_only_${emailLower}`, 'false');
            setIsGoogleOnly(false);
            setEmailVerifyStatus('idle');
            showToast("Password set successfully! Enter your password to log in.", "success");
            return;
          }
        }
      } catch (fErr) {}

      // 4. Fallback check with Firebase
      try {
        const methods = await fetchSignInMethodsForEmail(auth, email.trim());
        if (methods.includes('password')) {
          setIsGoogleOnly(false);
          setEmailVerifyStatus('idle');
          showToast("Password set successfully! Enter your password to log in.", "success");
        }
      } catch (err) {
        // Suppress expected email enumeration errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [emailVerifyStatus, email]);

  // Check if an email needs password setup verification (only after full domain ending in .org)
  const checkEmailMethods = async (targetEmail) => {
    const trimmed = (targetEmail || "").trim().toLowerCase();

    // Only run when email is complete
    const isCompleteCollegeEmail = trimmed.endsWith("@kbtcoe.org");
    const isAllowedTestEmail = trimmed === "jwj475.mail@gmail.com" ||
                               trimmed === "innovativeteachingfeedback@gmail.com";

    if (!isCompleteCollegeEmail && !isAllowedTestEmail) {
      setIsGoogleOnly(false);
      setEmailVerifyStatus('idle');
      return;
    }

    const emailValidation = validateCollegeEmail(trimmed);
    if (!emailValidation.isValid) {
      setIsGoogleOnly(false);
      setEmailVerifyStatus('idle');
      return;
    }

    // Keep verified state — don't reset it
    if (emailVerifyStatus === 'verified') return;

    // Test accounts bypass Verify button — they use manual password (Pass123) directly
    const TEST_EMAILS = ['a@kbtcoe.org', 'b@kbtcoe.org', 'jwj475.mail@gmail.com'];
    if (TEST_EMAILS.includes(trimmed)) {
      setIsGoogleOnly(false);
      setEmailVerifyStatus('idle');
      return;
    }

    console.log("[checkEmail] Checking complete email:", trimmed);

    // LAYER 1: Firestore auth_status is the PRIMARY SOURCE OF TRUTH (never blocked by stale localStorage)
    try {
      const authStatusDoc = await getDoc(doc(db, "auth_status", trimmed));
      console.log("[checkEmail] auth_status exists:", authStatusDoc?.exists(), "| data:", authStatusDoc?.exists() ? JSON.stringify(authStatusDoc.data()) : "N/A");
      if (authStatusDoc && authStatusDoc.exists()) {
        const authStatusData = authStatusDoc.data();
        if (authStatusData.hasPassword === true) {
          // Password is set — never show Verify
          localStorage.setItem(`has_password_${trimmed}`, 'true');
          localStorage.setItem(`google_only_${trimmed}`, 'false');
          setIsGoogleOnly(false);
          setEmailVerifyStatus('idle');
          return;
        }
        // hasPassword is false or missing — Google-only user, MUST show Verify
        localStorage.setItem(`has_password_${trimmed}`, 'false');
        localStorage.setItem(`google_only_${trimmed}`, 'true');
        setIsGoogleOnly(true);
        if (emailVerifyStatus !== 'sent' && emailVerifyStatus !== 'sending') {
          setEmailVerifyStatus('unverified');
        }
        return;
      }
    } catch (firestoreErr) {
      console.warn("[checkEmail] auth_status read error:", firestoreErr);
    }

    // LAYER 2: users collection — check isGoogleUser / authProvider / hasPassword
    try {
      const usersQ = query(collection(db, "users"), where("email", "==", trimmed), limit(1));
      const usersSnap = await getDocs(usersQ);
      console.log("[checkEmail] users doc found:", !usersSnap.empty, "| data:", !usersSnap.empty ? JSON.stringify(usersSnap.docs[0].data()) : "N/A");
      if (!usersSnap.empty) {
        const uData = usersSnap.docs[0].data();
        if (uData.hasPassword === true) {
          localStorage.setItem(`has_password_${trimmed}`, 'true');
          localStorage.setItem(`google_only_${trimmed}`, 'false');
          setIsGoogleOnly(false);
          setEmailVerifyStatus('idle');
          return;
        }
        if (uData.isGoogleUser === true || uData.authProvider === 'google' || uData.hasPassword !== true) {
          try {
            await setDoc(doc(db, "auth_status", trimmed), {
              email: trimmed,
              hasPassword: false,
              authProvider: 'google',
              updatedAt: new Date()
            }, { merge: true });
            console.log("[checkEmail] Self-healed auth_status doc for:", trimmed);
          } catch (writeErr) {
            console.warn("[checkEmail] Could not self-heal auth_status:", writeErr);
          }
          localStorage.setItem(`has_password_${trimmed}`, 'false');
          localStorage.setItem(`google_only_${trimmed}`, 'true');
          setIsGoogleOnly(true);
          if (emailVerifyStatus !== 'sent' && emailVerifyStatus !== 'sending') {
            setEmailVerifyStatus('unverified');
          }
          return;
        }
      }
    } catch (usersErr) {
      console.warn("[checkEmail] users collection read error:", usersErr);
    }

    // LAYER 3: Firebase Auth fetchSignInMethodsForEmail
    try {
      const methods = await fetchSignInMethodsForEmail(auth, trimmed);
      console.log("[checkEmail] Firebase sign-in methods:", methods);
      if (methods && methods.includes('password')) {
        localStorage.setItem(`has_password_${trimmed}`, 'true');
        localStorage.setItem(`google_only_${trimmed}`, 'false');
        setIsGoogleOnly(false);
        setEmailVerifyStatus('idle');
        return;
      }
      if (methods && methods.includes('google.com') && !methods.includes('password')) {
        localStorage.setItem(`has_password_${trimmed}`, 'false');
        localStorage.setItem(`google_only_${trimmed}`, 'true');
        setIsGoogleOnly(true);
        if (emailVerifyStatus !== 'sent' && emailVerifyStatus !== 'sending') {
          setEmailVerifyStatus('unverified');
        }
        return;
      }
    } catch (err) {
      // Suppress enumeration errors
    }

    // LAYER 4: localStorage fallback only if Firestore has no doc
    if (localStorage.getItem(`google_only_${trimmed}`) === 'true' && localStorage.getItem(`has_password_${trimmed}`) !== 'true') {
      setIsGoogleOnly(true);
      if (emailVerifyStatus !== 'sent' && emailVerifyStatus !== 'sending') {
        setEmailVerifyStatus('unverified');
      }
      return;
    }

    // Default: normal account, keep idle
    setIsGoogleOnly(false);
    setEmailVerifyStatus('idle');
  };


  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    const trimmed = (val || "").trim().toLowerCase();
    if (trimmed.endsWith("@kbtcoe.org") || trimmed === "jwj475.mail@gmail.com" || trimmed === "innovativeteachingfeedback@gmail.com") {
      checkEmailMethods(trimmed);
    } else {
      if (emailVerifyStatus !== 'idle') {
        setEmailVerifyStatus('idle');
      }
      setIsGoogleOnly(false);
    }
  };

  // Immediate check whenever email is complete
  useEffect(() => {
    const trimmed = (email || "").trim().toLowerCase();
    if (trimmed.endsWith("@kbtcoe.org") || trimmed === "jwj475.mail@gmail.com" || trimmed === "innovativeteachingfeedback@gmail.com") {
      checkEmailMethods(trimmed);
    } else {
      setIsGoogleOnly(false);
      if (emailVerifyStatus !== 'idle') setEmailVerifyStatus('idle');
    }
  }, [email]);

  const handlePaste = (e) => {
    e.preventDefault(); // Prevents duplicate text from being pasted
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      const clean = pastedText.trim();
      setEmail(clean);
      const cleanLower = clean.toLowerCase();
      if (cleanLower.endsWith("@kbtcoe.org") || cleanLower === "jwj475.mail@gmail.com" || cleanLower === "innovativeteachingfeedback@gmail.com") {
        checkEmailMethods(cleanLower);
      }
    }
  };


  // Send password setup link to email
  const handleSendPasswordSetupLink = async () => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      showToast("Please enter your email address first.");
      return;
    }

    const emailValidation = validateCollegeEmail(cleanEmail);
    if (!emailValidation.isValid) {
      showToast(emailValidation.error || "Please enter a valid college email address ending with @kbtcoe.org");
      return;
    }

    setEmailVerifyStatus('sending');

    const actionCodeSettings = getActionCodeSettings('/reset-password');

    try {
      try {
        await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
      } catch (actErr) {
        console.warn("Failed with actionCodeSettings, trying standard:", actErr);
        await sendPasswordResetEmail(auth, cleanEmail);
      }
      setEmailVerifyStatus('sent');
      setResendCooldown(60);
      showToast(`Password setup link sent to ${cleanEmail}! Open it to set your password.`, "success");
    } catch (err) {
      console.error("Error sending password reset email:", err);
      showToast(err.message || "Failed to send password setup link.");
      setEmailVerifyStatus('unverified');
    }
  };

  const loginUser = async () => {
    if (!email || !password) {
      showToast("Please enter both email and password");
      return;
    }

    // Validate email domain and role formats using shared validation
    const emailValidation = validateCollegeEmail(email);
    if (!emailValidation.isValid) {
      showToast(emailValidation.error);
      return;
    }

    if (isGoogleOnly && emailVerifyStatus === 'unverified') {
      showToast("Please click 'Verify' above to send a password setup link to your email first.", "info");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Reload user from Firebase Auth to get the freshest emailVerified flag
      await user.reload();

      // Test/dev accounts bypass email verification entirely
      const TEST_EMAILS = ['a@kbtcoe.org', 'b@kbtcoe.org', 'jwj475.mail@gmail.com'];
      const isTestEmail = TEST_EMAILS.includes((user.email || '').toLowerCase());

      // Test accounts: skip ALL checks — go straight to Faculty dashboard

      if (isTestEmail) {
        const testEmail = (user.email || '').toLowerCase();
        const userDocRef = doc(db, "users", user.uid);

        // Load existing Firestore profile
        let userDoc = await getDoc(userDocRef);

        // Create the profile if it doesn't exist
        if (!userDoc.exists()) {
          const testName =
            user.displayName || testEmail.split('@')[0] || 'Test User';

          await setDoc(userDocRef, {
            name: testName,
            displayName: testName,
            email: user.email,
            role: 'Faculty',
            isGoogleUser: false,
            authProvider: 'password',
            createdAt: new Date(),
            updatedAt: new Date()
          }, { merge: true });

          userDoc = await getDoc(userDocRef);
        }

        const userData = userDoc.exists() ? userDoc.data() : {};

        // Set session with saved profile, including departments
        setUser({
          uid: user.uid,
          email: user.email,
          emailVerified: true,
          isGoogleUser: false,
          ...userData,
          role: 'Faculty',
          name: userData.name || user.email?.split('@')[0] || 'Test User',
          displayName:
            userData.displayName ||
            user.displayName ||
            user.email?.split('@')[0] ||
            'Test User'
        });

        localStorage.setItem(`has_password_${testEmail}`, 'true');
        localStorage.setItem(`google_only_${testEmail}`, 'false');

        setEmailVerifyStatus('verified');
        setIsGoogleOnly(false);

        const welcomeDisplayName = userData.displayName || userData.name || user.displayName || 'Test User';
        sessionStorage.setItem('pending_welcome_toast', JSON.stringify({
          name: welcomeDisplayName,
          role: 'Faculty',
          timestamp: Date.now()
        }));

        navigate('/faculty-dashboard');
        if (onClose) onClose();
        return;
      }

      let userDocRef = doc(db, "users", user.uid);
      let userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        try {
          const q = query(collection(db, "users"), where("email", "==", user.email));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const existingData = qSnap.docs[0].data();
            await setDoc(userDocRef, {
              ...existingData,
              updatedAt: new Date()
            }, { merge: true });
            userDoc = await getDoc(userDocRef);
          }
        } catch (queryErr) {
          console.warn("Email lookup query skipped:", queryErr);
        }
      }

      if (!userDoc.exists()) {
        showToast("User profile not found. Please contact support.");
        return;
      }

      const userData = userDoc.data();
      const userEmail = userData.email ? userData.email.toLowerCase() : email.toLowerCase();

      // Validate email format matches the assigned role
      const roleValidation = validateCollegeEmail(userEmail, userData.role);
      if (!roleValidation.isValid) {
        showToast(roleValidation.error);
        return;
      }

      // Normalize role and update session immediately
      const rawRole = userData.role || '';
      const normalizedRole = rawRole.toLowerCase() === 'student' ? 'Student' :
                             rawRole.toLowerCase() === 'faculty' ? 'Faculty' :
                             rawRole.toLowerCase() === 'hod' ? 'HOD' : rawRole;

      setUser({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        isGoogleUser: false,
        ...userData,
        role: normalizedRole
      });

      localStorage.setItem(`has_password_${userEmail}`, 'true');
      localStorage.setItem(`google_only_${userEmail}`, 'false');
      try {
        await setDoc(doc(db, "auth_status", userEmail), {
          email: userEmail,
          hasPassword: true,
          updatedAt: new Date()
        }, { merge: true });
      } catch (statusSaveErr) {
        console.warn("Could not save auth_status on login:", statusSaveErr);
      }
      setEmailVerifyStatus('verified');
      setIsGoogleOnly(false);

      sessionStorage.removeItem('itfs_student_academic_year_filter');
      sessionStorage.removeItem('itfs_student_class_name_filter');
      sessionStorage.removeItem('itfs_student_filter_is_manual');
      sessionStorage.removeItem('itfs_student_filter_uid');

      const welcomeDisplayName = userData.displayName || userData.name || user.displayName || (user.email?.split('@')[0]) || 'User';
      sessionStorage.setItem('pending_welcome_toast', JSON.stringify({
        name: welcomeDisplayName,
        role: normalizedRole,
        timestamp: Date.now()
      }));
      window.dispatchEvent(new CustomEvent('auth_welcome_toast', {
        detail: { name: welcomeDisplayName, role: normalizedRole }
      }));

      // Navigate based on normalized role — navigate BEFORE closing modal
      if (normalizedRole === 'Student') {
        navigate("/student-dashboard");
      } else if (normalizedRole === 'Faculty') {
        navigate("/faculty-dashboard");
      } else if (normalizedRole === 'HOD') {
        navigate("/hod-dashboard");
      } else {
        navigate("/");
      }

      if (onClose) {
        onClose();
      }

    } catch (err) {
      console.error("Login error:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        const cleanEmail = email.trim().toLowerCase();

        // Firestore auth_status is the SINGLE SOURCE OF TRUTH — always check it first
        let firestoreHasPassword = null; // null = unknown, true = has password, false = Google-only
        try {
          const authStatusRef = doc(db, "auth_status", cleanEmail);
          const statusSnap = await getDoc(authStatusRef);
          if (statusSnap.exists()) {
            const d = statusSnap.data();
            if (d.hasPassword === true) {
              firestoreHasPassword = true;
            } else if (d.hasPassword === false || d.authProvider === 'google') {
              firestoreHasPassword = false; // Google-only, no password
              // Sync localStorage to match Firestore truth
              localStorage.setItem(`has_password_${cleanEmail}`, 'false');
              localStorage.setItem(`google_only_${cleanEmail}`, 'true');
            }
          }
        } catch (statusErr) {
          console.warn("Could not check auth_status in login catch:", statusErr);
        }

        // 1. Firestore explicitly says this is a Google-only account (no password yet) → show Verify
        if (firestoreHasPassword === false) {
          setIsGoogleOnly(true);
          setEmailVerifyStatus('unverified');
          showToast("Account registered via Google. Click 'Verify' above to set a password.", "info");
          return;
        }

        // 2. Firestore confirms user has a password → wrong password entered
        if (firestoreHasPassword === true) {
          setIsGoogleOnly(false);
          setEmailVerifyStatus('idle');
          showToast("Incorrect email or password. Please check your password and try again.", "error");
          return;
        }

        // 3. Firestore doc unknown/missing — fall back to localStorage
        const hasLocalPassword = localStorage.getItem(`has_password_${cleanEmail}`) === 'true';
        const isLocalGoogleOnly = localStorage.getItem(`google_only_${cleanEmail}`) === 'true';

        if (isLocalGoogleOnly && !hasLocalPassword) {
          // Local says Google-only → show Verify
          setIsGoogleOnly(true);
          setEmailVerifyStatus('unverified');
          showToast("Account registered via Google. Click 'Verify' above to set a password.", "info");
          return;
        }

        if (hasLocalPassword) {
          setIsGoogleOnly(false);
          setEmailVerifyStatus('idle');
          showToast("Incorrect email or password. Please check your password and try again.", "error");
          return;
        }

        // 4. If waiting for reset link — special message
        if (emailVerifyStatus === 'sent') {
          showToast("Password doesn't match yet. Please ensure you saved your new password from the email link and entered it correctly.", "error");
          return;
        }

        // 5. No info at all — generic error
        setIsGoogleOnly(false);
        setEmailVerifyStatus('idle');
        showToast("Incorrect email or password. Please try again.", "error");
      } else if (err.code === 'auth/too-many-requests') {
        showToast("Access temporarily disabled due to multiple failed attempts. Reset password or try later.");
      } else {
        showToast(err.message || "Login failed. Please try again.");
      }

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

      // Enforce organization email for Google sign-in, except the special email and whitelisted email
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
        console.warn("Could not get user doc by UID:", getErr);
      }

      // If document by user.uid not found, search by email to link manual signup account
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
            determinedRole = "Student";
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
          } catch (updErr) {
            console.warn("Could not update user doc:", updErr);
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

      // Fetch final user document data and update session
      let userData = {};
      try {
        const finalUserDoc = await getDoc(userDocRef);
        if (finalUserDoc.exists()) {
          userData = finalUserDoc.data();
        }
      } catch (fErr) {
        console.warn("Could not fetch final user doc:", fErr);
      }

      const rawRole = userData.role || 'Student';
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
        console.warn("Could not save auth_status in Google login:", authStatusErr);
      }

      localStorage.setItem(`google_user_${userEmail}`, 'true');
      localStorage.setItem(`google_only_${userEmail}`, hasPasswordLinked ? 'false' : 'true');
      localStorage.setItem(`has_password_${userEmail}`, hasPasswordLinked ? 'true' : 'false');
      localStorage.removeItem('password_verified_signal');
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

      if (normalizedRole === 'HOD') {
        navigate("/hod-dashboard");
      } else if (normalizedRole === 'Faculty') {
        navigate("/faculty-dashboard");
      } else {
        navigate("/student-dashboard");
      }

      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Google Sign-In error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      showToast(err.message || "Google Sign-In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`afm-root w-full h-full flex flex-col justify-center ${mounted ? "afm-mounted" : ""}`}>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: "", type: "error" })}
        />
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        .afm-root { font-family: 'Inter', system-ui, sans-serif; }
        .afm-heading { font-family: 'Outfit', 'Inter', system-ui, sans-serif; letter-spacing: -0.01em; }

        .afm-field {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .afm-mounted .afm-field { opacity: 1; transform: translateY(0); }
        .afm-mounted .afm-field.d1 { transition-delay: 0.03s; }
        .afm-mounted .afm-field.d2 { transition-delay: 0.08s; }
        .afm-mounted .afm-field.d3 { transition-delay: 0.14s; }
        .afm-mounted .afm-field.d4 { transition-delay: 0.20s; }
        .afm-mounted .afm-field.d5 { transition-delay: 0.26s; }

        .afm-input {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 197, 224, 0.55);
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
        }
        .afm-input:focus {
          outline: none;
          border-color: #0ea5e9;
          background: rgba(255, 255, 255, 0.95);
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

        /* Hide Microsoft Edge / IE native password reveal eye button */
        input::-ms-reveal,
        input::-ms-clear {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
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
          background: rgba(255, 255, 255, 0.75);
          border: 1px solid rgba(148, 197, 224, 0.6);
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .afm-btn-google:hover:not(:disabled) {
          background: rgba(255, 255, 255, 1);
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

      {/* Google button */}
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="afm-btn-google afm-field d1 w-full flex items-center justify-center gap-3 text-sky-800 font-semibold rounded-xl py-2.5 px-4 mb-3"
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="afm-field d2 relative flex items-center mb-3">
            <div className="flex-grow border-t border-sky-200"></div>
            <span className="mx-3 text-sky-500 text-xs">or log in with email</span>
            <div className="flex-grow border-t border-sky-200"></div>
          </div>

          <form noValidate className="space-y-3" onSubmit={(e) => { e.preventDefault(); loginUser(); }}>
            <div className="afm-field d3">
              <label className="block text-sky-800 text-sm font-semibold mb-1.5">Email Address</label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}
                  onInput={handleEmailChange}
                  onPaste={handlePaste}
                  onBlur={(e) => {
                    const c = (e.target.value || email || '').trim().toLowerCase();
                    if (c.endsWith('@kbtcoe.org') || c === 'jwj475.mail@gmail.com' || c === 'innovativeteachingfeedback@gmail.com') {
                      checkEmailMethods(c);
                    }
                  }}
                  disabled={emailVerifyStatus === 'verified'}
                  className={`afm-input w-full rounded-xl px-4 py-2.5 text-sky-900 placeholder-sky-400 ${
                    isGoogleOnly ? 'pr-28' : ''
                  } ${emailVerifyStatus === 'verified' ? 'disabled:bg-emerald-50/50' : ''}`}
                  required
                />

                {/* Inline Verify / Status tab for Google-only accounts */}
                {isGoogleOnly && (
                  <div className="absolute right-2 flex items-center">
                    {emailVerifyStatus === 'verified' ? (
                      <div 
                        className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm"
                        style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7' }}
                      >
                        <FaCheckCircle className="text-emerald-500 text-sm" />
                        <span>Verified</span>
                      </div>
                    ) : (emailVerifyStatus === 'sending' || emailVerifyStatus === 'checking') ? (
                      <div
                        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm"
                        style={{ backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #7dd3fc' }}
                      >
                        <FaSpinner className="animate-spin text-sky-600 text-xs" />
                        <span>Sending...</span>
                      </div>
                    ) : emailVerifyStatus === 'sent' ? (
                      <div
                        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm"
                        style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                      >
                        <span>Email Sent</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendPasswordSetupLink}
                        className="text-xs font-bold px-3 py-1 rounded-lg shadow-md transition-all cursor-pointer hover:brightness-110 active:scale-95"
                        style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none' }}
                      >
                        Verify
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Status helper under email input */}
              {isGoogleOnly && (
                <>
                  {(emailVerifyStatus === 'sent' || emailVerifyStatus === 'checking' || emailVerifyStatus === 'sending') && (
                    <div className="flex items-center justify-between text-xs mt-1.5 px-0.5 text-sky-800 gap-2">
                      <span className="text-sky-700 text-xs truncate min-w-0">
                        Password link sent! After setting it, enter your password below to log in.
                      </span>
                      <button
                        type="button"
                        onClick={handleSendPasswordSetupLink}
                        disabled={resendCooldown > 0}
                        className="text-xs text-sky-700 hover:text-sky-900 font-semibold underline whitespace-nowrap shrink-0 flex items-center gap-1 disabled:opacity-60 disabled:no-underline disabled:cursor-not-allowed"
                      >
                        <FaRedo className="text-[10px]" />
                        <span className="whitespace-nowrap">{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend"}</span>
                      </button>
                    </div>
                  )}
                  {emailVerifyStatus === 'verified' && (
                    <div className="flex items-center text-xs mt-1.5 px-0.5 text-emerald-700 font-medium gap-1">
                      <FaCheckCircle className="text-emerald-500 text-xs" />
                      <span>Password set! You can now enter your password and log in.</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="afm-field d4 relative">
              <label className="block text-sky-800 text-sm font-semibold mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => {
                    const c = (email || '').trim().toLowerCase();
                    if (c.endsWith('@kbtcoe.org') || c === 'jwj475.mail@gmail.com' || c === 'innovativeteachingfeedback@gmail.com') {
                      checkEmailMethods(c);
                    }
                  }}
                  className="afm-input w-full rounded-xl px-4 py-2.5 pr-11 text-sky-900 placeholder-sky-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-sky-500 hover:text-sky-700 bg-transparent border-none focus:outline-none transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="afm-field d5 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="afm-btn-primary w-full text-white font-semibold py-2.5 rounded-xl"
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </div>
          </form>

          <div className="afm-field d5 mt-4 text-center space-y-2">
            <p
              onClick={toggleForgotPassword}
              className="afm-link inline-block text-sky-600 hover:text-sky-700 text-sm cursor-pointer font-semibold"
            >
              Forgot Password?
            </p>
            <p className="text-sky-800/70 text-sm">
              Don't have an account?{" "}
              <span onClick={toggleSignup} className="afm-link text-sky-600 hover:text-sky-700 cursor-pointer font-semibold">
                Create Account
              </span>
            </p>
          </div>
    </div>
  );
};

export default LoginPage;