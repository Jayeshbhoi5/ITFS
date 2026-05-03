import React, { useState } from 'react';
import { FaEnvelope, FaPaperPlane } from 'react-icons/fa';
import Navbar from './Navbar';
import StudentSidebar from './StudentSidebar';
import emailjs from 'emailjs-com';
import { useUserSession } from '../../UserSessionContext';
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';

const StudentContactUs = ({ darkMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'feedback'
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const { user } = useUserSession();
  const [showDeptModal, setShowDeptModal] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    emailjs.send(
      'service_cukhdvh',
      'template_7ig6a7y',
      formData,
      'EWntbehXd46736HkT'
    ).then(
      (result) => {
        setToastMessage('Message sent successfully!');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          type: 'feedback'
        });
      },
      (error) => {
        setToastMessage('Failed to send message. Please try again.');
        setToastType('error');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        console.error(error);
      }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditDepartment = () => {
    if (user && user.role === 'Student') {
      setShowDeptModal(true);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
      <DepartmentSelectionModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onSubmit={() => setShowDeptModal(false)}
        userType={'student'}
        currentDepartments={user?.departments || []}
        canEdit={true}
      />
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toastType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <span>{toastMessage}</span>
        </div>
      )}
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
        <StudentSidebar 
          darkMode={darkMode} 
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
              <div className={`p-8 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center mb-8">
                  <FaEnvelope className="text-3xl mr-4 text-blue-500" />
                  <div>
                    <h2 className="text-2xl font-semibold">Get in Touch</h2>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                      Have questions, suggestions, or found a bug? We'd love to hear from you!
                    </p>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type of Message</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="feedback">General Feedback</option>
                      <option value="bug">Report a Bug</option>
                      <option value="improvement">Suggest an Improvement</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="6"
                      className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center"
                  >
                    <FaPaperPlane className="mr-2" />
                    Send Message
                  </button>
                </form>
                <div className="mt-8 pt-8 border-t border-gray-700">
                  <h3 className="text-xl font-semibold mb-4">Direct Contact</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                    You can also reach us directly at:
                  </p>
                  <a
                    href="mailto:innovativeteachingfeedback@gmail.com"
                    className="text-blue-500 hover:text-blue-400"
                  >
                    innovativeteachingfeedback@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentContactUs;
 