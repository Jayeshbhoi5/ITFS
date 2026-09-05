import React, { useState, useEffect, useCallback } from 'react';
import { FaStar, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './StudentSidebar';
import { serverTimestamp } from "firebase/firestore";
import { useActivityUserStatus } from './ActivityUserStatusManager';
import { getAuth } from 'firebase/auth';

const auth = getAuth();

const ProvideFeedbackPage = () => {
  const navigate = useNavigate();
  const { activityId } = useParams();
  const location = useLocation();
  const [activity, setActivity] = useState(null);
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [existingFeedbackId, setExistingFeedbackId] = useState(null);
    const [hasBeenEdited, setHasBeenEdited] = useState(false);

  const { submitFeedback, refreshStatus } = useActivityUserStatus() || {};

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);

  // Load activity data and check for edit mode
  const loadActivity = useCallback(async () => {
    setLoading(true);
    try {
      let activityData = location.state?.activity;
      let isEditMode = location.state?.isEditing || false;

      // If data is in navigation state, use it. This is the most reliable method.
      if (activityData) {
        setActivity(activityData);
        setEditMode(isEditMode);
        if (isEditMode) {
          // Pass the full activity data, not just the ID
          await loadExistingFeedback(activityData);
        }
      } else if (activityId) {
        // Fallback for page refresh or direct navigation: fetch from DB
        console.log('Fetching activity from DB as it was not in location.state');
        const activityDoc = await getDoc(doc(db, 'activities', activityId));
        if (activityDoc.exists()) {
          activityData = { id: activityDoc.id, ...activityDoc.data() };
          setActivity(activityData);
          
          // When refreshing, we must check if feedback exists to determine if we are in "edit mode"
          const userId = auth.currentUser?.uid;
          if (userId) {
            const q = query(
              collection(db, 'feedback'),
              where('activityId', '==', activityId),
              where('studentId', '==', userId)
            );
            const feedbackSnapshot = await getDocs(q);
            if (!feedbackSnapshot.empty) {
              const feedbackData = feedbackSnapshot.docs[0].data();
              setEditMode(true);
              // Pass the fetched activity data and existing feedback data
              await loadExistingFeedback(activityData, feedbackData, feedbackSnapshot.docs[0].id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  }, [activityId, location.state]);

  // Load existing feedback for edit mode
  const loadExistingFeedback = async (activity, feedbackData, feedbackId) => {
    try {
      // If feedback data is passed directly (on refresh), use it
      if (feedbackData) {
        if (feedbackData.hasBeenEdited) {
          alert('This feedback has already been edited once and cannot be edited again.');
          navigate('/AllActivitiesPage');
          return;
        }
        setExistingFeedbackId(feedbackId);
        setHasBeenEdited(feedbackData.hasBeenEdited || false);
        setFormData({
          rating: feedbackData.rating || 0,
          understandability: feedbackData.understandability || 0,
          engagement: feedbackData.engagement || 0,
          relevance: feedbackData.relevance || 0,
          comments: feedbackData.comment || feedbackData.feedback || '',
          suggestions: feedbackData.suggestions || ''
        });
        return;
      }

      // Original logic for when navigating from the list page
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const q = query(
        collection(db, 'feedback'),
        where('activityId', '==', activity.id),
        where('studentId', '==', userId)
      );
      
      const feedbackSnapshot = await getDocs(q);

      if (!feedbackSnapshot.empty) {
        const existingFeedback = feedbackSnapshot.docs[0];
        const feedbackData = existingFeedback.data();
         if (feedbackData.hasBeenEdited) {
          alert('This feedback has already been edited once and cannot be edited again.');
          navigate('/AllActivitiesPage');
          return;
        }
        setExistingFeedbackId(existingFeedback.id);
                setHasBeenEdited(feedbackData.hasBeenEdited || false);

        setFormData({
          rating: feedbackData.rating || 0,
          understandability: feedbackData.understandability || 0,
          engagement: feedbackData.engagement || 0,
          relevance: feedbackData.relevance || 0,
          comments: feedbackData.comment || feedbackData.feedback || '',
          suggestions: feedbackData.suggestions || ''
        });
      }
    } catch (error) {
      console.error('Error loading existing feedback:', error);
    }
  };

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

// Add this enhanced debugging to your handleSubmit function in ProvideFeedbackPage.jsx

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) return;

  setSubmitting(true);
  setFormErrors({});

  try {
    if (editMode && existingFeedbackId) {
      // Update existing feedback directly
      const feedbackRef = doc(db, 'feedback', existingFeedbackId);
      await updateDoc(feedbackRef, {
        rating: formData.rating,
        understandability: formData.understandability,
        engagement: formData.engagement,
        relevance: formData.relevance,
        comment: formData.comments,
        suggestions: formData.suggestions || '',
        hasBeenEdited: true,
        lastUpdated: serverTimestamp()
      });
      
      setSubmitted(true);
    } else {
      // Create new feedback - Enhanced debug logging
      const currentUser = auth.currentUser;
      console.log('=== DEBUGGING FEEDBACK SUBMISSION ===');
      console.log('Current User Info:', {
        uid: currentUser?.uid,
        email: currentUser?.email,
        displayName: currentUser?.displayName
      });

      console.log('Activity Info:', {
        id: activity.id,
        title: activity.title,
        departments: activity.departments,
        facultyId: activity.facultyId
      });

      // Check user document to see departments and role
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      console.log('User Document Data:', {
        role: userData?.role,
        departments: userData?.departments,
        primaryDepartment: userData?.primaryDepartment,
        email: userData?.email
      });

      // Check activity document to see departments
      const activityDoc = await getDoc(doc(db, 'activities', activity.id));
      const activityData = activityDoc.data();
      console.log('Activity Document Data:', {
        departments: activityData?.departments,
        facultyId: activityData?.facultyId,
        title: activityData?.title
      });

      // Check department overlap
      if (userData?.departments && activityData?.departments) {
        const hasOverlap = userData.departments.some(userDep => 
          activityData.departments.includes(userDep)
        );
        console.log('Department overlap check:', {
          userDepartments: userData.departments,
          activityDepartments: activityData.departments,
          hasOverlap: hasOverlap
        });
      }

      const feedbackData = {
        activityId: activity.id,
        studentId: currentUser.uid,
        userId: currentUser.uid, // Add this field for compatibility
        studentName: currentUser.displayName || userData?.name || 'Anonymous Student', // Modified this line
        userEmail: currentUser.email, // Add email for rule matching
        rating: formData.rating,
        understandability: formData.understandability,
        engagement: formData.engagement,
        relevance: formData.relevance,
        comment: formData.comments,
        suggestions: formData.suggestions || '',
        createdAt: serverTimestamp()
      };
      
      console.log('Submitting feedback data:', feedbackData);
      console.log('=== END DEBUG INFO ===');
      
      const result = await submitFeedback(activity.id, feedbackData);
      
      console.log('Submit result:', result);
      
      if (!result.success) {
        console.log('Submission failed:', result.error);
        setFormErrors(prev => ({
          ...prev,
          submit: result.error || 'Failed to submit feedback'
        }));
        return;
      }
      
      setSubmitted(true);
    }
    
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
        <div className={`rounded-xl shadow-sm border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-gray-100'
        }`}>
          {submitted && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className={`p-8 rounded-lg shadow-lg max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                <div className="flex flex-col items-center justify-center">
                  <FaCheckCircle className="text-6xl text-green-500 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">
                    {editMode ? 'Feedback Updated!' : 'Feedback Submitted!'}
                  </h3>
                  <p className="text-center">
                    {editMode 
                      ? `Your feedback has been updated successfully.`
                      : `Thank you for providing your feedback`
                    }
                  </p>
                  {!editMode && (
                    <p className="text-center mt-2">Your feedback has been submitted successfully.</p>
                  )}
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
            {/* Back Button */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center bg-transparent p-0 border-none shadow-none text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
              style={{ background: 'none', boxShadow: 'none', border: 'none' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-base font-medium">Back</span>
            </button>
            <h3 className="text-xl font-bold mb-4">
              {editMode 
                ? `Edit Feedback for "${activity.title || activity.activityName || 'Untitled Activity'}"` 
                : `Provide Feedback for "${activity.title || activity.activityName || 'Untitled Activity'}"`}
            </h3>

            <div className={`p-4 mb-6 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-100'}`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                {activity.title || activity.activityName || 'Untitled Activity'}
              </h2>
              <p className="mt-2">{activity.description}</p>
              <div className="mt-2 text-sm">
                <span className="font-medium">Faculty:</span> {activity.facultyName || activity.faculty || 'N/A'} |
                <span className="ml-2 font-medium">Due Date:</span> {
                  activity.dueDate
                    ? new Date(activity.dueDate).toLocaleDateString()
                    : (activity.activityDate
                        ? new Date(activity.activityDate).toLocaleDateString()
                        : 'N/A')
                }
              </div>
            </div>

            {formErrors.submit && (
              <div className="mb-4 p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                {formErrors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
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
                    className={`w-full p-3 rounded-xl border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                    } focus:outline-none`}
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
                    className={`w-full p-3 rounded-xl border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                    } focus:outline-none`}
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
                    className={`w-half py-3 px-9 rounded-xl font-semibold flex items-center justify-center shadow-sm transition-all ${
                      submitting
                        ? 'bg-gray-500 cursor-not-allowed text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        {editMode ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : (
                      editMode ? 'Update Feedback' : 'Submit Feedback'
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