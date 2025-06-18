import React, { useState, useEffect, useCallback } from 'react';
import { FaStar, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './StudentSidebar';
import { serverTimestamp } from "firebase/firestore";
import { useActivityUserStatus } from './ActivityUserStatusManager';
import { getAuth } from 'firebase/auth';

const auth = getAuth();

const ProvideFeedbackPage = () => {
  const navigate = useNavigate();
  const { activityId } = useParams();
  const [activity, setActivity] = useState(null);
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const { submitFeedback, refreshStatus } = useActivityUserStatus() || {};

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);

  // Load activity data
  const loadActivity = useCallback(async () => {
    try {
      const storedActivity = localStorage.getItem('selectedActivity');
      if (storedActivity) {
        const parsedActivity = JSON.parse(storedActivity);
        setActivity(parsedActivity);
        setLoading(false);
        return;
      }

      if (activityId) {
        const activityDoc = await getDoc(doc(db, 'activities', activityId));
        if (activityDoc.exists()) {
          const activityData = { id: activityDoc.id, ...activityDoc.data() };
          setActivity(activityData);
          localStorage.setItem('selectedActivity', JSON.stringify(activityData));
        }
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const [formData, setFormData] = useState({
    rating: 0,
    understandability: 0,
    engagement: 0,
    relevance: 0,
    comments: '',
    suggestions: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleRatingChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: value
    }));
    clearFieldError(category);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    clearFieldError(name);
  };

  const clearFieldError = (field) => {
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setDarkModeInStorage(newMode);
  };

  const [hoveredRating, setHoveredRating] = useState({
    rating: 0,
    understandability: 0,
    engagement: 0,
    relevance: 0
  });

  const validateForm = () => {
    const errors = {};
    if (formData.rating === 0) errors.rating = 'Overall rating is required';
    if (formData.understandability === 0) errors.understandability = 'Understandability rating is required';
    if (formData.engagement === 0) errors.engagement = 'Engagement rating is required';
    if (formData.relevance === 0) errors.relevance = 'Relevance rating is required';
    if (!formData.comments.trim()) errors.comments = 'Please provide some comments';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
  
    setSubmitting(true);
    setFormErrors({});
  
    try {
      const feedbackData = {
        activityId: activity.id,
        studentId: auth.currentUser.uid,
        studentName: auth.currentUser.displayName || 'Anonymous Student',
        rating: formData.rating,
        understandability: formData.understandability,
        engagement: formData.engagement,
        relevance: formData.relevance,
        comment: formData.comments,
        suggestions: formData.suggestions || '',
      };
      
      const result = await submitFeedback(activity.id, feedbackData);
      
      if (!result.success) {
        // Show specific error message
        setFormErrors(prev => ({
          ...prev,
          submit: result.error || 'Failed to submit feedback'
        }));
        return;
      }
      
      setSubmitted(true);
      
      // Clear form after successful submission
      setFormData({
        rating: 0,
        understandability: 0,
        engagement: 0,
        relevance: 0,
        comments: '',
        suggestions: ''
      });
  
      // Redirect after delay
      setTimeout(() => {
        navigate('/AllActivitiesPage?tab=submitted');
      }, 2000);
  
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFormErrors(prev => ({
        ...prev,
        submit: error.message || 'Failed to submit feedback. Please try again.'
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (category, count = 5) => {
    const stars = [];
    for (let i = 1; i <= count; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className="focus:outline-none border-none bg-transparent p-1"
          onMouseEnter={() => setHoveredRating({...hoveredRating, [category]: i})}
          onMouseLeave={() => setHoveredRating({...hoveredRating, [category]: 0})}
          onClick={() => handleRatingChange(category, i)}
        >
          <FaStar
            className={`text-2xl transition-colors ${
              i <= (hoveredRating[category] || formData[category])
                ? 'text-yellow-400'
                : (darkMode ? 'text-gray-600' : 'text-gray-300')
            }`}
          />
        </button>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="text-center p-8">
        <p>Activity not found</p>
        <button 
          onClick={() => navigate('/activities')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Back to Activities
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'} transition-colors duration-300`}>
      <Navbar 
        darkMode={darkMode} 
        toggleSidebar={toggleSidebar} 
        showProfileMenu={showProfileMenu}
        toggleProfileMenu={toggleProfileMenu}
        sidebarOpen={sidebarOpen}
      />

      <Sidebar 
        darkMode={darkMode}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleDarkMode={toggleDarkMode}
        activePage="activities"
      />

      <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out`}>
        <div className={`rounded-lg shadow-md transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
        }`}>
          {submitted && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className={`p-8 rounded-lg shadow-lg max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                <div className="flex flex-col items-center justify-center">
                  <FaCheckCircle className="text-6xl text-green-500 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Feedback Submitted!</h3>
                  <p className="text-center">Thank you for providing your feedback on "{activity.title}".</p>
                  <p className="text-center mt-2">Activity status has been updated to "Submitted".</p>
                  <button
                    onClick={() => navigate('/AllActivitiesPage',{ 
  state: { feedbackSubmitted: true } 
})}
                    className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Go to Activities
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Provide Feedback for "{activity.title}"</h3>

            <div className={`p-4 mb-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                {activity.title}
              </h2>
              <p className="mt-2">{activity.description}</p>
              <div className="mt-2 text-sm">
                <span className="font-medium">Faculty:</span> {activity.faculty} |
                <span className="ml-2 font-medium">Due Date:</span> {new Date(activity.dueDate).toLocaleDateString()}
              </div>
            </div>

            {formErrors.submit && (
              <div className="mb-4 p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                {formErrors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Rating sections remain the same */}
                {/* Overall Rating */}
                <div>
                  <label className="block mb-2 font-medium">
                    Overall Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    {renderStars('rating')}
                  </div>
                  {formErrors.rating && (
                    <p className="mt-1 text-red-500 text-sm">{formErrors.rating}</p>
                  )}
                </div>

                {/* Understandability */}
                <div>
                  <label className="block mb-2 font-medium">
                    How easy was it to understand? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    {renderStars('understandability')}
                  </div>
                  {formErrors.understandability && (
                    <p className="mt-1 text-red-500 text-sm">{formErrors.understandability}</p>
                  )}
                </div>

                {/* Engagement */}
                <div>
                  <label className="block mb-2 font-medium">
                    How engaging was the activity? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    {renderStars('engagement')}
                  </div>
                  {formErrors.engagement && (
                    <p className="mt-1 text-red-500 text-sm">{formErrors.engagement}</p>
                  )}
                </div>

                {/* Relevance */}
                <div>
                  <label className="block mb-2 font-medium">
                    How relevant was the content? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    {renderStars('relevance')}
                  </div>
                  {formErrors.relevance && (
                    <p className="mt-1 text-red-500 text-sm">{formErrors.relevance}</p>
                  )}
                </div>

                {/* Comments */}
                <div>
                  <label className="block mb-2 font-medium">
                    Comments <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="comments"
                    rows="4"
                    className={`w-full p-3 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    placeholder="Share your thoughts about this activity..."
                    value={formData.comments}
                    onChange={handleInputChange}
                  />
                  {formErrors.comments && (
                    <p className="mt-1 text-red-500 text-sm">{formErrors.comments}</p>
                  )}
                </div>

                {/* Suggestions */}
                <div>
                  <label className="block mb-2 font-medium">
                    Suggestions for Improvement
                  </label>
                  <textarea
                    name="suggestions"
                    rows="3"
                    className={`w-full p-3 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    placeholder="How could this activity be improved?"
                    value={formData.suggestions}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-half py-3 px-9 rounded-lg font-medium flex items-center justify-center ${
                      submitting
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvideFeedbackPage;