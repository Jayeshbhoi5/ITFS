import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { FaStar, FaStarHalfAlt, FaRegStar, FaArrowLeft, FaCalendarAlt, FaUser, FaBook, FaGraduationCap } from 'react-icons/fa';
import TruncatedText from '../../components/TruncatedText';
import Spinner from '../../components/Spinner';

const FacultyDetailView = ({ facultyId, onBack, darkMode = false }) => {
  const [activities, setActivities] = useState([]);
  const [facultyInfo, setFacultyInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);

  const fetchFacultyData = useCallback(async () => {
    if (!facultyId) {
      setLoading(false);
      return;
    }

      setLoading(true);
      setError('');
      
      try {
        console.log('Fetching data for faculty ID:', facultyId);
        
        // Fetch faculty information
        const facultyDoc = await getDoc(doc(db, 'users', facultyId));
        if (facultyDoc.exists()) {
          const facultyData = facultyDoc.data();
          setFacultyInfo({
            name: facultyData.name || 'Unknown Faculty',
            email: facultyData.email || '',
            department: facultyData.department || '',
            ...facultyData
          });
          console.log('Faculty info:', facultyData);
        } else {
          console.log('Faculty document not found');
          setError('Faculty information not found');
          return;
        }

        // Fetch activities for this faculty
        const activitiesRef = collection(db, 'activities');
        const activitiesQuery = query(
          activitiesRef,
          where('facultyId', '==', facultyId),
          orderBy('createdAt', 'desc')
        );
        
        const activitiesSnapshot = await getDocs(activitiesQuery);
        console.log('Found activities:', activitiesSnapshot.size);

        if (activitiesSnapshot.empty) {
          console.log('No activities found for faculty:', facultyId);
          setActivities([]);
          setLoading(false);
          return;
        }

        // Process each activity and fetch its feedback
        const activitiesData = await Promise.all(
          activitiesSnapshot.docs.map(async (activityDoc) => {
            const activityData = activityDoc.data();
            console.log('Processing activity:', activityData.activityName);

            // Fetch feedback for this activity
            const feedbackQuery = query(
              collection(db, 'feedback'),
              where('activityId', '==', activityDoc.id)
            );
            
            const feedbackSnapshot = await getDocs(feedbackQuery);
            const feedbackData = feedbackSnapshot.docs.map(fbDoc => ({ id: fbDoc.id, ...fbDoc.data() }));

            // Manually calculate all average ratings from the fetched feedback
            const calculateAverage = (items, key) => {
              const ratings = items.map(item => item[key]).filter(r => typeof r === 'number');
              return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
            };

            const calculatedOverallAverage = calculateAverage(feedbackData, 'rating');
            const calculatedUnderstandability = calculateAverage(feedbackData, 'understandability');
            const calculatedEngagement = calculateAverage(feedbackData, 'engagement');
            const calculatedRelevance = calculateAverage(feedbackData, 'relevance');
            
            return { 
              id: activityDoc.id, 
              ...activityData, 
              feedback: feedbackData,
              feedbackCount: feedbackData.length,
              averageRating: calculatedOverallAverage,
              averageUnderstandability: calculatedUnderstandability,
              averageEngagement: calculatedEngagement,
              averageRelevance: calculatedRelevance,
              createdDate: activityData.createdAt ? new Date(activityData.createdAt.toDate()).toLocaleDateString() : 'Unknown',
              activityDate: activityData.activityDate ? new Date(activityData.activityDate).toLocaleDateString() : 'Unknown'
            };
          })
        );

        console.log('Processed activities with feedback:', activitiesData.length);
        setActivities(activitiesData);
        
        // Set first activity as selected by default
        if (activitiesData.length > 0) {
          setSelectedActivity(activitiesData[0]);
        }

      } catch (err) {
        console.error("Error fetching faculty data:", err);
        setError(`Failed to fetch faculty data: ${err.message}`);
      } finally {
        setLoading(false);
      }
  }, [facultyId]);

  useEffect(() => {
    fetchFacultyData();
    window.addEventListener('focus', fetchFacultyData);
    return () => {
      window.removeEventListener('focus', fetchFacultyData);
    };
  }, [fetchFacultyData]);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-500" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-500" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-gray-300" />);
    }
    
    return <div className="flex justify-center space-x-1">{stars}</div>;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingBadgeColor = (rating) => {
    if (rating >= 4.5) return 'bg-green-100 text-green-800';
    if (rating >= 3.5) return 'bg-blue-100 text-blue-800';
    if (rating >= 2.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className={`min-h-full ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Spinner />
            <p className="text-lg mt-4">Loading faculty performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-full ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="container mx-auto px-4 py-8">
         
          <div className="text-center bg-red-50 border border-red-200 rounded-lg p-8">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Data</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Scrollbar styling */}
      <style>
        {`
          .scrollbar-light::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .scrollbar-light::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .scrollbar-light::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 10px;
          }
          .scrollbar-light::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
          .scrollbar-dark::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .scrollbar-dark::-webkit-scrollbar-track {
            background: #374151;
            border-radius: 10px;
          }
          .scrollbar-dark::-webkit-scrollbar-thumb {
            background: #6b7280;
            border-radius: 10px;
          }
          .scrollbar-dark::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
        `}
      </style>

      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
     

        {/* Faculty Info Header */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 mb-6`}>
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} rounded-full flex items-center justify-center`}>
              <FaUser className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{facultyInfo.name}</h1>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{facultyInfo.email}</p>
              {facultyInfo.department && (
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                  Department: {facultyInfo.department}
                </p>
              )}
            </div>
          </div>

          {/* Performance Summary */}
          {activities.length > 0 && (
            (() => {
              const ratedActivities = activities.filter(act => act.feedback && act.feedback.length > 0);
              const overallAverage = ratedActivities.length > 0
                ? ratedActivities.reduce((sum, act) => sum + act.averageRating, 0) / ratedActivities.length
                : 0;

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg p-4 text-center`}>
                    <div className="text-2xl font-bold text-blue-600">{activities.length}</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Activities</div>
                  </div>
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-green-50'} rounded-lg p-4 text-center`}>
                    <div className="text-2xl font-bold text-green-600">
                      {activities.reduce((sum, activity) => sum + (activity.feedbackCount || 0), 0)}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Feedback</div>
                  </div>
                  <div className={`${darkMode ? 'bg-green-50' : 'bg-green-50'} rounded-lg p-4 text-center`}>
                    <div className={`text-2xl font-bold ${getRatingColor(overallAverage)}`}>
                      {overallAverage.toFixed(1)}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Overall Rating</div>
                  </div>
                  <div className={`${darkMode ? 'bg-green-50' : 'bg-green-50'} rounded-lg p-4 text-center`}>
                    <div className="text-2xl font-bold text-purple-600">
                      {activities.filter(activity => activity.averageRating >= 4).length}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>High Rated (4+)</div>
                  </div>
                </div>
              );
            })()
          )}
        </div>

        {activities.length === 0 ? (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-12 text-center`}>
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold mb-2">No Activities Found</h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              This faculty member hasn't uploaded any activities yet, or there might be a data synchronization issue.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activities List */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
              <h2 className="text-xl font-bold mb-4">Activities ({activities.length})</h2>
              <div className={`space-y-3 max-h-96 overflow-y-auto ${darkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => setSelectedActivity(activity)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedActivity?.id === activity.id
                        ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 border-blue-300')
                        : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100')
                    }`}
                  >
                    <h3 className="font-semibold mb-1">{activity.activityName}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {activity.activityDate}
                      </span>
                      <div className="flex items-center space-x-1">
                        <FaStar className="text-yellow-500 text-xs" />
                        <span className={getRatingColor(activity.averageRating)}>
                          {activity.averageRating.toFixed(1)}
                        </span>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          ({activity.feedbackCount})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Details */}
            <div className="lg:col-span-2">
              {selectedActivity ? (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden`}>
                  {/* Activity Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-2">{selectedActivity.activityName}</h2>
                    <div className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <TruncatedText text={selectedActivity.description} />
                    </div>
                    
                    <div className="grid grid-cols-2 
                    md:grid-cols-4 gap-4 text-sm mt-3">
                      <div className="flex items-center space-x-2">
                        <FaBook className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                        <span>{selectedActivity.courseName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaGraduationCap className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                        <span>{selectedActivity.className}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaCalendarAlt className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                        <span>{selectedActivity.activityDate}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getRatingBadgeColor(selectedActivity.averageRating)}`}>
                          {selectedActivity.averageRating.toFixed(1)} ★
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ratings Breakdown */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Rating Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getRatingColor(selectedActivity.averageRating)}`}>
                          {selectedActivity.averageRating.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-500">Overall</div>
                        {renderStars(selectedActivity.averageRating)}
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getRatingColor(selectedActivity.averageUnderstandability)}`}>
                          {selectedActivity.averageUnderstandability.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-500">Understanding</div>
                        {renderStars(selectedActivity.averageUnderstandability)}
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getRatingColor(selectedActivity.averageEngagement)}`}>
                          {selectedActivity.averageEngagement.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-500">Engagement</div>
                        {renderStars(selectedActivity.averageEngagement)}
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getRatingColor(selectedActivity.averageRelevance)}`}>
                          {selectedActivity.averageRelevance.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-500">Relevance</div>
                        {renderStars(selectedActivity.averageRelevance)}
                      </div>
                    </div>
                  </div>

                  {/* Student Feedback */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Student Feedback ({selectedActivity.feedbackCount})
                    </h3>
                    
                    {selectedActivity.feedback.length > 0 ? (
                      <div className={`space-y-4 max-h-96 overflow-y-auto ${darkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
                        {selectedActivity.feedback.map((feedback) => (
                          <div
                            key={feedback.id}
                            className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{feedback.studentName}</h4>
                              <div className="flex items-center space-x-1">
                                {renderStars(feedback.rating)}
                                <span className={`ml-2 font-semibold ${getRatingColor(feedback.rating)}`}>
                                  {feedback.rating}
                                </span>
                              </div>
                            </div>
                            
                            {feedback.comment && (
                              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                "{feedback.comment}"
                              </p>
                            )}
                            
                            {feedback.suggestions && (
                              <div className="mt-2">
                                <span className="text-sm font-medium">Suggestions: </span>
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {feedback.suggestions}
                                </span>
                              </div>
                            )}
                            
                            {feedback.timestamp && (
                              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-2`}>
                                {new Date(feedback.timestamp.toDate()).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">💬</div>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          No feedback submitted for this activity yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-12 text-center`}>
                  <div className="text-4xl mb-4">👈</div>
                  <h3 className="text-xl font-semibold mb-2">Select an Activity</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Choose an activity from the left panel to view detailed feedback and ratings.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDetailView;