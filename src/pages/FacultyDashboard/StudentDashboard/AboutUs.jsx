import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaPhone } from 'react-icons/fa';
import Navbar from './Navbar'; // Correct: Use Student's Navbar
import StudentSidebar from './StudentSidebar'; // Correct: Use Student's Sidebar
import { Link } from 'react-router-dom';
import { useUserSession } from '../../UserSessionContext';
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';

const StudentAboutUs = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode ? JSON.parse(savedMode) : false;
      }
    } catch (e) {
      console.error("Error parsing darkMode from localStorage:", e);
    }
    return false;
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);

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

  const { user } = useUserSession();

  const teamMembers = [
    {
      name: 'Aarya Shewale',
      bio: 'Focused on database architecture and system integration for the project.',
      role: 'Roll no: 59',
      image: '/aaryas.jpg',
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
      image: '/uday1.png',
      email: 'Udayjagtap8684@gmail.com',
      phone: '+91 8010098286'
    }
  ];

  const handleEditDepartment = () => {
    if (user && user.role === 'Student') {
      setShowDeptModal(true);
    }
  };

  return (
    <div className={`relative w-full min-h-screen ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
      <DepartmentSelectionModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onSubmit={() => setShowDeptModal(false)}
        userType={'student'}
        currentDepartments={user?.departments || []}
        canEdit={true}
      />
      <div className={`fixed top-0 left-0 right-4 z-50 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <Navbar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode}
          toggleSidebar={toggleSidebar}
          showProfileMenu={showProfileMenu}
          toggleProfileMenu={toggleProfileMenu}
          sidebarOpen={sidebarOpen}
          user={user}
          onEditDepartment={handleEditDepartment}
        />
      </div>

      <div className="flex pt-16">
        <StudentSidebar 
          darkMode={darkMode} 
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          toggleDarkMode={toggleDarkMode}
          user={user}
        />

        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className={`text-4xl font-bold mb-6 ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>About Our Project</h2>
                <p className={`text-xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  The Innovative Teaching Feedback system is designed to bridge the gap between students and faculty, 
                  creating a transparent and effective learning environment at KBTCOE.
                </p>
              </div>

              {/* Mission and Vision */}
              <div className={`rounded-xl shadow-lg p-8 mb-12 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>Our Mission & Vision</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                    <h4 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>Mission</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      To create a responsive educational ecosystem where timely feedback leads to measurable 
                      improvements in teaching methodologies and learning outcomes for all students at KBTCOE.
                    </p>
                  </div>
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                    <h4 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>Vision</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      To establish KBTCOE as a pioneering institute where continuous feedback and improvement 
                      become the foundation of educational excellence and student success.
                    </p>
                  </div>
                </div>
              </div>

              {/* Project Team Section */}
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
                                e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-4xl ${darkMode ? 'text-blue-400' : 'text-blue-800'} font-medium">${member.name.charAt(0)}</div>`;
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
                        <div className={`flex flex-col items-center space-y-2 mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <div className="flex items-center">
                            <FaEnvelope className={`mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`} />
                            <a href={`mailto:${member.email}`} className={`hover:text-blue-600 ${darkMode ? 'hover:text-blue-300' : ''}`}>{member.email}</a>
                          </div>
                          <div className="flex items-center">
                            <FaPhone className={`mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`} />
                            <span>{member.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Guide Section */}
              <div className={`rounded-xl shadow-lg p-8 mb-12 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-2xl font-bold mb-4 text-center ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>Project Guide</h3>
                <div className="text-center">
                  <p className={`text-xl font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Dr. Vaishali S. Tidake</p>
                </div>
              </div>

              {/* Project Details */}
              <div className={`rounded-xl shadow-lg p-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
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
                    <h4 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>Key Features</h4>
                    <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <li>Role-based access control (Student, Faculty, HOD)</li>
                      <li>Secure authentication and feedback submission</li>
                      <li>Faculty can upload and manage teaching activities</li>
                      <li>Students can provide feedback on activities</li>
                      <li>Dashboard with insightful metrics for all user roles</li>
                    </ul>
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

export default StudentAboutUs;
