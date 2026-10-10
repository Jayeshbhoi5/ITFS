import React, { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import SignupPage from "./Signup";
import ForgotPassword from "./ForgotPassword";
import { Link } from "react-router-dom";
import ModernContactView from "../components/ModernContactView";

export default function Contacthome() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  const openLogin = () => {
    setShowLogin(true);
    setShowSignup(false);
    setShowForgotPassword(false);
  };

  const openSignup = () => {
    setShowSignup(true);
    setShowLogin(false);
    setShowForgotPassword(false);
  };

  const openForgotPassword = () => {
    setShowForgotPassword(true);
    setShowLogin(false);
    setShowSignup(false);
  };

  const closeModals = () => {
    setShowLogin(false);
    setShowSignup(false);
    setShowForgotPassword(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModals();
      }
    };
    if (showLogin || showSignup || showForgotPassword) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showLogin, showSignup, showForgotPassword]);

  return (
    <div className={`relative w-full min-h-screen itf-page ${mounted ? "itf-mounted" : ""}`} style={{ overflow: 'visible' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');

        .itf-page {
          font-family: 'Inter', system-ui, sans-serif;
          background:
            radial-gradient(1100px 600px at 85% -10%, #dff3ff 0%, transparent 60%),
            radial-gradient(900px 500px at -10% 20%, #e6f7ff 0%, transparent 55%),
            linear-gradient(180deg, #f5fbff 0%, #eef9ff 40%, #f7fcff 100%);
          color: #124559;
          overflow: visible !important;
        }
        .itf-heading {
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
          letter-spacing: -0.01em;
        }

        .itf-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(60px);
          opacity: 0.5;
          pointer-events: none;
          z-index: 0;
        }
        .itf-orb--a {
          background: radial-gradient(circle, #bfe9ff 0%, transparent 70%);
          width: 520px;
          height: 520px;
          top: -120px;
          right: -80px;
          animation: itf-drift 24s ease-in-out infinite;
        }
        .itf-orb--b {
          background: radial-gradient(circle, #cdeaff 0%, transparent 70%);
          width: 440px;
          height: 440px;
          bottom: 100px;
          left: -100px;
          animation: itf-drift 28s ease-in-out infinite reverse;
        }
        @keyframes itf-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 25px) scale(1.06); }
        }

        .itf-navbar {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.75);
        }

        .itf-modal {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(224, 242, 254, 0.9);
          box-shadow: 0 35px 80px -15px rgba(3, 105, 161, 0.5), 0 0 0 1px rgba(125, 211, 252, 0.3);
          animation: itf-modal-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes itf-modal-in {
          0% { opacity: 0; transform: scale(0.95) translateY(28px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .itf-modal-strip {
          height: 4px;
          width: 100%;
          flex-shrink: 0;
          background: linear-gradient(90deg, #075985, #0ea5e9 50%, #7dd3fc);
        }
        .itf-modal-caption {
          background: linear-gradient(to top, rgba(3, 25, 41, 0.85) 0%, rgba(3, 25, 41, 0.25) 55%, transparent 100%);
        }

        .itf-btn-primary {
          background: linear-gradient(135deg, #0284c7, #075985);
          box-shadow: 0 10px 25px rgba(7, 89, 133, 0.45);
          transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
        }
        .itf-btn-primary:hover {
          background: linear-gradient(135deg, #0369a1, #0c4a6e);
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(12, 74, 110, 0.55);
        }

        .itf-gradient-text {
          background: linear-gradient(120deg, #0ea5e9, #38bdf8 45%, #7dd3fc);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .itf-nav-link {
          position: relative;
          color: #0B1F3A;
          font-weight: 500;
          padding: 4px 2px;
          display: inline-block;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.35s ease;
        }
        .itf-nav-link::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -3px;
          width: 0;
          height: 2.5px;
          border-radius: 9999px;
          background: linear-gradient(90deg, #0284c7, #38bdf8);
          box-shadow: 0 1px 5px rgba(2, 132, 199, 0.35);
          transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .itf-nav-link:hover {
          color: #0284c7 !important;
        }
        .itf-nav-link:hover::after {
          width: 100%;
        }
        .itf-nav-link:active,
        .itf-nav-link.active {
          color: #031d33 !important;
          font-weight: 700 !important;
        }
        .itf-nav-link:active::after,
        .itf-nav-link.active::after {
          display: none !important;
          width: 0 !important;
          opacity: 0 !important;
        }

        .itf-reveal {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .itf-mounted .itf-reveal { opacity: 1; transform: translateY(0); }
        .itf-reveal.d1 { transition-delay: 0.05s; }
        .itf-reveal.d2 { transition-delay: 0.18s; }
      `}</style>

      {/* College Header Banner */}
      <div className="relative z-10 w-full py-4 border-b border-sky-100/70">
        <div className="container mx-auto max-w-screen-lg flex flex-col md:flex-row items-center justify-center px-4 text-center">
          <img
            src="/5.png"
            alt="KBTCOE Logo"
            className="h-20 w-24 mx-7 mb-6 md:mb-0 object-contain shrink-0"
            loading="eager"
            decoding="sync"
            fetchpriority="high"
            width="96"
            height="64"
          />
          <div className="text-center flex-1 w-full">
            <h2 className="itf-heading text-sky-700 font-semibold text-lg md:text-xl">
              Maratha Vidya Prasarak Samaj's
            </h2>
            <h1 className="itf-heading text-sky-800 font-bold text-xl md:text-2xl whitespace-nowrap">
              Karmaveer Adv. Baburao Ganpatrao Thakare College of Engineering
            </h1>
            <p className="text-sky-600 text-sm md:text-base">
              Udoji Maratha Boarding Campus, Near Pumping Station, Gangapur Road, Nashik
            </p>
            <p className="text-sky-500 text-xs md:text-sm">
              "An Autonomous Institute Permanently affiliated to Savitribai Phule Pune University"
            </p>
          </div>
           <div className="flex items-center mt-2 md:mt-0">
            <img src="/6.png" alt="Accreditation Badges" className="h-12 w-auto mx-2" />
            <img src="/7.png" alt="Accreditation Badges" className="h-12 w-auto mx-0" />
          </div>
        </div>
      </div>

      {/* Floating glass navbar */}
      <nav className="itf-navbar relative z-20 mx-4 md:mx-8 mt-4 rounded-2xl flex justify-between items-center px-5 py-3">
        <div className="flex items-center">
          <h1
            className="group inline-flex flex-wrap items-center gap-x-1 text-lg sm:text-base md:text-xl lg:text-2xl font-extrabold tracking-tight focus:outline-none"
            style={{
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
              lineHeight: 1.2,
              textShadow: "0 1px 2px rgba(7, 89, 133, 0.15)",
            }}
          >
            <span className="text-[#075985] transition-all duration-300 group-hover:drop-shadow-[0_0_4px_rgba(7,89,133,0.35)]">
              Innovative
            </span>

            <span
              className="relative text-[#0284c7] transition-all duration-300 group-hover:drop-shadow-[0_0_5px_rgba(2,132,199,0.45)]
                         after:absolute after:left-0 after:-bottom-1
                         after:h-[2px] after:w-0 after:rounded-full
                         after:bg-gradient-to-r after:from-[#075985] after:to-[#0284c7]
                         after:transition-all after:duration-300
                         group-hover:after:w-full"
            >
              Teaching
            </span>

            <span className="text-[#075985] transition-all duration-300 group-hover:drop-shadow-[0_0_4px_rgba(7,89,133,0.35)]">
              Feedback
            </span>
          </h1>
        </div>
        <div className="space-x-5 flex items-center">
          <Link
            to="/"
            className="itf-nav-link text-sm md:text-base cursor-pointer"
          >
            Home
          </Link>

          <Link
            to="/#features"
            className="itf-nav-link text-sm md:text-base cursor-pointer"
          >
            Features
          </Link>

          <Link
            to="/#benefits"
            className="itf-nav-link text-sm md:text-base cursor-pointer"
          >
            Benefits
          </Link>

          <Link
            to="/abouthome"
            className="itf-nav-link text-sm md:text-base cursor-pointer"
          >
            About Us
          </Link>

          <Link
            to="/contacthome"
            className="itf-nav-link active font-bold !text-[#031d33] text-sm md:text-base cursor-pointer"
          >
            Contact Us
          </Link>
          <button
            className="itf-btn-primary text-white px-4 py-2 text-sm md:text-base rounded-xl font-medium cursor-pointer"
            onClick={openSignup}
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Content Below Navbar with Smooth Animation */}
      <div className="itf-home-enter">
        {/* Hero section */}
        <section className="relative w-full px-4 sm:px-6 md:px-12 pt-10 pb-6 text-center overflow-hidden">
        <div className="itf-orb itf-orb--a" />
        <div className="itf-orb itf-orb--b" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="itf-reveal d1 itf-heading text-4xl md:text-5xl font-bold text-sky-900 leading-tight">
            Contact <span className="itf-gradient-text">Us</span>
          </h2>
          <p className="itf-reveal d2 text-sky-800/80 mt-4 text-base md:text-lg">
            Have questions, feedback, or need assistance? Reach out to the Innovative Teaching Feedback team directly.
          </p>
        </div>
      </section>

      {/* Main Contact Us View */}
      <div className="relative z-10 w-full pb-16">
        <ModernContactView darkMode={false} />
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full itf-glass border-t-0 rounded-t-3xl text-center py-6">
        <p className="text-lg text-sky-800">Innovative Teaching Feedback © 2025. All rights reserved.</p>
      </footer>
      </div>

      {/* Modal Overlay for Login, Signup, and Forgot Password */}
      {(showLogin || showSignup || showForgotPassword) && (
        <div 
          className="fixed inset-0 bg-sky-950/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-y-auto cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModals();
          }}
        >
          {showLogin && (
            <div
              className="itf-modal rounded-2xl w-full max-w-4xl mx-auto overflow-hidden flex flex-col my-auto cursor-default"
              style={{ width: "900px", height: "560px", maxHeight: "calc(100vh - 2rem)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="itf-modal-strip" />
              <div className="flex flex-1 min-h-0">
                <div className="hidden md:block w-1/2 relative">
                  <img src="/8.png" alt="KBTCOE Campus" className="w-full h-full object-cover" loading="eager" decoding="sync" />
                  <div className="absolute inset-0 itf-modal-caption" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="itf-heading text-white text-lg font-semibold">KBTCOE</p>
                    <p className="text-white/80 text-sm mt-1">Excellence in engineering education, Nashik.</p>
                  </div>
                </div>
                <div className="w-full md:w-1/2 p-6 flex flex-col justify-center h-full overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img src="/5.png" alt="KBTCOE Logo" className="w-12 h-13 bg-white object-contain p-1 flex-shrink-0" loading="eager" decoding="sync" />
                      <div>
                        <h2 className="itf-heading text-2xl font-bold text-sky-900 leading-tight">Welcome Back</h2>
                        <p className="text-sky-600 text-xs mt-0.5">Log in to continue to your dashboard</p>
                      </div>
                    </div>
                    <button onClick={closeModals} className="text-sky-400 hover:text-sky-700 text-2xl bg-transparent leading-none transition-colors cursor-pointer">×</button>
                  </div>
                  <LoginPage onClose={closeModals} toggleSignup={openSignup} toggleForgotPassword={openForgotPassword} />
                </div>
              </div>
            </div>
          )}

          {showSignup && (
            <div
              className="itf-modal rounded-2xl w-full max-w-4xl mx-auto overflow-hidden flex flex-col my-auto cursor-default"
              style={{ width: "900px", height: "600px", maxHeight: "calc(100vh - 1.5rem)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="itf-modal-strip" />
              <div className="flex flex-1 min-h-0">
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
                    <button onClick={closeModals} className="text-sky-400 hover:text-sky-700 text-xl bg-transparent leading-none transition-colors cursor-pointer">×</button>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto afm-white-scroll pr-2 md:pr-3">
                    <SignupPage onClose={closeModals} toggleLogin={openLogin} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {showForgotPassword && (
            <div
              className="itf-modal rounded-2xl w-full max-w-4xl mx-auto overflow-hidden flex flex-col my-auto cursor-default"
              style={{ width: "900px", height: "440px", maxHeight: "calc(100vh - 2rem)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="itf-modal-strip" />
              <div className="flex flex-1 min-h-0">
                <div className="hidden md:block w-1/2 relative">
                  <img src="/8.png" alt="KBTCOE Campus" className="w-full h-full object-cover" loading="eager" decoding="sync" />
                  <div className="absolute inset-0 itf-modal-caption" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="itf-heading text-white text-lg font-semibold">KBTCOE</p>
                    <p className="text-white/80 text-sm mt-1">We'll help you get back in.</p>
                  </div>
                </div>
                <div className="w-full md:w-1/2 p-6 flex flex-col justify-center h-full overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img src="/5.png" alt="KBTCOE Logo" className="w-12 h-13 bg-white object-contain p-1 flex-shrink-0" loading="eager" decoding="sync" />
                      <div>
                        <h2 className="itf-heading text-2xl font-bold text-sky-900 leading-tight">Reset Password</h2>
                        <p className="text-sky-600 text-xs mt-0.5">We'll email you a secure reset link</p>
                      </div>
                    </div>
                    <button onClick={closeModals} className="text-sky-400 hover:text-sky-700 text-2xl bg-transparent leading-none transition-colors cursor-pointer">×</button>
                  </div>
                  <ForgotPassword onClose={closeModals} toggleLogin={openLogin} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
