import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "../../firebaseConfig";
import { useUserSession } from '../../UserSessionContext';
import { FaStarHalfAlt, FaStar, FaRegStar, FaTimes, FaEdit, FaTrash, FaCheckSquare, FaRegSquare, FaListUl, FaClone } from 'react-icons/fa';
import LogoutConfirmation from '../../components/LogoutConfirmation';
import { useNavigate } from 'react-router-dom';
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';

const StudentFeedback = () => {
  const navigate = useNavigate();
  const { user } = useUserSession();
  
  // IMPORTANT: Move hasEditDeletePermission before any useEffect that uses it
  const hasEditDeletePermission = user && user.role === 'Faculty';
  
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [showCompleteFeedback, setShowCompleteFeedback] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [detailedFeedbackLoading, setDetailedFeedbackLoading] = useState(false);
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deletingActivities, setDeletingActivities] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [isMultiDelete, setIsMultiDelete] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [activityForDeptChange, setActivityForDeptChange] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
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
              studentName: feedbackData.studentName || 'Anonymous Student', // Ensure fallback
              studentId: feedbackData.studentId,
              rating: feedbackData.rating,
              understandability: feedbackData.understandability,
              engagement: feedbackData.engagement,
              relevance: feedbackData.relevance,
              comment: feedbackData.comment,
              suggestions: feedbackData.suggestions,
              timestamp: feedbackData.timestamp,
              createdAt: feedbackData.createdAt // <-- Ensure this is included
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
            image: data.mainImage || (data.fileUrls && data.fileUrls.length > 0 ? data.fileUrls[0].url : 'https://via.placeholder.com/300x200?text=No+Image'),
            department: data.department || 'Unknown'
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
  if (isMultiSelectMode && 
          !event.target.closest('.activities-container') && 
          !event.target.closest('button[title*="Delete"]') &&
          !event.target.closest('.bg-red-600')) {
                    setIsMultiSelectMode(false);
        setSelectedActivities(new Set());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMultiSelectMode]);

  // Debug useEffect - now hasEditDeletePermission is available
  useEffect(() => {
    console.log('State update - isMultiSelectMode:', isMultiSelectMode);
    console.log('State update - selectedActivities size:', selectedActivities.size);
    console.log('State update - hasEditDeletePermission:', hasEditDeletePermission);
  }, [isMultiSelectMode, selectedActivities, hasEditDeletePermission]);

  useEffect(() => {
    console.log('Current user:', user);
    console.log('User role:', user?.role);
    console.log('Has edit/delete permission:', hasEditDeletePermission);
  }, [user, hasEditDeletePermission]);

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
    setIsMultiSelectMode((prev) => {
      const newMode = !prev;
      console.log('Multi-select mode toggled to:', newMode);
      return newMode;
    });
    setSelectedActivities(new Set());
    console.log('Multi-select mode state updated');
  };

  const toggleActivitySelection = (activityId) => {
    console.log('Toggling selection for activity:', activityId);
    setSelectedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
        console.log('Deselected activity:', activityId);
      } else {
        newSet.add(activityId);
        console.log('Selected activity:', activityId);
      }
      console.log('Total selected activities:', Array.from(newSet));
      console.log('Selected activities size:', newSet.size);
      return newSet;
    });
  };

  // Single activity delete function
  const deleteActivity = (activityId) => {
    setActivityToDelete(activityId);
    setIsMultiDelete(false);
    setShowDeleteConfirmation(true);
  };

  // Multi-select delete function
const handleDeleteConfirm = async () => {
  console.log('handleDeleteConfirm called');
  console.log('isMultiDelete:', isMultiDelete);
  console.log('selectedActivities:', Array.from(selectedActivities));
  console.log('activityToDelete:', activityToDelete);

  try {
    setDeletingActivities(true);
    setDeleteError(null);

    if (isMultiDelete) {
      // Delete multiple activities
      const activitiesToDelete = Array.from(selectedActivities);
      console.log('Starting multi-delete for activities:', activitiesToDelete);
      
      if (activitiesToDelete.length === 0) {
        throw new Error('No activities selected for deletion');
      }
      
      // Process each activity deletion
      for (let i = 0; i < activitiesToDelete.length; i++) {
        const activityId = activitiesToDelete[i];
        console.log(`Processing deletion ${i + 1}/${activitiesToDelete.length} for activity:`, activityId);
        
        try {
          // Delete related feedback first
          console.log('Querying feedback for activity:', activityId);
          const feedbackQuery = query(
            collection(db, 'feedback'),
            where('activityId', '==', activityId)
          );
          
          const feedbackSnapshot = await getDocs(feedbackQuery);
          console.log(`Found ${feedbackSnapshot.docs.length} feedback documents for activity ${activityId}`);
          
          // Delete feedback documents one by one
          for (const feedbackDoc of feedbackSnapshot.docs) {
            console.log('Deleting feedback document:', feedbackDoc.id);
            await deleteDoc(feedbackDoc.ref);
          }
          
          // Delete the activity document
          console.log('Deleting activity document:', activityId);
          const activityRef = doc(db, 'activities', activityId);
          await deleteDoc(activityRef);
          console.log('Successfully deleted activity:', activityId);
          
        } catch (err) {
          console.error(`Failed to delete activity ${activityId}:`, err);
          throw new Error(`Failed to delete activity: ${err.message}`);
        }
      }
      
      console.log('All activities deleted successfully, updating local state');
      
      // Update local state - remove deleted activities
      setActivities((prevActivities) => {
        const filteredActivities = prevActivities.filter((activity) => !selectedActivities.has(activity.id));
        console.log('Activities after deletion:', filteredActivities.length);
        return filteredActivities;
      });
      
      // Clear selection if selected activity was deleted
      if (selectedActivity && selectedActivities.has(selectedActivity.id)) {
        console.log('Selected activity was deleted, clearing selection');
setSelectedActivity((prevSelected) => {
  const remainingActivities = activities.filter((activity) => !selectedActivities.has(activity.id));
  return remainingActivities.length > 0 ? remainingActivities[0] : null;
});
      }
      
      // Reset multi-select state
      setSelectedActivities(new Set());
      setIsMultiSelectMode(false);
      
      console.log('Multi-delete operation completed successfully');
      
    } else {
      // Delete single activity
      console.log('Starting single delete for activity:', activityToDelete);
      
      if (!activityToDelete) {
        throw new Error('No activity selected for deletion');
      }
      
      // Delete related feedback first
      console.log('Querying feedback for single activity:', activityToDelete);
      const feedbackQuery = query(
        collection(db, 'feedback'),
        where('activityId', '==', activityToDelete)
      );
      
      const feedbackSnapshot = await getDocs(feedbackQuery);
      console.log(`Found ${feedbackSnapshot.docs.length} feedback documents`);
      
      // Delete feedback documents
      for (const feedbackDoc of feedbackSnapshot.docs) {
        console.log('Deleting feedback document:', feedbackDoc.id);
        await deleteDoc(feedbackDoc.ref);
      }
      
      // Delete the activity document
      console.log('Deleting single activity document:', activityToDelete);
      const activityRef = doc(db, 'activities', activityToDelete);
      await deleteDoc(activityRef);
      
      // Update local state
      setActivities((prevActivities) => {
        const filteredActivities = prevActivities.filter((activity) => activity.id !== activityToDelete);
        console.log('Activities after single deletion:', filteredActivities.length);
        return filteredActivities;
      });
      
      // Clear selection if selected activity was deleted
      if (selectedActivity && selectedActivity.id === activityToDelete) {
        console.log('Selected activity was deleted, clearing selection');

          setSelectedActivity((prevSelected) => {
            const remainingActivities = activities.filter((activity) => activity.id !== activityToDelete);
            return remainingActivities.length > 0 ? remainingActivities[0] : null;
          });
      }
      
      console.log('Single delete operation completed successfully');
    }
        const deletedCount = isMultiDelete ? selectedActivities.size : 1;
       showToastMessage(`Successfully deleted ${deletedCount} activity `);

    // Close modal and reset states
    setShowDeleteConfirmation(false);
    setActivityToDelete(null);
    setIsMultiDelete(false);
    setDeleteError(null);
    

  } catch (error) {
    console.error('Error in handleDeleteConfirm:', error);
    setDeleteError(`Failed to delete activities: ${error.message}`);
  } finally {
    setDeletingActivities(false);
    console.log('Delete operation finished');
  }
};
 const handleMultiDelete = () => {
  console.log('handleMultiDelete called');
  console.log('Selected activities size:', selectedActivities.size);
  console.log('Selected activities array:', Array.from(selectedActivities));
  console.log('hasEditDeletePermission:', hasEditDeletePermission);
  
  if (selectedActivities.size === 0) {
    console.log('No activities selected for deletion');
    alert('Please select activities to delete');
    return;
  }
  
  console.log('Setting multi-delete confirmation modal');
  setIsMultiDelete(true);
  setActivityToDelete(null);
  setDeleteError(null);
  setShowDeleteConfirmation(true);
};

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
             showToastMessage(`Activity updated successfully!`);

    } catch (error) {
      console.error('Error updating activity:', error);
                   showToastMessage(`Failed to update activity. Please try again`);

    }
  };

  const handleLogout = () => {
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

  const handleOpenDepartmentModal = (activity) => {
    setActivityForDeptChange(activity);
    setShowDepartmentModal(true);
  };

  const handleDepartmentSubmit = async ({ departments }) => {
    if (!activityForDeptChange || departments.length === 0) {
      setShowDepartmentModal(false);
      return;
    }

    const activityRef = doc(db, 'activities', activityForDeptChange.id);
    try {
      await updateDoc(activityRef, {
        department: departments[0] // Assuming single department for an activity
      });
      showToastMessage('Department updated successfully!');
      
      // Refresh the activities list
      setActivities(prev => prev.map(act => 
        act.id === activityForDeptChange.id ? { ...act, department: departments[0] } : act
      ));
      if (selectedActivity?.id === activityForDeptChange.id) {
        setSelectedActivity(prev => ({ ...prev, department: departments[0] }));
      }

    } catch (error) {
      console.error("Error updating department: ", error);
      showToastMessage('Failed to update department.', 'error');
    } finally {
      setShowDepartmentModal(false);
      setActivityForDeptChange(null);
    }
  };

  const openImageModal = (imageUrl) => {
    console.log("openImageModal called with URL:", imageUrl);
    setModalImageUrl(imageUrl);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    console.log("closeImageModal called");
    setIsImageModalOpen(false);
    setModalImageUrl('');
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

      {/* Department Display */}
      {user?.role === 'Student' && user?.departments && user.departments.length > 0 && (
        <div className="px-6 pt-4 pb-2">
          <div className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full px-4 py-2 text-sm font-semibold shadow">
            Your Department: {user.departments[0]}
          </div>
        </div>
      )}

      <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col md:flex-row gap-6">
          <div className={`w-full md:w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border p-4 h-min sticky top-24 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center mb-4 w-full">
              <h2 className="text-xl font-bold flex-shrink-0">Your Activities</h2>
              <div className="flex items-center gap-2 ml-auto">
  <button
    onClick={toggleMultiSelectMode}
    className={`p-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center h-8 w-8 ${
      isMultiSelectMode
        ? darkMode
          ? 'bg-blue-700 border-blue-500 text-white'
          : 'bg-blue-200 border-blue-500 text-blue-800'
        : darkMode
          ? 'bg-gray-700 border-gray-600 text-white'
          : 'bg-gray-100 border-gray-300 text-blue-800'
    }`}
    title="Multi-Select"
  >
    <FaClone className="h-4 w-4 mx-auto" />
  </button>
  {isMultiSelectMode && selectedActivities.size > 0 && hasEditDeletePermission && (
    <button
      onClick={() => {
        console.log('Multi-delete button clicked');
        console.log('Selected activities before delete:', Array.from(selectedActivities));
        handleMultiDelete();
      }}
      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center h-8 w-8"
      title={`Delete ${selectedActivities.size} Selected`}
    >
      <FaTrash size={16} />
    </button>
  )}
</div>
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
                    <div className="flex items-center justify-between">
                      <div
                        onClick={() => {
                          if (!isMultiSelectMode) {
                            setSelectedActivity(activity);
                            setIsDescriptionExpanded(false);
                          }
                        }}
                        className="flex-1"
                      >
                        <h3 className="font-medium">
                          <span>{activity.activityName}</span>
                          {(Array.isArray(activity.departments) && activity.departments.length > 0) ? (
                            <span className="block text-xs text-gray-500 mt-1">{activity.departments.join(', ')}</span>
                          ) : (
                            activity.department && (
                              <span className="block text-xs text-gray-500 mt-1">{activity.department}</span>
                            )
                          )}
                        </h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{activity.date}</span>
                          <div className="flex items-center gap-1">
                            <span className={`text-sm font-semibold ${activity.averageRating >= 4 ? 'text-green-500' : activity.averageRating >= 3 ? 'text-yellow-500' : 'text-red-500'}`}>{activity.averageRating.toFixed(1)}</span>
                            <FaStar className={`h-4 w-4 ${activity.averageRating >= 4 ? 'text-green-500' : activity.averageRating >= 3 ? 'text-yellow-500' : 'text-red-500'}`} />
                            <span className="text-xs text-gray-500">({activity.feedbackCount})</span>
                          </div>
                        </div>
                      </div>
                      {isMultiSelectMode && (
                        <span
                          className="ml-2 cursor-pointer"
                          onClick={e => {
                            e.stopPropagation();
                            toggleActivitySelection(activity.id);
                          }}
                        >
                          {selectedActivities.has(activity.id) ? (
                            <FaCheckSquare className="h-5 w-5 text-blue-500" />
                          ) : (
                            <FaRegSquare className="h-5 w-5 text-gray-400" />
                          )}
                        </span>
                      )}
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
              <div className={`rounded-xl shadow-sm overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} relative`}>
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
                    className="w-full h-full object-cover rounded-t-lg cursor-pointer"
                    onClick={() => openImageModal(selectedActivity.image)}
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src='https://placehold.co/600x400/lightgray/white?text=Activity';
                    }}
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
                    <div>
                      <h3 className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Departments</h3>
                      <p className="text-lg">{Array.isArray(selectedActivity.departments) ? selectedActivity.departments.join(', ') : selectedActivity.department || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h3 className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description</h3>
                      <div className="mt-1">
                        <p className="whitespace-pre-wrap">
                          {isDescriptionExpanded || (selectedActivity.description || '').length <= 250
                            ? selectedActivity.description
                            : `${(selectedActivity.description || '').substring(0, 250)}...`}
                        </p>
                        {(selectedActivity.description || '').length > 250 && (
                          <button
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="text-blue-500 hover:underline mt-1 text-sm bg-transparent border-none p-0"
                          >
                            {isDescriptionExpanded ? 'Show less' : 'more...'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Student Feedback Summary</h3>
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
                                <div className="flex mt-1">{renderStars(comment.rating)}</div>
                              </div>
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {comment.createdAt
                                  ? (() => {
                                      if (comment.createdAt.toDate) {
                                        return comment.createdAt.toDate().toLocaleString('en-GB', {
                                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        });
                                      }
                                      const d = new Date(comment.createdAt);
                                      if (!isNaN(d)) {
                                        return d.toLocaleString('en-GB', {
                                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        });
                                      }
                                      return comment.createdAt;
                                    })()
                                  : '-'
                                }
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
                  {(() => {
                    // Prefer timestamp
                    if (selectedFeedback.timestamp?.toDate) {
                      return selectedFeedback.timestamp.toDate().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    }
                    // Firestore Timestamp object for createdAt
                    if (selectedFeedback.createdAt?.toDate) {
                      return selectedFeedback.createdAt.toDate().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    }
                    // ISO string or date string
                    if (typeof selectedFeedback.createdAt === 'string') {
                      const d = new Date(selectedFeedback.createdAt);
                      if (!isNaN(d)) {
                        return d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                      }
                    }
                    // Milliseconds number
                    if (typeof selectedFeedback.createdAt === 'number') {
                      const d = new Date(selectedFeedback.createdAt);
                      if (!isNaN(d)) {
                        return d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                      }
                    }
                    return '-';
                  })()}
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
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          darkMode ? 'bg-green-800 text-white' : 'bg-green-600 text-white'
        } ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>)}
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
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl`}>
            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {isMultiDelete 
                ? `Are you sure you want to delete ${selectedActivities.size} selected activities? This action cannot be undone.`
                : `Are you sure you want to delete this activity? This action cannot be undone.`
              }
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                <p>{deleteError}</p>
              </div>
            )}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setActivityToDelete(null);
                  setIsMultiDelete(false);
                  setDeleteError(null);
                }}
                className={`px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
                disabled={deletingActivities}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ${
                  deletingActivities ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={deletingActivities}
              >
                {deletingActivities ? 'Deleting...' : isMultiDelete ? `Delete ${selectedActivities.size} Activities` : 'Delete'}
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
      <DepartmentSelectionModal
        isOpen={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        onSubmit={handleDepartmentSubmit}
        userType="faculty" // Treat this as a faculty action for selecting a department
        currentDepartments={activityForDeptChange ? [activityForDeptChange.department] : []}
        canEdit={true}
      />
      {isImageModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4"
          onClick={closeImageModal}
        >
          <div
            className={`relative shadow-lg w-full max-w-4xl max-h-[90vh] ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
            onClick={e => e.stopPropagation()}
          >
            <img src={modalImageUrl} alt="Full size activity" className="w-full h-auto object-contain max-h-[90vh]" />
            <button
              onClick={closeImageModal}
              className={`absolute top-2 right-2 p-2 rounded-md ${darkMode ? 'text-gray-300 bg-gray-800 hover:bg-gray-700' : 'text-gray-500 bg-white hover:bg-gray-100'}`}
              aria-label="Close image viewer"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeedback;