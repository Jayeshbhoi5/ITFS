import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { FaArrowLeft, FaCalendarAlt, FaUser, FaChalkboardTeacher, FaStar, FaComment } from 'react-icons/fa';
import { getDarkModeFromStorage } from './darkModeUtils';
import Navbar from './Navbar';
import Sidebar from './StudentSidebar';

const ViewFeedbackPage = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());

  // Get current user ID
  const getCurrentUserId = () => {
    return auth.currentUser?.uid;
  };

  // Fetch feedback and activity details
  useEffect(() => {
    const fetchFeedbackAndActivity = async () => {
      try {
        setLoading(true);
        console.log(`Fetching data for activity: ${activityId}`);

        // First fetch the activity details
        const activityRef = doc(db, 'activities', activityId);
        const activitySnap = await getDoc(activityRef);

        if (!activitySnap.exists()) {
          throw new Error('Activity not found');
        }

        const activityData = {
          id: activitySnap.id,
          ...activitySnap.data()
        };
        console.log("Activity data:", activityData);
        setActivity(activityData);

        // Then fetch feedback using query where activityId matches
        const userId = getCurrentUserId();
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        console.log(`Searching for feedback with activityId: ${activityId}, userId: ${userId}`);
        
        // Try different field combinations for query
        let feedbackData = null;
        
        // First try with userId field
        let q = query(
          collection(db, 'feedback'), 
          where('activityId', '==', activityId),
          where('userId', '==', userId)
        );
        
        let feedbackSnapshot = await getDocs(q);
        
        // If no results, try with studentId field
        if (feedbackSnapshot.empty) {
          console.log("No results with userId, trying studentId");
          q = query(
            collection(db, 'feedback'), 
            where('activityId', '==', activityId),
            where('studentId', '==', userId)
          );
          
          feedbackSnapshot = await getDocs(q);
        }
        
        // If still no results, try just by activityId (in case the user identifiers don't match)
        if (feedbackSnapshot.empty) {
          console.log("No results with studentId, trying only activityId");
          q = query(
            collection(db, 'feedback'), 
            where('activityId', '==', activityId)
          );
          
          feedbackSnapshot = await getDocs(q);
          
          // If we find multiple results, try to find the one that looks like it belongs to this user
          if (!feedbackSnapshot.empty) {
            console.log(`Found ${feedbackSnapshot.docs.length} feedback entries for this activity`);
            // Try to find one matching this user somehow (even partial match)
            const potentialMatch = feedbackSnapshot.docs.find(doc => {
              const data = doc.data();
              return data.userId?.includes(userId) || data.studentId?.includes(userId) || 
                     data.userEmail === auth.currentUser?.email;
            });
            
            if (potentialMatch) {
              console.log("Found potential matching feedback");
              feedbackData = {
                id: potentialMatch.id,
                ...potentialMatch.data()
              };
            } else {
              // Just take the first one if we can't find a match
              console.log("No specific match found, using first result");
              const firstDoc = feedbackSnapshot.docs[0];
              feedbackData = {
                id: firstDoc.id,
                ...firstDoc.data()
              };
            }
          }
        } else if (!feedbackSnapshot.empty) {
          // Found a direct match with one of the first two queries
          const feedbackDoc = feedbackSnapshot.docs[0];
          feedbackData = {
            id: feedbackDoc.id,
            ...feedbackDoc.data()
          };
        }
        
        if (!feedbackData) {
          throw new Error('Feedback not found. Please ensure you have submitted feedback for this activity.');
        }
        
        console.log("Fetched feedback data:", feedbackData);
        
        // Ensure comments field is available
        if (feedbackData.comments === undefined || feedbackData.comments === null) {
          console.log("Comments field is missing or null, checking alternate fields");
          // Try common alternate field names
          if (feedbackData.comment) {
            feedbackData.comments = feedbackData.comment;
          } else if (feedbackData.feedback) {
            feedbackData.comments = feedbackData.feedback;
          } else if (feedbackData.text) {
            feedbackData.comments = feedbackData.text;
          } else if (feedbackData.description) {
            feedbackData.comments = feedbackData.description;
          } else {
            console.log("No alternative comment field found");
            feedbackData.comments = ""; // Ensure it's at least an empty string
          }
        }
        
        setFeedback(feedbackData);
        setLoading(false);
        
      } catch (err) {
        console.error('Error fetching feedback or activity:', err);
        setError(`${err.message || 'Failed to load feedback. Please try again later.'}`);
        setLoading(false);
      }
    };

    fetchFeedbackAndActivity();
  }, [activityId]);

  // Handle back navigation
  const handleBack = () => {
    navigate('/AllActivitiesPage'); // Navigate directly to AllActivitiesPage
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Function to render star ratings
  const renderStarRating = (rating) => {
    const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <FaStar
            key={i}
            className={`w-6 h-6 ${i < Math.round(numericRating) ? 'text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-2 text-gray-800 dark:text-gray-200">
          ({numericRating ? numericRating.toFixed(1) : '0.0'})
        </span>
      </div>
    );
  };

  // Safe getter function for feedback data to handle different data structures
  const getFeedbackField = (field, defaultValue = '') => {
    if (!feedback) return defaultValue;
    
    // Direct field access
    if (feedback[field] !== undefined && feedback[field] !== null) {
      return feedback[field];
    }
    
    // Check for nested fields (sometimes data is nested under 'data' or similar)
    if (feedback.data && feedback.data[field] !== undefined && feedback.data[field] !== null) {
      return feedback.data[field];
    }
    
    // For comments, check alternative field names
    if (field === 'comments') {
      const alternatives = ['comment', 'feedback', 'text', 'description', 'content', 'message'];
      for (const alt of alternatives) {
        if (feedback[alt]) return feedback[alt];
        if (feedback.data && feedback.data[alt]) return feedback.data[alt];
      }
    }
    
    return defaultValue;
  };

  // Get comments safely
  const getComments = () => {
    const comments = getFeedbackField('comments', '');
    return comments && comments.trim() !== '' ? comments : 'No comments provided';
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex justify-center items-center ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex justify-center items-center ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
        <div className="text-center p-8 rounded-lg bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 max-w-lg mx-auto">
          <p>{error}</p>
          <button
            onClick={handleBack}
            className={`mt-4 flex items-center px-4 py-2 rounded-lg mx-auto ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            <FaArrowLeft className="mr-2" />
            Back to Activities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'} transition-colors duration-300`}>
      {/* Navigation Bar */}
      <Navbar 
        darkMode={darkMode} 
        toggleSidebar={toggleSidebar} 
        sidebarOpen={sidebarOpen}
      />

      {/* Sidebar */}
      <Sidebar 
        darkMode={darkMode}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        activePage="activities"
      />

      {/* Content area */}
      <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out min-h-screen flex flex-col`}>
        {/* Back Button */}
        <div className="p-4">
          <button
            onClick={handleBack}
            className={`flex items-center px-4 py-2 rounded-lg ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
        </div>

        {/* Feedback and Activity Details */}
        <div className="p-6 flex-grow">
          <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
            Feedback Details
          </h2>

          {/* Activity Details */}
          {activity && (
            <div className={`rounded-xl shadow-sm border p-6 mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <h3 className="text-xl font-semibold mb-4">{activity.activityName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <FaUser className="mr-2" />
                  <span>Faculty: {activity.facultyName}</span>
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  <span>Date: {activity.activityDate ? new Date(activity.activityDate).toLocaleDateString() : 'Not specified'}</span>
                </div>
                <div className="flex items-center">
                  <FaChalkboardTeacher className="mr-2" />
                  <span>Course: {activity.courseName}</span>
                </div>
              </div>
              {/* Activity Image */}
              <div className="mt-4">
                <img 
                  src={activity.mainImage || 'https://placehold.co/600x400/lightgray/white?text=Activity'} 
                  alt={activity.activityName} 
                  className="w-full max-w-md h-auto object-cover rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Feedback Details */}
          {feedback && (
            <div className={`rounded-xl shadow-sm border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <h3 className="text-xl font-semibold mb-4">Your Feedback</h3>
              <div className="space-y-4">
                {/* Rating */}
                <div className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-100 bg-gray-50'}`}>
                  <h4 className="flex items-center text-base font-semibold mb-2">
                    <FaStar className="text-yellow-400 mr-2" />
                    Rating
                  </h4>
                  {renderStarRating(feedback.rating || 0)}
                </div>
                
                {/* Comments */}
                <div className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-100 bg-gray-50'}`}>
                  <h4 className="flex items-center text-base font-semibold mb-2">
                    <FaComment className="text-blue-500 mr-2" />
                    Comments
                  </h4>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
                      {feedback.comments ? feedback.comments : "No comments provided"}
                    </p>
                  </div>
                </div>
                
                {/* Submission Date */}
                {feedback.createdAt && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>Submitted on: {feedback.createdAt.toDate ? 
                      new Date(feedback.createdAt.toDate()).toLocaleString() :
                      new Date(feedback.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewFeedbackPage;