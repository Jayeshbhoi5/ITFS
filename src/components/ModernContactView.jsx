import React, { useState, useEffect } from 'react';
import { 
  FaEnvelope, 
  FaPaperPlane, 
  FaMapMarkerAlt, 
  FaUser, 
  FaComments, 
  FaBug, 
  FaLightbulb, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaHeadset, 
  FaTimes 
} from 'react-icons/fa';
import emailjs from 'emailjs-com';

const ModernContactView = ({ darkMode = false, user = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'feedback' // 'feedback', 'bug', 'improvement'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Pre-fill user information if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.displayName || user.name || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await emailjs.send(
        'service_cukhdvh',
        'template_7ig6a7y',
        formData,
        'EWntbehXd46736HkT'
      );
      setToastMessage('Thank you! Your message has been sent successfully.');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      setFormData({
        name: user?.displayName || user?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
        type: 'feedback'
      });
    } catch (error) {
      console.error('EmailJS error:', error);
      setToastMessage('Failed to send your message. Please try again or email us directly.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageTypes = [
    { id: 'feedback', label: 'General Feedback', icon: FaComments },
    { id: 'bug', label: 'Report a Bug', icon: FaBug },
    { id: 'improvement', label: 'Suggest Improvement', icon: FaLightbulb },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Toast Notification */}
      {showToast && (
        <div 
          className={`fixed top-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl border flex items-start gap-3 transition-all duration-300 transform translate-y-0 ${
            toastType === 'success'
              ? darkMode
                ? 'bg-emerald-950/90 border-emerald-700/80 text-emerald-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : darkMode
                ? 'bg-rose-950/90 border-rose-700/80 text-rose-200'
                : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {toastType === 'success' ? (
            <FaCheckCircle className="text-emerald-500 text-xl flex-shrink-0 mt-0.5" />
          ) : (
            <FaExclamationCircle className="text-rose-500 text-xl flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium leading-snug">
            {toastMessage}
          </div>
          <button 
            type="button" 
            onClick={() => setShowToast(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm transition-colors cursor-pointer ml-1"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100/90 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/80 mb-2.5 shadow-2xs">
          <FaHeadset className="text-xs" />
          <span>Support & Communication</span>
        </div>
     
      </div>

      {/* Interactive Form Card (Top / Main) */}
      <div className={`p-6 sm:p-8 lg:p-10 rounded-3xl border shadow-xl transition-all ${
        darkMode 
          ? 'bg-gray-800 border-gray-700/80 shadow-gray-950/40' 
          : 'bg-white border-slate-200/80 shadow-slate-200/60'
      }`}>
        <h2 className={`text-xl sm:text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Send a Message
        </h2>
        <p className={`text-xs sm:text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Fill out the form below and the team will get in touch with you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Pills */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2.5 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Select Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {messageTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = formData.type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTypeSelect(item.id)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'text-white shadow-md'
                        : darkMode
                          ? 'bg-gray-700/60 border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                    style={isSelected ? {
                      background: 'linear-gradient(135deg, #0284c7, #075985)',
                      borderColor: '#0284c7'
                    } : {}}
                  >
                    <Icon className={isSelected ? 'text-white text-xs' : 'text-sky-500 text-xs'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Your Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FaUser className="text-xs" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border text-sm transition-all outline-none ${
                    darkMode
                      ? 'bg-gray-900/60 border-gray-700 text-white placeholder-gray-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FaEnvelope className="text-xs" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. name@kbtcoe.org"
                  required
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border text-sm transition-all outline-none ${
                    darkMode
                      ? 'bg-gray-900/60 border-gray-700 text-white placeholder-gray-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder={
                formData.type === 'bug'
                  ? 'e.g., Error occurred while submitting feedback rating'
                  : formData.type === 'improvement'
                    ? 'e.g., Suggestion to add filtering by academic semester'
                    : 'e.g., Question about activity feedback visibility'
              }
              required
              className={`w-full px-4 py-2.5 sm:py-3 rounded-xl border text-sm transition-all outline-none ${
                darkMode
                  ? 'bg-gray-900/60 border-gray-700 text-white placeholder-gray-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15'
              }`}
            />
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`block text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Your Message <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {formData.message.length} characters
              </span>
            </div>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={5}
              placeholder="Please describe your thoughts, issue details, or suggestions clearly..."
              required
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none resize-y ${
                darkMode
                  ? 'bg-gray-900/60 border-gray-700 text-white placeholder-gray-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15'
              }`}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full text-white font-semibold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #0284c7, #075985)',
              boxShadow: '0 10px 25px rgba(7, 89, 133, 0.4)'
            }}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending Message...</span>
              </>
            ) : (
              <>
                <FaPaperPlane className="text-sm" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Bottom Card: Contact Channels (Email & Campus Location) */}
      <div className={`mt-8 sm:mt-10 p-6 sm:p-8 rounded-3xl border shadow-lg transition-all ${
        darkMode 
          ? 'bg-gray-800/90 border-gray-700/80 shadow-gray-950/40' 
          : 'bg-white border-slate-200/80 shadow-slate-200/60'
      }`}>
        <div className="mb-5">
          <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Contact Channels
          </h2>
          <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Connect directly with the Innovative Teaching Feedback administration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Email */}
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl flex-shrink-0 ${
              darkMode ? 'bg-sky-950/60 text-sky-400 border border-sky-800/50' : 'bg-sky-50 text-sky-600 border border-sky-100'
            }`}>
              <FaEnvelope className="text-lg" />
            </div>
            <div className="min-w-0 flex-1">
              <span className={`block text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Direct Email
              </span>
              <a 
                href="mailto:innovativeteachingfeedback@gmail.com" 
                className="block text-sm sm:text-base font-semibold text-sky-600 dark:text-sky-400 hover:underline break-all transition-colors mt-0.5"
              >
                innovativeteachingfeedback@gmail.com
              </a>
              <span className={`block text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Available for general queries & support
              </span>
            </div>
          </div>

          {/* Campus Location */}
          <div className="flex items-start gap-4 md:border-l md:border-slate-100 md:dark:border-gray-700/60 md:pl-6">
            <div className={`p-3 rounded-2xl flex-shrink-0 ${
              darkMode ? 'bg-sky-950/60 text-sky-400 border border-sky-800/50' : 'bg-sky-50 text-sky-600 border border-sky-100'
            }`}>
              <FaMapMarkerAlt className="text-lg" />
            </div>
            <div className="flex-1">
              <span className={`block text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Campus Location
              </span>
              <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                MVPS's K.B.T. College of Engineering
              </p>
              <p className={`text-xs mt-0.5 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Udoji Maratha Boarding Campus, Gangapur Road, Nashik, Maharashtra 422013
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernContactView;
