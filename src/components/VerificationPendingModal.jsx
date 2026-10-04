// src/components/VerificationPendingModal.jsx
import React, { useState, useEffect } from 'react';
import { getAuth, sendEmailVerification } from 'firebase/auth';
import { FaEnvelope, FaCheckCircle, FaExclamationTriangle, FaRedo, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { useUserSession } from '../UserSessionContext';
import { getActionCodeSettings } from '../utils/authConfig';

const COOLDOWN_SECONDS = 60;

const VerificationPendingModal = ({ email, onVerified, onClose, onBackToLogin }) => {
  const { refreshSession } = useUserSession();
  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error' | 'info', text: string }
  const [isVerified, setIsVerified] = useState(false);

  // Timer countdown for cooldown
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle manual "I've Verified My Email" check
  const handleCheckVerification = async () => {
    setChecking(true);
    setStatusMessage(null);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setStatusMessage({
          type: 'error',
          text: "Session expired or not found. Please log in again to check verification."
        });
        setChecking(false);
        return;
      }

      // Reload user from Firebase Authentication
      await currentUser.reload();

      if (currentUser.emailVerified) {
        setIsVerified(true);
        setStatusMessage({
          type: 'success',
          text: "Email Verified Successfully! Your account is now active."
        });
        if (refreshSession) {
          await refreshSession();
        }
      } else {
        setStatusMessage({
          type: 'info',
          text: "We haven't received your verification yet. Please open the link sent to your inbox, then click this button again."
        });
      }
    } catch (err) {
      console.error("Verification check error:", err);
      setStatusMessage({
        type: 'error',
        text: err.message || "Network error while checking verification status. Please try again."
      });
    } finally {
      setChecking(false);
    }
  };

  // Handle "Resend Verification Email"
  const handleResendEmail = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setStatusMessage(null);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setStatusMessage({
          type: 'error',
          text: "Authentication session expired. Please log in with your credentials to resend the verification email."
        });
        setResending(false);
        return;
      }

      // If user already verified in the background
      await currentUser.reload();
      if (currentUser.emailVerified) {
        setIsVerified(true);
        setStatusMessage({
          type: 'success',
          text: "Your email is already verified! You can proceed to log in."
        });
        setResending(false);
        return;
      }

      // ActionCodeSettings pointing to public hosted URL
      const actionCodeSettings = getActionCodeSettings('/verify-email');

      try {
        await sendEmailVerification(currentUser, actionCodeSettings);
      } catch (sendErr) {
        // Fallback without actionCodeSettings if authorized domain is pending in Firebase
        await sendEmailVerification(currentUser);
      }

      setCooldown(COOLDOWN_SECONDS);
      setStatusMessage({
        type: 'success',
        text: `A new verification link has been sent to ${email || currentUser.email}. Please check your inbox and spam folder.`
      });
    } catch (err) {
      console.error("Error resending email:", err);
      if (err.code === 'auth/too-many-requests') {
        setStatusMessage({
          type: 'error',
          text: "Too many requests. Please wait a few moments before trying again."
        });
        setCooldown(60);
      } else {
        setStatusMessage({
          type: 'error',
          text: err.message || "Failed to resend verification email. Please check your network connection."
        });
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center text-center">
      {/* Icon Badge */}
      <div className="relative mb-3">
        <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 shadow-inner">
          {isVerified ? (
            <FaCheckCircle className="text-3xl text-emerald-500 animate-bounce" />
          ) : (
            <FaEnvelope className="text-3xl text-sky-600" />
          )}
        </div>
        {!isVerified && (
          <span className="absolute -bottom-2 -right-2 px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300 shadow-sm">
            Awaiting Verification
          </span>
        )}
      </div>

      {/* Heading */}
      <h2 className="itf-heading text-xl md:text-2xl font-bold text-sky-950 mb-1">
        {isVerified ? "Email Verified Successfully!" : "Verify Your Email Address"}
      </h2>

      {/* Description */}
      {!isVerified ? (
        <p className="text-xs md:text-sm text-sky-800/80 max-w-sm mb-3">
          We've sent a verification link to your registered email address:
          <span className="block font-semibold text-sky-900 mt-1 break-all bg-sky-50 py-1 px-2.5 rounded-lg border border-sky-200/60">
            {email || "your college email"}
          </span>
          <span className="block mt-1 text-[11px] text-sky-600">
            Please check your inbox (and spam folder) and click the link to activate your ITFS account.
          </span>
        </p>
      ) : (
        <p className="text-xs md:text-sm text-emerald-800 max-w-sm mb-4">
          Your email address has been verified. You can now access your Innovative Teaching Feedback System account.
        </p>
      )}

      {/* Inline Status Message */}
      {statusMessage && (
        <div
          className={`w-full text-xs p-2.5 rounded-lg mb-3 flex items-center gap-2 text-left ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
          ) : statusMessage.type === 'error' ? (
            <FaExclamationTriangle className="text-red-500 flex-shrink-0" />
          ) : (
            <FaEnvelope className="text-blue-500 flex-shrink-0" />
          )}
          <span className="flex-1 leading-snug">{statusMessage.text}</span>
        </div>
      )}

      {/* Actions */}
      <div className="w-full space-y-2 mt-1">
        {isVerified ? (
          <button
            onClick={onVerified || onBackToLogin}
            className="afm-btn-primary w-full text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
          >
            Continue to Login
          </button>
        ) : (
          <>
            <button
              onClick={handleCheckVerification}
              disabled={checking}
              className="afm-btn-primary w-full text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              {checking ? (
                <>
                  <FaSpinner className="animate-spin text-sm" />
                  <span>Checking Status...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle className="text-sm" />
                  <span>I've Verified My Email</span>
                </>
              )}
            </button>

            <button
              onClick={handleResendEmail}
              disabled={cooldown > 0 || resending}
              className="w-full bg-white/70 hover:bg-white text-sky-800 font-semibold py-2 rounded-xl text-xs border border-sky-200 shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {resending ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : cooldown > 0 ? (
                <>
                  <FaRedo className="text-xs" />
                  <span>Resend Email in {cooldown}s</span>
                </>
              ) : (
                <>
                  <FaRedo className="text-xs" />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Back to Login */}
      <div className="mt-4">
        <button
          onClick={onBackToLogin || onClose}
          className="text-sky-600 hover:text-sky-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <FaArrowLeft className="text-[10px]" />
          <span>Back to Login</span>
        </button>
      </div>
    </div>
  );
};

export default VerificationPendingModal;
