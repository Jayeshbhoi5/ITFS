// src/pages/VerifyEmailPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getAuth, applyActionCode, reload } from 'firebase/auth';
import { FaCheckCircle, FaExclamationCircle, FaSpinner, FaArrowRight, FaRedo } from 'react-icons/fa';
import { app } from '../firebaseConfig';
import { useUserSession } from '../UserSessionContext';
import { PUBLIC_HOSTED_URL } from '../utils/authConfig';

const auth = getAuth(app);

const VerifyEmailPage = ({ darkMode }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSession } = useUserSession();

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  // 'loading' | 'success' | 'already-verified' | 'error'
  const [verificationState, setVerificationState] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const verifyCode = async () => {
      // 1. If Firebase action code provided in URL
      if (oobCode) {
        try {
          await applyActionCode(auth, oobCode);
          if (isMounted) {
            setVerificationState('success');
            if (refreshSession) {
              await refreshSession();
            }
          }
        } catch (error) {
          console.error("Firebase applyActionCode error:", error);
          if (isMounted) {
            setVerificationState('error');
            if (error.code === 'auth/invalid-action-code') {
              setErrorMessage("This verification link is invalid or has already been used.");
            } else if (error.code === 'auth/expired-action-code') {
              setErrorMessage("This verification link has expired. Please request a new verification email.");
            } else {
              setErrorMessage(error.message || "Unable to verify email address. Please try again.");
            }
          }
        }
      } 
      // 2. If user arrived directly while logged in
      else if (auth.currentUser) {
        try {
          await reload(auth.currentUser);
          if (auth.currentUser.emailVerified) {
            if (isMounted) setVerificationState('already-verified');
          } else {
            if (isMounted) {
              setVerificationState('error');
              setErrorMessage("Your email address is not yet verified. Please check your inbox for the verification link.");
            }
          }
        } catch (err) {
          if (isMounted) {
            setVerificationState('error');
            setErrorMessage("Could not retrieve verification status. Please log in again.");
          }
        }
      } 
      // 3. Direct access without code or session
      else {
        if (isMounted) {
          setVerificationState('error');
          setErrorMessage("No verification code found. Please use the link sent to your registered email address.");
        }
      }
    };

    verifyCode();

    return () => {
      isMounted = false;
    };
  }, [oobCode, refreshSession]);

  const handleContinueToLogin = () => {
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

        {/* State: LOADING */}
        {verificationState === 'loading' && (
          <div className="py-6 flex flex-col items-center">
            <FaSpinner className="text-4xl text-sky-600 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-sky-950 mb-1">Verifying Your Email</h2>
            <p className="text-sm text-sky-700/80">
              Please wait while we verify your college email address with ITFS...
            </p>
          </div>
        )}

        {/* State: SUCCESS */}
        {(verificationState === 'success' || verificationState === 'already-verified') && (
          <div className="py-4 flex flex-col items-center w-full">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
              <FaCheckCircle className="text-3xl" />
            </div>

            <span className="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300 mb-2">
              Email Verified Successfully
            </span>

            <h2 className="text-2xl font-bold text-sky-950 mb-2">
              Welcome to ITFS!
            </h2>

            <p className="text-sm text-sky-800/80 mb-6 max-w-xs">
              Your email address has been verified. You can now log in to your Innovative Teaching Feedback System account.
            </p>

            <button
              onClick={handleContinueToLogin}
              className="w-full bg-gradient-to-r from-sky-600 to-sky-800 hover:from-sky-700 hover:to-sky-900 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Login</span>
              <FaArrowRight className="text-sm" />
            </button>
          </div>
        )}

        {/* State: ERROR */}
        {verificationState === 'error' && (
          <div className="py-4 flex flex-col items-center w-full">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 shadow-inner">
              <FaExclamationCircle className="text-3xl" />
            </div>

            <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full border border-red-300 mb-2">
              Verification Failed
            </span>

            <h2 className="text-xl font-bold text-sky-950 mb-2">
              Verification Link Invalid or Expired
            </h2>

            <p className="text-sm text-red-700/90 bg-red-50 p-3 rounded-xl border border-red-200/80 mb-6 max-w-xs leading-relaxed">
              {errorMessage}
            </p>

            <button
              onClick={handleContinueToLogin}
              className="w-full bg-gradient-to-r from-sky-600 to-sky-800 hover:from-sky-700 hover:to-sky-900 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <FaRedo className="text-xs" />
              <span>Go to Login / Request New Link</span>
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

export default VerifyEmailPage;
