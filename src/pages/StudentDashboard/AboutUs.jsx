import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaPhone } from 'react-icons/fa';
import Navbar from './Navbar';
import StudentSidebar from './StudentSidebar';
import { Link } from 'react-router-dom';
import { useUserSession } from '../../UserSessionContext';
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';
import Toast from '../../components/Toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {
  getDarkModeFromStorage,
  setDarkModeInStorage,
} from './darkModeUtils';

const StudentAboutUs = () => {
  console.log('✅ STUDENT ABOUT US FILE IS RENDERING');

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

  const handleEditDepartment = () => {
    setShowDeptModal(true);
  };

  const handleDepartmentSubmit = async (data) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const activeAy = data.academicYear || getCurrentAcademicYear();
    const newChangeCount = (user.departmentChangeCount || 0) + 1;

    // Close modal instantly with ZERO delay & show toast immediately
    setShowDeptModal(false);
    setToast({ show: true, message: 'Department updated successfully!', type: 'success' });

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
  };

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

  return (
    <div
      className={`student-about-page min-h-screen transition-colors duration-300 ${
        darkMode
          ? 'bg-gray-900 text-gray-100'
          : 'bg-white text-gray-800'
      }`}
    >
      <style>{`
        .student-about-page {
          --student-about-teal: #10465a;
          --student-about-cyan: #28b8f0;
          --student-about-blue: #2563eb;
        }

        .student-about-heading {
          color: var(--student-about-teal);
        }

        .student-about-accent {
          color: var(--student-about-cyan);
        }

        .student-about-icon {
          color: var(--student-about-blue);
          flex-shrink: 0;
        }

        .student-about-panel {
          background: #ffffff;
          border: 1px solid #dbeafe;
          border-radius: 1rem;
          box-shadow: 0 4px 16px rgba(16, 70, 90, 0.045);
        }

        .student-about-card {
          min-width: 0;
          background: #ffffff;
          border: 1px solid #dbeafe;
          border-radius: 1rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .student-about-card:hover {
          border-color: #93dafa;
          box-shadow: 0 6px 18px rgba(16, 70, 90, 0.08);
        }

        .student-about-avatar-ring {
          padding: 4px;
          border: 2px solid #28b8f0;
          border-radius: 9999px;
        }

        .student-about-email-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: 100%;
          min-width: 0;
        }

        .student-about-email {
          white-space: nowrap;
          font-size: 12px;
          line-height: 1.5;
          color: #1d4ed8;
          text-decoration: none;
        }

        .student-about-email:hover {
          text-decoration: underline;
        }

        .student-about-guide {
          background: #ffffff;
          border: 1px solid #dbeafe;
          border-left: 4px solid #28b8f0;
          border-right: 4px solid #28b8f0;
          border-radius: 1rem;
          box-shadow: 0 4px 16px rgba(16, 70, 90, 0.045);
        }

        .student-about-dark .student-about-heading {
          color: #7dd3fc;
        }

        .student-about-dark .student-about-panel,
        .student-about-dark .student-about-card,
        .student-about-dark .student-about-guide {
          background: #1f2937;
          border-color: #374151;
        }

        .student-about-dark .student-about-card:hover {
          border-color: #38bdf8;
        }

        .student-about-dark .student-about-email {
          color: #93c5fd;
        }

        .student-about-dark .student-about-guide {
          border-left-color: #28b8f0;
          border-right-color: #28b8f0;
        }

        @media (max-width: 640px) {
          .student-about-email {
            font-size: 11px;
          }
        }
      `}</style>

      {/* Department Selection Modal */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          darkMode={darkMode}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <DepartmentSelectionModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onSubmit={handleDepartmentSubmit}
        userType="student"
        currentDepartments={user?.departments || []}
        currentPrimaryDepartment={user?.primaryDepartment || user?.departments?.[0] || ''}
        canEdit={(user?.departmentChangeCount || 0) < 1}
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
        {/* Student Sidebar */}
        <StudentSidebar
          darkMode={darkMode}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          toggleDarkMode={toggleDarkMode}
          user={user}
        />

        {/* Main Content */}
        <div
          className={`flex-1 min-h-screen transition-all duration-300 page-smooth-enter ${
            sidebarOpen ? 'ml-64' : 'ml-16'
          } ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
        >
          <div className="p-4 sm:p-6 lg:p-8 relative z-10">
            <div
              className={`max-w-7xl mx-auto ${
                darkMode ? 'student-about-dark' : ''
              }`}
            >
              {/* About Section */}
              <section className="mb-12">
                <h1 className="student-about-heading text-4xl font-bold mb-6">
                  About Us
                </h1>

                <div className="student-about-panel p-6">
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
              <section className="student-about-panel p-6 sm:p-8 mb-10">
                <h3 className="student-about-heading text-2xl font-bold mb-6">
                  Our Mission &amp; Vision
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="student-about-card p-6">
                    <h4 className="text-xl font-semibold mb-3">
                      <span className="student-about-accent">
                        Mission
                      </span>
                    </h4>

                    <p className="opacity-80">
                      To create a responsive educational ecosystem where
                      timely feedback leads to measurable improvements in
                      teaching methodologies and learning outcomes for all
                      students at KBTCOE.
                    </p>
                  </div>

                  <div className="student-about-card p-6">
                    <h4 className="text-xl font-semibold mb-3">
                      <span className="student-about-accent">
                        Vision
                      </span>
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
              <section className="student-about-panel p-5 sm:p-8 mb-10">
                <h3 className="student-about-heading text-2xl font-bold mb-8">
                  Our Team
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {teamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="student-about-card text-center p-4 sm:p-5"
                    >
                      <div className="flex flex-col items-center min-w-0">
                        {/* Profile Image */}
                        <div className="student-about-avatar-ring mb-4">
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
                              <div className="w-full h-full flex items-center justify-center text-4xl font-medium student-about-accent">
                                {member.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Name and Role */}
                        <h4 className="student-about-heading text-xl font-semibold">
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
                          <div className="student-about-email-row">
                            <FaEnvelope className="student-about-icon" />

                            <a
                              href={`mailto:${member.email}`}
                              className="student-about-email"
                              title={member.email}
                            >
                              {member.email}
                            </a>
                          </div>

                          <div className="flex items-center justify-center gap-2">
                            <FaPhone className="student-about-icon" />

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
              <section className="student-about-guide p-6 sm:p-8 mb-10">
                <h3 className="student-about-heading text-2xl font-bold mb-4 text-center">
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

export default StudentAboutUs;