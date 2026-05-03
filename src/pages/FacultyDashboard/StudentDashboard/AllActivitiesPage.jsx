import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './StudentSidebar';
import Navbar from './Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaCalendarAlt, FaUser, FaChalkboardTeacher, FaStar, FaEdit, FaEye } from 'react-icons/fa';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { useActivities } from "../FacultyDashboard/ActivityContext";
import { useActivityUserStatus } from "./ActivityUserStatusManager";
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

const AllActivitiesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [classNameFilter, setClassNameFilter] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityRatings, setActivityRatings] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [feedbackEditStatus, setFeedbackEditStatus] = useState({});
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get activities from context
  const { activities: contextActivities, refreshActivities } = useActivities();

  // Get dark mode from storage
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  
  // Get user status context
  const { submittedActivities = [], isActivitySubmitted = () => false, loading: statusLoading = false } = useActivityUserStatus() || {};
  
  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setDarkModeInStorage(newMode);
  };

  // Toast notification function
  const showToastMessage = (message, type = 'info') => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Update tab from URL if needed
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['all', 'pending', 'submitted'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Fetch latest activity data directly from Firestore for each activity
  const fetchLatestActivityData = async (activityId) => {
    try {
      const activityRef = doc(db, 'activities', activityId);
      const activitySnap = await getDoc(activityRef);
      
      if (activitySnap.exists()) {
        return {
          id: activitySnap.id,
          ...activitySnap.data()
        };
      }
      return null;
    } catch (err) {
      console.error(`Error fetching latest data for activity ${activityId}:`, err);
      return null;
    }
  };

  // Fetch user feedback for a specific activity
  const fetchUserFeedback = async (activityId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return null;

      // Try different field combinations for query
      // First try with userId field
      let q = query(
        collection(db, 'feedback'), 
        where('activityId', '==', activityId),
        where('userId', '==', userId)
      );
      
      let feedbackSnapshot = await getDocs(q);
      
      // If no results, try with studentId field
      if (feedbackSnapshot.empty) {
        q = query(
          collection(db, 'feedback'), 
          where('activityId', '==', activityId),
          where('studentId', '==', userId)
        );
        
        feedbackSnapshot = await getDocs(q);
      }
      
      // If still no results, try just by activityId
      if (feedbackSnapshot.empty) {
        q = query(
          collection(db, 'feedback'), 
          where('activityId', '==', activityId)
        );
        
        feedbackSnapshot = await getDocs(q);
        
        // Try to find one matching this user
        if (!feedbackSnapshot.empty) {
          const potentialMatch = feedbackSnapshot.docs.find(doc => {
            const data = doc.data();
            return data.userId?.includes(userId) || data.studentId?.includes(userId) || 
                   data.userEmail === auth.currentUser?.email;
          });
          
          if (potentialMatch) {
            return {
              id: potentialMatch.id,
              ...potentialMatch.data()
            };
          }
        }
      } else if (!feedbackSnapshot.empty) {
        // Found a direct match with one of the first two queries
        const feedbackDoc = feedbackSnapshot.docs[0];
        return {
          id: feedbackDoc.id,
          ...feedbackDoc.data()
        };
      }
      
      return null;
    } catch (err) {
      console.error(`Error fetching feedback for activity ${activityId}:`, err);
      return null;
    }
  };

  // Process activities from context
  useEffect(() => {
    const processActivities = async () => {
      if (contextActivities && contextActivities.length > 0) {
        try {
          setLoading(true);
          
          const processedActivities = await Promise.all(contextActivities.map(async (data) => {
            // For activities, always fetch the latest data to get updated ratings
            let latestData = data;
            const freshData = await fetchLatestActivityData(data.id);
            if (freshData) {
              latestData = freshData;
            }
            
            // Format date strings
            const activityDate = latestData.activityDate ? new Date(latestData.activityDate) : null;
            const formattedDate = activityDate ? activityDate.toLocaleDateString() : '';
            
            // Calculate due date (30 days after activity date)
            const dueDate = activityDate ? new Date(activityDate) : new Date();
            dueDate.setDate(dueDate.getDate() + 30);
            
            // If it's a submitted activity, also fetch user's personal feedback to get rating and edit status
            let userRating = 0;
            if (isActivitySubmitted(latestData.id)) {
              const userFeedback = await fetchUserFeedback(latestData.id);
              if (userFeedback && userFeedback.rating) {
                userRating = parseFloat(userFeedback.rating);
                
                // Store this rating in the state for quick access
                setActivityRatings(prev => ({
                  ...prev,
                  [latestData.id]: userRating
                }));

                // Store edit status
                setFeedbackEditStatus(prev => ({
                  ...prev,
                  [latestData.id]: userFeedback.hasBeenEdited || false
                }));
              }
            }
            
            return {
              id: latestData.id,
              title: latestData.activityName || 'Untitled Activity',
              description: latestData.description || '',
              branch: latestData.courseName || latestData.branch || '',
              year: latestData.className || latestData.year || '',
              faculty: latestData.facultyName || '',
              date: formattedDate,
              dueDate: dueDate.toISOString().split('T')[0],
              image: latestData.mainImage || 'https://placehold.co/600x400/lightgray/white?text=Activity',
              totalUsers: latestData.totalStudents || 0,
              averageRating: latestData.averageRating || 0,
              userRating: userRating,
              academicYear: latestData.academicYear,
            };
          }));
          
          setActivities(processedActivities);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error processing activities:", err);
          setError("Failed to process activities. Please try again later.");
          setLoading(false);
        }
      } else {
        if (!statusLoading) {
          setLoading(false);
        }
      }
    };

    processActivities();
  }, [contextActivities, statusLoading, isActivitySubmitted]);

  // Refresh data when returning from feedback submission
  useEffect(() => {
    if (location.state?.fromActivities || location.state?.feedbackSubmitted) {
      setLoading(true);
      
      // If the context has a refresh function, use it
      if (typeof refreshActivities === 'function') {
        refreshActivities();
      }
    }
  }, [location.state, refreshActivities]);

  // Memoize filtered activities
  const filteredActivities = useMemo(() => {
    // Make sure we have activities data
    if (!activities || activities.length === 0) {
      console.log('No activities available to filter');
      return [];
    }

    // Make sure we have the user status function
    const checkSubmitted = typeof isActivitySubmitted === 'function' 
      ? isActivitySubmitted 
      : () => false;

    // Map activities to include submission status
    const activitiesWithStatus = activities.map(activity => {
      const submitted = checkSubmitted(activity.id);
      return { 
        ...activity, 
        status: submitted ? 'submitted' : 'pending',
        // Use the stored user rating if available
        averageRating: activityRatings[activity.id] || activity.averageRating || 0
      };
    });
    
    // Then filter based on tab and search
    return activitiesWithStatus.filter(activity => {
      // Filter by tab
      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'submitted' && activity.status === 'submitted') ||
        (activeTab === 'pending' && activity.status === 'pending');
      
      // Filter by search term
      const matchesSearch = searchTerm 
        ? activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          activity.faculty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.branch?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      // ADDED: Filter by academic year and class name
      const matchesAcademicYear = !academicYearFilter || activity.academicYear === academicYearFilter;
      const matchesClassName = !classNameFilter || activity.year === classNameFilter;
      
      return matchesTab && matchesSearch && matchesAcademicYear && matchesClassName;
    });
  }, [activities, searchTerm, activeTab, isActivitySubmitted, activityRatings, academicYearFilter, classNameFilter]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleActivitySelect = (activityId) => {
    const selectedActivity = activities.find(activity => activity.id === activityId);
    if (selectedActivity) {
      localStorage.setItem('selectedActivity', JSON.stringify(selectedActivity));
      navigate(`/ProvideFeedbackPage/${activityId}`, {
        state: { fromActivities: true }
      });
    }
  };

  const handleViewFeedback = (activityId) => {
    setTimeout(() => {
      navigate(`/viewfeedbackpage/${activityId}`);
    }, 100);
  };

  const handleEditFeedback = async (activityId) => {
    // Find the activity from the locally processed 'activities' list.
    // This is crucial because this list contains the formatted properties 
    // like 'title' and 'dueDate' that the ProvideFeedbackPage expects.
    const activityToEdit = activities.find(act => act.id === activityId);

    if (activityToEdit) {
      // Pass the full, processed activity object via state.
      navigate(`/ProvideFeedbackPage/${activityId}`, {
        state: {
          activity: activityToEdit,
          isEditing: true
        }
      });
    } else {
      console.error("Could not find activity to edit in the processed list.");
      showToastMessage("Error: Could not load activity data to edit.", "error");
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Calculate days remaining until due date
  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location);
    url.searchParams.set('tab', activeTab);
    window.history.pushState({}, '', url);
  }, [activeTab]);

  // Function to render star ratings
  const renderStarRating = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="text-yellow-400" />
        ))}
        {halfStar && <FaStar key="half" className="text-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaStar key={`empty-${i}`} className="text-gray-300" />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          ({(rating || 0).toFixed(1)})
        </span>
      </div>
    );
  };

  const calculateAverageRating = useMemo(() => {
    if (!submittedActivities.length) return 0;
    
    const sum = submittedActivities.reduce((total, activityId) => {
      return total + (activityRatings[activityId] || 0);
    }, 0);
    
    return (sum / submittedActivities.length).toFixed(1);
  }, [submittedActivities, activityRatings]);

  const openImageModal = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setModalImageUrl('');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'} transition-colors duration-300`}>
      {/* Navigation Bar */}
      <Navbar 
        darkMode={darkMode} 
        toggleSidebar={toggleSidebar} 
        showProfileMenu={showProfileMenu}
        toggleProfileMenu={toggleProfileMenu}
        sidebarOpen={sidebarOpen}
      />

      {/* Sidebar */}
      <Sidebar 
        darkMode={darkMode}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleDarkMode={toggleDarkMode}
        activePage="all-activities"
      />

      {/* Content area */}
      <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out min-h-screen flex flex-col`}>
        <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
          All Activities
        </h2>
        
        {/* Tab navigation */}
        <div className="flex space-x-4 mb-6">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'all'
                ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'pending'
                ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
            }`}
          >
            Pending
          </button>
          <button 
            onClick={() => setActiveTab('submitted')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'submitted'
                ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
            }`}
          >
            Submitted
          </button>
        </div>
        
        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-grow">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by activity, faculty, or keyword..."
                value={searchTerm}
                onChange={handleSearch}
                className={`w-full rounded-lg py-3 pl-12 pr-4 transition-all ${
                  darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-800 placeholder-gray-500'
                }`}
              />
            </div>
            {/* Academic Year Filter */}
            <div className="relative">
              <select
                value={academicYearFilter}
                onChange={(e) => setAcademicYearFilter(e.target.value)}
                className={`w-full md:w-auto rounded-lg py-3 pl-4 pr-10 transition-all appearance-none ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                <option value="">All Academic Years</option>
                {['2027-28','2026-27','2025-26','2024-25', '2023-24', '2022-23', '2021-22', '2020-21'].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
            {/* Class Name Filter */}
            <div className="relative">
              <select
                value={classNameFilter}
                onChange={(e) => setClassNameFilter(e.target.value)}
                className={`w-full md:w-auto rounded-lg py-3 pl-4 pr-10 transition-all appearance-none ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                <option value="">All Years</option>
                <option value="FE">FE</option>
                <option value="SE">SE</option>
                <option value="TE">TE</option>
                <option value="BE">BE</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
        </div>
        
        {/* Loading State */}
        {(loading || statusLoading) && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="text-center p-8 rounded-lg bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
            <p>{error}</p>
          </div>
        )}
        
        {/* Activities List */}
        {!loading && !statusLoading && !error && (
          <div className="space-y-4 flex-grow">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className={`rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-64 h-48 flex-shrink-0">
                      <img 
                        src={activity.image} 
                        alt={activity.title} 
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openImageModal(activity.image)}
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/600x400/lightgray/white?text=Activity';
                        }}
                      />
                    </div>
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold">{activity.title}</h3>
                          <div className="flex space-x-2">
                            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                              {activity.academicYear}
                            </span>
                            <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs">
                              {activity.branch}
                            </span>
                            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                              {activity.year}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              activity.status === 'pending'
                                ? (darkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800')
                                : (darkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800')
                            }`}>
                              {activity.status === 'pending' ? 'Pending' : 'Submitted'}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <p className="whitespace-pre-wrap">
                                {expandedActivityId === activity.id || (activity.description || '').length <= 150
                                ? activity.description
                                : `${(activity.description || '').substring(0, 150)}...`}
                            </p>
                            {(activity.description || '').length > 150 && (
                                <button
                                onClick={() => setExpandedActivityId(expandedActivityId === activity.id ? null : activity.id)}
                                className="text-blue-500 hover:underline mt-1 text-sm bg-transparent border-none p-0"
                                >
                                {expandedActivityId === activity.id ? 'Show less' : 'more...'}
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <FaUser className="mr-2" />
                            <span>Faculty: {activity.faculty}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <FaCalendarAlt className="mr-2" />
                            <span>Date: {activity.date}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <FaChalkboardTeacher className="mr-2" />
                            <span>Due: {new Date(activity.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        {activity.status === 'pending' ? (
                          <>
                            <div className={`px-3 py-1 rounded-full text-xs ${
                              getDaysRemaining(activity.dueDate) <= 3
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : getDaysRemaining(activity.dueDate) <= 7
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {getDaysRemaining(activity.dueDate)} days remaining
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActivitySelect(activity.id);
                              }}
                              className={`text-sm font-medium px-4 py-2 rounded ${
                                darkMode 
                                  ? 'bg-blue-700 hover:bg-blue-600 text-white'
                                  : 'bg-blue-700 hover:bg-blue-600 text-white'
                              }`}
                            >
                              Provide Feedback
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center">
                              <span className="text-sm mr-2">Rating:</span>
                              {renderStarRating(activity.averageRating)}
                            </div>
                            <div className="flex space-x-2">
                              {feedbackEditStatus[activity.id] ? (
                                <button 
                                  disabled={true}
                                  className={`text-sm font-medium px-3 py-2 rounded flex items-center space-x-1 cursor-not-allowed opacity-50 ${
                                    darkMode 
                                      ? 'bg-gray-600 text-gray-400'
                                      : 'bg-gray-400 text-gray-600'
                                  }`}
                                  title="Feedback has already been edited"
                                >
                                  <FaEdit className="w-3 h-3" />
                                  <span>Edited</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditFeedback(activity.id);
                                  }}
                                  className={`text-sm font-medium px-3 py-2 rounded flex items-center space-x-1 ${
                                    darkMode 
                                      ? 'bg-blue-700 hover:bg-blue-600 text-white'
                                      : 'bg-blue-700 hover:bg-blue-600 text-white'
                                  }`}
                                  title="Edit Feedback"
                                >
                                  <FaEdit className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                              )}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewFeedback(activity.id);
                                }}
                                className={`text-sm font-medium px-4 py-2 rounded ${
                                  darkMode 
                                    ? 'bg-green-700 hover:bg-green-600 text-white'
                                    : 'bg-green-700 hover:bg-green-600 text-white'
                                }`}
                              >
                                View Feedback
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`text-center p-8 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <p className="text-lg">No activities found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          toastMessage.includes('error') || toastMessage.includes('cannot be edited')
            ? 'bg-red-600 text-white'
            : toastMessage.includes('success') || toastMessage.includes('Opening')
            ? 'bg-green-600 text-white'
            : darkMode ? 'bg-blue-800 text-white' : 'bg-blue-600 text-white'
        } ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center"
          onClick={closeImageModal}
        >
          <div 
            className="relative bg-white p-4 rounded-lg shadow-lg max-w-4xl max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={closeImageModal}
              className="absolute -top-4 -right-4 text-white bg-gray-800 rounded-full p-2 text-2xl leading-none"
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              &times;
            </button>
            <img src={modalImageUrl} alt="Full size activity" className="object-contain" style={{ maxHeight: '85vh' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllActivitiesPage;