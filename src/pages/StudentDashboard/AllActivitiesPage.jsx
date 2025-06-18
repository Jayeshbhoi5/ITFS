import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './StudentSidebar';
import Navbar from './Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaCalendarAlt, FaUser, FaChalkboardTeacher, FaStar } from 'react-icons/fa';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { useActivities } from "../FacultyDashboard/ActivityContext";
import { useActivityUserStatus } from "./ActivityUserStatusManager";
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import StudentMetrics from './StudentMetrics';

const AllActivitiesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'submitted'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityRatings, setActivityRatings] = useState({});
  
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

  // Update tab from URL if needed
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['all', 'pending', 'submitted'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

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
            
            // If it's a submitted activity, also fetch user's personal feedback to get rating
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
              averageRating: userRating > 0 ? userRating : (latestData.averageRating || 0),
              userRating: userRating
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
      
      // This will re-trigger the above useEffect which processes activities
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
          activity.faculty?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      return matchesTab && matchesSearch;
    });
  }, [activities, searchTerm, activeTab, isActivitySubmitted, activityRatings]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleProvideFeedback = (activityId) => {
    const selectedActivity = activities.find(activity => activity.id === activityId);
    if (selectedActivity) {
      localStorage.setItem('selectedActivity', JSON.stringify(selectedActivity));
      navigate(`/ProvideFeedbackPage/${activityId}`, {
        state: { fromActivities: true } // Add this to track navigation source
      });
    }
  };

  const handleViewFeedback = (activityId) => {
    console.log(`Attempting to navigate to /viewfeedbackpage/${activityId}`);
    // Add a small delay to ensure the log is visible before navigation
    setTimeout(() => {
      navigate(`/viewfeedbackpage/${activityId}`);
    }, 100);
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
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <FaStar
            key={i}
            className={`w-4 h-4 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
          ({rating ? rating.toFixed(1) : "0.0"})
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
        activePage="activities"
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
        
        {/* Search Box */}
        <div className="mb-6">
          <div className={`flex items-center p-2 rounded-md ${
            darkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <FaSearch className="text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search activities..." 
              className={`bg-transparent border-none outline-none ${
                darkMode ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-500'
              }`}
              value={searchTerm}
              onChange={handleSearch}
            />
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
                    <div className="md:w-1/4 h-48 md:h-auto">
                      <img 
                        src={activity.image} 
                        alt={activity.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 md:w-3/4 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold">{activity.title}</h3>
                          <div className="flex space-x-2">
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
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{activity.description}</p>
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
                              onClick={() => handleProvideFeedback(activity.id)}
                              className={`text-sm font-medium px-4 py-2 rounded ${
                                darkMode 
                                  ? 'bg-blue-700 hover:bg-blue-700 text-white'
                                  : 'bg-blue-700 hover:bg-blue-700 text-white'
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
                            <button 
                              onClick={() => handleViewFeedback(activity.id)}
                              className={`text-sm font-medium px-4 py-2 rounded ${
                                darkMode 
                                  ? 'bg-green-700 hover:bg-green-600 text-white'
                                  : 'bg-green-700 hover:bg-green-600 text-white'
                              }`}
                            >
                              View Feedback
                            </button>
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
    </div>
  );
};

export default AllActivitiesPage;