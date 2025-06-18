import React, { useState, useEffect } from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import Navbar from './FacultyDashboard/Navbar';
import Sidebar from './FacultyDashboard/Sidebar';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  // Initialize dark mode state safely
  const [darkMode, setDarkMode] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === null) return false;
        return JSON.parse(savedMode);
      }
    } catch (e) {
      console.error("Error parsing darkMode from localStorage:", e);
      localStorage.removeItem('darkMode'); // Clean up invalid value
    }
    return false;
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    try {
      localStorage.setItem('darkMode', JSON.stringify(newMode));
    } catch (e) {
      console.error("Error saving darkMode to localStorage:", e);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const teamMembers = [
    {
      name: 'Aarya Shewale',
      bio: 'Focused on database architecture and system integration for the project.',
      role: 'Roll no: 59',
      image: '/aaryas.jpg',
      github: 'https://github.com/aryashewale',
      linkedin: 'https://linkedin.com/in/aryashewale'
    },      
    {
      name: 'Aarya Thombare',
      bio: 'Contributed to the development of user interface and project documentation.',
      role: 'Roll no: 68',
      image: '/aaryat.png',
      github: 'https://github.com/aaryathombare',
      linkedin: 'https://linkedin.com/in/aaryathombare'
    },
    {
      name: 'Jayesh Bhoi',
      bio: 'Specialized in system development & implementation of feedback mechanisms.',
      role: 'Roll no: 10',
      image: '/jayesh4.png',
      github: 'https://github.com/jayeshbhoi',
      linkedin: 'https://linkedin.com/in/jayeshbhoi'
    },
    {
      name: 'Udaysingh Jagtap',
      bio: 'Contributed to research, design and development of the application interface.',
      role: 'Roll no: 27',
      image: '/uday1.png',
      github: 'https://github.com/udayjagtap',
      linkedin: 'https://linkedin.com/in/udayjagtap'
    }
  ];

  return (
    <div className={`relative w-full min-h-screen ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
      {/* Fixed Navbar with no border */}
      <div className={`fixed top-0 left-0 right-4 z-50 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <Navbar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode}
          toggleSidebar={toggleSidebar}
          showProfileMenu={showProfileMenu}
          toggleProfileMenu={toggleProfileMenu}
          sidebarOpen={sidebarOpen}
        />
      </div>

      <div className="flex pt-16"> {/* Add pt-16 to account for fixed navbar height */}
        {/* Sidebar with dark mode toggle */}
        <Sidebar 
          darkMode={darkMode} 
          sidebarOpen={sidebarOpen}
          toggleDarkMode={toggleDarkMode}
        />

        {/* Main content area with seamless transition */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-8">
            <div className="max-w-6xl mx-auto">
              {/* About Section */}
              <section className="mb-16">
                <h1 className="text-4xl font-bold mb-6">About Us</h1>
                <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className="text-lg mb-4">
                    Welcome to Innovative Teaching Feedback, a platform designed to enhance the teaching-learning experience through effective feedback mechanisms.
                  </p>
                  <p className="text-lg mb-4">
                    Our mission is to bridge the gap between students and faculty by providing a seamless feedback system that helps improve teaching methodologies and student engagement.
                  </p>
                  <p className="text-lg">
                    We believe in the power of constructive feedback and its role in creating a better educational environment for everyone involved.
                  </p>
                </div>
              </section>
              <div className={`rounded-xl shadow-lg p-8 mb-12 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>Our Mission & Vision</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                    <h4 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>Mission</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      To create a responsive educational ecosystem where timely feedback leads to measurable improvements in teaching methodologies and learning outcomes for all students at KBTCOE.
                    </p>
                  </div>
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                    <h4 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>Vision</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      To establish KBTCOE as a pioneering institute where continuous feedback and improvement become the foundation of educational excellence and student success.
                    </p>
                  </div>
                </div>
              </div>

              {/* Team Section */}
              <div className={`rounded-xl shadow-lg p-8 mb-12 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-2xl font-bold mb-8 ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>Our Team</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {teamMembers.map((member, index) => (
                    <div key={index} className={`p-6 rounded-lg text-center hover:shadow-md transition duration-300 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex flex-col items-center">
                        <div className={`w-40 h-40 rounded-full mb-4 overflow-hidden aspect-square ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          {member.image ? (
                            <img 
                              src={member.image} 
                              alt={member.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center text-4xl ${darkMode ? 'text-blue-400' : 'text-blue-800'} font-medium">
                                    ${member.name.charAt(0)}
                                  </div>`;
                              }}
                            />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-4xl ${darkMode ? 'text-blue-400' : 'text-blue-800'} font-medium`}>
                              {member.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <h4 className={`text-xl font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>{member.name}</h4>
                        <p className={`font-medium mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{member.role}</p>
                        <p className={`mt-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{member.bio}</p>
                        <div className="flex space-x-4 mt-4">
                          <a 
                            href={member.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-full ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-blue-400' : 'bg-gray-200 hover:bg-gray-300 text-blue-800'}`}
                          >
                            <FaGithub />
                          </a>
                          <a 
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-full ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-blue-400' : 'bg-gray-200 hover:bg-gray-300 text-blue-800'}`}
                          >
                            <FaLinkedin />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Details - Fixed with dark mode support */}
              <div className={`rounded-xl shadow-lg p-8 mb-12 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>Project Details</h3>
                <div className="space-y-6">
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                    <h4 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>Technologies Used</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className={`p-4 rounded shadow-sm ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-100'}`}>
                        <h5 className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Frontend</h5>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>React.js, Tailwind CSS</p>
                      </div>
                      <div className={`p-4 rounded shadow-sm ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-100'}`}>
                        <h5 className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Backend</h5>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Firebase (Firestore Database, Authentication)</p>
                      </div>
                      <div className={`p-4 rounded shadow-sm ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-100'}`}>
                        <h5 className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Deployment</h5>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Firebase Hosting</p>
                      </div>
                      <div className={`p-4 rounded shadow-sm ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-100'}`}>
                        <h5 className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Media Management</h5>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Cloudinary</p>
                      </div>
                    </div>
                  </div>
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                    <h4 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>Project Features</h4>
                    <ul className={`list-disc pl-6 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <li>Personalized feedback dashboards for faculty members</li>
                      <li>Anonymous student feedback submission system</li>
                      <li>Data visualization of teaching effectiveness metrics</li>
                      <li>Automated report generation and trend analysis</li>
                      <li>Multi-level user access for students, faculty, and administrators</li>
                    </ul>
                  </div>
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                    <h4 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>Project Impact</h4>
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      The Innovative Teaching Feedback system aims to transform the educational experience at KBTCOE by:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded shadow-sm ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-100'}`}>
                        <h5 className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>For Students</h5>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Providing a voice in their educational journey and improving the quality of instruction they receive.</p>
                      </div>
                      <div className={`p-4 rounded shadow-sm ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-100'}`}>
                        <h5 className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>For Faculty</h5>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Offering actionable insights to enhance teaching effectiveness and professional development.</p>
                      </div>
                    </div>
                  </div>
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                    <h4 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>Future Enhancements</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Our roadmap includes integrating AI-powered analytics to provide deeper insights 
                      into teaching patterns, expanding the platform to include peer evaluation systems, 
                      and developing mobile applications for increased accessibility.
                    </p>
                  </div>
                </div>
              </div>

              {/* Development Process - Fixed with dark mode support */}
              <div className={`rounded-xl shadow-lg p-8 mt-12 mb-12 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>Development Process</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                    <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>Research Phase</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Comprehensive analysis of existing feedback systems and identification of key requirements for KBTCOE's unique educational environment.
                    </p>
                  </div>
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                    <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>Development Phase</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Collaborative approach to system architecture, frontend design, and backend implementation with continuous testing and refinement.
                    </p>
                  </div>
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                    <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>Implementation Phase</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Phased rollout with pilot testing, user training sessions, and incremental feature additions based on initial user feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;