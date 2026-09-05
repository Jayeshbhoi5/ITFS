import React, { useState, useEffect, useCallback } from 'react';
import { FaStar, FaCheckCircle, FaSpinner, FaUser, FaCalendarAlt, FaBook, FaGraduationCap, FaExpand, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
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
  const initialActivity = location.state?.activity || null;
  const isInitialEdit = location.state?.isEditing || false;
  const [activity, setActivity] = useState(initialActivity);
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [loading, setLoading] = useState(!initialActivity);
  const [fetchingFeedback, setFetchingFeedback] = useState(isInitialEdit);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [editMode, setEditMode] = useState(isInitialEdit);
  const [existingFeedbackId, setExistingFeedbackId] = useState(null);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { submitFeedback, refreshStatus } = useActivityUserStatus() || {};

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);

  // Load activity data and check for edit mode
  const loadActivity = useCallback(async () => {
    let activityData = location.state?.activity;
    let isEditMode = location.state?.isEditing || false;
    const id = activityData?.id || activityId;

    if (!activityData && id) {
      setLoading(true);
    }
    try {
      // Always fetch the full Firestore document so we get all image fields
      // (mainImage, fileUrls, images) which may not be in the processed state object
      if (id) {
        const activityDoc = await getDoc(doc(db, 'activities', id));
        if (activityDoc.exists()) {
          // Merge: Firestore data is the base, location.state overrides formatted fields
          activityData = { ...activityData, id: activityDoc.id, ...activityDoc.data() };
        }
      }

      if (activityData) {
        setActivity(activityData);
        setEditMode(isEditMode);

        if (isEditMode) {
          await loadExistingFeedback(activityData);
        } else if (!location.state?.isEditing && id) {
          // Check for existing feedback even in provide mode (page refresh case)
          const userId = auth.currentUser?.uid;
          if (userId) {
            const q = query(
              collection(db, 'feedback'),
              where('activityId', '==', id),
              where('studentId', '==', userId)
            );
            const feedbackSnapshot = await getDocs(q);
            if (!feedbackSnapshot.empty) {
              const feedbackData = feedbackSnapshot.docs[0].data();
              setEditMode(true);
              await loadExistingFeedback(activityData, feedbackData, feedbackSnapshot.docs[0].id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
      setFetchingFeedback(false);
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
    window.scrollTo(0, 0);
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


  // Aggregate all activity images for the modal
  const activityImages = (() => {
    if (!activity) return [];
    const list = [];
    const main = activity.mainImage || activity.image;
    if (main) list.push(main);
    if (Array.isArray(activity.fileUrls)) {
      activity.fileUrls.forEach(f => {
        const url = typeof f === 'string' ? f : f?.url;
        if (url && !list.includes(url)) list.push(url);
      });
    }
    if (Array.isArray(activity.images)) {
      activity.images.forEach(img => {
        const url = typeof img === 'string' ? img : img?.url;
        if (url && !list.includes(url)) list.push(url);
      });
    }
    return list;
  })();

  const currentImage = activityImages[activeImageIndex] || null;

  const handlePrevImage = (e) => {
    if (e) e.stopPropagation();
    setActiveImageIndex(prev => (prev === 0 ? activityImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    if (e) e.stopPropagation();
    setActiveImageIndex(prev => (prev === activityImages.length - 1 ? 0 : prev + 1));
  };

  const renderStars = (category, count = 5) => {
    const stars = [];
    for (let i = 1; i <= count; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className="focus:outline-none border-none bg-transparent p-1 cursor-pointer"
          style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
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
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!activity) {
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
          <div className="text-center p-8">
            <p>Activity not found</p>
            <button 
              onClick={() => navigate('/AllActivitiesPage')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
            >
              Back to Activities
            </button>
          </div>
        </div>
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

      {/* Success Modal - placed at root level for true screen centering */}
      {submitted && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-transparent z-50 pointer-events-auto"
          onClick={() => navigate('/AllActivitiesPage', { state: { feedbackSubmitted: true } })}
        >
          <div 
            className={`relative p-8 rounded-2xl shadow-2xl border max-w-md w-full mx-4 animate-scale-in ${
              darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => navigate('/AllActivitiesPage', { state: { feedbackSubmitted: true } })}
              className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors cursor-pointer ${
                darkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-400 hover:text-gray-500 bg-gray-100 hover:bg-gray-200'
              }`}
              aria-label="Close"
            >
              <FaTimes className="text-base" />
            </button>

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
                onClick={() => navigate('/AllActivitiesPage', { 
                  state: { feedbackSubmitted: true } 
                })}
                className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                Go to Activities
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out`}>
        <div className={`rounded-xl shadow-sm border transition-colors duration-300 animate-slide-up ${
          darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-gray-200'
        }`}>
          <div className="p-6">
            {/* Back arrow + breadcrumb row */}
            <div className="flex items-center gap-2.5 mb-5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none cursor-pointer transition-colors"
                style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}
                title="Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() => navigate('/AllActivitiesPage')}
                >
                  Activities
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {editMode ? 'Edit Feedback' : 'Provide Feedback'}
                </span>
              </div>
            </div>

            {/* Title + meta row: text on left, blob image on right */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                {/* Activity title — single display */}
                <h2
                  className={`text-2xl font-bold mb-2 leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  style={{ wordBreak: 'break-word' }}
                >
                  {activity.title || activity.activityName || 'Untitled Activity'}
                </h2>

                {/* Activity meta chips */}
                <div className={`flex flex-wrap items-center gap-2.5`}>
                  {(activity.facultyName || activity.faculty) && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      darkMode
                        ? 'bg-blue-950/40 text-blue-300 border-blue-800/60'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      <FaUser className="text-blue-500 text-xs" />
                      <span>{activity.facultyName || activity.faculty}</span>
                    </span>
                  )}
                  {(activity.dueDate || activity.activityDate) && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      darkMode
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <FaCalendarAlt className="text-amber-500 text-xs" />
                      <span>{
                        activity.dueDate
                          ? new Date(activity.dueDate).toLocaleDateString()
                          : new Date(activity.activityDate).toLocaleDateString()
                      }</span>
                    </span>
                  )}
                  {(activity.courseName || activity.branch) && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      darkMode
                        ? 'bg-purple-950/40 text-purple-300 border-purple-800/60'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      <span>{activity.courseName || activity.branch}</span>
                    </span>
                  )}
                  {(activity.className || activity.year) && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      darkMode
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      <span>{activity.className || activity.year}</span>
                    </span>
                  )}
                  {activity.description && (
                    <p className={`w-full text-sm mt-1 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Modern Gesture Stacked Image Card — only show if real image exists */}
              {activity?.mainImage && (
                <div className="flex-shrink-0 flex flex-col items-center justify-center md:justify-end pt-1">
                  <div
                    onClick={() => setIsImageModalOpen(true)}
                    className="relative group cursor-pointer select-none p-2"
                    title="Click to view photo"
                  >
                    {/* Layer 1: background tilt card */}
                    <div className="absolute inset-2 rounded-2xl bg-indigo-200 dark:bg-indigo-900/60 transform rotate-6 scale-95 opacity-70 group-hover:rotate-12 transition-transform duration-300"></div>
                    {/* Layer 2: secondary tilt card */}
                    <div className="absolute inset-2 rounded-2xl bg-blue-200 dark:bg-blue-800/60 transform -rotate-3 scale-95 opacity-80 group-hover:-rotate-6 transition-transform duration-300"></div>
                    {/* Foreground main card */}
                    <div className="relative w-36 h-28 sm:w-44 sm:h-32 rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                      <img
                        src={currentImage || activity?.mainImage || activity?.image}
                        alt={activity.title || activity.activityName || 'Activity'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/600x400/lightgray/white?text=Activity';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold backdrop-blur-xs gap-1">
                        <FaExpand className="text-xs" />
                        <span>View</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {formErrors.submit && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-900/30 dark:border-red-700 dark:text-red-400">
                {formErrors.submit}
              </div>
            )}

            {fetchingFeedback ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-blue-500"></div>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading your previous feedback...</span>
              </div>
            ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">

                {/* Rating fields — grouped in a single bordered block */}
                <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'bg-gray-700/60 text-gray-400 border-b border-gray-700' : 'bg-gray-50 text-gray-500 border-b border-gray-200'}`}>
                    Ratings
                  </div>
                  {[
                    { key: 'rating',            label: 'Overall Rating'       },
                    { key: 'understandability', label: 'Ease of Understanding' },
                    { key: 'engagement',        label: 'Engagement Level'      },
                    { key: 'relevance',         label: 'Content Relevance'     },
                  ].map(({ key, label }, index, arr) => (
                    <div
                      key={key}
                      className={`flex items-center justify-between px-4 py-3 ${
                        index !== arr.length - 1
                          ? (darkMode ? 'border-b border-gray-700' : 'border-b border-gray-100')
                          : ''
                      }`}
                    >
                      <label className={`text-sm font-bold w-52 flex-shrink-0 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {label} <span className="text-red-500 font-bold">*</span>
                      </label>
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center">
                          {renderStars(key)}
                        </div>
                        {formErrors[key] && (
                          <p className="text-red-500 text-xs">{formErrors[key]}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comments */}
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Comments <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="comments"
                    rows="4"
                    className={`w-full p-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                    } ${formErrors.comments ? 'border-red-400' : ''}`}
                    placeholder="Share your thoughts about this activity..."
                    value={formData.comments}
                    onChange={handleInputChange}
                  />
                  {formErrors.comments && (
                    <p className="mt-1 text-red-500 text-xs">{formErrors.comments}</p>
                  )}
                </div>

                {/* Suggestions */}
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Suggestions for Improvement
                    <span className={`ml-1 text-xs font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(optional)</span>
                  </label>
                  <textarea
                    name="suggestions"
                    rows="3"
                    className={`w-full p-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                    }`}
                    placeholder="How could this activity be improved?"
                    value={formData.suggestions}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Footer row: hint + submit */}
                <div className="flex items-center justify-between pt-1 pb-1">
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Fields marked <span className="text-red-500">*</span> are required
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`py-2.5 px-8 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                      submitting
                        ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:scale-95'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        {editMode ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : (
                      editMode ? 'Update Feedback' : 'Submit Feedback'
                    )}
                  </button>
                </div>

              </div>
            </form>
            )}
          </div>
        </div>
      </div>
      {/* Image Modal */}
      {isImageModalOpen && activity?.mainImage && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 transition-all ${
            darkMode ? 'bg-black/75 backdrop-blur-xs' : 'bg-gray-900/40 backdrop-blur-xs'
          }`}
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className={`relative max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden transition-all flex flex-col ${
              darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'
            }`}
            style={{ maxHeight: 'calc(100vh - 40px)', boxSizing: 'border-box' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image container — overlay controls directly on image */}
            <div
              className={`relative w-full min-h-0 flex-1 rounded-xl overflow-hidden flex items-center justify-center p-2 ${
                darkMode ? 'bg-gray-900' : 'bg-gray-50 border border-gray-100'
              }`}
              style={{ maxHeight: 'calc(100vh - 80px)' }}
            >
              {/* Counter pill top-left */}
              {activityImages.length > 1 && (
                <span
                  className="absolute top-2.5 left-2.5 z-10 text-xs px-2.5 py-1 rounded-full font-semibold pointer-events-none"
                  style={{
                    background: darkMode ? 'rgba(31,41,55,0.85)' : 'rgba(255,255,255,0.88)',
                    color: darkMode ? '#d1d5db' : '#374151',
                    backdropFilter: 'blur(4px)',
                    border: darkMode ? '1px solid rgba(75,85,99,0.5)' : '1px solid rgba(209,213,219,0.7)'
                  }}
                >
                  {activeImageIndex + 1} / {activityImages.length}
                </span>
              )}
              {/* Close button top-right */}
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95"
                style={{
                  background: darkMode ? 'rgba(31,41,55,0.85)' : 'rgba(255,255,255,0.88)',
                  color: darkMode ? '#e5e7eb' : '#374151',
                  backdropFilter: 'blur(4px)',
                  border: darkMode ? '1px solid rgba(75,85,99,0.5)' : '1px solid rgba(209,213,219,0.7)',
                  padding: 0
                }}
                title="Close"
              >
                <FaTimes className="text-sm" />
              </button>

              <img
                src={currentImage || activity?.mainImage || activity?.image}
                alt="Activity preview"
                style={{ maxHeight: 'calc(100vh - 100px)', maxWidth: '100%', objectFit: 'contain' }}
                className="select-none"
              />

              {/* Left Arrow */}
              {activityImages.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer border active:scale-95"
                  style={{
                    background: darkMode ? '#374151' : '#ffffff',
                    borderColor: darkMode ? '#4b5563' : '#d1d5db',
                    color: darkMode ? '#f3f4f6' : '#1f2937',
                    padding: 0
                  }}
                  title="Previous image"
                >
                  <FaChevronLeft className="text-sm" />
                </button>
              )}

              {/* Right Arrow */}
              {activityImages.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer border active:scale-95"
                  style={{
                    background: darkMode ? '#374151' : '#ffffff',
                    borderColor: darkMode ? '#4b5563' : '#d1d5db',
                    color: darkMode ? '#f3f4f6' : '#1f2937',
                    padding: 0
                  }}
                  title="Next image"
                >
                  <FaChevronRight className="text-sm" />
                </button>
              )}
            </div>

            {/* Dot indicators */}
            {activityImages.length > 1 && (
              <div className="flex justify-center gap-1.5 py-2 flex-shrink-0">
                {activityImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === activeImageIndex
                        ? 'w-6 bg-blue-600'
                        : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                    }`}
                    style={{ border: 'none', padding: 0 }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvideFeedbackPage;