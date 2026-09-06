import React, { useState, useEffect } from "react";
import { FaCheckCircle } from "react-icons/fa";
import LoginPage from "./LoginPage";
import SignupPage from "./Signup";
import Abouthome from "./Abouthome";
import ForgotPassword from "./ForgotPassword";
import { Link } from "react-router-dom";

export default function HomePage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const hasSeenInstructions = localStorage.getItem("hasSeenInstructions");
    if (!hasSeenInstructions) {
      setShowInstructions(true);
      localStorage.setItem("hasSeenInstructions", "true");
    }
    // trigger the one-time entrance sequence on mount
    const t = setTimeout(() => setMounted(true), 50);
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
    setShowInstructions(false);
  };

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden itf-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');

        .itf-page {
          font-family: 'Inter', system-ui, sans-serif;
          background:
            radial-gradient(1100px 600px at 85% -10%, #dff3ff 0%, transparent 60%),
            radial-gradient(900px 500px at -10% 20%, #e6f7ff 0%, transparent 55%),
            linear-gradient(180deg, #f5fbff 0%, #eef9ff 40%, #f7fcff 100%);
          color: #124559;
        }
        .itf-heading {
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
          letter-spacing: -0.01em;
        }

        /* floating ambient orbs — one orchestrated, slow, non-intrusive */
        .itf-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(60px);
          opacity: 0.55;
          pointer-events: none;
          z-index: 0;
        }
        .itf-orb--a { background: radial-gradient(circle, #bfe9ff 0%, transparent 70%); width: 480px; height: 480px; top: -120px; right: -80px; animation: itf-drift 22s ease-in-out infinite; }
        .itf-orb--b { background: radial-gradient(circle, #cdeaff 0%, transparent 70%); width: 380px; height: 380px; bottom: -140px; left: -100px; animation: itf-drift 26s ease-in-out infinite reverse; }
        @keyframes itf-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 25px) scale(1.06); }
        }

        /* glass surfaces used for content cards (kept light so they read as "on" the page) */
        .itf-glass {
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 8px 32px rgba(56, 189, 248, 0.12);
        }
        .itf-navbar {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.75);
        }

        /* modal surface: deliberately solid + high-contrast so it never blends into the page */
        .itf-modal {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(224, 242, 254, 0.9);
          box-shadow: 0 35px 80px -15px rgba(3, 105, 161, 0.5), 0 0 0 1px rgba(125, 211, 252, 0.3);
          animation: itf-modal-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes itf-modal-in {
          0% { opacity: 0; transform: scale(0.94) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .itf-modal-strip {
          height: 5px;
          width: 100%;
          flex-shrink: 0;
          background: linear-gradient(90deg, #075985, #0ea5e9 50%, #7dd3fc);
        }
        .itf-modal-caption {
          background: linear-gradient(to top, rgba(3, 25, 41, 0.85) 0%, rgba(3, 25, 41, 0.25) 55%, transparent 100%);
        }

        /* Sign Up / Get Started — deeper, darker blue for higher contrast and presence */
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

        .itf-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
        }
        .itf-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.75);
        }

        .itf-gradient-text {
          background: linear-gradient(120deg, #0ea5e9, #38bdf8 45%, #7dd3fc);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* one orchestrated entrance sequence for the hero, not scattered per-section reveals */
        .itf-reveal {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .itf-mounted .itf-reveal { opacity: 1; transform: translateY(0); }
        .itf-reveal.d1 { transition-delay: 0.05s; }
        .itf-reveal.d2 { transition-delay: 0.18s; }
        .itf-reveal.d3 { transition-delay: 0.32s; }
        .itf-reveal.d4 { transition-delay: 0.46s; }

        @media (prefers-reduced-motion: reduce) {
          .itf-orb { animation: none !important; }
          .itf-reveal { transition: none !important; opacity: 1 !important; transform: none !important; }
          .itf-modal { animation: none !important; }
        }
      `}</style>

      <div className={mounted ? "itf-mounted" : ""}>
        {/* College Header Banner */}
        <div className="relative z-10 w-full py-4 border-b border-sky-100/70">
          <div className="container mx-auto max-w-screen-lg flex flex-col md:flex-row items-center justify-center px-4 text-center">
            <img src="/5.png" alt="KBTCOE Logo" className="h-16 w-24 mx-7 mb-6 md:mb-0" />
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
                An Autonomous Institute Permanently affiliated to Savitribai Phule Pune University
              </p>
            </div>
            <div className="flex items-center mt-2 md:mt-0">
              <img src="/6.png" alt="Accreditation Badges" className="h-12 w-auto mx-2" />
              <img src="/7.png" alt="Accreditation Badges" className="h-12 w-auto mx-0" />
            </div>
          </div>
        </div>

        {/* Floating glass navbar */}
        <nav className="itf-navbar sticky top-4 z-20 mx-4 md:mx-8 mt-4 rounded-2xl flex justify-between items-center px-5 py-3">
          <h1 className="itf-heading text-xl md:text-2xl font-bold">
            <span className="text-sky-700">Innovative Teaching Feedback</span>
          </h1>
          <div className="space-x-5 flex items-center">
            <a href="#features" className="text-sky-700 hover:text-sky-500 text-sm md:text-base transition-colors">
              Features
            </a>
            <a href="#benefits" className="text-sky-700 hover:text-sky-500 text-sm md:text-base transition-colors">
              Benefits
            </a>
            <Link to="/abouthome" className="text-sky-700 hover:text-sky-500 text-sm md:text-base transition-colors">
              About Us
            </Link>
            <button
              className="itf-btn-primary text-white px-4 py-2 text-sm md:text-base rounded-xl font-medium"
              onClick={openSignup}
            >
              Sign Up
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-20 min-h-[80vh] w-full overflow-hidden">
          <div className="itf-orb itf-orb--a" />
          <div className="itf-orb itf-orb--b" />

          <div className="relative z-10 w-full md:w-1/2 text-center md:text-left mb-10 md:mb-0">
            <h2 className="itf-reveal d1 itf-heading text-4xl md:text-5xl font-bold text-sky-900 leading-tight">
              Enhancing Education with{" "}
              <span className="itf-gradient-text">Smart Feedback</span>
            </h2>
            <p className="itf-reveal d2 text-sky-800/80 mt-6 max-w-2xl text-lg">
              A seamless platform for faculty and students to engage in meaningful feedback, driving educational excellence at KBTCOE.
            </p>
            <button
              className="itf-reveal d3 itf-btn-primary mt-8 text-white px-8 py-3 text-lg rounded-xl font-medium"
              onClick={openSignup}
            >
              Get Started
            </button>
          </div>

          <div className="itf-reveal d4 relative z-10 w-full md:w-1/2 flex justify-center">
            <div className="itf-glass p-3 rounded-3xl">
              <img
                src="/2.jpg"
                alt="KBTCOE Building"
                className="rounded-2xl w-full max-w-xl h-auto"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="relative z-10 w-full py-24 px-6 text-center">
          <h3 className="itf-heading text-3xl md:text-4xl font-bold text-sky-900">Features</h3>
          <p className="text-sky-800/70 mt-4 text-lg">Explore what makes our feedback system effective.</p>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-6xl mx-auto">
            <div className="itf-glass itf-card p-8 rounded-2xl">
              <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #bae6fd, #7dd3fc)" }}>
                <FaCheckCircle className="text-sky-700 text-2xl" />
              </div>
              <h4 className="itf-heading text-xl font-semibold mt-6 text-sky-800">Real-time Feedback</h4>
              <p className="text-sky-800/70 mt-3">
                Instant communication between faculty and students for timely improvement.
              </p>
            </div>
            <div className="itf-glass itf-card p-8 rounded-2xl">
              <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #bae6fd, #7dd3fc)" }}>
                <FaCheckCircle className="text-sky-700 text-2xl" />
              </div>
              <h4 className="itf-heading text-xl font-semibold mt-6 text-sky-800">Performance Analytics</h4>
              <p className="text-sky-800/70 mt-3">
                Track student progress and identify teaching effectiveness patterns.
              </p>
            </div>
            <div className="itf-glass itf-card p-8 rounded-2xl">
              <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #bae6fd, #7dd3fc)" }}>
                <FaCheckCircle className="text-sky-700 text-2xl" />
              </div>
              <h4 className="itf-heading text-xl font-semibold mt-6 text-sky-800">Customized Rubrics</h4>
              <p className="text-sky-800/70 mt-3">
                Structured assessment criteria for consistent and clear feedback.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section id="benefits" className="relative z-10 w-full py-20 px-6 text-center">
          <h3 className="itf-heading text-3xl md:text-4xl font-bold text-sky-900">Benefits</h3>
          <div className="grid md:grid-cols-2 gap-6 mt-10 max-w-5xl mx-auto">
            <div className="itf-glass itf-card flex items-center p-6 rounded-2xl">
              <FaCheckCircle className="text-sky-600 text-2xl mr-4 flex-shrink-0" />
              <span className="text-lg text-sky-900/90">Enhanced Communication – Transparent and structured feedback sharing.</span>
            </div>
            <div className="itf-glass itf-card flex items-center p-6 rounded-2xl">
              <FaCheckCircle className="text-sky-600 text-2xl mr-4 flex-shrink-0" />
              <span className="text-lg text-sky-900/90">Continuous Improvement – Helps improve teaching and learning experiences.</span>
            </div>
            <div className="itf-glass itf-card flex items-center p-6 rounded-2xl">
              <FaCheckCircle className="text-sky-600 text-2xl mr-4 flex-shrink-0" />
              <span className="text-lg text-sky-900/90">Data-Driven Insights – Valuable analytics for decision-making.</span>
            </div>
            <div className="itf-glass itf-card flex items-center p-6 rounded-2xl">
              <FaCheckCircle className="text-sky-600 text-2xl mr-4 flex-shrink-0" />
              <span className="text-lg text-sky-900/90">Engagement & Collaboration – Encourages participation from students and faculty.</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 w-full itf-glass border-t-0 rounded-t-3xl mt-8 text-center py-6">
          <p className="text-lg text-sky-800">Innovative Teaching Feedback © 2025. All rights reserved.</p>
        </footer>
      </div>

      {(showLogin || showSignup || showForgotPassword) && (
        <div
          className="fixed inset-0 bg-sky-950/60 backdrop-blur-md z-50 flex items-center justify-center"
          onClick={closeModals}
        >
          {showLogin && (
            <div
              className="itf-modal rounded-2xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col"
              style={{ width: "900px", height: "560px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="itf-modal-strip" />
              <div className="flex flex-1 min-h-0">
                <div className="hidden md:block w-1/2 relative">
                  <img src="/8.png" alt="KBTCOE Campus" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 itf-modal-caption" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="itf-heading text-white text-lg font-semibold">KBTCOE</p>
                    <p className="text-white/80 text-sm mt-1">Excellence in engineering education, Nashik.</p>
                  </div>
                </div>
                <div className="w-full md:w-1/2 p-6 flex flex-col justify-center h-full overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img src="/5.png" alt="KBTCOE Logo" className="w-12 h-13  bg-white   object-contain p-1 flex-shrink-0" />
                      <div>
                        <h2 className="itf-heading text-2xl font-bold text-sky-900 leading-tight">Welcome Back</h2>
                        <p className="text-sky-600 text-xs mt-0.5">Log in to continue to your dashboard</p>
                      </div>
                    </div>
                    <button onClick={closeModals} className="text-sky-400 hover:text-sky-700 text-2xl bg-transparent leading-none transition-colors">×</button>
                  </div>
                  <LoginPage onClose={closeModals} toggleSignup={openSignup} toggleForgotPassword={openForgotPassword} />
                </div>
              </div>
            </div>
          )}

          {showSignup && (
            <div
              className="itf-modal rounded-2xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col"
              style={{ width: "900px", height: "640px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="itf-modal-strip" />
              <div className="flex flex-1 min-h-0">
                <div className="hidden md:block w-1/2 relative">
                  <img src="/8.png" alt="KBTCOE Campus" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 itf-modal-caption" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="itf-heading text-white text-lg font-semibold">KBTCOE</p>
                    <p className="text-white/80 text-sm mt-1">Be part of a transparent feedback community.</p>
                  </div>
                </div>
                <div className="w-full md:w-1/2 p-5 flex flex-col justify-center h-full overflow-hidden">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                       <img src="/5.png" alt="KBTCOE Logo" className="w-12 h-13  bg-white   object-contain p-1 flex-shrink-0" />
                      <div>
                        <h2 className="itf-heading text-2xl font-bold text-sky-900 leading-tight">Create Account</h2>
                        <p className="text-sky-600 text-xs mt-0.5">Sign up with your organization email</p>
                      </div>
                    </div>
                    <button onClick={closeModals} className="text-sky-400 hover:text-sky-700 text-xl bg-transparent leading-none transition-colors">×</button>
                  </div>
                  <SignupPage onClose={closeModals} toggleLogin={openLogin} />
                </div>
              </div>
            </div>
          )}

          {showForgotPassword && (
            <div
              className="itf-modal rounded-2xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col"
              style={{ width: "900px", height: "440px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="itf-modal-strip" />
              <div className="flex flex-1 min-h-0">
                <div className="hidden md:block w-1/2 relative">
                  <img src="/8.png" alt="KBTCOE Campus" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 itf-modal-caption" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="itf-heading text-white text-lg font-semibold">KBTCOE</p>
                    <p className="text-white/80 text-sm mt-1">We'll help you get back in.</p>
                  </div>
                </div>
                <div className="w-full md:w-1/2 p-6 flex flex-col justify-center h-full overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                       <img src="/5.png" alt="KBTCOE Logo" className="w-12 h-13  bg-white   object-contain p-1 flex-shrink-0" />
                      <div>
                        <h2 className="itf-heading text-2xl font-bold text-sky-900 leading-tight">Reset Password</h2>
                        <p className="text-sky-600 text-xs mt-0.5">We'll email you a secure reset link</p>
                      </div>
                    </div>
                    <button onClick={closeModals} className="text-sky-400 hover:text-sky-700 text-2xl bg-transparent leading-none transition-colors">×</button>
                  </div>
                  <ForgotPassword onClose={closeModals} toggleLogin={openLogin} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showInstructions && (
        <div
          className="fixed inset-0 bg-sky-950/40 z-50 flex items-center justify-center"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="itf-modal rounded-2xl max-w-lg w-full p-8 relative flex flex-col items-center mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img src="/5.png" alt="KBTCOE Logo" className="h-16 w-auto mb-4 mx-auto" />
            <h2 className="itf-heading text-2xl font-bold text-sky-800 mb-4 text-center">
              Welcome to Innovative Teaching Feedback
            </h2>
            <ul className="list-disc pl-6 text-sky-900/90 text-base space-y-2 mb-4">
              <li><b>HODs</b> should use their respective organization email (ending with <b>@kbtcoe.org</b> or the official HOD email).</li>
              <li><b>Faculty</b> should use their respective organization email (ending with <b>@kbtcoe.org</b>).</li>
              <li><b>Students</b> must use their respective <b>kbtug</b> or <b>stkbtcoe</b> email (ending with <b>@kbtcoe.org</b>).</li>
              <li>All users must use their <b>organization email</b> to sign up or log in.</li>
              <li>If you use <b>Forgot Password</b>, please check your <b>spam/junk folder</b> for the reset link.</li>
              <li><b>Prefer Google Signup</b> for the best experience.</li>
            </ul>
            <button
              onClick={() => setShowInstructions(false)}
              className="itf-btn-primary w-full text-white font-semibold py-2 rounded-lg mt-2"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}