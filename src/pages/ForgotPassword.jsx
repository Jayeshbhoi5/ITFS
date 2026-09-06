import React, { useState, useEffect } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app } from "../firebaseConfig";

const auth = getAuth(app);

const ForgotPassword = ({ onClose, toggleLogin }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link has been sent to your email");
      toggleLogin(); // Go back to login page
    } catch (error) {
      setError(error.message);
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
          transform: translateY(10px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .afm-mounted .afm-field { opacity: 1; transform: translateY(0); }
        .afm-mounted .afm-field.d1 { transition-delay: 0.05s; }
        .afm-mounted .afm-field.d2 { transition-delay: 0.12s; }
        .afm-mounted .afm-field.d3 { transition-delay: 0.19s; }

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
        .afm-input:disabled { opacity: 0.6; cursor: not-allowed; }

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

        .afm-error, .afm-success {
          animation: afm-pop 0.35s ease;
        }
        @keyframes afm-pop {
          0% { opacity: 0; transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .afm-field { transition: none !important; opacity: 1 !important; transform: none !important; }
          .afm-error, .afm-success { animation: none !important; }
        }
      `}</style>

      {error && (
        <div className="afm-error bg-red-50/80 backdrop-blur-sm text-red-700 p-3 rounded-xl mb-4 text-sm border border-red-200/70 w-full">
          {error}
        </div>
      )}
      {message && (
        <div className="afm-success bg-emerald-50/80 backdrop-blur-sm text-emerald-700 p-3 rounded-xl mb-4 text-sm border border-emerald-200/70 w-full">
          {message}
        </div>
      )}

      {!message && (
        <p className="afm-field d1 text-sky-800/70 text-sm text-center mb-6">
          Enter your email and we'll send you a link to get back into your account.
        </p>
      )}

      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
        <div className="afm-field d2">
          <label className="block text-sky-800 text-sm font-semibold mb-1.5">Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="afm-input w-full rounded-xl px-4 py-2.5 text-sky-900 placeholder-sky-400"
            required
            disabled={!!message}
          />
        </div>
        <div className="afm-field d3 pt-1">
          <button
            type="submit"
            disabled={loading || !!message}
            className="afm-btn-primary w-full text-white font-semibold py-2.5 rounded-xl"
          >
            {loading ? "Sending Link..." : "Send Reset Link"}
          </button>
        </div>
      </form>

      <div className="afm-field d3 mt-6 text-center">
        <span
          onClick={toggleLogin}
          className="afm-link text-sky-600 hover:text-sky-700 cursor-pointer font-semibold text-sm"
        >
          Back to Login
        </span>
      </div>
    </div>
  );
};

export default ForgotPassword;