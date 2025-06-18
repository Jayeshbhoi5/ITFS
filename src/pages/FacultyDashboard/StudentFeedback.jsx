import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from "../../firebaseConfig";
import { useUserSession } from '../../UserSessionContext';
import { FaStarHalfAlt, FaStar, FaRegStar, FaTimes, FaEdit, FaTrash, FaCheckSquare, FaRegSquare } from 'react-icons/fa';
import LogoutConfirmation from '../../components/LogoutConfirmation';
import { useNavigate } from 'react-router-dom';

const StudentFeedback = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [showCompleteFeedback, setShowCompleteFeedback] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [detailedFeedbackLoading, setDetailedFeedbackLoading] = useState(false);
  const { user } = useUserSession();
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editForm, setEditForm] = useState({
    activityName: '',
    description: '',
    courseName: '',
    className: '',
    academicYear: '',
    semester: '',
    activityDate: ''
  });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showMultiDeleteConfirmation, setShowMultiDeleteConfirmation] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deletingActivities, setDeletingActivities] = useState(false);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  useEffect(() => {
    const fetchActivities = async () => {
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
            where('className', '==', user.className),
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
        
        if (fetchedActivities.length > 0 && !selectedActivity) {
          setSelectedActivity(fetchedActivities[0]);
        } else if (fetchedActivities.length === 0) {
          setSelectedActivity(null);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
        setSelectedActivity(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, [user]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMultiSelectMode && !event.target.closest('.activities-container')) {
        setIsMultiSelectMode(false);
        setSelectedActivities(new Set());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMultiSelectMode]);

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

  const handleViewCompleteFeedback = async (feedbackId) => {
    try {
      setDetailedFeedbackLoading(true);
      
      const feedback = selectedActivity.comments.find(f => f.id === feedbackId);
      if (feedback) {
        setSelectedFeedback(feedback);
        setShowCompleteFeedback(true);
      }
    } catch (error) {
      console.error('Error loading detailed feedback:', error);
    } finally {
      setDetailedFeedbackLoading(false);
    }
  };

  const closeCompleteFeedback = () => {
    setShowCompleteFeedback(false);
    setSelectedFeedback(null);
  };
  
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedActivities(new Set());
  };

  // This is the critical function for toggling activity selection
  const toggleActivitySelection = (activityId, e) => {
    // Prevent the click from selecting the activity
    if (e) {
      e.stopPropagation();
    }
    
    const newSelectedActivities = new Set([...selectedActivities]);
    if (newSelectedActivities.has(activityId)) {
      newSelectedActivities.delete(activityId);
    } else {
      newSelectedActivities.add(activityId);
    }
    
    setSelectedActivities(newSelectedActivities);
    console.log("Selected activities:", Array.from(newSelectedActivities)); // Debugging
  };
  
  const deleteActivity = (activityId) => {
    setActivityToDelete(activityId);
    setShowDeleteConfirmation(true);
  };

  const deleteSelectedActivities = () => {
    if (selectedActivities.size > 0) {
      setShowMultiDeleteConfirmation(true);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (activityToDelete) {
        await deleteDoc(doc(db, 'activities', activityToDelete));
        setActivities(prevActivities => 
          prevActivities.filter(activity => activity.id !== activityToDelete)
        );
        if (selectedActivity?.id === activityToDelete) {
          setSelectedActivity(null);
        }
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity. Please try again.');
    } finally {
      setShowDeleteConfirmation(false);
      setActivityToDelete(null);
    }
  };

  // This is the critical function for multi-delete
  const handleMultiDeleteConfirm = async () => {
    try {
      setDeletingActivities(true);
      setDeleteError(null);
      
      const activitiesToDelete = Array.from(selectedActivities);
      console.log("Attempting to delete activities:", activitiesToDelete);
      
      if (activitiesToDelete.length === 0) {
        setDeleteError("No activities selected for deletion");
        return;
      }
      
      // Process each deletion one by one
      for (const activityId of activitiesToDelete) {
        try {
          console.log(`Deleting activity: ${activityId}`);
          
          // First, delete related feedback
          const feedbackQuery = query(
            collection(db, 'feedback'),
            where('activityId', '==', activityId)
          );
          
          const feedbackSnapshot = await getDocs(feedbackQuery);
          console.log(`Found ${feedbackSnapshot.size} feedback items for activity ${activityId}`);
          
          // Delete each feedback document
          for (const doc of feedbackSnapshot.docs) {
            await deleteDoc(doc.ref);
          }
          
          // Now delete the activity
          await deleteDoc(doc(db, 'activities', activityId));
          console.log(`Successfully deleted activity ${activityId}`);
          
        } catch (error) {
          console.error(`Error deleting activity ${activityId}:`, error);
          throw new Error(`Failed to delete activity ${activityId}: ${error.message}`);
        }
      }
      
      // Update UI after successful deletions
      setActivities(prevActivities => 
        prevActivities.filter(activity => !selectedActivities.has(activity.id))
      );
      
      // Update selected activity if it was deleted
      if (selectedActivity && selectedActivities.has(selectedActivity.id)) {
        const remainingActivities = activities.filter(a => !selectedActivities.has(a.id));
        setSelectedActivity(remainingActivities.length > 0 ? remainingActivities[0] : null);
      }
      
      alert(`Successfully deleted ${activitiesToDelete.length} activities`);
      
    } catch (error) {
      console.error('Error in batch delete operation:', error);
      setDeleteError(`Failed to delete activities: ${error.message}`);
    } finally {
      setShowMultiDeleteConfirmation(false);
      setSelectedActivities(new Set());
      setIsMultiSelectMode(false);
      setDeletingActivities(false);
    }
  };

  const hasEditDeletePermission = user && user.role === 'Faculty';

  const openEditModal = async (activity) => {
    setEditingActivity(activity);
    setEditForm({
      activityName: activity.activityName || '',
      description: activity.description || '',
      courseName: activity.courseName || '',
      className: activity.className || '',
      academicYear: activity.academicYear || '',
      semester: activity.semester || '',
      activityDate: activity.activityDate || ''
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const activityRef = doc(db, 'activities', editingActivity.id);
      await updateDoc(activityRef, {
        ...editForm,
        updatedAt: new Date()
      });

      setActivities(prevActivities =>
        prevActivities.map(activity =>
          activity.id === editingActivity.id
            ? { ...activity, ...editForm }
            : activity
        )
      );

      if (selectedActivity?.id === editingActivity.id) {
        setSelectedActivity(prev => ({ ...prev, ...editForm }));
      }

      setShowEditModal(false);
      setEditingActivity(null);
      alert('Activity updated successfully!');
    } catch (error) {
      console.error('Error updating activity:', error);
      alert('Failed to update activity. Please try again.');
    }
  };
  

  const handleLogout = () => {
    // Add your logout logic here
    navigate('/login');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    handleLogout();
    setShowLogoutConfirm(false);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'} transition-colors duration-300`} style={{ minHeight: '109vh' }}>
      <Navbar 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        toggleSidebar={toggleSidebar} 
        showProfileMenu={showProfileMenu}
        toggleProfileMenu={toggleProfileMenu} 
        sidebarOpen={sidebarOpen}
        user={user}
      />

      <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col md:flex-row gap-6">
          <div className={`w-full md:w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 h-min sticky top-24`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Activities</h2>
              {hasEditDeletePermission && (
                <div className="flex items-center gap-2">
                 
                  {isMultiSelectMode && selectedActivities.size > 0 && (
                    <button
                      onClick={deleteSelectedActivities}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                    >
                      <FaTrash size={16} />
                      <span className="text-sm">({selectedActivities.size})</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-2 activities-container">
                {activities.map(activity => (
                  <div 
                    key={activity.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors relative ${
                      selectedActivity && selectedActivity.id === activity.id 
                        ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800')
                        : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50')
                    }`}
                  >
                    {hasEditDeletePermission && isMultiSelectMode && (
                      <div 
                        className="absolute top-2 right-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div 
                          className="relative cursor-pointer" 
                          onClick={(e) => toggleActivitySelection(activity.id, e)}
                        >
                          {selectedActivities.has(activity.id) ? (
                            <FaCheckSquare className="h-5 w-5 text-blue-500" />
                          ) : (
                            <FaRegSquare className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    )}
                    <div onClick={() => {
                      if (!isMultiSelectMode) {
                        setSelectedActivity(activity);
                      } else {
                        toggleActivitySelection(activity.id);
                      }
                    }}>
                      <h3 className="font-medium">{activity.activityName}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {activity.date}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-semibold ${
                            activity.averageRating >= 4 
                              ? 'text-green-500'
                              : activity.averageRating >= 3
                                ? 'text-yellow-500'
                                : 'text-red-500'
                          }`}>
                            {activity.averageRating.toFixed(1)}
                          </span>
                          <FaStar className={`h-4 w-4 ${
                            activity.averageRating >= 4 
                              ? 'text-green-500'
                              : activity.averageRating >= 3
                                ? 'text-yellow-500'
                                : 'text-red-500'
                          }`} />
                          <span className="text-xs text-gray-500">({activity.feedbackCount})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No activities found</p>
              </div>
            )}
          </div>
          
          {selectedActivity ? (
            <div className="flex-1">
              <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} relative`}>
                {hasEditDeletePermission && !isMultiSelectMode && (
                  <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(selectedActivity);
                      }}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteActivity(selectedActivity.id);
                      }}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                )}

                <div className="h-64 relative">
                  <img 
                    src={selectedActivity.image} 
                    alt={selectedActivity.activityName} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end">
                    <div className="p-6 text-white">
                      <h2 className="text-3xl font-bold">{selectedActivity.activityName}</h2>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex space-x-2">
                          <span className="px-3 py-1 bg-blue-600 rounded-full text-sm">
                            {selectedActivity.branch}
                          </span>
                          <span className="px-3 py-1 bg-green-600 rounded-full text-sm">
                            {selectedActivity.year}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {renderStars(selectedActivity.averageRating)}
                          </div>
                          <span className="text-white font-bold">
                            {selectedActivity.averageRating.toFixed(1)}
                          </span>
                          <span className="text-white text-sm">
                            ({selectedActivity.feedbackCount} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Faculty</h3>
                      <p className="text-lg">{selectedActivity.facultyName}</p>
                    </div>
                    <div>
                      <h3 className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Course</h3>
                      <p className="text-lg">{selectedActivity.courseName}</p>
                    </div>
                    <div>
                      <h3 className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Class</h3>
                      <p className="text-lg">{selectedActivity.className}</p>
                    </div>
                    <div>
                      <h3 className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Academic Year</h3>
                      <p className="text-lg">{selectedActivity.academicYear} (Sem {selectedActivity.semester})</p>
                    </div>
                    <div>
                      <h3 className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</h3>
                      <p className="text-lg">{selectedActivity.date}</p>
                    </div>
                    
                  </div>
                  
                  <div className="mb-6">
                    <h3 className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description</h3>
                    <p className="mt-1">{selectedActivity.description}</p>
                  </div>
                  
                  <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <h3 className="font-bold text-lg mb-2">Student Feedback Summary</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-end gap-2">
                          <span className="text-4xl font-bold">{selectedActivity.averageRating.toFixed(1)}</span>
                          <span className="text-sm mb-1">out of 5</span>
                        </div>
                        <div className="flex mt-1">
                          {renderStars(selectedActivity.averageRating)}
                        </div>
                        <p className="text-sm mt-1">{selectedActivity.feedbackCount} student reviews</p>
                      </div>
                      
                      <div className="w-48">
                        {[5, 4, 3, 2, 1].map(rating => {
                          const count = selectedActivity.comments.filter(c => Math.floor(c.rating) === rating).length;
                          const percentage = selectedActivity.feedbackCount > 0 ? 
                            (count / selectedActivity.feedbackCount) * 100 : 0;
                          
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
                  
                  <div>
                    <h3 className="font-bold text-xl mb-4">Student Comments</h3>
                    {selectedActivity.comments && selectedActivity.comments.length > 0 ? (
                      <div className="space-y-4">
                        {selectedActivity.comments.map((comment, index) => (
                          <div key={comment.id || index} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{comment.studentName || 'Anonymous Student'}</h4>
                                <div className="flex mt-1">
                                  {renderStars(comment.rating)}
                                </div>
                              </div>
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {comment.timestamp?.toDate?.().toLocaleDateString() || ''}
                              </span>
                            </div>
                            <p className="mt-2">{comment.comment || 'No comment provided'}</p>
                            
                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={() => handleViewCompleteFeedback(comment.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                  darkMode 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                    : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                }`}
                              >
                                View Complete Feedback
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <p>No comments available for this activity.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center h-96">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-xl font-medium">Select an activity to view feedback</h2>
                <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Choose an activity from the list to see student comments and ratings
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showCompleteFeedback && selectedFeedback && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className={`rounded-lg shadow-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">Complete Feedback Details</h2>
              <button 
                onClick={closeCompleteFeedback}
                className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700">
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            <div className="border-b pb-4 mb-4">
              <div className="flex justify-between">
                <h3 className="font-medium text-lg">{selectedFeedback.studentName || 'Anonymous Student'}</h3>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedFeedback.timestamp?.toDate?.().toLocaleDateString() || ''}
                </span>
              </div>
            </div>
            
            {detailedFeedbackLoading ? (
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <h4 className="font-medium mb-2">Overall Rating</h4>
                    <div className="flex items-center">
                      {renderStars(selectedFeedback.rating)}
                      <span className="ml-2 font-bold">{selectedFeedback.rating}</span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <h4 className="font-medium mb-2">Understandability</h4>
                    <div className="flex items-center">
                      {renderStars(selectedFeedback.understandability)}
                      <span className="ml-2 font-bold">{selectedFeedback.understandability}</span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <h4 className="font-medium mb-2">Engagement</h4>
                    <div className="flex items-center">
                      {renderStars(selectedFeedback.engagement)}
                      <span className="ml-2 font-bold">{selectedFeedback.engagement}</span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <h4 className="font-medium mb-2">Relevance</h4>
                    <div className="flex items-center">
                      {renderStars(selectedFeedback.relevance)}
                      <span className="ml-2 font-bold">{selectedFeedback.relevance}</span>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h4 className="font-medium mb-2">Student Comments</h4>
                  <p>{selectedFeedback.comment || 'No comments provided'}</p>
                </div>
                
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h4 className="font-medium mb-2">Suggestions for Improvement</h4>
                  <p>{selectedFeedback.suggestions || 'No suggestions provided'}</p>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeCompleteFeedback}
                className={`px-6 py-2 rounded-lg font-medium ${
                  darkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col`} style={{ maxHeight: '90vh' }}>
            {/* Fixed Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Edit Activity</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingActivity(null);
                  }}
                  className={`p-2 rounded-full border-2 transition-colors bg-transparent ${
                    darkMode
                      ? 'border-blue-600 hover:bg-blue-700/20 text-white'
                      : 'border-blue-600 hover:bg-blue-50 text-blue-600'
                  }`}
                >
                  <FaTimes size={20} className={darkMode ? 'text-white' : 'text-blue-600'} />
                </button>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: darkMode ? '#4B5563 transparent' : '#E5E7EB transparent'
            }}>
              <form id="editForm" className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Activity Name</label>
                  <input
                    type="text"
                    name="activityName"
                    value={editForm.activityName}
                    onChange={handleEditFormChange}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Description</label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditFormChange}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    rows="4"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium">Course Name</label>
                    <input
                      type="text"
                      name="courseName"
                      value={editForm.courseName}
                      onChange={handleEditFormChange}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Class</label>
                    <select
                      name="className"
                      value={editForm.className}
                      onChange={handleEditFormChange}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      required
                    >
                      <option value="">Select Class</option>
                      <option value="FE">FE (First Year)</option>
                      <option value="SE">SE (Second Year)</option>
                      <option value="TE">TE (Third Year)</option>
                      <option value="BE">BE (Fourth Year)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Academic Year</label>
                    <input
                      type="text"
                      name="academicYear"
                      value={editForm.academicYear}
                      onChange={handleEditFormChange}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Semester</label>
                    <select
                      name="semester"
                      value={editForm.semester}
                      onChange={handleEditFormChange}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      required
                    >
                      <option value="">Select Semester</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Activity Date</label>
                    <input
                      type="date"
                      name="activityDate"
                      value={editForm.activityDate}
                      onChange={handleEditFormChange}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      required
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Fixed Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingActivity(null);
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showDeleteConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-sm w-fullounded-lg p-6 max-w-sm w-full mx-4 shadow-xl`}>
            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to delete this activity? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className={`px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showMultiDeleteConfirmation && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl`}>
      <h3 className="text-xl font-bold mb-4">Confirm Multiple Delete</h3>
      <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Are you sure you want to delete {selectedActivities.size} selected activities? This action cannot be undone.
      </p>
      {deleteError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          <p>{deleteError}</p>
        </div>
      )}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => setShowMultiDeleteConfirmation(false)}
          className={`px-4 py-2 rounded-lg ${
            darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleMultiDeleteConfirm}
          className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete All'}
        </button>
      </div>
    </div>
  </div>
)}
<Sidebar 
  darkMode={darkMode} 
  sidebarOpen={sidebarOpen} 
  toggleSidebar={toggleSidebar}
  toggleDarkMode={toggleDarkMode}
  activePage="comments" 
/>

<LogoutConfirmation
  isOpen={showLogoutConfirm}
  onClose={handleCancelLogout}
  onConfirm={handleConfirmLogout}
  darkMode={darkMode}
/>
  </div>
  );
};

export default StudentFeedback;