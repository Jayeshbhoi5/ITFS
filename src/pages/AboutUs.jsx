import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaPhone } from 'react-icons/fa';
import Navbar from './FacultyDashboard/Navbar';
import Sidebar from './FacultyDashboard/Sidebar';
import { Link } from 'react-router-dom';
import { useUserSession } from '../UserSessionContext';
import DepartmentSelectionModal from '../components/DepartmentSelectionModal';
import Toast from '../components/Toast';
import {
  getDarkModeFromStorage,
  setDarkModeInStorage,
} from './FacultyDashboard/darkModeUtils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const AboutUs = () => {

  const [darkMode, setDarkMode] = useState(() => getDarkModeFromStorage());

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('sidebarOpen')) || false;
    } catch {
      return false;
    }
  });

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [mounted] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setDarkModeInStorage(newMode);
  };

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'darkMode') {
        setDarkMode(e.newValue === 'enabled');
      }
    };

    window.addEventListener('storage', onStorage);

    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const { user, setUser } = useUserSession();

  const teamMembers = [
    {
      name: 'Aarya Shewale',
      bio: 'Focused on database architecture and system integration for the project.',
      role: 'Roll no: 59',
      image: '/aaryas.jpg',
      email: 'aaryashewale03@gmail.com',
      phone: '+91 7588095796',
    },
    {
      name: 'Aarya Thombare',
      bio: 'Contributed to the development of user interface and project documentation.',
      role: 'Roll no: 68',
      image: '/aaryat.png',
      email: 'aaryaathombre754@gmail.com',
      phone: '+91 9356837438',
    },
    {
      name: 'Jayesh Bhoi',
      bio: 'Contributed to developing & implementing feedback mechanisms & system solutions.',
      role: 'Roll no: 10',
      image: '/jayesh4.png',
      email: 'jayeshb249@gmail.com',
      phone: '+91 8208550878',
    },
    {
      name: 'Udaysingh Jagtap',
      bio: 'Contributed to research, design and development of the application interface.',
      role: 'Roll no: 27',
      image: '/uday1.png',
      email: 'Udayjagtap8684@gmail.com',
      phone: '+91 8010098286',
    },
  ];

  const handleEditDepartment = () => {
    if (user && (user.role === 'Faculty' || user.role === 'Student')) {
      setShowDeptModal(true);
    }
  };

  const handleDepartmentSubmit = async (data) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);

    // Close modal instantly with ZERO delay & show toast immediately
    setShowDeptModal(false);
    setToast({ show: true, message: 'Department updated successfully!', type: 'success' });

    if (user.role === 'Faculty') {
      if (setUser) {
        setUser({ ...user, departments: data.departments, primaryDepartment: data.primaryDepartment });
      }
      try {
        await updateDoc(userRef, {
          departments: data.departments,
          primaryDepartment: data.primaryDepartment,
        });
      } catch (err) {
        console.error('Error updating department in Firestore:', err);
        setToast({ show: true, message: 'Failed to update department.', type: 'error' });
      }
    } else {
      const activeAy = data.academicYear || getCurrentAcademicYear();
      const newChangeCount = (user.departmentChangeCount || 0) + 1;
      if (setUser) {
        setUser({
          ...user,
          departments: data.departments,
          year: data.year,
          academicYear: activeAy,
          baseYear: data.year,
          yearSelectedAt: data.yearSelectedAt,
          departmentChangeCount: newChangeCount,
        });
      }
      try {
        await updateDoc(userRef, {
          departments: data.departments,
          year: data.year,
          academicYear: activeAy,
          baseYear: data.year,
          yearSelectedAt: data.yearSelectedAt,
          departmentChangeCount: newChangeCount,
        });
      } catch (err) {
        console.error('Error updating department in Firestore:', err);
        setToast({ show: true, message: 'Failed to update department.', type: 'error' });
      }
    }
  };


  return (
    <div
      className={`faculty-about-page min-h-screen transition-colors duration-300 ${
        darkMode
          ? 'bg-gray-900 text-gray-100'
          : 'bg-white text-gray-800'
      }`}
    >
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          darkMode={darkMode}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <style>{`
        .faculty-about-page {
          --faculty-teal: #10465a;
          --faculty-cyan: #28b8f0;
          --faculty-blue: #2563eb;
        }

        .faculty-about-heading {
          color: var(--faculty-teal);
        }

        .faculty-about-accent {
          color: var(--faculty-cyan);
        }

        .faculty-about-icon {
          color: var(--faculty-blue);
          flex-shrink: 0;
        }

        .faculty-about-panel {
          border: 1px solid #dbeafe;
          border-radius: 1rem;
          background: #ffffff;
          box-shadow: 0 4px 16px rgba(16, 70, 90, 0.045);
        }

        .faculty-about-card {
          min-width: 0;
          border: 1px solid #dbeafe;
          border-radius: 1rem;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .faculty-about-card:hover {
          border-color: #93dafa;
          box-shadow: 0 6px 18px rgba(16, 70, 90, 0.08);
        }

        .faculty-about-avatar-ring {
          padding: 4px;
          border: 2px solid #28b8f0;
          border-radius: 9999px;
        }

        .faculty-about-email-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: 100%;
          min-width: 0;
        }

        .faculty-about-email {
          white-space: nowrap;
          overflow: visible;
          font-size: 12px;
          line-height: 1.5;
          color: #1d4ed8;
          text-decoration: none;
        }

        .faculty-about-email:hover {
          text-decoration: underline;
        }

        .faculty-about-guide {
          border-radius: 1rem;
          border: 1px solid #dbeafe;
          border-left: 4px solid #28b8f0;
          border-right: 4px solid #28b8f0;
          background: #ffffff;
          box-shadow: 0 4px 16px rgba(16, 70, 90, 0.045);
        }

        .faculty-about-dark .faculty-about-heading {
          color: #7dd3fc;
        }

        .faculty-about-dark .faculty-about-panel,
        .faculty-about-dark .faculty-about-card,
        .faculty-about-dark .faculty-about-guide {
          background: #1f2937;
          border-color: #374151;
        }

        .faculty-about-dark .faculty-about-card:hover {
          border-color: #38bdf8;
        }

        .faculty-about-dark .faculty-about-email {
          color: #93c5fd;
        }

        .faculty-about-dark .faculty-about-guide {
          border-left-color: #28b8f0;
          border-right-color: #28b8f0;
        }

        @media (max-width: 640px) {
          .faculty-about-email {
            font-size: 11px;
          }
        }
      `}</style>

      {/* Department Selection Modal */}
      <DepartmentSelectionModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onSubmit={handleDepartmentSubmit}
        userType={user?.role === 'Faculty' ? 'faculty' : 'student'}
        currentDepartments={user?.departments || []}
        currentPrimaryDepartment={user?.primaryDepartment || user?.departments?.[0] || ''}
        canEdit={true}
        darkMode={darkMode}
      />

      {/* Navbar */}
      <Navbar
        darkMode={darkMode}
        toggleSidebar={toggleSidebar}
        showProfileMenu={showProfileMenu}
        toggleProfileMenu={toggleProfileMenu}
        sidebarOpen={sidebarOpen}
        user={user}
        onEditDepartment={handleEditDepartment}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          darkMode={darkMode}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          toggleDarkMode={toggleDarkMode}
        />

        {/* Main Content */}
        <div
          className={`flex-1 min-h-screen transition-all duration-300 page-smooth-enter ${
            sidebarOpen ? 'ml-64' : 'ml-16'
          } ${
            darkMode ? 'bg-gray-900' : 'bg-white'
          }`}
        >
          <div className="p-4 sm:p-6 lg:p-8 relative z-10">
            <div
              className={`max-w-7xl mx-auto ${
                darkMode ? 'faculty-about-dark' : ''
              }`}
            >
              {/* About Section */}
              <section className="mb-12">
                <h1 className="faculty-about-heading text-4xl font-bold mb-6">
                  About Us
                </h1>

                <div className="faculty-about-panel p-6">
                  <p className="text-lg mb-4">
                    Welcome to Innovative Teaching Feedback, a platform
                    designed to enhance the teaching-learning experience
                    through effective feedback mechanisms.
                  </p>

                  <p className="text-lg mb-4">
                    Our mission is to bridge the gap between students and
                    faculty by providing a seamless feedback system that
                    helps improve teaching methodologies and student
                    engagement.
                  </p>

                  <p className="text-lg">
                    We believe in the power of constructive feedback and its
                    role in creating a better educational environment for
                    everyone involved.
                  </p>
                </div>
              </section>

              {/* Mission & Vision */}
              <section className="faculty-about-panel p-6 sm:p-8 mb-10">
                <h3 className="faculty-about-heading text-2xl font-bold mb-6">
                  Our Mission &amp; Vision
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="faculty-about-card p-6">
                    <h4 className="faculty-about-heading text-xl font-semibold mb-3">
                      <span className="faculty-about-accent">Mission</span>
                    </h4>

                    <p className="opacity-80">
                      To create a responsive educational ecosystem where
                      timely feedback leads to measurable improvements in
                      teaching methodologies and learning outcomes for all
                      students at KBTCOE.
                    </p>
                  </div>

                  <div className="faculty-about-card p-6">
                    <h4 className="faculty-about-heading text-xl font-semibold mb-3">
                      <span className="faculty-about-accent">Vision</span>
                    </h4>

                    <p className="opacity-80">
                      To establish KBTCOE as a pioneering institute where
                      continuous feedback and improvement become the
                      foundation of educational excellence and student
                      success.
                    </p>
                  </div>
                </div>
              </section>

              {/* Team Section */}
              <section className="faculty-about-panel p-5 sm:p-8 mb-10">
                <h3 className="faculty-about-heading text-2xl font-bold mb-8">
                  Our Team
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {teamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="faculty-about-card text-center p-4 sm:p-5"
                    >
                      <div className="flex flex-col items-center min-w-0">
                        {/* Profile Image */}
                        <div className="faculty-about-avatar-ring mb-4">
                          <div className="w-36 h-36 rounded-full overflow-hidden aspect-square bg-white">
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={member.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentNode.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center text-4xl font-medium" style="color: #28b8f0;">
                                      ${member.name.charAt(0)}
                                    </div>`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl font-medium faculty-about-accent">
                                {member.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Name and Role */}
                        <h4 className="faculty-about-heading text-xl font-semibold">
                          {member.name}
                        </h4>

                        <p className="font-medium mt-1 opacity-80">
                          {member.role}
                        </p>

                        <p className="mt-3 opacity-70">
                          {member.bio}
                        </p>

                        {/* Contact Details */}
                        <div className="flex flex-col items-center gap-2 mt-4 w-full min-w-0 text-sm">
                          <div className="faculty-about-email-row">
                            <FaEnvelope className="faculty-about-icon" />

                            <a
                              href={`mailto:${member.email}`}
                              className="faculty-about-email"
                              title={member.email}
                            >
                              {member.email}
                            </a>
                          </div>

                          <div className="flex items-center justify-center gap-2">
                            <FaPhone className="faculty-about-icon" />

                            <span className="opacity-80 whitespace-nowrap">
                              {member.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Project Guide */}
              <section className="faculty-about-guide p-6 sm:p-8 mb-10">
                <h3 className="faculty-about-heading text-2xl font-bold mb-4 text-center">
                  Project Guide
                </h3>

                <div className="text-center">
                  <p className="text-xl font-semibold opacity-90">
                    Dr. Vaishali S. Tidake
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;