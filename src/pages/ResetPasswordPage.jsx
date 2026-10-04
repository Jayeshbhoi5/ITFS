// src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAuth, verifyPasswordResetCode, confirmPasswordReset, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { FaCheckCircle, FaExclamationCircle, FaSpinner, FaArrowRight, FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';
import { app } from '../firebaseConfig';

import { PUBLIC_HOSTED_URL } from '../utils/authConfig';

const auth = getAuth(app);
const db = getFirestore(app);

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const oobCode = searchParams.get('oobCode');

  // 'checking' | 'ready' | 'success' | 'error'
  const [state, setState] = useState('checking');
  const [accountEmail, setAccountEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!oobCode) {
      setState('error');
      setErrorMessage("Invalid or missing password reset code. Please request a new link.");
      return;
    }

    const checkCode = async () => {
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setAccountEmail(userEmail);
        setState('ready');
      } catch (err) {
        console.error("verifyPasswordResetCode error:", err);
        setState('error');
        if (err.code === 'auth/invalid-action-code') {
          setErrorMessage("This password reset link is invalid or has already been used.");
        } else if (err.code === 'auth/expired-action-code') {
          setErrorMessage("This password reset link has expired. Please request a new one.");
        } else {
          setErrorMessage(err.message || "Failed to verify reset code.");
        }
      }
    };

    checkCode();
  }, [oobCode]);

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);

      // Immediately sign in user to establish authenticated session
      try {
        await signInWithEmailAndPassword(auth, accountEmail, newPassword);
      } catch (signInErr) {
        console.warn("Auto sign-in after reset password:", signInErr);
      }

      // Broadcast to other tabs (specifically the login screen)
      const emailLower = (accountEmail || '').toLowerCase();
      localStorage.setItem(`has_password_${emailLower}`, 'true');
      localStorage.setItem(`google_only_${emailLower}`, 'false');
      localStorage.setItem('password_verified_signal', JSON.stringify({ email: emailLower, time: Date.now() }));

      // Save hasPassword: true to Firestore auth_status
      try {
        await setDoc(doc(db, "auth_status", emailLower), {
          email: emailLower,
          hasPassword: true,
          updatedAt: new Date()
        }, { merge: true });
      } catch (statusErr) {
        console.warn("Could not save auth_status in reset password:", statusErr);
      }

      try {
        const bc = new BroadcastChannel('itfs_auth');
        bc.postMessage({ type: 'PASSWORD_VERIFIED', email: emailLower });
        setTimeout(() => {
          try { bc.close(); } catch (e) {}
        }, 2000);
      } catch (bcErr) {
        console.warn("BroadcastChannel not available:", bcErr);
      }

      setState('success');

      // Return to login screen on public hosted URL after 2 seconds
      setTimeout(() => {
        if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
          window.location.href = `${PUBLIC_HOSTED_URL}/?openLogin=true`;
        } else {
          navigate('/?openLogin=true', { state: { openLogin: true, verifiedEmail: emailLower }, replace: true });
        }
      }, 2000);
    } catch (err) {
      console.error("confirmPasswordReset error:", err);
      setErrorMessage(err.message || "Failed to set new password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
      window.location.href = `${PUBLIC_HOSTED_URL}/?openLogin=true`;
    } else {
      navigate('/?openLogin=true', { state: { openLogin: true }, replace: true });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-sky-50 via-sky-100/40 to-sky-50">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl p-8 border border-sky-200/80 shadow-2xl flex flex-col items-center text-center">
        {/* ITFS Logo */}
        <img
          src="/5.png"
          alt="ITFS Logo"
          className="h-16 w-auto object-contain mb-4 drop-shadow-sm"
        />

        {/* State: CHECKING */}
        {state === 'checking' && (
          <div className="py-6 flex flex-col items-center">
            <FaSpinner className="text-4xl text-sky-600 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-sky-950 mb-1">Verifying Reset Link</h2>
            <p className="text-sm text-sky-700/80">Please wait while we verify your link...</p>
          </div>
        )}

        {/* State: READY (Enter new password) */}
        {state === 'ready' && (
          <div className="w-full text-left">
            <div className="text-center mb-5">
              <div className="mx-auto w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 mb-2">
                <FaLock className="text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-sky-950">Set New Password</h2>
              <p className="text-xs text-sky-700 mt-1">
                For <span className="font-semibold text-sky-900">{accountEmail}</span>
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-sky-800 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm border border-sky-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 bg-white/70 text-sky-950"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-sky-500 hover:text-sky-700"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sky-800 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm border border-sky-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 bg-white/70 text-sky-950"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-sky-500 hover:text-sky-700"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                    {newPassword === confirmPassword ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <FaCheckCircle className="text-[11px]" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-red-500 font-medium flex items-center gap-1">
                        <FaExclamationCircle className="text-[11px]" /> Passwords do not match
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-600 to-sky-800 hover:from-sky-700 hover:to-sky-900 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin text-sm" />
                    <span>Saving Password...</span>
                  </>
                ) : (
                  <span>Save Password & Continue</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* State: SUCCESS */}
        {state === 'success' && (
          <div className="py-4 flex flex-col items-center w-full">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
              <FaCheckCircle className="text-3xl" />
            </div>

            <span className="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300 mb-2">
              Password Set & Verified
            </span>

            <h2 className="text-2xl font-bold text-sky-950 mb-2">Success!</h2>

            <p className="text-sm text-sky-800/80 mb-6 max-w-xs">
              Your password has been set successfully. Redirecting you to the login screen...
            </p>

            <button
              onClick={handleBackToHome}
              className="w-full bg-gradient-to-r from-sky-600 to-sky-800 hover:from-sky-700 hover:to-sky-900 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Login</span>
              <FaArrowRight className="text-sm" />
            </button>
          </div>
        )}

        {/* State: ERROR */}
        {state === 'error' && (
          <div className="py-4 flex flex-col items-center w-full">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 shadow-inner">
              <FaExclamationCircle className="text-3xl" />
            </div>

            <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full border border-red-300 mb-2">
              Reset Link Expired or Invalid
            </span>

            <h2 className="text-xl font-bold text-sky-950 mb-2">Unable to Reset Password</h2>

            <p className="text-sm text-red-700/90 bg-red-50 p-3 rounded-xl border border-red-200/80 mb-6 max-w-xs leading-relaxed">
              {errorMessage}
            </p>

            <button
              onClick={handleBackToHome}
              className="w-full bg-gradient-to-r from-sky-600 to-sky-800 hover:from-sky-700 hover:to-sky-900 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Back to Login</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-sky-100 w-full text-center">
          <p className="text-[11px] text-sky-700/70">
            Innovative Teaching Feedback System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
