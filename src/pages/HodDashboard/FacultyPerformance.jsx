import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useUserSession } from '../../UserSessionContext';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import Spinner from '../../components/Spinner';

const FacultyPerformance = ({ onSelectFaculty }) => {
  const { user } = useUserSession();
  const [facultyPerformances, setFacultyPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function to render stars
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    let stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar key={`full-${i}`} className="h-4 w-4 text-yellow-500" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <FaStarHalfAlt key="half" className="h-4 w-4 text-yellow-500" />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaRegStar key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      );
    }
    
    return <div className="flex">{stars}</div>;
  };

  const fetchFacultyAndPerformance = useCallback(async () => {
    if (!user?.department) {
      setError('HOD department not found.');
      setLoading(false);
      return;
    }

      setLoading(true);
      setError('');
      try {
        console.log('HOD Department:', user.department);

        // Step 1: Fetch only faculty in the HOD's department
        const usersRef = collection(db, 'users');
        const facultyQuery = query(
          usersRef,
          where('role', '==', 'Faculty'),
          where('primaryDepartment', '==', user.department)
        );
        const facultySnapshot = await getDocs(facultyQuery);
        
        const departmentFaculty = facultySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log('Department Faculty Found:', departmentFaculty.length);

        // Remove duplicates based on email
        const uniqueFaculty = Array.from(new Map(departmentFaculty.map(item => [item.email, item])).values());

        if (uniqueFaculty.length === 0) {
          console.log("No faculty found for department:", user.department);
          setFacultyPerformances([]);
          setLoading(false);
          return;
        }
        
        // Step 2: For each faculty, get their performance data
        const performanceData = await Promise.all(
          uniqueFaculty.map(async (faculty) => {
            const facultyId = faculty.id;
            console.log(`Processing faculty: ${faculty.name} (${facultyId})`);

            // Get activities for this faculty
            const activitiesRef = collection(db, 'activities');
            const activitiesQuery = query(activitiesRef, where('facultyId', '==', facultyId));
            const activitiesSnapshot = await getDocs(activitiesQuery);

            console.log(`Activities found for ${faculty.name}:`, activitiesSnapshot.size);

            let totalRating = 0;
            let totalFeedbackCount = 0;
            let activityCount = activitiesSnapshot.size;
            let activitiesWithFeedback = 0;

            // Process each activity to calculate its true average rating from feedback
            for (const activityDoc of activitiesSnapshot.docs) {
              const feedbackQuery = query(
                collection(db, 'feedback'),
                where('activityId', '==', activityDoc.id)
              );
              const feedbackSnapshot = await getDocs(feedbackQuery);
              
              const feedbackDocs = feedbackSnapshot.docs;
              totalFeedbackCount += feedbackDocs.length;

              if (feedbackDocs.length > 0) {
                let activityTotalRating = 0;
                feedbackDocs.forEach(doc => {
                  const rating = doc.data().rating;
                  if (typeof rating === 'number') {
                    activityTotalRating += rating;
                  }
                });

                const activityAverage = activityTotalRating / feedbackDocs.length;
                totalRating += activityAverage;
                activitiesWithFeedback++;
              }
            }

            // Calculate overall average performance for the faculty
            const averagePerformance = activitiesWithFeedback > 0 ? totalRating / activitiesWithFeedback : 0;

            console.log(`${faculty.name} - Activities: ${activityCount}, Feedback: ${totalFeedbackCount}, Avg Rating: ${averagePerformance.toFixed(2)}`);

            return {
              id: facultyId,
              name: faculty.name,
              email: faculty.email,
              averagePerformance: parseFloat(averagePerformance.toFixed(2)),
              activityCount: activityCount,
              totalFeedbackCount: totalFeedbackCount,
              activitiesWithFeedback: activitiesWithFeedback
            };
          })
        );

        // Sort by average performance (highest first)
        performanceData.sort((a, b) => b.averagePerformance - a.averagePerformance);
        
        console.log('Final performance data:', performanceData);
        setFacultyPerformances(performanceData);
      } catch (err) {
        console.error("Error fetching faculty performance:", err);
        setError('Failed to fetch faculty performance data: ' + err.message);
      }
      setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFacultyAndPerformance();

    window.addEventListener('focus', fetchFacultyAndPerformance);

    return () => {
      window.removeEventListener('focus', fetchFacultyAndPerformance);
    };
  }, [fetchFacultyAndPerformance]);

  if (loading) {
    return (
      <div className="text-center p-8">
        <Spinner />
        <p className="mt-2">Loading faculty performance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-4">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-2xl font-bold text-white">Faculty Performance Ranking</h2>
          <p className="text-blue-100 mt-1">Department: {user.department}</p>
        </div>
        
        {facultyPerformances.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {facultyPerformances.map((faculty, index) => {
              if (!faculty) return null;

              return (
              <div
                  key={faculty.id || index}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                  onClick={() => faculty.id && onSelectFaculty(faculty.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    {/* Rank Badge */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          index === 0
                            ? 'bg-yellow-600'
                            : index === 1
                            ? 'bg-gray-500'
                            : index === 2
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                      >
                      {index + 1}
                    </div>
                    
                    {/* Faculty Info */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">{faculty.name || 'Unnamed Faculty'}</h3>
                        <p className="text-sm text-gray-500">{faculty.email || 'No email'}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {faculty.activityCount || 0} Activities
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {faculty.totalFeedbackCount || 0} Feedbacks
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rating Display */}
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-2 mb-2">
                      {renderStars(faculty.averagePerformance)}
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {faculty.averagePerformance > 0 ? faculty.averagePerformance.toFixed(1) : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">Average Rating</p>
                    {faculty.averagePerformance > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Based on {faculty.activitiesWithFeedback} activities
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Performance Bar */}
                {faculty.averagePerformance > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          faculty.averagePerformance >= 4.5 ? 'bg-green-500' :
                          faculty.averagePerformance >= 4.0 ? 'bg-yellow-500' :
                          faculty.averagePerformance >= 3.5 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(faculty.averagePerformance / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Faculty Found</h3>
            <p className="text-gray-500">
              No faculty members found in the {user.department} department.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyPerformance;