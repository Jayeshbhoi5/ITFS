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

  useEffect(() => {
    const hasSeenInstructions = localStorage.getItem('hasSeenInstructions');
    if (!hasSeenInstructions) {
      setShowInstructions(true);
      localStorage.setItem('hasSeenInstructions', 'true');
    }
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
    <div className="relative w-full min-h-screen bg-white text-gray-800 overflow-x-hidden">
      {/* College Header Banner */}
      <div className="w-full bg-blue-50 py-4 border-b border-blue-100 flex items-center justify-center">
        <div className="container mx-auto max-w-screen-lg flex flex-col md:flex-row items-center justify-center px-4 text-center">
          {/* Left Logo */}
          <img src="/5.png" alt="KBTCOE Logo" className="h-16 w-auto mx-4 mb-2 md:mb-0" />

          {/* Centered Text */}
          <div className="text-center flex-1 w-full">
            <h2 className="text-blue-800 font-bold text-lg md:text-xl">Maratha Vidya Prasarak Samaj's</h2>
            <h1 className="text-blue-900 font-bold text-xl md:text-2xl whitespace-nowrap">
              Karmaveer Adv. Baburao Ganpatrao Thakare College of Engineering
            </h1>
            <p className="text-blue-700 text-sm md:text-base">
              Udoji Maratha Boarding Campus, Near Pumping Station, Gangapur Road, Nashik
            </p>
            <p className="text-blue-600 text-xs md:text-sm">
              An Autonomous Institute Permanently affiliated to Savitribai Phule Pune University
            </p>
          </div>
          <div className="flex items-center mt-2 md:mt-0">
            <img 
              src="/6.png" 
              alt="Accreditation Badges" 
              className="h-12 w-auto mx-2"
            />
            <img 
              src="/7.png" 
              alt="Accreditation Badges" 
              className="h-12 w-auto mx-0"
            />
          </div>
        </div>
      </div>

      <nav className="sticky top-2 w-full flex justify-between items-center px-4 py-3 bg-white shadow-md z-10">
        <h1 className="text-2xl font-bold">
          <span className="text-blue-700">Innovative Teaching Feedback</span>
        </h1>
        <div className="space-x-4 flex items-center">
          <a href="#features" className="text-blue-900 hover:text-blue-700 text-sm md:text-base">Features</a>
          <a href="#benefits" className="text-blue-900 hover:text-blue-700 text-sm md:text-base">Benefits</a>
          {/* Changed "Team" to "About Us" and linked to separate page */}
          <Link to="/abouthome" className="text-blue-900 hover:text-blue-700 text-sm md:text-base">About Us</Link>
          <button 
            className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-2 text-sm md:text-base rounded font-medium transition-all duration-200"
            onClick={openSignup}
          >
            Sign Up
          </button>
        </div>
      </nav>

      <section className="flex flex-col md:flex-row items-center justify-between px-6 py-20 min-h-[80vh] w-full bg-gradient-to-b from-white to-blue-50 relative">
        <div className="w-full md:w-1/2 text-center md:text-left mb-10 md:mb-0">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-900">
            Enhancing Education with <span className="text-blue-600">Smart Feedback</span>
          </h2>
          <p className="text-gray-700 mt-6 max-w-2xl text-lg">
            A seamless platform for faculty and students to engage in meaningful feedback, driving educational excellence at KBTCOE.
          </p>
          <button 
            className="mt-8 bg-blue-700 hover:bg-blue-600 text-white px-6 py-3 text-lg rounded font-medium transition-all duration-200"
            onClick={openSignup}
          >
            Get Started
          </button>
        </div>
        <div className="w-full md:w-1/2 flex justify-center">
          <img 
            src="/2.jpg"  
            alt="KBTCOE Building" 
            className="rounded-lg w-full max-w-xl h-auto shadow-xl"
          />
        </div>
        {/* Blue gradient extended further down */}
        <div 
          className="absolute left-0 right-0 bottom-0 h-48 bg-gradient-to-b from-blue-50 to-transparent" 
          style={{marginBottom: "-120px"}}
        ></div>
      </section>

      <section id="features" className="w-full py-24 px-6 bg-white text-center relative z-10 mt-19">
        <h3 className="text-3xl md:text-4xl font-bold text-blue-900">Features</h3>
        <p className="text-gray-700 mt-4 text-lg">Explore what makes our feedback system effective.</p>
        <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-6xl mx-auto">
          <div className="p-8 bg-blue-50 rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow duration-300">
            <FaCheckCircle className="text-blue-600 text-5xl mx-auto" />
            <h4 className="text-xl font-semibold mt-6 text-blue-800">Real-time Feedback</h4>
            <p className="text-gray-700 mt-3">
              Instant communication between faculty and students for timely improvement.
            </p>
          </div>
          <div className="p-8 bg-blue-50 rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow duration-300">
            <FaCheckCircle className="text-blue-600 text-5xl mx-auto" />
            <h4 className="text-xl font-semibold mt-6 text-blue-800">Performance Analytics</h4>
            <p className="text-gray-700 mt-3">
              Track student progress and identify teaching effectiveness patterns.
            </p>
          </div>
          <div className="p-8 bg-blue-50 rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow duration-300">
            <FaCheckCircle className="text-blue-600 text-5xl mx-auto" />
            <h4 className="text-xl font-semibold mt-6 text-blue-800">Customized Rubrics</h4>
            <p className="text-gray-700 mt-3">
              Structured assessment criteria for consistent and clear feedback.
            </p>
          </div>
        </div>
      </section>

      <section id="benefits" className="w-full py-20 px-6 text-center bg-blue-50 text-gray-800">
        <h3 className="text-3xl md:text-4xl font-bold text-blue-900">Benefits</h3>
        <div className="grid md:grid-cols-2 gap-8 mt-10 max-w-5xl mx-auto">
          <div className="flex items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <FaCheckCircle className="text-blue-600 text-2xl mr-4 flex-shrink-0" />
            <span className="text-lg">Enhanced Communication – Transparent and structured feedback sharing.</span>
          </div>
          <div className="flex items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <FaCheckCircle className="text-blue-600 text-2xl mr-4 flex-shrink-0" />
            <span className="text-lg">Continuous Improvement – Helps improve teaching and learning experiences.</span>
          </div>
          <div className="flex items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <FaCheckCircle className="text-blue-600 text-2xl mr-4 flex-shrink-0" />
            <span className="text-lg">Data-Driven Insights – Valuable analytics for decision-making.</span>
          </div>
          <div className="flex items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <FaCheckCircle className="text-blue-600 text-2xl mr-4 flex-shrink-0" />
            <span className="text-lg">Engagement & Collaboration – Encourages participation from students and faculty.</span>
          </div>
        </div>
      </section>

      
      <footer className="w-full bg-blue-900 text-white text-center py-4">
        <p className="text-lg">Innovative Teaching Feedback © 2025. All rights reserved.</p>
      </footer>

      {/* Modal Overlay for Login, Signup, and Forgot Password */}
      {(showLogin || showSignup || showForgotPassword) && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center">
          {/* Login Modal */}
          {showLogin && (
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-0 mx-4 overflow-hidden" style={{ width: '892px', height: '600px' }}>
              <div className="flex h-full flex-shrink-0">
                {/* Left side - College Image */}
                <div className="hidden md:block w-1/2 bg-blue-100">
                  <img 
                    src="/8.png" 
                    alt="KBTCOE Campus" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Right side - Login Form */}
                <div className="w-full md:w-1/2 p-4 flex flex-col justify-center h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-blue-900">Log In</h2>
                    <button 
                      onClick={closeModals}
                      className="text-gray-600 hover:text-gray-800 text-2xl bg-transparent"
                    >
                      ×
                    </button>
                  </div>
                  {/* College Logo above login */}
                  <div className="flex justify-center mb-9">
                    <img 
                      src="/5.png" 
                      alt="KBTCOE Logo" 
                      className="h-20 w-auto"
                    />
                  </div>
                  <LoginPage 
                    onClose={closeModals} 
                    toggleSignup={openSignup}
                    toggleForgotPassword={openForgotPassword}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Signup Modal */}
          {showSignup && (
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-0 mx-5 overflow-hidden" style={{ width: '892px', height: '600px' }}>
              <div className="flex h-full flex-shrink-0"> 
                {/* Left side - College Image */}
                <div className="hidden md:block w-1/2 bg-blue-100">
                  <img 
                    src="/8.png" 
                    alt="KBTCOE Campus" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Right side - Signup Form */}
                <div className="w-full md:w-1/2 p-4 flex flex-col justify-center h-full">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-bold text-blue-900">Sign Up</h2>
                    <button 
                      onClick={closeModals}
                      className="text-gray-600 hover:text-gray-800 text-xl bg-transparent"
                    >
                      ×
                    </button>
                  </div>
                  {/* College Logo above signup */}
                  <div className="flex justify-center mb-3">
                    <img 
                      src="/5.png" 
                      alt="KBTCOE Logo" 
                      className="h-12 w-auto"
                    />
                  </div>
                  <SignupPage 
                    onClose={closeModals} 
                    toggleLogin={openLogin}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-0 mx-4 overflow-hidden" style={{ width: '892px', height: '600px' }}>
              <div className="flex h-full flex-shrink-0">
                {/* Left side - College Image */}
                <div className="hidden md:block w-1/2 bg-blue-100">
                  <img 
                    src="/8.png" 
                    alt="KBTCOE Campus" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Right side - Forgot Password Form */}
                <div className="w-full md:w-1/2 p-4 flex flex-col justify-center h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-blue-900">Reset Password</h2>
                    <button 
                      onClick={closeModals}
                      className="text-gray-600 hover:text-gray-800 text-2xl bg-transparent"
                    >
                      ×
                    </button>
                  </div>
                  {/* College Logo above form */}
                  <div className="flex justify-center mb-0">
                    <img 
                      src="/5.png" 
                      alt="KBTCOE Logo" 
                      className="h-20 w-auto"
                    />
                  </div>
                  <ForgotPassword 
                    onClose={closeModals}
                    toggleLogin={openLogin}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* First-time Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-8 relative flex flex-col items-center">
            <img src="/5.png" alt="KBTCOE Logo" className="h-16 w-auto mb-4 mx-auto" />
            <h2 className="text-2xl font-bold text-blue-800 mb-4 text-center">Welcome to Innovative Teaching Feedback</h2>
            <ul className="list-disc pl-6 text-gray-800 text-base space-y-2 mb-4">
              <li><b>HODs</b> should use their respective organization email (ending with <b>@kbtcoe.org</b> or the official HOD email).</li>
              <li><b>Faculty</b> should use their respective organization email (ending with <b>@kbtcoe.org</b>).</li>
              <li><b>Students</b> must use their respective <b>kbtug</b> or <b>stkbtcoe</b> email (ending with <b>@kbtcoe.org</b>).</li>
              <li>All users must use their <b>organization email</b> to sign up or log in.</li>
              <li>If you use <b>Forgot Password</b>, please check your <b>spam/junk folder</b> for the reset link.</li>
              <li><b>Prefer Google Signup</b> for the best experience.</li>
            </ul>
            <button
              onClick={() => setShowInstructions(false)}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg mt-2 transition"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}