import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaPhone } from 'react-icons/fa';
import Navbar from './FacultyDashboard/Navbar';
import Sidebar from './FacultyDashboard/Sidebar';
import { Link } from 'react-router-dom';
import { useUserSession } from '../UserSessionContext';
import DepartmentSelectionModal from '../components/DepartmentSelectionModal';

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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptEditMode, setDeptEditMode] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

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
      bio: 'Contributed to developing and implementing feedback mechanisms and system solutions.',
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
    if (user && (user.role === 'Faculty' || user.role === 'Student')) {
      setShowDeptModal(true);
      setDeptEditMode(true);
    }
  };

  return (
    <div className={`relative w-full min-h-screen itf-about ${darkMode ? 'itf-about-dark' : 'itf-about-light'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');

        .itf-about { font-family: 'Inter', system-ui, sans-serif; }
        .itf-about-heading { font-family: 'Outfit', 'Inter', system-ui, sans-serif; letter-spacing: -0.01em; }
        .itf-about-ink { color: #0f172a; }
        .itf-about-dark .itf-about-ink { color: #f8fafc; }

        .itf-about-light {
          background-color: #f8fafc;
          color: #334155;
        }
        .itf-about-dark {
          background-color: #111827;
          color: #e2e8f0;
        }

        .itf-about-glass {
          border-radius: 1.25rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
        }
        .itf-about-light .itf-about-glass {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
        }
        .itf-about-dark .itf-about-glass {
          background: #1f2937;
          border: 1px solid #374151;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.35);
        }
        .itf-about-card:hover { transform: translateY(-3px); }
        .itf-about-light .itf-about-card:hover { background: #ffffff; box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.08); }
        .itf-about-dark .itf-about-card:hover { background: #1f2937; box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.45); }

        .itf-about-accent { color: #0284c7; }
        .itf-about-dark .itf-about-accent { color: #38bdf8; }
        .itf-about-gradient-text {
          background: linear-gradient(120deg, #0284c7, #0369a1);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }

        .itf-about-avatar-ring {
          padding: 3px;
          background: linear-gradient(135deg, #0284c7, #075985);
          border-radius: 9999px;
        }

        .itf-about-reveal { opacity: 0; transform: translateY(14px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .itf-about-mounted .itf-about-reveal { opacity: 1; transform: translateY(0); }
        .itf-about-reveal.d1 { transition-delay: 0.05s; }
        .itf-about-reveal.d2 { transition-delay: 0.15s; }
        .itf-about-reveal.d3 { transition-delay: 0.25s; }

        @media (prefers-reduced-motion: reduce) {
          .itf-about-reveal { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* Department Selection Modal */}
      <DepartmentSelectionModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onSubmit={() => setShowDeptModal(false)}
        userType={user?.role === 'Faculty' ? 'faculty' : 'student'}
        currentDepartments={user?.departments || []}
        canEdit={true}
      />

      {/* Sticky Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
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
        {/* Sidebar with dark mode toggle */}
        <Sidebar 
          darkMode={darkMode} 
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          toggleDarkMode={toggleDarkMode}
        />

        {/* Main content area with seamless transition */}
        <div className={`flex-1 transition-all duration-300 relative z-10 ${sidebarOpen ? 'ml-64' : 'ml-16'} ${mounted ? 'itf-about-mounted' : ''}`}>

          <div className="p-8 relative z-10">
            <div className="max-w-6xl mx-auto">
              {/* About Section */}
              <section className="mb-12 itf-about-reveal d1">
                <h1 className="itf-about-heading itf-about-ink text-4xl font-bold mb-6">About Us</h1>
                <div className="itf-about-glass p-6">
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

              {/* Mission & Vision */}
              <div className="itf-about-glass p-8 mb-10 itf-about-reveal d2">
                <h3 className="itf-about-heading itf-about-ink text-2xl font-bold mb-6">Our Mission & Vision</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="itf-about-glass itf-about-card p-6">
                    <h4 className="itf-about-heading text-xl font-semibold mb-3 itf-about-accent">Mission</h4>
                    <p className="opacity-80">
                      To create a responsive educational ecosystem where timely feedback leads to measurable improvements in teaching methodologies and learning outcomes for all students at KBTCOE.
                    </p>
                  </div>
                  <div className="itf-about-glass itf-about-card p-6">
                    <h4 className="itf-about-heading text-xl font-semibold mb-3 itf-about-accent">Vision</h4>
                    <p className="opacity-80">
                      To establish KBTCOE as a pioneering institute where continuous feedback and improvement become the foundation of educational excellence and student success.
                    </p>
                  </div>
                </div>
              </div>

              {/* Team Section */}
              <div className="itf-about-glass p-8 mb-10 itf-about-reveal d3">
                <h3 className="itf-about-heading itf-about-ink text-2xl font-bold mb-8">Our Team</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="itf-about-glass itf-about-card text-center p-6">
                      <div className="flex flex-col items-center">
                        <div className="itf-about-avatar-ring mb-4">
                          <div className="w-36 h-36 rounded-full overflow-hidden aspect-square bg-white/40">
                            {member.image ? (
                              <img 
                                src={member.image} 
                                alt={member.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentNode.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center text-4xl itf-about-accent font-medium">
                                      ${member.name.charAt(0)}
                                    </div>`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl itf-about-accent font-medium">
                                {member.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                        <h4 className="itf-about-heading itf-about-ink text-xl font-semibold">{member.name}</h4>
                        <p className="font-medium mt-1 opacity-80">{member.role}</p>
                        <p className="mt-3 opacity-70">{member.bio}</p>
                        <div className="flex flex-col items-center space-y-2 mt-4 text-sm">
                          <div className="flex items-center">
                            <FaEnvelope className="mr-2 itf-about-accent" />
                            <a href={`mailto:${member.email}`} className="hover:opacity-100 opacity-80 transition-opacity">{member.email}</a>
                          </div>
                          <div className="flex items-center">
                            <FaPhone className="mr-2 itf-about-accent" />
                            <span className="opacity-80">{member.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Guide Section */}
              <div className="itf-about-glass p-8 mb-10 itf-about-reveal d3">
                <h3 className="itf-about-heading itf-about-ink text-2xl font-bold mb-4 text-center">Project Guide</h3>
                <div className="text-center">
                  <p className="text-xl font-semibold opacity-90">Dr. Vaishali S. Tidake</p>
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