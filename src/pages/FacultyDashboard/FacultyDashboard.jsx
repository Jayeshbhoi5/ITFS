import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import DashboardMetrics from './DashboardMetrics';
import ActivityCarousel from './ActivityCarousel';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from "../../firebaseConfig";
import { useUserSession } from '../../UserSessionContext';
import { FaStarHalfAlt, FaStar, FaRegStar } from 'react-icons/fa';
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';

const FacultyDashboard = () => {
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalActivities: 0,
    totalFeedback: 0,
    pendingFeedback: 0,
    averageRating: 0
  });
  const { user, loading: userLoading, setUser } = useUserSession();
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptEditMode, setDeptEditMode] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Replace your toggle function with:
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setDarkModeInStorage(newMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  // Function to render star ratings
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    let stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar key={`full-${i}`} className="h-5 w-5 text-yellow-500" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <FaStarHalfAlt key="half" className="h-5 w-5 text-yellow-500" />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaRegStar key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
      );
    }
    
    return <div className="flex">{stars}</div>;
  };

  useEffect(() => {
    const fetchActivitiesWithFeedback = async () => {
      try {
        setLoading(true);
        
        if (!user) {
          setActivities([]);
          return;
        }
        
        let activitiesQuery;
        
        if (user.role === 'Faculty') {
          activitiesQuery = query(
            collection(db, 'activities'),
            where('facultyId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
        } else if (user.role === 'Student') {
          activitiesQuery = query(
            collection(db, 'activities'),
            where('department', '==', user.departments[0].trim()),
            orderBy('createdAt', 'desc')
          );
        } else {
          activitiesQuery = query(
            collection(db, 'activities'),
            orderBy('createdAt', 'desc'),
            limit(20)
          );
        }

        const querySnapshot = await getDocs(activitiesQuery);
        
        const activityPromises = querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Fetch related feedback for this activity
          const feedbackQuery = query(
            collection(db, 'feedback'),
            where('activityId', '==', doc.id)
          );
          
          const feedbackSnapshot = await getDocs(feedbackQuery);
          const feedbackComments = feedbackSnapshot.docs.map(feedbackDoc => {
            const feedbackData = feedbackDoc.data();
            return {
              id: feedbackDoc.id,
              studentName: feedbackData.studentName,
              studentId: feedbackData.studentId,
              rating: feedbackData.rating,
              understandability: feedbackData.understandability,
              engagement: feedbackData.engagement,
              relevance: feedbackData.relevance,
              comment: feedbackData.comment,
              suggestions: feedbackData.suggestions,
              timestamp: feedbackData.timestamp
            };
          });
          
          // Calculate average rating
          const ratings = feedbackComments.map(c => c.rating);
          const averageRating = ratings.length > 0 ? 
            ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
          
          return {
            id: doc.id,
            ...data,
            date: data.activityDate ? new Date(data.activityDate).toLocaleDateString() : 
                 data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 
                 'No date',
            averageRating: averageRating,
            comments: feedbackComments || [],
            totalStudents: data.totalStudents || 0,
            feedbackCount: feedbackComments.length,
            branch: data.className || 'Unknown',
            year: data.academicYear || 'Unknown',
            image: data.mainImage || (data.fileUrls && data.fileUrls.length > 0 ? data.fileUrls[0].url : 'https://via.placeholder.com/300x200?text=No+Image')
          };
        });
        
        const fetchedActivities = await Promise.all(activityPromises);
        setActivities(fetchedActivities);
        
        // Update dashboard metrics based on feedback data
        updateDashboardMetrics(fetchedActivities);
      } catch (error) {
        console.error('Error fetching activities with feedback:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivitiesWithFeedback();
  }, [user]);

  // Function to update dashboard metrics based on fetched activities
  const updateDashboardMetrics = (activities) => {
    if (!activities || activities.length === 0) {
      setDashboardMetrics({
        totalActivities: 0,
        totalFeedback: 0,
        pendingFeedback: 0,
        averageRating: 0
      });
      return;
    }

    const totalActivities = activities.length;
    
    // Calculate total feedback received across all activities
    const totalFeedback = activities.reduce((sum, activity) => 
      sum + (activity.comments ? activity.comments.length : 0), 0);
    
    // Calculate pending feedback (total students - received feedback)
    const totalStudents = activities.reduce((sum, activity) => 
      sum + (activity.totalStudents || 0), 0);
    const pendingFeedback = Math.max(0, totalStudents - totalFeedback);
    
    // Calculate average rating across all activities
    const allRatings = activities.flatMap(activity => 
      activity.comments ? activity.comments.map(comment => comment.rating) : []);
    const averageRating = allRatings.length > 0 
      ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length 
      : 0;
    
    // Update the dashboard metrics
    setDashboardMetrics({
      totalActivities,
      totalFeedback,
      pendingFeedback,
      averageRating
    });
  };

  useEffect(() => {
    // Apply dark mode to the entire document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Enhanced activity carousel items with feedback data
 // Enhanced activity carousel items with feedback data
const getEnhancedActivities = () => {
  return activities
    .slice(0, 5) // Only take the first 5 activities
    .map(activity => ({
      id: activity.id,
      title: activity.activityName,
      image: activity.image,
      description: activity.description,
      branch: activity.branch,
      year: activity.year,
      rating: activity.averageRating,
      feedbackCount: activity.feedbackCount,
      renderStars: () => renderStars(activity.averageRating)
    }));
};

  useEffect(() => {
    if (user && user.role === 'Faculty' && !user.primaryDepartment) {
        setShowDeptModal(true);
    }
  }, [user]);

  // Handler for department edit from Navbar/profile
  const handleEditDepartment = () => {
    if (user && user.role === 'Faculty') {
      setShowDeptModal(true);
      setDeptEditMode(true);
    }
  };

  const handleDeptSubmit = async ({ departments, primaryDepartment }) => {
    if (!user) return;

    try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
            departments: departments,
            primaryDepartment: primaryDepartment
        });

        // Update user context after successful Firestore update
        setUser({
            ...user,
            departments: departments,
            primaryDepartment: primaryDepartment
        });

        setShowDeptModal(false);
        setDeptEditMode(false);
    } catch (error) {
        console.error("Error updating departments:", error);
    }
  };

  const deleteSelectedActivities = async () => {
    if (selectedActivities.size > 0) {
      try {
        for (const activityId of selectedActivities) {
          await deleteDoc(doc(db, 'activities', activityId));
        }
        setActivities(prev => prev.filter(activity => !selectedActivities.has(activity.id)));
        setSelectedActivities(new Set());
      } catch (error) {
        alert('Failed to delete activities: ' + error.message);
      }
    }
  };

  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-screen w-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
<div className={`flex flex-col min-h-full ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'} transition-colors duration-300`}>        {/* Department Selection Modal */}
        <DepartmentSelectionModal
          isOpen={showDeptModal}
          onClose={() => {
            // In this flow, the user cannot close the modal.
            // A department must be selected to proceed.
          }}
          onSubmit={handleDeptSubmit}
          userType="faculty"
          currentDepartments={user?.departments || []}
          canEdit={true}
        />
        {/* Navigation Bar */}
        <Navbar 
          darkMode={darkMode} 
          toggleSidebar={toggleSidebar} 
          showProfileMenu={showProfileMenu}
          toggleProfileMenu={toggleProfileMenu}
          sidebarOpen={sidebarOpen}
          user={user}
          onEditDepartment={handleEditDepartment}
        />
        {/* Block dashboard if department not set */}
        {(!user?.departments || user.departments.length === 0) ? (
          <div className="flex justify-center items-center h-96 text-xl font-semibold">Please select your department to continue.</div>
        ) : (
          <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out`}>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Activity Carousel with Feedback */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Faculty Dashboard</h2>
                    <div className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}> 
                      <div className="flex items-center gap-2">
                        <span>Overall Rating:</span>
                        {renderStars(dashboardMetrics.averageRating)}
                        <span className="text-lg font-bold">{dashboardMetrics.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <ActivityCarousel 
                    darkMode={darkMode}
                    activities={getEnhancedActivities()}
                  />
                </div>
                {/* Dashboard Metrics with Feedback Data */}
                <DashboardMetrics 
                  darkMode={darkMode} 
                  dashboardMetrics={dashboardMetrics} 
                />
                {/* Feedback Summary Section */}
                <div className="mt-8">
                  <h2 className="text-2xl font-bold mb-4">Feedback Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Activities with Highest Ratings - Now showing top 5 */}
                    <div className={`p-6 rounded-xl border shadow-sm transition-colors duration-300 hover:shadow-md ${
                      darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-gray-100'
                    }`}>
                      <h3 className="text-lg font-semibold mb-4">Top Rated Activities</h3>
                      {activities.length > 0 ? (
                        <div className="space-y-3">
                          {activities
                            .filter(activity => activity.feedbackCount > 0)
                            .sort((a, b) => b.averageRating - a.averageRating)
                            .slice(0, 5) // Only show top 5
                            .map(activity => (
                              <div key={activity.id} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <div className="flex items-center justify-between gap-2 w-full">
                                  <div className="w-full">
                                    <span className="font-medium text-blue-900 dark:text-blue-200 truncate block" style={{ maxWidth: '100%' }}>
                                      {activity.activityName}
                                    </span>
                                    {activity.department && (
                                      <span className="block text-xs text-gray-500 mt-1">
                                        {activity.department}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <div className="flex items-center">
                                    {renderStars(activity.averageRating)}
                                    <span className="ml-2 font-bold">{activity.averageRating.toFixed(1)}</span>
                                  </div>
                                  <span className="text-sm">{activity.feedbackCount} reviews</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-center py-4">No rated activities available</p>
                      )}
                    </div>
                    {/* Recent Feedback - Now showing only last 5 */}
                    <div className={`p-6 rounded-xl border shadow-sm transition-colors duration-300 hover:shadow-md ${
                      darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-gray-100'
                    }`}>
                      <h3 className="text-lg font-semibold mb-4">Recent Feedback</h3>
                      {activities.length > 0 ? (
                        <div className="space-y-3">
                          {activities
                            .flatMap(activity => 
                              activity.comments.map(comment => ({
                                ...comment,
                                activityName: activity.activityName,
                                activityDate: activity.createdAt // Add activity date for sorting
                              }))
                            )
                            .sort((a, b) => {
                              // Sort by timestamp descending (newest first)
                              const dateA = a.timestamp?.toDate?.() || new Date(0);
                              const dateB = b.timestamp?.toDate?.() || new Date(0);
                              return dateB - dateA;
                            })
                            .slice(0, 5) // Only show last 5
                            .map((comment, index) => (
                              <div key={comment.id || index} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <div className="flex items-center gap-2 w-full">
                                  <div className="w-full">
                                    <span className="font-medium truncate block max-w-[100%]">{comment.activityName}</span>
                                    {comment.department && (
                                      <span className="block text-xs text-gray-500 mt-1">{comment.department}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <div className="flex items-center">
                                    <FaStar className="h-4 w-4 text-yellow-500 mr-1" />
                                    <span>{comment.rating}</span>
                                  </div>
                                </div>
                                <p className="text-sm mt-1 line-clamp-2">{comment.comment || 'No comment provided'}</p>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-xs">{comment.studentName || 'Anonymous'}</span>
                                  <span className="text-xs">
                                    {comment.timestamp?.toDate?.().toLocaleDateString() || ''}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-center py-4">No feedback available</p>
                      )}
                    </div>
                    {/* Feedback Statistics */}
                    <div className={`p-6 rounded-xl border shadow-sm transition-colors duration-300 hover:shadow-md ${
                      darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-gray-100'
                    }`}>
                      <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
                      <div className="space-y-4">
                        {/* Feedback Completion Rate */}
                        <div className="flex items-center justify-between">
                          <span>Feedback Completion:</span>
                          <span className="font-bold">
                            {feedbackCompletionRate(activities).toFixed(1)}%
                          </span>
                        </div>
                        {/* Rating Distribution */}
                        <div className="mt-4">
                          {[5, 4, 3, 2, 1].map(rating => {
                            const count = countRatingOccurrences(activities, rating);
                            const total = totalFeedbackCount(activities);
                            const percentage = total > 0 ? (count / total) * 100 : 0;
                            return (
                              <div key={rating} className="flex items-center mt-1">
                                <span className="text-sm w-3">{rating}</span>
                                <FaStar className="h-4 w-4 text-yellow-500 mx-1" />
                                <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-yellow-500" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm ml-2 w-8">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {/* Sidebar */}
      <Sidebar 
        darkMode={darkMode} 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        toggleDarkMode={toggleDarkMode} 
        activePage="dashboard"
        isMultiSelectMode={isMultiSelectMode}
      />
    </>
  );
};

// Helper functions for feedback statistics
const totalStudentsCount = (activities) => {
  return activities.reduce((sum, activity) => sum + (activity.totalStudents || 0), 0);
};

const totalStudentsWithFeedback = (activities) => {
  return activities.reduce((sum, activity) => sum + (activity.comments ? activity.comments.length : 0), 0);
};

const feedbackCompletionRate = (activities) => {
  const totalStudents = totalStudentsCount(activities);
  const totalFeedback = totalStudentsWithFeedback(activities);
  return totalStudents > 0 ? (totalFeedback / totalStudents) * 100 : 0;
};

const totalFeedbackCount = (activities) => {
  return activities.reduce((sum, activity) => 
    sum + (activity.comments ? activity.comments.length : 0), 0);
};

const countRatingOccurrences = (activities, ratingValue) => {
  return activities.reduce((count, activity) => {
    const matchingRatings = activity.comments 
      ? activity.comments.filter(comment => Math.floor(comment.rating) === ratingValue).length 
      : 0;
    return count + matchingRatings;
  }, 0);
};

export default FacultyDashboard;