import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './StudentSidebar';
import Navbar from './Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaCalendarAlt, FaUser, FaChalkboardTeacher, FaStar, FaEdit, FaEye, FaExpand, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { useActivities } from "../FacultyDashboard/ActivityContext";
import { useActivityUserStatus } from "./ActivityUserStatusManager";
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useUserSession } from '../../UserSessionContext';
import { computeCurrentYearAndAcademic } from '../../components/DepartmentSelectionModal';

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
  const [modalImages, setModalImages] = useState([]);
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0);
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get activities from context
  const { activities: contextActivities, refreshActivities } = useActivities();

  // Get dark mode from storage
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  
  // Get user session for default filter values
  const { user } = useUserSession();

  // Get user status context
  const { submittedActivities = [], isActivitySubmitted = () => false, loading: statusLoading = false } = useActivityUserStatus() || {};

  // Auto-set filters from user's saved year when user data loads
  // Both year and academic year auto-advance each July 1 via computeCurrentYearAndAcademic()
  useEffect(() => {
    if (user?.baseYear && user?.yearSelectedAt) {
      const { currentYear, academicYear } = computeCurrentYearAndAcademic(user.baseYear, user.yearSelectedAt);
      setClassNameFilter(currentYear);
      setAcademicYearFilter(academicYear);
    }
  }, [user?.baseYear, user?.yearSelectedAt]);
  
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
            
            // Extract all image URLs
            const allImages = [];
            if (latestData.mainImage) allImages.push(latestData.mainImage);
            if (Array.isArray(latestData.fileUrls)) {
              latestData.fileUrls.forEach(f => {
                const url = typeof f === 'string' ? f : f?.url;
                if (url && !allImages.includes(url)) allImages.push(url);
              });
            }
            if (Array.isArray(latestData.images)) {
              latestData.images.forEach(img => {
                const url = typeof img === 'string' ? img : img?.url;
                if (url && !allImages.includes(url)) allImages.push(url);
              });
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
              image: latestData.mainImage || (allImages.length > 0 ? allImages[0] : 'https://placehold.co/600x400/lightgray/white?text=Activity'),
              images: allImages,
              fileUrls: latestData.fileUrls || [],
              mainImage: latestData.mainImage || null,
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
      navigate(`/ProvideFeedbackPage/${activityId}`, {
        state: {
          activity: selectedActivity,
          fromActivities: true
        }
      });
    }
  };

  const handleViewFeedback = (activityId) => {
    const selectedActivity = activities.find(activity => activity.id === activityId);
    navigate(`/viewfeedbackpage/${activityId}`, {
      state: {
        activity: selectedActivity
      }
    });
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

  const openImageModal = (activityOrImages, initialIndex = 0) => {
    let imagesList = [];
    if (Array.isArray(activityOrImages)) {
      imagesList = activityOrImages;
    } else if (activityOrImages && typeof activityOrImages === 'object') {
      if (Array.isArray(activityOrImages.images) && activityOrImages.images.length > 0) {
        imagesList = activityOrImages.images;
      } else if (activityOrImages.mainImage) {
        imagesList = [activityOrImages.mainImage];
      } else if (activityOrImages.image) {
        imagesList = [activityOrImages.image];
      }
    } else if (typeof activityOrImages === 'string') {
      imagesList = [activityOrImages];
    }
    
    setModalImages(imagesList);
    setActiveModalImageIndex(initialIndex);
    setIsImageModalOpen(true);
  };

  const handlePrevModalImage = (e) => {
    if (e) e.stopPropagation();
    setActiveModalImageIndex(prev => (prev === 0 ? modalImages.length - 1 : prev - 1));
  };

  const handleNextModalImage = (e) => {
    if (e) e.stopPropagation();
    setActiveModalImageIndex(prev => (prev === modalImages.length - 1 ? 0 : prev + 1));
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setModalImages([]);
    setActiveModalImageIndex(0);
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
        <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-grow flex items-center">
              <FaSearch className="absolute left-4 text-gray-400 pointer-events-none" style={{top: '50%', transform: 'translateY(-50%)'}} />
              <input
                type="text"
                placeholder="Search by activity, faculty, or keyword..."
                value={searchTerm}
                onChange={handleSearch}
                className={`w-full rounded-xl py-3 pl-12 pr-4 border transition-all ${
                  darkMode ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600 focus:border-blue-500' : 'bg-gray-50 text-gray-800 placeholder-gray-400 border-gray-200 focus:border-blue-400'
                }`}
              />
            </div>
            {/* Academic Year Filter */}
            <div className="relative">
              <select
                value={academicYearFilter}
                onChange={(e) => setAcademicYearFilter(e.target.value)}
                className={`w-full md:w-auto rounded-xl py-3 pl-4 pr-10 border transition-all appearance-none ${
                  darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-800 border-gray-200'
                }`}
              >
                <option value="">All Academic Years</option>
                {['2024-25','2025-26','2026-27','2027-28','2028-29','2029-30'].map(year => (
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
                className={`w-full md:w-auto rounded-xl py-3 pl-4 pr-10 border transition-all appearance-none ${
                  darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-800 border-gray-200'
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
                  className={`rounded-xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-md ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="p-3.5 flex items-center justify-center flex-shrink-0">
                      <div 
                        className="relative group cursor-pointer select-none p-1.5"
                        onClick={() => openImageModal(activity)}
                        title="Click to view photo"
                      >
                        {/* Layer 1: background tilt card */}
                        <div className="absolute inset-1.5 rounded-2xl bg-indigo-200 dark:bg-indigo-900/60 transform rotate-6 scale-95 opacity-70 group-hover:rotate-12 transition-transform duration-300"></div>
                        {/* Layer 2: secondary tilt card */}
                        <div className="absolute inset-1.5 rounded-2xl bg-blue-200 dark:bg-blue-800/60 transform -rotate-3 scale-95 opacity-80 group-hover:-rotate-6 transition-transform duration-300"></div>
                        {/* Foreground main card */}
                        <div className="relative w-44 h-36 sm:w-48 sm:h-44 rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-750 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                          <img 
                            src={activity.image} 
                            alt={activity.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
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
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h3
                            className="text-lg font-semibold overflow-hidden"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-word',
                              flex: '1 1 0%',
                            }}
                            title={activity.title}
                          >
                            {activity.title}
                          </h3>
                          <div className="flex flex-wrap gap-1 flex-shrink-0 justify-end" style={{ maxWidth: '55%' }}>
                            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs whitespace-nowrap">
                              {activity.academicYear}
                            </span>
                            <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs whitespace-nowrap">
                              {activity.branch}
                            </span>
                            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs whitespace-nowrap">
                              {activity.year}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
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
      {isImageModalOpen && modalImages.length > 0 && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 transition-all ${
            darkMode ? 'bg-black/75 backdrop-blur-xs' : 'bg-gray-900/40 backdrop-blur-xs'
          }`}
          onClick={closeImageModal}
        >
          <div 
            className={`relative max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden transition-all flex flex-col ${
              darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'
            }`}
            style={{ maxHeight: 'calc(100vh - 40px)', boxSizing: 'border-box' }}
            onClick={e => e.stopPropagation()}
          >
            <div 
              className={`relative w-full min-h-0 flex-1 rounded-xl overflow-hidden flex items-center justify-center p-2 ${
                darkMode ? 'bg-gray-900' : 'bg-gray-50 border border-gray-100'
              }`}
              style={{ maxHeight: 'calc(100vh - 80px)' }}
            >
              {/* Counter pill top-left */}
              {modalImages.length > 1 && (
                <span
                  className="absolute top-2.5 left-2.5 z-10 text-xs px-2.5 py-1 rounded-full font-semibold pointer-events-none"
                  style={{
                    background: darkMode ? 'rgba(31,41,55,0.85)' : 'rgba(255,255,255,0.88)',
                    color: darkMode ? '#d1d5db' : '#374151',
                    backdropFilter: 'blur(4px)',
                    border: darkMode ? '1px solid rgba(75,85,99,0.5)' : '1px solid rgba(209,213,219,0.7)'
                  }}
                >
                  {activeModalImageIndex + 1} / {modalImages.length}
                </span>
              )}

              {/* Close button top-right */}
              <button
                type="button"
                onClick={closeImageModal}
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
                src={modalImages[activeModalImageIndex] || modalImages[0]} 
                alt="Activity preview" 
                style={{ maxHeight: 'calc(100vh - 100px)', maxWidth: '100%', objectFit: 'contain' }}
                className="select-none" 
              />

              {/* Left Arrow */}
              {modalImages.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevModalImage}
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
              {modalImages.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextModalImage}
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
            {modalImages.length > 1 && (
              <div className="flex justify-center gap-1.5 py-2 flex-shrink-0">
                {modalImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveModalImageIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === activeModalImageIndex
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

export default AllActivitiesPage;