import React, { useState } from "react";
import LoginPage from "./LoginPage";
import SignupPage from "./Signup";
import ForgotPassword from "./ForgotPassword";
import { Link } from "react-router-dom";
import { FaUserGraduate, FaLaptopCode, FaCode, FaDatabase, FaEnvelope, FaPhone } from "react-icons/fa";

export default function AboutUs() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
      name: 'Aarya Shewale',
      bio: 'Focused on database architecture and system integration for the project.',
      role: 'Roll no: 59',
      image: '/aaryas.jpg', // Add path to image
      email: 'aaryashewale03@gmail.com',
      phone: '+91 7588095796'
    },      
    {
      name: 'Aarya Thombare',
      bio: 'Contributed to the development of user interface and project documentation.',
      role: 'Roll no: 68',
      image: '/aaryat.png', 
      email: 'aaryaathombre754@gmail.com',
      phone: '+91 9356837438'
    },
    {
      name: 'Jayesh Bhoi',
      bio: 'Specialized in system development & implementation of feedback mechanisms.',
      role: 'Roll no: 10',
      image: '/jayesh4.png', 
      email: 'jayeshb249@gmail.com',
      phone: '+91 8208550878'
    },
    {
      name: 'Udaysingh Jagtap',
      bio: 'Contributed to research, design and development of the application interface.',
      role: 'Roll no: 27',
      image: '/uday1.png', // Add path to image
      email: 'Udayjagtap8684@gmail.com',
      phone: '+91 8010098286'
    }
  ];

  return (
    <div className="relative w-full min-h-screen bg-white text-gray-800 overflow-x-hidden">
      {/* College Header Banner - Kept the same as HomePage */}
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

      {/* Navigation - Kept the same as HomePage */}
      <nav className="sticky top-2 w-full flex justify-between items-center px-4 py-3 bg-white shadow-md z-10">
        <h1 className="text-2xl font-bold">
          <span className="text-blue-700">Innovative Teaching Feedback</span>
        </h1>
        <div className="space-x-4 flex items-center">
          <Link to="/" className="text-blue-900 hover:text-blue-700 text-sm md:text-base">Home</Link>
          <Link to="/#features" className="text-blue-900 hover:text-blue-700 text-sm md:text-base">Features</Link>
          <Link to="/#benefits" className="text-blue-900 hover:text-blue-700 text-sm md:text-base">Benefits</Link>
          <Link to="/abouthome" className="text-blue-900 hover:text-blue-700 font-bold text-sm md:text-base">About Us</Link>
          <button 
            className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-2 text-sm md:text-base rounded font-medium transition-all duration-200"
            onClick={openSignup}
          >
            Sign Up
          </button>
        
        </div>
      </nav>

      {/* About Us Content with white background */}
      <div className="bg-white min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-900 mb-6">About Our Project</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              The Innovative Teaching Feedback system is designed to bridge the gap between students and faculty, 
              creating a transparent and effective learning environment at KBTCOE.
            </p>
          </div>

          {/* Mission and Vision */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-12 border border-gray-200">
            <h3 className="text-2xl font-bold text-blue-900 mb-6">Our Mission & Vision</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h4 className="text-xl font-semibold text-blue-800 mb-4">Mission</h4>
                <p className="text-gray-700">
                  To create a responsive educational ecosystem where timely feedback leads to measurable 
                  improvements in teaching methodologies and learning outcomes for all students at KBTCOE.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h4 className="text-xl font-semibold text-blue-800 mb-4">Vision</h4>
                <p className="text-gray-700">
                  To establish KBTCOE as a pioneering institute where continuous feedback and improvement 
                  become the foundation of educational excellence and student success.
                </p>
              </div>
            </div>
          </div>

          {/* Project Team Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-12 border border-gray-200">
  <h3 className="text-2xl font-bold text-blue-900 mb-8">Our Team</h3>
  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
    {teamMembers.map((member, index) => (
      <div key={index} className="bg-gray-50 p-6 rounded-lg text-center hover:shadow-md transition duration-300 border border-gray-100">
        <div className="flex flex-col items-center">
          {/* Circular image container with fixed size */}
          <div className="w-40 h-40 rounded-full bg-gray-200 mb-4 overflow-hidden aspect-square">
            {member.image ? (
              <img 
                src={member.image} 
                alt={member.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center text-4xl text-blue-800 font-medium">
                      ${member.name.charAt(0)}
                    </div>`;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-blue-800 font-medium">
                {member.name.charAt(0)}
              </div>
            )}
          </div>
          <h4 className="text-xl font-semibold text-blue-800">{member.name}</h4>
          <p className="text-gray-700 font-medium mt-1">{member.role}</p>
          <p className="text-gray-600 mt-3">{member.bio}</p>
          <div className="flex flex-col items-center space-y-2 mt-4 text-sm text-gray-600">
            <div className="flex items-center">
              <FaEnvelope className="mr-2 text-blue-800" />
              <a href={`mailto:${member.email}`} className="hover:text-blue-600">{member.email}</a>
            </div>
            <div className="flex items-center">
              <FaPhone className="mr-2 text-blue-800" />
              <span>{member.phone}</span>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>

{/* Project Guide Section */}
<div className="bg-white rounded-xl shadow-lg p-8 mb-12 border border-gray-200">
  <h3 className="text-2xl font-bold text-blue-900 mb-4 text-center">Project Guide</h3>
  <div className="text-center">
    <p className="text-xl font-semibold text-gray-800">Dr. Vaishali S. Tidake</p>
  </div>
</div>

          {/* Project Details */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-blue-900 mb-6">Project Details</h3>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h4 className="text-xl font-semibold text-blue-800 mb-3">Technologies Used</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                    <h5 className="font-medium text-blue-700">Frontend</h5>
                    <p className="text-gray-700">React.js, Tailwind CSS</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                    <h5 className="font-medium text-blue-700">Backend</h5>
                    <p className="text-gray-700">Firebase (Firestore Database, Authentication)</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                    <h5 className="font-medium text-blue-700">Deployment</h5>
                    <p className="text-gray-700">Firebase Hosting</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                    <h5 className="font-medium text-blue-700">Media Management</h5>
                    <p className="text-gray-700">Cloudinary</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h4 className="text-xl font-semibold text-blue-800 mb-3">Project Features</h4>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Personalized feedback dashboards for faculty members</li>
                  <li>Anonymous student feedback submission system</li>
                  <li>Data visualization of teaching effectiveness metrics</li>
                  <li>Automated report generation and trend analysis</li>
                  <li>Multi-level user access for students, faculty, and administrators</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h4 className="text-xl font-semibold text-blue-800 mb-3">Project Impact</h4>
                <p className="text-gray-700 mb-4">
                  The Innovative Teaching Feedback system aims to transform the educational experience at KBTCOE by:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                    <h5 className="font-medium text-blue-700">For Students</h5>
                    <p className="text-gray-700">Providing a voice in their educational journey and improving the quality of instruction they receive.</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                    <h5 className="font-medium text-blue-700">For Faculty</h5>
                    <p className="text-gray-700">Offering actionable insights to enhance teaching effectiveness and professional development.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h4 className="text-xl font-semibold text-blue-800 mb-3">Future Enhancements</h4>
                <p className="text-gray-700">
                  Our roadmap includes integrating AI-powered analytics to provide deeper insights 
                  into teaching patterns, expanding the platform to include peer evaluation systems, 
                  and developing mobile applications for increased accessibility.
                </p>
              </div>
            </div>
          </div>
          
          {/* Project Development Process */}
          <div className="bg-white rounded-xl shadow-lg p-8 mt-12 border border-gray-200">
            <h3 className="text-2xl font-bold text-blue-900 mb-6">Development Process</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h4 className="text-lg font-semibold text-blue-800 mb-3">Research Phase</h4>
                <p className="text-gray-700">
                  Comprehensive analysis of existing feedback systems and identification of key requirements for KBTCOE's unique educational environment.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h4 className="text-lg font-semibold text-blue-800 mb-3">Development Phase</h4>
                <p className="text-gray-700">
                  Collaborative approach to system architecture, frontend design, and backend implementation with continuous testing and refinement.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h4 className="text-lg font-semibold text-blue-800 mb-3">Implementation Phase</h4>
                <p className="text-gray-700">
                  Phased rollout with pilot testing, user training sessions, and incremental feature additions based on initial user feedback.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full bg-blue-900 text-white text-center py-4">
        <p className="text-lg">Innovative Teaching Feedback © 2025. All rights reserved.</p>
      </footer>

      {/* Modal Overlay for Login, Signup, and Forgot Password - Same as HomePage */}
      {(showLogin || showSignup || showForgotPassword) && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center">
          {/* Login Modal */}
          {showLogin && (
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-0 mx-4 overflow-hidden">
              <div className="flex h-[500px]">
                {/* Left side - College Image */}
                <div className="hidden md:block w-1/2 bg-blue-100">
                  <img 
                    src="/8.png" 
                    alt="KBTCOE Campus" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Right side - Login Form */}
                <div className="w-full md:w-1/2 p-6">
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
                  <div className="flex justify-center mb-6">
                    <img 
                      src="/5.png" 
                      alt="KBTCOE Logo" 
                      className="h-16 w-auto"
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-0 mx-5 overflow-hidden">
              <div className="flex h-[600px] md:h-[600px]"> 
                {/* Left side - College Image */}
                <div className="hidden md:block w-1/2 bg-blue-100">
                  <img 
                    src="/8.png" 
                    alt="KBTCOE Campus" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Right side - Signup Form */}
                <div className="w-full md:w-1/2 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-blue-900">Sign Up</h2>
                    <button 
                      onClick={closeModals}
                      className="text-gray-600 hover:text-gray-800 text-2xl bg-transparent"
                    >
                      ×
                    </button>
                  </div>
                  {/* College Logo above signup */}
                  <div className="flex justify-center mb-6">
                    <img 
                      src="/5.png" 
                      alt="KBTCOE Logo" 
                      className="h-16 w-auto"
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-0 mx-4 overflow-hidden">
              <div className="flex h-[400px]">
                {/* Left side - College Image */}
                <div className="hidden md:block w-1/2 bg-blue-100">
                  <img 
                    src="/8.png" 
                    alt="KBTCOE Campus" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Right side - Forgot Password Form */}
                <div className="w-full md:w-1/2 p-6">
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
                  <div className="flex justify-center mb-6">
                    <img 
                      src="/5.png" 
                      alt="KBTCOE Logo" 
                      className="h-16 w-auto"
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
    </div>
  );
}