import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import DashboardMetrics from './DashboardMetrics';
import ActivityCarousel from './ActivityCarousel';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from "../../firebaseConfig";
import { resolveStudentDisplayName } from '../../utils/resolveStudentDisplayName';
import { useUserSession } from '../../UserSessionContext';
import { FaStarHalfAlt, FaStar, FaRegStar } from 'react-icons/fa';
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';
import Toast from '../../components/Toast';

/*
  Background theme: "Skyline Mist"
  A soft, layered wash of blue/teal/indigo blobs sitting behind the
  existing flat page color, instead of one flat off-white/near-black
  fill. It keeps the same base hues the app already used
  (#f8fcff light / gray-900 dark) but adds depth so panels don't look
  like they're floating on plain white. See <SkylineMistBackground />.
*/
const SkylineMistBackground = ({ darkMode }) => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    <div
      className={`absolute inset-0 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'
          : 'bg-gradient-to-br from-[#e3edf9] via-[#f3f8fd] to-[#e6f4ec]'
      }`}
    />
    <div
      className={`absolute -top-32 -left-24 w-[32rem] h-[32rem] rounded-full blur-3xl ${
        darkMode ? 'bg-blue-800/40' : 'bg-blue-300/60'
      }`}
    />
    <div
      className={`absolute top-1/4 -right-32 w-[30rem] h-[30rem] rounded-full blur-3xl ${
        darkMode ? 'bg-indigo-800/35' : 'bg-indigo-200/70'
      }`}
    />
    <div
      className={`absolute bottom-0 left-1/4 w-[26rem] h-[26rem] rounded-full blur-3xl ${
        darkMode ? 'bg-emerald-800/30' : 'bg-emerald-200/60'
      }`}
    />
    <div
      className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl ${
        darkMode ? 'bg-purple-900/25' : 'bg-sky-200/50'
      }`}
    />
  </div>
);

// Thin, theme-aware scrollbar used across the Feedback Summary cards.
// Injected once so any element with class="custom-scrollbar" picks it up.
const ScrollbarStyles = () => (
  <style>{`
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(148, 163, 184, 0.45);
      border-radius: 9999px;
    }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb {
      background-color: rgba(148, 163, 184, 0.7);
    }
    .dark .custom-scrollbar {
      scrollbar-color: rgba(100, 116, 139, 0.55) transparent;
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(100, 116, 139, 0.55);
    }
    .dark .custom-scrollbar:hover::-webkit-scrollbar-thumb {
      background-color: rgba(148, 163, 184, 0.7);
    }
  `}</style>
);

const FacultyDashboard = () => {
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('sidebarOpen')) || false; } catch { return false; }
  });
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
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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

  const carouselStarBase = {
    height: '1.25rem',
    width: '1.25rem',
    stroke: '#B45309',
    strokeWidth: 28,
    paintOrder: 'stroke fill',
  };

  // General-purpose 5-star renderer. sizeClass lets callers use a smaller
  // set of stars in tight spaces (corner badges) without duplicating logic.
  const renderStars = (rating, sizeClass = 'h-5 w-5') => {
    const safeRating = Number.isFinite(rating) ? rating : 0;
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;

    let stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar
          key={`full-${i}`}
          className={sizeClass}
          style={{ color: '#FBBF24', filter: 'drop-shadow(0 0 3px rgba(251,191,36,0.7))' }}
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <FaStarHalfAlt
          key="half"
          className={sizeClass}
          style={{ color: '#FBBF24', filter: 'drop-shadow(0 0 3px rgba(251,191,36,0.7))' }}
        />
      );
    }

    const emptyStars = 5 - Math.ceil(safeRating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaRegStar
          key={`empty-${i}`}
          className={sizeClass}
          style={{ color: '#D1D5DB' }}
        />
      );
    }

    return <div className="flex shrink-0">{stars}</div>;
  };

  const renderCarouselStars = (rating) => {
    const safeRating = Number.isFinite(rating) ? rating : 0;
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar key={`full-${i}`} style={{ ...carouselStarBase, color: '#FBBF24' }} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <FaStarHalfAlt key="half" style={{ ...carouselStarBase, color: '#FBBF24' }} />
      );
    }

    const emptyStars = 5 - Math.ceil(safeRating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaRegStar key={`empty-${i}`} style={{ ...carouselStarBase, color: '#F3F4F6' }} />
      );
    }

    return (
      <div className="flex items-center gap-0.5 bg-transparent" style={{ boxShadow: 'none', filter: 'none' }}>
        {stars}
      </div>
    );
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
          const feedbackComments = await Promise.all(feedbackSnapshot.docs.map(async (feedbackDoc) => {
            const feedbackData = feedbackDoc.data();
            const studentName = await resolveStudentDisplayName(feedbackData);
            return {
              id: feedbackDoc.id,
              studentName,
              studentId: feedbackData.studentId,
              rating: feedbackData.rating,
              understandability: feedbackData.understandability,
              engagement: feedbackData.engagement,
              relevance: feedbackData.relevance,
              comment: feedbackData.comment,
              suggestions: feedbackData.suggestions,
              timestamp: feedbackData.timestamp
            };
          }));

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
            // NOTE on the "Feedback Completion" stat:
            // it's computed from each activity's total-enrolled-students
            // count, which may be saved under different keys depending on
            // where the activity was created. This checks the common
            // alternates so the stat has a better chance of resolving to
            // a real number instead of always landing on 0. If it's still
            // 0.0% after this, the field genuinely isn't being saved
            // anywhere on the activity document and needs to be added at
            // creation time.
            totalStudents: data.totalStudents || data.totalStudent || data.studentsCount ||
              data.totalEnrolled || data.enrolledStudents || data.classStrength ||
              data.totalClassStudents || 0,
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
        facultyName: user?.name || '',
        renderStars: () => renderCarouselStars(activity.averageRating)
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

    // Close modal instantly with ZERO delay & show toast immediately
    setShowDeptModal(false);
    setDeptEditMode(false);
    setToast({ show: true, message: 'Department updated successfully!', type: 'success' });

    // Update user context immediately
    setUser({
      ...user,
      departments: departments,
      primaryDepartment: primaryDepartment
    });

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        departments: departments,
        primaryDepartment: primaryDepartment
      });
    } catch (error) {
      console.error("Error updating departments in Firestore:", error);
      setToast({ show: true, message: 'Failed to update department. Please try again.', type: 'error' });
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
    return null;
  }

  // Sorted, un-truncated lists - the cards below scroll instead of cutting
  // data off, so this stays correct no matter how much feedback comes in.
  const topRatedActivities = [...activities]
    .filter(activity => activity.feedbackCount > 0)
    .sort((a, b) => b.averageRating - a.averageRating);

  const recentFeedback = activities
    .flatMap(activity =>
      activity.comments.map(comment => ({
        ...comment,
        activityName: activity.activityName,
        department: activity.department
      }))
    )
    .sort((a, b) => {
      // Newest first
      const dateA = a.timestamp?.toDate?.() || new Date(0);
      const dateB = b.timestamp?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

  return (
    <>
      <ScrollbarStyles />
      <SkylineMistBackground darkMode={darkMode} />
      <div className={`flex flex-col min-h-screen ${darkMode ? 'text-gray-100' : 'text-slate-800'} transition-colors duration-300`}>
        {/* Toast Notification */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            darkMode={darkMode}
            onClose={() => setToast(prev => ({ ...prev, show: false }))}
          />
        )}
        {/* Department Selection Modal */}
        <DepartmentSelectionModal
          isOpen={showDeptModal}
          onClose={() => {
            if (!user?.departments || user.departments.length === 0) return;
            setShowDeptModal(false);
            setDeptEditMode(false);
          }}
          onSubmit={handleDeptSubmit}
          userType="faculty"
          currentDepartments={user?.departments || []}
          currentPrimaryDepartment={user?.primaryDepartment || user?.departments?.[0] || ''}
          canEdit={true}
          darkMode={darkMode}
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
        {/* Sidebar */}
        <Sidebar 
          darkMode={darkMode} 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar}
          toggleDarkMode={toggleDarkMode} 
          activePage="dashboard"
          isMultiSelectMode={isMultiSelectMode}
        />
        {/* Block dashboard if department not set */}
        {(!user?.departments || user.departments.length === 0) ? (
          <div className="flex justify-center items-center h-96 text-xl font-semibold">Please select your department to continue.</div>
        ) : (
          <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out page-smooth-enter`}>
            {!loading && (
              <>
                {/* Activity Carousel with Feedback */}
                <div className="mb-3">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                    {/* Activities with Highest Ratings - all of them, scrollable */}
                    <div className={`p-6 rounded-xl border shadow-sm transition-colors duration-300 hover:shadow-md ${
                      darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-gray-100'
                    }`}>
                      <h3 className="text-lg font-semibold mb-4">Top Rated Activities</h3>
                      {topRatedActivities.length > 0 ? (
                        <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-2">
                          {topRatedActivities.map(activity => (
                              <div key={activity.id} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <div className="flex items-start justify-between gap-2 w-full">
                                  <div className="min-w-0 flex-1">
                                    <span
                                      className="font-semibold truncate block"
                                      style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}
                                      title={activity.activityName}
                                    >
                                      {activity.activityName}
                                    </span>
                                    {activity.department && (
                                      <span className="block text-xs text-gray-500 mt-1 truncate">
                                        {activity.department}
                                      </span>
                                    )}
                                  </div>
                                  <div className={`flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    darkMode ? 'bg-amber-900/30 text-amber-200' : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    <FaStar className="h-3 w-3 text-amber-400" />
                                    {activity.averageRating.toFixed(1)}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <div className="flex items-center">
                                    {renderStars(activity.averageRating, 'h-4 w-4')}
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
                    {/* Recent Feedback - all of it, newest first, scrollable */}
                    <div className={`p-6 rounded-xl border shadow-sm transition-colors duration-300 hover:shadow-md ${
                      darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-gray-100'
                    }`}>
                      <h3 className="text-lg font-semibold mb-4">Recent Feedback</h3>
                      {recentFeedback.length > 0 ? (
                        <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-2">
                          {recentFeedback.map((comment, index) => (
                              <div key={comment.id || index} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <div className="flex items-start justify-between gap-2 w-full">
                                  <span
                                    className="font-medium truncate block min-w-0 flex-1"
                                    title={comment.activityName}
                                  >
                                    {comment.activityName}
                                  </span>
                                  <div className={`flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    darkMode ? 'bg-amber-900/30 text-amber-200' : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    <FaStar className="h-3 w-3 text-amber-400" />
                                    {Number(comment.rating).toFixed(1)}
                                  </div>
                                </div>

                                <div className="mt-2">
                                  {renderStars(comment.rating, 'h-4 w-4')}
                                </div>

                                <div className="flex justify-between items-center gap-2 mt-2">
                                  <span className="text-xs truncate">{comment.studentName || 'Anonymous'}</span>
                                  <span className="text-xs shrink-0 text-right">
                                    {comment.department && (
                                      <span className="block font-medium text-gray-500 dark:text-gray-400 truncate max-w-[10rem]">{comment.department}</span>
                                    )}
                                    {comment.timestamp?.toDate?.() && (
                                      <span className="block text-[10px] opacity-70">
                                        {comment.timestamp.toDate().toLocaleDateString()}
                                      </span>
                                    )}
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
                      <div className="max-h-[420px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                        {/* Feedback Overview */}
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Total Reviews Received:
                          </span>
                          <span className="text-base font-bold text-sky-600 dark:text-sky-400">
                            {totalFeedbackCount(activities)}
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
                                <div className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
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