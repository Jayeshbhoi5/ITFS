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
  FaTimes,
  FaSpinner,
} from 'react-icons/fa';
import emailjs from 'emailjs-com';

const ModernContactView = ({ darkMode: propDarkMode, user = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'feedback',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Dynamically resolve dark mode from prop, document class, or localStorage
  const getIsDark = () => {
    if (typeof propDarkMode === 'boolean') return propDarkMode;
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) return true;
    return typeof localStorage !== 'undefined' && localStorage.getItem('darkMode') === 'enabled';
  };

  const [isDark, setIsDark] = useState(getIsDark);

  useEffect(() => {
    if (typeof propDarkMode === 'boolean') {
      setIsDark(propDarkMode);
    }
  }, [propDarkMode]);

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e?.detail?.isDark !== undefined) {
        setIsDark(e.detail.isDark);
      } else {
        setIsDark(getIsDark());
      }
    };

    window.addEventListener('darkModeChange', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    // Also observe class mutations on <html> element
    const observer = new MutationObserver(() => {
      if (typeof propDarkMode !== 'boolean') {
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener('darkModeChange', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
      observer.disconnect();
    };
  }, [propDarkMode]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.displayName || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeSelect = (type) =>
    setFormData((prev) => ({ ...prev, type }));

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

      setToastMessage(
        'Thank you! Your message has been sent successfully.'
      );
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);

      setFormData({
        name: user?.displayName || user?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
        type: 'feedback',
      });
    } catch (error) {
      console.error('EmailJS error:', error);

      setToastMessage(
        'Failed to send your message. Please try again or email us directly.'
      );
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageTypes = [
    { id: 'feedback', label: 'General feedback', icon: FaComments },
    { id: 'bug', label: 'Report a bug', icon: FaBug },
    { id: 'improvement', label: 'Suggest improvement', icon: FaLightbulb },
  ];

  // ---- Design tokens ---------------------------------------------------
  const bg = isDark ? '#384353' : '#f8fafc';
  const surface = isDark ? '#2e3745' : '#ffffff';
  const surfaceMuted = isDark ? 'rgba(14,165,233,0.15)' : '#f0f9ff';
  const border = isDark ? '#475569' : '#e2e8f0';
  const borderMuted = isDark ? '#475569' : '#f1f5f9';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const accent = isDark ? '#38bdf8' : '#0369a1';

  const card = {
    background: surface,
    border: `1.5px solid ${border}`,
    boxShadow: isDark
      ? '0 10px 30px -10px rgba(0,0,0,0.5)'
      : '0 8px 30px rgba(15,23,42,0.06)',
  };

  const inputCls = isDark
    ? 'bg-[rgba(51,65,85,0.45)] border-[#475569] text-slate-100 placeholder-slate-400 focus:bg-[rgba(51,65,85,0.65)] focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 focus:outline-none'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25 focus:outline-none';

  const labelCls = `block text-sm font-medium mb-1.5 ${
    isDark ? 'text-slate-200' : 'text-slate-700'
  }`;

  return (
    <div
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 transition-colors duration-300 page-smooth-enter"
      style={{ color: textPrimary, background: 'transparent' }}
    >
      {/* Toast */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl border flex items-start gap-3 animate-[fadeSlideIn_0.25s_ease-out]`}
          style={
            toastType === 'success'
              ? {
                  background: isDark ? '#052e21' : '#ecfdf5',
                  borderColor: isDark ? '#0f5132' : '#a7f3d0',
                  color: isDark ? '#a7f3d0' : '#065f46',
                }
              : {
                  background: isDark ? '#3f0d16' : '#fef2f2',
                  borderColor: isDark ? '#7f1d2b' : '#fecaca',
                  color: isDark ? '#fecaca' : '#991b1b',
                }
          }
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
            aria-label="Dismiss notification"
            className="opacity-60 hover:opacity-100 text-sm transition-opacity cursor-pointer ml-1"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Page intro */}
     

      {/* Main layout: form left, contact details right, equal height */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-stretch">

        {/* LEFT: Contact Form */}
        <div className="lg:col-span-3 flex">
          <div
            className="p-6 sm:p-8 lg:p-10 rounded-3xl w-full flex flex-col"
            style={card}
          >
            <h2
              className="text-lg sm:text-xl font-semibold mb-1"
              style={{ color: textPrimary }}
            >
              Send a message
            </h2>

            <p className="text-sm mb-6" style={{ color: textSecondary }}>
              Fill out the form below and the team will get back to you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
              {/* Category pills */}
              <div>
                <span className={labelCls}>What's this about?</span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {messageTypes.map(({ id, label, icon: Icon }) => {
                    const isSelected = formData.type === id;

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleTypeSelect(id)}
                        aria-pressed={isSelected}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
                        style={
                          isSelected
                            ? {
                                background:
                                  'linear-gradient(135deg,#0284c7,#075985)',
                                color: '#fff',
                                border: '1.5px solid #0284c7',
                              }
                            : isDark
                            ? {
                                background: 'rgba(51,65,85,0.4)',
                                border: `1.5px solid ${border}`,
                                color: '#cbd5e1',
                              }
                            : {
                                background: '#f8fafc',
                                border: `1.5px solid ${border}`,
                                color: '#475569',
                              }
                        }
                      >
                        <Icon
                          className={
                            isSelected
                              ? 'text-white text-xs'
                              : 'text-sky-600 text-xs'
                          }
                        />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls} htmlFor="contact-name">
                    Your name <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <div
                      className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                      style={{ color: textSecondary }}
                    >
                      <FaUser className="text-xs" />
                    </div>

                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                      style={{ 
                        colorScheme: isDark ? 'dark' : 'light',
                        backgroundColor: isDark ? 'rgba(51, 65, 85, 0.45)' : undefined 
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border text-sm transition-all outline-none ${inputCls}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls} htmlFor="contact-email">
                    Email address <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <div
                      className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                      style={{ color: textSecondary }}
                    >
                      <FaEnvelope className="text-xs" />
                    </div>

                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. name@kbtcoe.org"
                      required
                      style={{ 
                        colorScheme: isDark ? 'dark' : 'light',
                        backgroundColor: isDark ? 'rgba(51, 65, 85, 0.45)' : undefined 
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border text-sm transition-all outline-none ${inputCls}`}
                    />
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className={labelCls} htmlFor="contact-subject">
                  Subject <span className="text-rose-500">*</span>
                </label>

                <input
                  id="contact-subject"
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
                  style={{ 
                    colorScheme: isDark ? 'dark' : 'light',
                    backgroundColor: isDark ? 'rgba(51, 65, 85, 0.45)' : undefined 
                  }}
                  className={`w-full px-4 py-2.5 sm:py-3 rounded-xl border text-sm transition-all outline-none ${inputCls}`}
                />
              </div>

              {/* Message */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls.replace('mb-1.5', '')} htmlFor="contact-message">
                    Your message <span className="text-rose-500">*</span>
                  </label>

                  <span className="text-xs" style={{ color: textSecondary }}>
                    {formData.message.length} characters
                  </span>
                </div>

                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Please describe your thoughts, issue details, or suggestions clearly..."
                  required
                  style={{ 
                    colorScheme: isDark ? 'dark' : 'light',
                    backgroundColor: isDark ? 'rgba(51, 65, 85, 0.45)' : undefined 
                  }}
                  className={`w-full flex-1 min-h-[120px] px-4 py-3 rounded-xl border text-sm transition-all outline-none resize-y ${inputCls}`}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white font-semibold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg,#0284c7,#075985)',
                  boxShadow: '0 10px 25px rgba(7,89,133,0.35)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin text-lg" />
                    <span>Sending message…</span>
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="text-sm" />
                    <span>Send message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: Contact Channels — stretched to match the form's height */}
        <div className="lg:col-span-2 flex">
          <div
            className="p-6 sm:p-8 rounded-3xl w-full flex flex-col"
            style={card}
          >
            <div className="mb-5">
              <h2
                className="text-lg sm:text-xl font-semibold"
                style={{ color: textPrimary }}
              >
                Contact channels
              </h2>

              <p className="text-sm mt-0.5" style={{ color: textSecondary }}>
                Connect directly with the Innovative Teaching Feedback
                administration.
              </p>
            </div>

            <div
              className="space-y-6 pt-2 flex-1"
              style={{ borderTop: `1px solid ${borderMuted}` }}
            >
              {/* Email */}
              <div className="flex items-start gap-4 pt-4">
                <div
                  className="p-3 rounded-2xl flex-shrink-0"
                  style={{
                    background: surfaceMuted,
                    color: accent,
                    border: `1px solid ${isDark ? '#164e63' : '#bae6fd'}`,
                  }}
                >
                  <FaEnvelope className="text-lg" />
                </div>

                <div className="min-w-0 flex-1">
                  <span
                    className="block text-sm font-medium"
                    style={{ color: textSecondary }}
                  >
                    Direct email
                  </span>

                  <a
                    href="mailto:innovativeteachingfeedback@gmail.com"
                    className="block text-sm sm:text-base font-semibold hover:underline break-all transition-colors mt-0.5"
                    style={{ color: accent }}
                  >
                    innovativeteachingfeedback@gmail.com
                  </a>

                  <span className="block text-xs mt-0.5" style={{ color: textSecondary }}>
                    Available for general queries &amp; support
                  </span>
                </div>
              </div>

              {/* Campus Location */}
              <div
                className="flex items-start gap-4 pt-4"
                style={{ borderTop: `1px solid ${borderMuted}` }}
              >
                <div
                  className="p-3 rounded-2xl flex-shrink-0"
                  style={{
                    background: surfaceMuted,
                    color: accent,
                    border: `1px solid ${isDark ? '#164e63' : '#bae6fd'}`,
                  }}
                >
                  <FaMapMarkerAlt className="text-lg" />
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className="block text-sm font-medium"
                    style={{ color: textSecondary }}
                  >
                    Campus location
                  </span>

                  <p className="text-sm font-semibold mt-0.5" style={{ color: textPrimary }}>
                    MVPS's K.B.T. College of Engineering
                  </p>

                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: textSecondary }}>
                    Udoji Maratha Boarding Campus, Gangapur Road, Nashik,
                    Maharashtra 422013
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ModernContactView;