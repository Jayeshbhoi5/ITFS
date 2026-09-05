import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import {
  FaUser, FaCalendarAlt, FaStar, FaTimes, FaExpand,
  FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import Navbar from './Navbar';
import Sidebar from './StudentSidebar';

const ViewFeedbackPage = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialActivity = location.state?.activity || null;
  const [feedback, setFeedback] = useState(null);
  const [activity, setActivity] = useState(initialActivity);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setDarkModeInStorage(newMode);
  };

  const getCurrentUserId = () => {
    return auth.currentUser?.uid;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchFeedbackAndActivity = async () => {
      try {
        if (!activity) {
          setLoading(true);
        }

        // Fetch activity details
        const activityRef = doc(db, 'activities', activityId);
        const activitySnap = await getDoc(activityRef);

        if (!activitySnap.exists()) {
          throw new Error('Activity not found');
        }

        const activityData = {
          id: activitySnap.id,
          ...activitySnap.data()
        };
        setActivity(activityData);

        // Fetch feedback
        const userId = getCurrentUserId();
        if (!userId) {
          throw new Error('User not authenticated');
        }

        let feedbackData = null;

        // Try query with userId
        let q = query(
          collection(db, 'feedback'),
          where('activityId', '==', activityId),
          where('userId', '==', userId)
        );
        let feedbackSnapshot = await getDocs(q);

        // If no results, try with studentId
        if (feedbackSnapshot.empty) {
          q = query(
            collection(db, 'feedback'),
            where('activityId', '==', activityId),
            where('studentId', '==', userId)
          );
          feedbackSnapshot = await getDocs(q);
        }

        // Fallback search
        if (feedbackSnapshot.empty) {
          q = query(collection(db, 'feedback'), where('activityId', '==', activityId));
          feedbackSnapshot = await getDocs(q);

          if (!feedbackSnapshot.empty) {
            const potentialMatch = feedbackSnapshot.docs.find(d => {
              const data = d.data();
              return data.userId?.includes(userId) || data.studentId?.includes(userId) ||
                     data.userEmail === auth.currentUser?.email;
            });

            if (potentialMatch) {
              feedbackData = { id: potentialMatch.id, ...potentialMatch.data() };
            } else {
              const firstDoc = feedbackSnapshot.docs[0];
              feedbackData = { id: firstDoc.id, ...firstDoc.data() };
            }
          }
        } else {
          const feedbackDoc = feedbackSnapshot.docs[0];
          feedbackData = { id: feedbackDoc.id, ...feedbackDoc.data() };
        }

        if (!feedbackData) {
          throw new Error('Feedback not found. Please ensure you have submitted feedback for this activity.');
        }

        // Normalize comments field
        if (!feedbackData.comments) {
          feedbackData.comments = feedbackData.comment || feedbackData.feedback || feedbackData.text || feedbackData.description || '';
        }

        setFeedback(feedbackData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching feedback or activity:', err);
        setError(err.message || 'Failed to load feedback.');
        setLoading(false);
      }
    };

    fetchFeedbackAndActivity();
  }, [activityId]);

  // Aggregate all images belonging to the activity
  const activityImages = useMemo(() => {
    const list = [];
    const main = activity?.mainImage || activity?.image;
    if (main) list.push(main);

    if (Array.isArray(activity?.fileUrls) && activity.fileUrls.length > 0) {
      activity.fileUrls.forEach(f => {
        const url = typeof f === 'string' ? f : f?.url;
        if (url && !list.includes(url)) list.push(url);
      });
    }
    if (Array.isArray(activity?.images) && activity.images.length > 0) {
      activity.images.forEach(img => {
        const url = typeof img === 'string' ? img : img?.url;
        if (url && !list.includes(url)) list.push(url);
      });
    }
    return list;
  }, [activity]);

  const handlePrevImage = (e) => {
    if (e) e.stopPropagation();
    setActiveImageIndex(prev => (prev === 0 ? activityImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    if (e) e.stopPropagation();
    setActiveImageIndex(prev => (prev === activityImages.length - 1 ? 0 : prev + 1));
  };

  const renderStarRating = (rating) => {
    const numericRating = typeof rating === 'string' ? parseFloat(rating) : (rating || 0);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <FaStar
            key={i}
            className={`w-4 h-4 ${i < Math.round(numericRating) ? 'text-yellow-400' : (darkMode ? 'text-gray-600' : 'text-gray-300')}`}
          />
        ))}
      </div>
    );
  };

  const getComments = () => {
    if (!feedback) return 'No comments provided';
    const c = feedback.comments || feedback.comment || feedback.feedback || '';
    return c.trim() ? c : 'No comments provided';
  };

  const activityTitle = activity?.activityName || activity?.title || 'Untitled Activity';
  const currentImage = activityImages[activeImageIndex] || activity?.mainImage || activity?.image || null;

  if (loading && !activity) {
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

  if (error) {
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
          <div className="text-center p-8 rounded-xl bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200 max-w-lg mx-auto border border-red-200 dark:border-red-800">
            <p className="mb-4">{error}</p>
            <button
              onClick={() => navigate('/AllActivitiesPage')}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors cursor-pointer"
              style={{ border: 'none' }}
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

      <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out`}>
        <div className={`rounded-xl shadow-sm border transition-colors duration-300 animate-slide-up ${
          darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-gray-200'
        }`}>
          <div className="p-6">
            {/* Back arrow + breadcrumb row */}
            <div className="flex items-center gap-2.5 mb-5">
              <button
                type="button"
                onClick={() => navigate('/AllActivitiesPage')}
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
                  View Feedback
                </span>
              </div>
            </div>

            {/* Top row: Title + Meta details on left, Modern Stacked Image Card on right */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                {/* Activity title */}
                <h2
                  className={`text-2xl font-bold mb-3 leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  style={{ wordBreak: 'break-word' }}
                >
                  {activityTitle}
                </h2>

                {/* Activity meta row */}
                <div className="flex flex-wrap items-center gap-2.5 mb-3">
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
                  {(activity.activityDate || activity.date) && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      darkMode
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <FaCalendarAlt className="text-amber-500 text-xs" />
                      <span>{
                        activity.activityDate
                          ? new Date(activity.activityDate).toLocaleDateString()
                          : activity.date
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
                </div>

                {activity.description && (
                  <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activity.description}
                  </p>
                )}
              </div>

              {/* Modern Gesture Stacked Image Card */}
              {currentImage && (
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
                        src={currentImage}
                        alt={activityTitle}
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

                  {/* Arrow controls below thumbnail if multiple images */}
                  {activityImages.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs border active:scale-95"
                        style={{
                          background: darkMode ? '#374151' : '#ffffff',
                          borderColor: darkMode ? '#4b5563' : '#d1d5db',
                          color: darkMode ? '#e5e7eb' : '#374151',
                          padding: 0
                        }}
                        title="Previous image"
                      >
                        <FaChevronLeft className="text-[10px]" />
                      </button>
                      <span className={`text-[11px] font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {activeImageIndex + 1} / {activityImages.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs border active:scale-95"
                        style={{
                          background: darkMode ? '#374151' : '#ffffff',
                          borderColor: darkMode ? '#4b5563' : '#d1d5db',
                          color: darkMode ? '#e5e7eb' : '#374151',
                          padding: 0
                        }}
                        title="Next image"
                      >
                        <FaChevronRight className="text-[10px]" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ratings Section */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-blue-500"></div>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading feedback details...</span>
              </div>
            ) : (
              <>
                {feedback && (
                  <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-4 w-1 rounded-full bg-blue-600 dark:bg-blue-500" />
                  <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    Submitted Ratings
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { label: 'Overall Rating',        val: feedback.rating           },
                    { label: 'Ease of Understanding', val: feedback.understandability },
                    { label: 'Engagement Level',      val: feedback.engagement        },
                    { label: 'Content Relevance',     val: feedback.relevance         },
                  ].map(({ label, val }) => {
                    const score = typeof val === 'string' ? parseFloat(val) : (val || 0);
                    const pct = (score / 5) * 100;
                    return (
                      <div
                        key={label}
                        className={`rounded-xl border p-4 transition-all duration-200 hover:shadow-xs ${
                          darkMode
                            ? 'bg-gray-800/90 border-gray-700/80 hover:border-blue-500/40'
                            : 'bg-white border-gray-200 hover:border-blue-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                            {label}
                          </span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            darkMode 
                              ? 'bg-blue-950/50 text-blue-300 border-blue-800/60' 
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {score > 0 ? `${score} / 5` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`w-4 h-4 ${i < Math.round(score) ? 'text-yellow-400' : (darkMode ? 'text-gray-600' : 'text-gray-300')}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comments block */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 rounded-full bg-blue-600 dark:bg-blue-500" />
                <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Comments
                </span>
              </div>
              <div className={`rounded-xl p-4 text-sm leading-relaxed border ${
                darkMode
                  ? 'bg-gray-800/80 border-gray-700 text-gray-200'
                  : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}>
                {getComments()}
              </div>
            </div>

            {/* Suggestions block */}
            {feedback?.suggestions && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-1 rounded-full bg-blue-600 dark:bg-blue-500" />
                  <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    Suggestions for Improvement
                  </span>
                </div>
                <div className={`rounded-xl p-4 text-sm leading-relaxed border ${
                  darkMode
                    ? 'bg-gray-800/80 border-gray-700 text-gray-200'
                    : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}>
                  {feedback.suggestions}
                </div>
              </div>
            )}

            {/* Submission Date */}
            {feedback?.createdAt && (
              <div className="pt-2 flex justify-end">
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border ${
                  darkMode
                    ? 'bg-gray-800 text-gray-400 border-gray-700'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                  <FaCalendarAlt className="opacity-60 text-blue-500" />
                  Submitted on:{' '}
                  {feedback.createdAt.toDate
                    ? new Date(feedback.createdAt.toDate()).toLocaleString()
                    : new Date(feedback.createdAt).toLocaleString()}
                </span>
              </div>
            )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && currentImage && (
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
            style={{
              maxHeight: 'calc(100vh - 40px)',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >


            {/* Image Container — close button & counter overlaid directly on image */}
            <div
              className={`relative w-full min-h-0 flex-1 rounded-xl overflow-hidden flex items-center justify-center p-2 ${
                darkMode ? 'bg-gray-900' : 'bg-gray-50 border border-gray-100'
              }`}
              style={{
                maxHeight: 'calc(100vh - 80px)'
              }}
            >
              {/* Overlay: counter pill top-left */}
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
              {/* Overlay: close button top-right */}
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
                src={currentImage}
                alt="Activity preview"
                style={{
                  maxHeight: 'calc(100vh - 100px)',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
                className="select-none"
              />

              {/* Left Arrow Button (NO black background) */}
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

              {/* Right Arrow Button (NO black background) */}
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

            {/* Bottom thumbnail dots if multiple images */}
            {activityImages.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2.5 pt-1 flex-shrink-0">
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

export default ViewFeedbackPage;