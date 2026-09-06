import React, { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import SignupPage from "./Signup";
import ForgotPassword from "./ForgotPassword";
import { Link } from "react-router-dom";
import { FaEnvelope, FaPhone } from "react-icons/fa";

export default function AboutUs() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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
  };

  const teamMembers = [
    {
      name: "Aarya Shewale",
      bio: "Focused on database architecture and system integration for the project.",
      role: "Roll no: 59",
      image: "/aaryas.jpg",
      email: "aaryashewale03@gmail.com",
      phone: "+91 7588095796",
    },
    {
      name: "Aarya Thombare",
      bio: "Contributed to the development of user interface and project documentation.",
      role: "Roll no: 68",
      image: "/aaryat.png",
      email: "aaryaathombre754@gmail.com",
      phone: "+91 9356837438",
    },
    {
      name: "Jayesh Bhoi",
      bio: "Contributed to developing and implementing feedback mechanisms and system solutions.",
      role: "Roll no: 10",
      image: "/jayesh4.png",
      email: "jayeshb249@gmail.com",
      phone: "+91 8208550878",
    },
    {
      name: "Udaysingh Jagtap",
      bio: "Contributed to research, design and development of the application interface.",
      role: "Roll no: 27",
      image: "/uday1.png",
      email: "Udayjagtap8684@gmail.com",
      phone: "+91 8010098286",
    },
  ];

  return (
    <div className={`relative w-full min-h-screen overflow-x-hidden itf-page ${mounted ? "itf-mounted" : ""}`}>
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

        .itf-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(60px);
          opacity: 0.5;
          pointer-events: none;
          z-index: 0;
        }
        .itf-orb--a { background: radial-gradient(circle, #bfe9ff 0%, transparent 70%); width: 420px; height: 420px; top: -100px; right: -60px; animation: itf-drift 22s ease-in-out infinite; }
        .itf-orb--b { background: radial-gradient(circle, #cdeaff 0%, transparent 70%); width: 340px; height: 340px; bottom: -120px; left: -80px; animation: itf-drift 26s ease-in-out infinite reverse; }
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

        .itf-reveal {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .itf-mounted .itf-reveal { opacity: 1; transform: translateY(0); }
        .itf-reveal.d1 { transition-delay: 0.05s; }
        .itf-reveal.d2 { transition-delay: 0.18s; }
        .itf-reveal.d3 { transition-delay: 0.32s; }

        @media (prefers-reduced-motion: reduce) {
          .itf-orb { animation: none !important; }
          .itf-reveal { transition: none !important; opacity: 1 !important; transform: none !important; }
          .itf-modal { animation: none !important; }
        }
      `}</style>

      {/* College Header Banner */}
      <div className="relative z-10 w-full py-4 border-b border-sky-100/70">
        <div className="container mx-auto max-w-screen-lg flex flex-col md:flex-row items-center justify-center px-4 text-center">
          <img src="/5.png" alt="KBTCOE Logo" className="h-16 w-auto mx-4 mb-2 md:mb-0" />
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
          <Link to="/" className="text-sky-700 hover:text-sky-500 text-sm md:text-base transition-colors">
            Home
          </Link>
          <Link to="/#features" className="text-sky-700 hover:text-sky-500 text-sm md:text-base transition-colors">
            Features
          </Link>
          <Link to="/#benefits" className="text-sky-700 hover:text-sky-500 text-sm md:text-base transition-colors">
            Benefits
          </Link>
          <Link to="/abouthome" className="text-sky-800 font-semibold text-sm md:text-base transition-colors">
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
      <section className="relative w-full px-6 md:px-12 py-16 text-center overflow-hidden">
        <div className="itf-orb itf-orb--a" />
        <div className="itf-orb itf-orb--b" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="itf-reveal d1 itf-heading text-4xl md:text-5xl font-bold text-sky-900 leading-tight">
            About <span className="itf-gradient-text">Our Project</span>
          </h2>
          <p className="itf-reveal d2 text-sky-800/80 mt-6 text-lg">
            The Innovative Teaching Feedback system is designed to bridge the gap between students and faculty,
            creating a transparent and effective learning environment at KBTCOE.
          </p>
        </div>
      </section>

      <div className="relative z-10 w-full pb-20">
        <div className="container mx-auto px-4 space-y-8">
          {/* Mission and Vision */}
          <div className="itf-glass rounded-2xl p-8">
            <h3 className="itf-heading text-2xl font-bold text-sky-900 mb-6">Our Mission & Vision</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/60 p-6 rounded-xl border border-white/70">
                <h4 className="itf-heading text-xl font-semibold text-sky-700 mb-3">Mission</h4>
                <p className="text-sky-900/80">
                  To create a responsive educational ecosystem where timely feedback leads to measurable
                  improvements in teaching methodologies and learning outcomes for all students at KBTCOE.
                </p>
              </div>
              <div className="bg-white/60 p-6 rounded-xl border border-white/70">
                <h4 className="itf-heading text-xl font-semibold text-sky-700 mb-3">Vision</h4>
                <p className="text-sky-900/80">
                  To establish KBTCOE as a pioneering institute where continuous feedback and improvement
                  become the foundation of educational excellence and student success.
                </p>
              </div>
            </div>
          </div>

          {/* Project Team Section */}
          <div className="itf-glass rounded-2xl p-8">
            <h3 className="itf-heading text-2xl font-bold text-sky-900 mb-8">Our Team</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="itf-card bg-white/60 p-6 rounded-2xl text-center border border-white/70"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-sky-100 mb-4 overflow-hidden aspect-square ring-4 ring-white/80">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentNode.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center text-3xl text-sky-700 font-semibold">
                                ${member.name.charAt(0)}
                              </div>`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl text-sky-700 font-semibold">
                          {member.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h4 className="itf-heading text-lg font-semibold text-sky-800">{member.name}</h4>
                    <p className="text-sky-600 text-sm font-medium mt-1">{member.role}</p>
                    <p className="text-sky-900/70 text-sm mt-3">{member.bio}</p>
                    <div className="flex flex-col items-center space-y-2 mt-4 text-sm text-sky-800/80">
                      <div className="flex items-center">
                        <FaEnvelope className="mr-2 text-sky-600" />
                        <a href={`mailto:${member.email}`} className="hover:text-sky-600 break-all">
                          {member.email}
                        </a>
                      </div>
                      <div className="flex items-center">
                        <FaPhone className="mr-2 text-sky-600" />
                        <span>{member.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Guide Section */}
          <div className="itf-glass rounded-2xl p-8 text-center">
            <h3 className="itf-heading text-2xl font-bold text-sky-900 mb-4">Project Guide</h3>
            <p className="itf-heading text-xl font-semibold text-sky-700">Dr. Vaishali S. Tidake</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full itf-glass border-t-0 rounded-t-3xl text-center py-6">
        <p className="text-lg text-sky-800">Innovative Teaching Feedback © 2025. All rights reserved.</p>
      </footer>

      {/* Modal Overlay for Login, Signup, and Forgot Password */}
      {(showLogin || showSignup || showForgotPassword) && (
        <div className="fixed inset-0 bg-sky-950/60 backdrop-blur-md z-50 flex items-center justify-center">
          {showLogin && (
            <div
              className="itf-modal rounded-2xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col"
              style={{ width: "900px", height: "560px" }}
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
    </div>
  );
}