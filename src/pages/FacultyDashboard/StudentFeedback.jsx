import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "../../firebaseConfig";
import { useUserSession } from '../../UserSessionContext';
import { FaStarHalfAlt, FaStar, FaRegStar, FaTimes, FaEdit, FaTrash, FaCheckSquare, FaRegSquare, FaListUl, FaClone, FaExpand, FaChevronLeft, FaChevronRight, FaUser, FaCalendarAlt, FaComments, FaChartBar, FaGraduationCap, FaBuilding } from 'react-icons/fa';
import LogoutConfirmation from '../../components/LogoutConfirmation';
import { useNavigate } from 'react-router-dom';
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';

const DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Artificial Intelligence and Data Science Engineering',
  'Mechanical Engineering',
  'Instrumentation and Control Engineering',
  'Electronics and Telecommunication Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Automation and Robotics',
  'Applied Sciences & Humanities',
  'Master of Business Administration'
];

const StudentFeedback = () => {
  const navigate = useNavigate();
  const { user } = useUserSession();
  
  // Faculty & Admin users have edit and delete permissions (students do not)
  const hasEditDeletePermission = Boolean(user && user.role !== 'Student');
  
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
  const [editDeptDropdownOpen, setEditDeptDropdownOpen] = useState(false);
  const editDeptDropdownRef = useRef(null);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editForm, setEditForm] = useState({
    activityName: '',
    description: '',
    courseName: '',
    department: '',
    departments: [],
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
  const [modalImages, setModalImages] = useState([]);
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0);
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
    const handleDeptDropdownOutside = (event) => {
      if (editDeptDropdownRef.current && !editDeptDropdownRef.current.contains(event.target)) {
        setEditDeptDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDeptDropdownOutside);
    return () => {
      document.removeEventListener('mousedown', handleDeptDropdownOutside);
    };
  }, []);

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
            const rawRating = Number(feedbackData.rating || feedbackData.overallRating || 0);
            return {
              id: feedbackDoc.id,
              studentName: feedbackData.studentName || 'Anonymous Student', // Ensure fallback
              studentId: feedbackData.studentId,
              rating: rawRating,
              understandability: Number(feedbackData.understandability || 0),
              engagement: Number(feedbackData.engagement || 0),
              relevance: Number(feedbackData.relevance || 0),
              comment: feedbackData.comment,
              suggestions: feedbackData.suggestions,
              timestamp: feedbackData.timestamp,
              createdAt: feedbackData.createdAt // <-- Ensure this is included
            };
          });
          
          const ratings = feedbackComments.map(c => c.rating).filter(r => r > 0);
          const averageRating = ratings.length > 0 ? 
            ratings.reduce((a, b) => a + b, 0) / ratings.length : (Number(data.averageRating) || 0);
          
          // Aggregate all activity images
          const allImages = [];
          if (data.mainImage) allImages.push(data.mainImage);
          if (Array.isArray(data.fileUrls)) {
            data.fileUrls.forEach(f => {
              const url = typeof f === 'string' ? f : f?.url;
              if (url && !allImages.includes(url)) allImages.push(url);
            });
          }
          if (Array.isArray(data.images)) {
            data.images.forEach(img => {
              const url = typeof img === 'string' ? img : img?.url;
              if (url && !allImages.includes(url)) allImages.push(url);
            });
          }

          const rawDate = data.activityDate || data.createdAt;
          const displayDate = formatDateDMY(rawDate);

          return {
            id: doc.id,
            ...data,
            date: displayDate,
            averageRating: averageRating,
            comments: feedbackComments || [],
            totalStudents: data.totalStudents || 0,
            feedbackCount: feedbackComments.length,
            branch: data.className || 'Unknown',
            year: data.academicYear || 'Unknown',
            image: data.mainImage || (allImages.length > 0 ? allImages[0] : 'https://placehold.co/600x400/lightgray/white?text=Activity'),
            images: allImages,
            mainImage: data.mainImage || null,
            fileUrls: data.fileUrls || [],
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
      if (
        isMultiSelectMode && 
        !event.target.closest('.activities-left-panel') && 
        !event.target.closest('.delete-confirmation-modal') &&
        !event.target.closest('button[title*="Delete"]')
      ) {
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

  const formatDateDMY = (dateInput) => {
    if (!dateInput) return 'No date';
    try {
      let d;
      if (dateInput?.toDate) {
        d = dateInput.toDate();
      } else if (typeof dateInput === 'string' && dateInput.includes('-')) {
        // e.g. "2026-09-05" - avoid UTC offset issue by splitting
        const parts = dateInput.split('T')[0].split('-');
        if (parts.length === 3) {
          const year = parts[0];
          const month = parseInt(parts[1], 10);
          const day = parseInt(parts[2], 10);
          return `${day}/${month}/${year}`;
        }
        d = new Date(dateInput);
      } else {
        d = new Date(dateInput);
      }
      if (isNaN(d.getTime())) return String(dateInput);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return String(dateInput);
    }
  };

  const getRatingColor = (rating, hasFeedback) => {
    if (!hasFeedback || rating === 0) return darkMode ? '#94a3b8' : '#0f172a'; // black / dark for 0 reviews / 0 rating
    if (rating >= 4.5) return '#10b981'; // 5 stars -> green
    if (rating >= 3) return '#eab308'; // 3 and 4 stars -> yellow / amber (#eab308)
    return '#ef4444'; // 1 and 2 stars -> red
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    let stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar key={`full-${i}`} className="h-4 w-4" style={{ color: '#fbbf24' }} />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <FaStarHalfAlt key="half" className="h-4 w-4" style={{ color: '#fbbf24' }} />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaRegStar key={`empty-${i}`} className="h-4 w-4" style={{ color: '#fde68a' }} />
      );
    }
    
    return <div className="flex items-center gap-0.5">{stars}</div>;
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
  
  const toggleMultiSelectMode = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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

  const handleSelectAll = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (activities.length === 0) return;
    setSelectedActivities((prev) => {
      if (prev.size === activities.length) {
        console.log('Deselecting all activities');
        return new Set();
      } else {
        console.log('Selecting all activities:', activities.length);
        return new Set(activities.map((a) => a.id));
      }
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
    
    let actDepts = [];
    if (Array.isArray(activity.departments) && activity.departments.length > 0) {
      actDepts = [...activity.departments];
    } else if (activity.department) {
      actDepts = [activity.department];
    } else if (user?.primaryDepartment) {
      actDepts = [user.primaryDepartment];
    } else if (Array.isArray(user?.departments) && user.departments.length > 0) {
      actDepts = [...user.departments];
    }

    const primaryDept = actDepts[0] || activity.department || user?.primaryDepartment || (user?.departments && user.departments[0]) || '';

    setEditForm({
      activityName: activity.activityName || '',
      description: activity.description || '',
      courseName: activity.courseName || '',
      department: primaryDept,
      departments: actDepts,
      className: activity.className || '',
      academicYear: activity.academicYear || '',
      semester: activity.semester || '',
      activityDate: activity.activityDate || ''
    });
    setEditDeptDropdownOpen(false);
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
      const chosenDepartments = Array.isArray(editForm.departments) && editForm.departments.length > 0
        ? editForm.departments
        : (editForm.department ? [editForm.department] : []);

      if (chosenDepartments.length === 0) {
        showToastMessage('Please select at least one department', 'error');
        return;
      }

      const primaryDept = chosenDepartments[0] || editForm.department || '';
      const activityRef = doc(db, 'activities', editingActivity.id);
      const updateData = {
        ...editForm,
        department: primaryDept,
        departments: chosenDepartments,
        date: formatDateDMY(editForm.activityDate),
        updatedAt: new Date()
      };
      await updateDoc(activityRef, updateData);

      setActivities(prevActivities =>
        prevActivities.map(activity =>
          activity.id === editingActivity.id
            ? { ...activity, ...updateData }
            : activity
        )
      );

      if (selectedActivity?.id === editingActivity.id) {
        setSelectedActivity(prev => ({ ...prev, ...updateData }));
      }

      setShowEditModal(false);
      setEditingActivity(null);
      setEditDeptDropdownOpen(false);
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
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode
        ? 'bg-gray-900 text-gray-100'
        : 'text-gray-800'
    }`}
    style={{
      backgroundColor: darkMode ? '#111827' : '#f8fafc',
      backgroundImage: darkMode
        ? 'radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)'
        : 'radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
      backgroundSize: '24px 24px'
    }}
    >
      {/* Department Selection Modal */}
      <DepartmentSelectionModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onSubmit={() => setShowDeptModal(false)}
        userType={user?.role === 'Faculty' ? 'faculty' : 'student'}
        currentDepartments={user?.departments || []}
        canEdit={user?.role === 'Faculty' ? true : (user?.departmentChangeCount < 1 || (!user?.departments || user?.departments.length === 0))}
      />

      <Navbar 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        toggleSidebar={toggleSidebar} 
        showProfileMenu={showProfileMenu}
        toggleProfileMenu={toggleProfileMenu} 
        sidebarOpen={sidebarOpen}
        user={user}
        onEditDepartment={() => setShowDeptModal(true)}
      />

      {/* Department Display */}
      {user?.role === 'Student' && user?.departments && user.departments.length > 0 && (
        <div className="px-6 pt-4 pb-2">
          <div className="inline-block bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200 rounded-full px-4 py-2 text-sm font-semibold shadow-sm border border-sky-200/60">
            Your Department: {user.departments[0]}
          </div>
        </div>
      )}

      <div className={`p-5 lg:p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col lg:flex-row items-start gap-5 lg:gap-6">
          {/* ── Left panel: strictly locked/sticky, internal scroll only ── */}
          <div className={`activities-left-panel w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-18 z-10 rounded-2xl border flex flex-col overflow-hidden ${
            darkMode
              ? 'bg-gray-800 border-gray-700 shadow-lg'
              : 'bg-white border-slate-200/80 shadow-md'
          }`} style={{ maxHeight: 'calc(100vh - 3.5rem)', height: 'calc(100vh - 3.5rem)' }}>
            {/* Panel header — fixed inside panel */}
            <div className={`px-4 py-4 flex-shrink-0 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-100 bg-slate-50/80'}`}>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-sky-900/50 text-sky-300' : 'bg-sky-100 text-sky-600'}`}>
                  <FaListUl className="h-4 w-4" />
                </div>
                <h2 className={`text-base font-bold flex-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Your Activities</h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleMultiSelectMode}
                    className={`p-2 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center justify-center h-8 w-8 cursor-pointer shadow-xs ${
                      isMultiSelectMode
                        ? 'border-sky-400 text-sky-700 shadow-sm'
                        : 'border-sky-200 text-sky-600 hover:border-sky-300'
                    }`}
                    style={{
                      backgroundColor: isMultiSelectMode ? '#bae6fd' : '#f0f9ff',
                      color: '#0284c7',
                      borderWidth: '1px'
                    }}
                    title={isMultiSelectMode ? "Exit Multi-Select" : "Multi-Select"}
                  >
                    <FaClone className="h-3.5 w-3.5" style={{ color: '#0284c7' }} />
                  </button>
                  {isMultiSelectMode && activities.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="p-2 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center justify-center h-8 w-8 cursor-pointer shadow-xs"
                      style={{
                        backgroundColor: selectedActivities.size === activities.length ? '#0284c7' : '#f0f9ff',
                        color: selectedActivities.size === activities.length ? '#ffffff' : '#0284c7',
                        borderWidth: '1px',
                        borderColor: selectedActivities.size === activities.length ? '#0284c7' : '#bae6fd'
                      }}
                      title={selectedActivities.size === activities.length ? "Deselect All" : "Select All"}
                    >
                      {selectedActivities.size === activities.length ? (
                        <FaCheckSquare className="h-3.5 w-3.5" style={{ color: '#ffffff' }} />
                      ) : (
                        <FaRegSquare className="h-3.5 w-3.5" style={{ color: '#0284c7' }} />
                      )}
                    </button>
                  )}
                  {isMultiSelectMode && selectedActivities.size > 0 && hasEditDeletePermission && (
                    <button
                      type="button"
                      onClick={(e) => {
                        if (e) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                        handleMultiDelete();
                      }}
                      className="p-2 text-white rounded-xl hover:opacity-90 transition-all duration-200 flex items-center justify-center h-8 w-8 shadow-sm cursor-pointer"
                      style={{ backgroundColor: '#ef4444', border: 'none', color: '#ffffff' }}
                      title={`Delete ${selectedActivities.size} Selected`}
                    >
                      <FaTrash size={14} style={{ color: '#ffffff' }} />
                    </button>
                  )}
                </div>
              </div>
              <p className={`text-xs mt-1.5 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                {isMultiSelectMode && selectedActivities.size > 0
                  ? `${selectedActivities.size} of ${activities.length} selected`
                  : `${activities.length} activit${activities.length === 1 ? 'y' : 'ies'}`}
              </p>
            </div>
            
            {/* Scrollable activity list */}
            {loading ? (
              <div className="flex justify-center py-12 flex-1">
                <svg className="animate-spin h-8 w-8 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : activities.length > 0 ? (
              <div className="activities-container activity-panel-scroll flex-1 px-3 py-3 space-y-2">
                {activities.map((activity, idx) => {
                  const isSelected = selectedActivity && selectedActivity.id === activity.id;
                  return (
                    <div 
                      key={activity.id}
                      style={{
                        animationDelay: `${idx * 30}ms`,
                        backgroundColor: isSelected 
                          ? (darkMode ? 'rgba(14, 165, 233, 0.15)' : '#f0f9ff')
                          : (darkMode ? 'transparent' : '#ffffff'),
                        border: isSelected
                          ? '2px solid #0284c7'
                          : darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
                        boxShadow: isSelected
                          ? '0 2px 8px rgba(2, 132, 199, 0.15)'
                          : 'none'
                      }}
                      className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 relative ${
                        isSelected
                          ? darkMode ? 'text-white font-medium' : 'text-slate-900 font-medium'
                          : darkMode
                            ? 'hover:bg-sky-950/30 hover:border-sky-700/50'
                            : 'hover:bg-sky-50/60 hover:border-sky-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div
                          onClick={() => {
                            if (!isMultiSelectMode) {
                              setSelectedActivity(activity);
                              setIsDescriptionExpanded(false);
                            }
                          }}
                          className="flex-1 min-w-0"
                        >
                          <h3 className={`font-semibold text-sm leading-snug ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                            <span
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                wordBreak: 'break-word',
                              }}
                              title={activity.activityName}
                            >
                              {activity.activityName}
                            </span>
                          </h3>
                          {(Array.isArray(activity.departments) && activity.departments.length > 0) ? (
                            <span className={`block text-xs mt-0.5 truncate ${darkMode ? 'text-gray-400' : 'text-sky-600/75'}`}>{activity.departments.join(', ')}</span>
                          ) : (
                            activity.department && (
                              <span className={`block text-xs mt-0.5 truncate ${darkMode ? 'text-gray-400' : 'text-sky-600/75'}`}>{activity.department}</span>
                            )
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{activity.date}</span>
                            <div className="flex items-center gap-1">
                              <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded-md border"
                                style={{
                                  color: getRatingColor(activity.averageRating, activity.feedbackCount > 0),
                                  backgroundColor: `${getRatingColor(activity.averageRating, activity.feedbackCount > 0)}1A`,
                                  borderColor: `${getRatingColor(activity.averageRating, activity.feedbackCount > 0)}40`
                                }}
                              >
                                {activity.feedbackCount > 0 ? activity.averageRating.toFixed(1) : '0.0'}
                              </span>
                              <FaStar
                                className="h-3 w-3"
                                style={{ color: getRatingColor(activity.averageRating, activity.feedbackCount > 0) }}
                              />
                              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>({activity.feedbackCount})</span>
                            </div>
                          </div>
                        </div>
                        {isMultiSelectMode && (
                          <span
                            className="ml-1 cursor-pointer flex-shrink-0"
                            onClick={e => {
                              e.stopPropagation();
                              toggleActivitySelection(activity.id);
                            }}
                          >
                            {selectedActivities.has(activity.id) ? (
                              <FaCheckSquare className="h-4 w-4 text-sky-500" />
                            ) : (
                              <FaRegSquare className="h-4 w-4 text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-sky-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 flex-1 flex flex-col items-center justify-center px-4">
                <FaListUl className={`h-10 w-10 mb-3 ${darkMode ? 'text-gray-600' : 'text-sky-200'}`} />
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No activities found</p>
              </div>
            )}
          </div>
          
          {selectedActivity ? (
            <div className="flex-1 min-w-0 animate-fade-in-up" key={selectedActivity.id}>
              <div
                className={`rounded-2xl shadow-lg overflow-hidden border flex flex-col ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
                }`}
                style={{ maxHeight: 'calc(100vh - 3.5rem)', height: 'calc(100vh - 3.5rem)' }}
              >
                {/* Hero header — fixed/locked at top */}
                <div className={`px-6 pt-5 pb-5 border-b relative flex-shrink-0 z-10 ${darkMode ? 'border-gray-700/80 bg-gray-800' : 'border-slate-100 bg-slate-50/90 backdrop-blur-xs'}`}>
                  {hasEditDeletePermission && !isMultiSelectMode && (
                    <div className="absolute top-4 right-4 flex gap-2 z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(selectedActivity);
                        }}
                        className="p-2.5 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-95"
                        style={{
                          backgroundColor: '#0369a1',
                          color: '#ffffff',
                          border: '1px solid #0284c7'
                        }}
                        title="Edit Activity"
                      >
                        <FaEdit size={15} style={{ color: '#ffffff' }} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteActivity(selectedActivity.id);
                        }}
                        className="p-2.5 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-95"
                        style={{
                          backgroundColor: '#b91c1c',
                          color: '#ffffff',
                          border: '1px solid #dc2626'
                        }}
                        title="Delete Activity"
                      >
                        <FaTrash size={15} style={{ color: '#ffffff' }} />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                    <div className="flex-1 pr-16">
                      <h2
                        className={`text-xl sm:text-2xl font-bold leading-snug tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}
                        style={{ wordBreak: 'break-word' }}
                        title={selectedActivity.activityName}
                      >
                        {selectedActivity.activityName}
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {selectedActivity.facultyName && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                            darkMode ? 'bg-sky-950/50 text-sky-200 border-sky-500/80' : 'bg-sky-50 text-sky-800 border-sky-400 shadow-2xs'
                          }`}>
                            <FaUser className="text-sky-500 text-xs" />
                            <span>{selectedActivity.facultyName}</span>
                          </span>
                        )}
                        {selectedActivity.date && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                            darkMode ? 'bg-amber-950/50 text-amber-200 border-amber-500/80' : 'bg-amber-50 text-amber-800 border-amber-400 shadow-2xs'
                          }`}>
                            <FaCalendarAlt className="text-amber-500 text-xs" />
                            <span>{selectedActivity.date}</span>
                          </span>
                        )}
                        {(selectedActivity.courseName || selectedActivity.branch) && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                            darkMode ? 'bg-violet-950/50 text-violet-200 border-violet-500/80' : 'bg-violet-50 text-violet-800 border-violet-400 shadow-2xs'
                          }`}>
                            <FaGraduationCap className="text-violet-500 text-xs" />
                            <span>{selectedActivity.courseName || selectedActivity.branch}</span>
                          </span>
                        )}
                        {(selectedActivity.className || selectedActivity.year) && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                            darkMode ? 'bg-emerald-950/50 text-emerald-200 border-emerald-500/80' : 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-2xs'
                          }`}>
                            <span>{selectedActivity.className || selectedActivity.year}</span>
                          </span>
                        )}
                        {(selectedActivity.departments?.length > 0 || selectedActivity.department) && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                            darkMode ? 'bg-indigo-950/50 text-indigo-200 border-indigo-500/80' : 'bg-indigo-50 text-indigo-800 border-indigo-400 shadow-2xs'
                          }`}>
                            <FaBuilding className="text-indigo-500 text-xs" />
                            <span>{Array.isArray(selectedActivity.departments) ? selectedActivity.departments.join(', ') : selectedActivity.department}</span>
                          </span>
                        )}
                        {selectedActivity.academicYear && (
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                            darkMode ? 'bg-rose-950/50 text-rose-200 border-rose-500/80' : 'bg-rose-50 text-rose-800 border-rose-400 shadow-2xs'
                          }`}>
                            <span>{selectedActivity.academicYear} {selectedActivity.semester ? `(Sem ${selectedActivity.semester})` : ''}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-0.5">
                          {renderStars(selectedActivity.averageRating)}
                        </div>
                        <span
                          className="text-sm font-bold"
                          style={{ color: getRatingColor(selectedActivity.averageRating, selectedActivity.feedbackCount > 0) }}
                        >
                          {selectedActivity.averageRating.toFixed(1)}
                        </span>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          ({selectedActivity.feedbackCount} reviews)
                        </span>
                      </div>
                    </div>

                    {selectedActivity.image && (
                      <div className="flex-shrink-0 flex flex-col items-center justify-center md:justify-end">
                        <div
                          className="relative group cursor-pointer select-none p-2"
                          onClick={() => openImageModal(selectedActivity)}
                          title="Click to view photo"
                        >
                          <div className="absolute inset-2 rounded-2xl bg-sky-200/60 dark:bg-sky-800/40 transform rotate-6 scale-95 opacity-70 group-hover:rotate-12 transition-transform duration-300"></div>
                          <div className="absolute inset-2 rounded-2xl bg-sky-100/80 dark:bg-sky-700/40 transform -rotate-3 scale-95 opacity-80 group-hover:-rotate-6 transition-transform duration-300"></div>
                          <div className="relative w-44 h-32 sm:w-52 sm:h-36 rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-gray-700 bg-gray-100 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                            <img
                              src={selectedActivity.image}
                              alt={selectedActivity.activityName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/600x400/lightgray/white?text=Activity';
                              }}
                            />
                            <div className="absolute inset-0 bg-sky-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold backdrop-blur-xs gap-1">
                              <FaExpand className="text-xs" />
                              <span>View</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scrollable details: Description, Feedback Summary, Student Comments */}
                <div
                  className="p-6 flex-1 overflow-y-auto"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: darkMode ? '#4B5563 transparent' : '#CBD5E1 transparent'
                  }}
                >
                  {/* Description */}
                  <div className="mb-6">
                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-sky-100'}`}>
                      <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-sky-300' : 'text-sky-600'}`}>Description</h3>
                      <div>
                        <p className={`whitespace-pre-wrap text-sm leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          {isDescriptionExpanded || (selectedActivity.description || '').length <= 250
                            ? selectedActivity.description
                            : `${(selectedActivity.description || '').substring(0, 250)}...`}
                        </p>
                        {(selectedActivity.description || '').length > 250 && (
                          <button
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="text-sky-500 hover:text-sky-600 hover:underline mt-1 text-sm bg-transparent border-none p-0 cursor-pointer"
                          >
                            {isDescriptionExpanded ? 'Show less' : 'Read more...'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Rating summary card */}
                  <div className={`mb-6 p-5 rounded-2xl border ${
                    darkMode ? 'bg-gray-750 border-gray-700' : 'bg-gradient-to-br from-sky-50/80 to-white border-sky-100'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <FaChartBar className={`h-4 w-4 ${darkMode ? 'text-sky-400' : 'text-sky-500'}`} />
                      <h3 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-sky-900'}`}>Student Feedback Summary</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div>
                        <div className="flex items-end gap-2">
                          <span
                            className="text-5xl font-bold"
                            style={{ color: getRatingColor(selectedActivity.averageRating, selectedActivity.feedbackCount > 0) }}
                          >
                            {selectedActivity.averageRating.toFixed(1)}
                          </span>
                          <span className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>out of 5</span>
                        </div>
                        <div className="flex mt-1">{renderStars(selectedActivity.averageRating)}</div>
                        <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          {selectedActivity.feedbackCount} student review{selectedActivity.feedbackCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      <div className="w-full sm:w-64">
                        {[5, 4, 3, 2, 1].map(rating => {
                          const count = (selectedActivity.comments || []).filter(c => {
                            const r = Math.round(Number(c.rating || 0));
                            return r === rating;
                          }).length;
                          const total = selectedActivity.feedbackCount || (selectedActivity.comments ? selectedActivity.comments.length : 0);
                          const percentage = total > 0 ? (count / total) * 100 : 0;
                          
                          return (
                            <div key={rating} className="flex items-center mt-2 gap-2">
                              <span className={`text-xs w-3 font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{rating}</span>
                              <FaStar className="h-3 w-3 flex-shrink-0" style={{ color: '#fbbf24' }} />
                              <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-slate-200/80'}`}>
                                <div 
                                  className="h-full rounded-full transition-all duration-500" 
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: percentage > 0 ? '#eab308' : 'transparent'
                                  }}
                                ></div>
                              </div>
                              <span className={`text-xs ml-1 w-6 text-right font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Student comments */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <FaComments className={`h-4 w-4 ${darkMode ? 'text-sky-400' : 'text-sky-500'}`} />
                      <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-sky-900'}`}>Student Comments</h3>
                    </div>
                    {selectedActivity.comments && selectedActivity.comments.length > 0 ? (
                      <div className="space-y-3">
                        {selectedActivity.comments.map((comment, index) => (
                          <div
                            key={comment.id || index}
                            className={`px-4 py-3.5 rounded-xl border transition-all duration-200 hover:shadow-md ${
                              darkMode
                                ? 'bg-gray-750 border-gray-700 hover:border-gray-600'
                                : 'bg-white border-sky-100 hover:border-sky-200 hover:shadow-sky-100/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <h4 className="font-semibold text-sm leading-none">{comment.studentName || 'Anonymous Student'}</h4>
                                <div className="flex items-center">{renderStars(comment.rating)}</div>
                              </div>
                              <span className={`text-xs flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
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

                            <div className="flex items-center justify-between gap-4 mt-2.5">
                              <p className={`text-sm leading-relaxed flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {comment.comment || 'No comment provided'}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleViewCompleteFeedback(comment.id)}
                                style={{
                                  backgroundColor: '#0369a1',
                                  color: '#ffffff',
                                  border: '1px solid #0284c7'
                                }}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shadow-xs hover:brightness-110 active:scale-95 cursor-pointer whitespace-nowrap flex-shrink-0"
                              >
                                View Complete Feedback
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`p-8 rounded-xl border text-center ${
                        darkMode ? 'bg-gray-750 border-gray-700 text-gray-400' : 'bg-sky-50/50 border-sky-100 text-gray-500'
                      }`}>
                        <FaComments className={`h-8 w-8 mx-auto mb-2 ${darkMode ? 'text-gray-600' : 'text-sky-200'}`} />
                        <p className="text-sm">No comments available for this activity yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[28rem] animate-scale-in">
              <div className={`text-center p-10 rounded-2xl border ${
                darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-sky-100 bg-white/80 shadow-sm'
              }`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                  darkMode ? 'bg-sky-900/30' : 'bg-sky-100'
                }`}>
                  <FaComments className={`h-8 w-8 ${darkMode ? 'text-sky-400' : 'text-sky-400'}`} />
                </div>
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-sky-900'}`}>Select an activity to view feedback</h2>
                <p className={`mt-2 text-sm max-w-xs mx-auto ${darkMode ? 'text-gray-400' : 'text-sky-600/70'}`}>
                  Choose an activity from the list to see student comments and ratings
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showCompleteFeedback && selectedFeedback && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 p-4"
          onClick={closeCompleteFeedback}
        >
          <div
            className={`rounded-2xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto animate-scale-in border ${
              darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-800 border-slate-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-sky-900'}`}>Complete Feedback Details</h2>
                <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-sky-600/70'}`}>Full student review breakdown</p>
              </div>
              <button 
                type="button"
                onClick={closeCompleteFeedback}
                style={{
                  backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                  color: darkMode ? '#94a3b8' : '#64748b',
                  border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0'
                }}
                className="p-2 rounded-xl transition-all duration-200 hover:brightness-105 active:scale-95 cursor-pointer"
                title="Close"
              >
                <FaTimes className="h-4 w-4" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-sky-50/60 border-sky-100'}`}>
                    <h4 className={`font-medium mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-sky-700'}`}>Overall Rating</h4>
                    <div className="flex items-center">
                      {renderStars(selectedFeedback.rating)}
                      <span className="ml-2 font-bold">{selectedFeedback.rating}</span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-sky-50/60 border-sky-100'}`}>
                    <h4 className={`font-medium mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-sky-700'}`}>Understandability</h4>
                    <div className="flex items-center">
                      {renderStars(selectedFeedback.understandability)}
                      <span className="ml-2 font-bold">{selectedFeedback.understandability}</span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-sky-50/60 border-sky-100'}`}>
                    <h4 className={`font-medium mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-sky-700'}`}>Engagement</h4>
                    <div className="flex items-center">
                      {renderStars(selectedFeedback.engagement)}
                      <span className="ml-2 font-bold">{selectedFeedback.engagement}</span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-sky-50/60 border-sky-100'}`}>
                    <h4 className={`font-medium mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-sky-700'}`}>Relevance</h4>
                    <div className="flex items-center">
                      {renderStars(selectedFeedback.relevance)}
                      <span className="ml-2 font-bold">{selectedFeedback.relevance}</span>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-white border-sky-100'}`}>
                  <h4 className={`font-medium mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-sky-700'}`}>Student Comments</h4>
                  <p className="text-sm leading-relaxed">{selectedFeedback.comment || 'No comments provided'}</p>
                </div>
                
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-white border-sky-100'}`}>
                  <h4 className={`font-medium mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-sky-700'}`}>Suggestions for Improvement</h4>
                  <p className="text-sm leading-relaxed">{selectedFeedback.suggestions || 'No suggestions provided'}</p>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeCompleteFeedback}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  backgroundImage: 'linear-gradient(to right, #0284c7, #2563eb)'
                }}
                className="px-6 py-2.5 rounded-xl font-semibold text-white shadow-md shadow-sky-500/20 hover:brightness-110 active:brightness-95 transition-all cursor-pointer border-none"
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
        <div
          className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 p-4"
          onClick={() => {
            setShowEditModal(false);
            setEditingActivity(null);
          }}
        >
          <div
            className={`${darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-slate-800 border border-slate-200'} rounded-2xl shadow-2xl w-full max-w-2xl mx-auto flex flex-col overflow-hidden`}
            style={{ maxHeight: '92vh', height: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className={`px-6 py-4 border-b flex-shrink-0 flex justify-between items-center ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-100 bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-sky-900/50 text-sky-300' : 'bg-sky-100 text-sky-600'}`}>
                  <FaEdit className="h-4 w-4" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Edit Activity</h2>
                  
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingActivity(null);
                }}
                style={{
                  backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                  color: darkMode ? '#94a3b8' : '#64748b',
                  border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0'
                }}
                className="p-2 rounded-xl transition-all hover:brightness-105 active:scale-95 cursor-pointer"
                title="Close"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className={`flex-1 overflow-y-auto px-6 py-5 space-y-4 ${darkMode ? 'bg-gray-850' : 'bg-slate-50/60'}`} style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: darkMode ? '#4B5563 transparent' : '#CBD5E1 transparent'
            }}>
              <form id="editForm" onSubmit={handleEditSubmit} className="space-y-4">

                {/* Section: Basic details */}
                <div className={`rounded-2xl border p-4 shadow-2xs ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                  
                  <div className="space-y-3">
                    <div>
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Activity Name</label>
                      <input
                        type="text"
                        name="activityName"
                        value={editForm.activityName}
                        onChange={handleEditFormChange}
                        style={{
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs ${
                          darkMode ? 'border-gray-600 placeholder-gray-400' : 'border-slate-300 placeholder-slate-400'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Description</label>
                      <textarea
                        name="description"
                        value={editForm.description}
                        onChange={(e) => {
                          handleEditFormChange(e);
                          const textarea = e.target;
                          textarea.style.height = 'auto';
                          const newHeight = Math.min(Math.max(textarea.scrollHeight, 80), 200);
                          textarea.style.height = `${newHeight}px`;
                          textarea.style.overflowY = textarea.scrollHeight > 200 ? 'auto' : 'hidden';
                        }}
                        placeholder="Describe the activity, its objectives and outcomes..."
                        style={{
                          minHeight: '80px',
                          maxHeight: '200px',
                          overflowY: 'hidden',
                          scrollbarWidth: 'thin',
                          scrollbarColor: darkMode ? '#4b5563 #1f2937' : '#cbd5e1 #ffffff',
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs resize-none custom-light-scrollbar ${
                          darkMode ? 'border-gray-600 placeholder-gray-400' : 'border-slate-300 placeholder-slate-400'
                        }`}
                        rows="3"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Classification */}
                <div className={`rounded-2xl border p-4 shadow-2xs ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div ref={editDeptDropdownRef} className="relative">
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                        Departments
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditDeptDropdownOpen(prev => !prev)}
                        style={{
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-left flex justify-between items-center transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs cursor-pointer ${
                          darkMode ? 'border-gray-600' : 'border-slate-300'
                        }`}
                      >
                        <span className="truncate flex-1 pr-2">
                          {editForm.departments && editForm.departments.length > 0
                            ? editForm.departments.join(', ')
                            : (editForm.department || 'Select department(s)')}
                        </span>
                        <span className="text-gray-400 text-xs flex-shrink-0">▼</span>
                      </button>

                      {editDeptDropdownOpen && (
                        <div
                          className={`absolute z-30 mt-1.5 w-full rounded-xl shadow-xl border max-h-56 overflow-y-auto p-1.5 custom-light-scrollbar ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-slate-200'
                          }`}
                        >
                          {(() => {
                            const list = [];
                            if (Array.isArray(user?.departments) && user.departments.length > 0) {
                              user.departments.forEach(d => { if (d && !list.includes(d)) list.push(d); });
                            }
                            if (Array.isArray(editForm.departments)) {
                              editForm.departments.forEach(d => { if (d && !list.includes(d)) list.push(d); });
                            }
                            const deptsToShow = list.length > 0 ? list : DEPARTMENTS;

                            return deptsToShow.map(dept => {
                              const isChecked = editForm.departments?.includes(dept);
                              return (
                                <label
                                  key={dept}
                                  className={`flex items-center px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-sky-50'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2.5 transition-colors flex-shrink-0 ${
                                    isChecked
                                      ? 'bg-sky-600 border-sky-600 text-white'
                                      : darkMode
                                        ? 'bg-gray-700 border-gray-500'
                                        : 'bg-white border-slate-300'
                                  }`}>
                                    {isChecked && (
                                      <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={isChecked || false}
                                    onChange={e => {
                                      const checked = e.target.checked;
                                      setEditForm(prev => {
                                        let nd = prev.departments ? [...prev.departments] : [];
                                        if (checked) {
                                          if (!nd.includes(dept)) nd.push(dept);
                                        } else {
                                          nd = nd.filter(d => d !== dept);
                                        }
                                        return {
                                          ...prev,
                                          departments: nd,
                                          department: nd.length > 0 ? nd[0] : ''
                                        };
                                      });
                                    }}
                                    className="sr-only"
                                  />
                                  <span className={`text-sm truncate ${darkMode ? 'text-gray-200' : 'text-slate-800'}`}>
                                    {dept}
                                  </span>
                                </label>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Course Name</label>
                      <input
                        type="text"
                        name="courseName"
                        value={editForm.courseName}
                        onChange={handleEditFormChange}
                        style={{
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs ${
                          darkMode ? 'border-gray-600 placeholder-gray-400' : 'border-slate-300 placeholder-slate-400'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Class</label>
                      <select
                        name="className"
                        value={editForm.className}
                        onChange={handleEditFormChange}
                        style={{
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs ${
                          darkMode ? 'border-gray-600' : 'border-slate-300'
                        }`}
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
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Academic Year</label>
                      <input
                        type="text"
                        name="academicYear"
                        placeholder="e.g. 2024-25"
                        value={editForm.academicYear}
                        onChange={handleEditFormChange}
                        style={{
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs ${
                          darkMode ? 'border-gray-600 placeholder-gray-400' : 'border-slate-300 placeholder-slate-400'
                        }`}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Schedule */}
                <div className={`rounded-2xl border p-4 shadow-2xs ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Semester</label>
                      <select
                        name="semester"
                        value={editForm.semester}
                        onChange={handleEditFormChange}
                        style={{
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs ${
                          darkMode ? 'border-gray-600' : 'border-slate-300'
                        }`}
                        required
                      >
                        <option value="">Select Semester</option>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Activity Date</label>
                      <input
                        type="date"
                        name="activityDate"
                        value={editForm.activityDate}
                        onChange={handleEditFormChange}
                        style={{
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs ${
                          darkMode ? 'border-gray-600' : 'border-slate-300'
                        }`}
                        required
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Fixed Footer */}
            <div className={`px-6 py-4 border-t flex-shrink-0 flex justify-end gap-3 ${
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-white'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingActivity(null);
                }}
                style={{
                  backgroundColor: darkMode ? '#374151' : '#f0f9ff',
                  color: darkMode ? '#e5e7eb' : '#0284c7'
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-all border border-transparent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  backgroundImage: 'linear-gradient(to right, #0284c7, #2563eb)'
                }}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:brightness-110 active:brightness-95 transition-all shadow-md shadow-sky-500/20 border-none cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      
     {showDeleteConfirmation && (
        <div 
          className="delete-confirmation-modal fixed inset-0 flex items-center justify-center bg-sky-950/40 backdrop-blur-sm z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingActivities) {
              setShowDeleteConfirmation(false);
              setActivityToDelete(null);
              setIsMultiDelete(false);
              setDeleteError(null);
            }
          }}
        >
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-sm w-full shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-sky-100'}`}>
            <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Confirm Delete</h3>
            <p className={`mb-6 text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
              {isMultiDelete 
                ? `Are you sure you want to delete ${selectedActivities.size} selected activit${selectedActivities.size === 1 ? 'y' : 'ies'}? This action cannot be undone.`
                : `Are you sure you want to delete this activity? This action cannot be undone.`
              }
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-xs">
                <p>{deleteError}</p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setActivityToDelete(null);
                  setIsMultiDelete(false);
                  setDeleteError(null);
                }}
                style={{
                  backgroundColor: darkMode ? '#374151' : '#f0f9ff',
                  color: darkMode ? '#e5e7eb' : '#0284c7',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #bae6fd'
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all cursor-pointer"
                disabled={deletingActivities}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none'
                }}
                className={`px-4 py-2 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all cursor-pointer shadow-sm ${
                  deletingActivities ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={deletingActivities}
              >
                {deletingActivities ? 'Deleting...' : isMultiDelete ? `Delete ${selectedActivities.size} Activit${selectedActivities.size === 1 ? 'y' : 'ies'}` : 'Delete'}
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
      {/* Modern Multi-Image Modal */}
      {isImageModalOpen && modalImages.length > 0 && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 transition-all ${
            darkMode ? 'bg-black/75 backdrop-blur-xs' : 'bg-sky-950/30 backdrop-blur-xs'
          }`}
          onClick={closeImageModal}
        >
          <div
            className={`relative max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden transition-all flex flex-col ${
              darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'
            }`}
            style={{ maxHeight: 'calc(100vh - 40px)', boxSizing: 'border-box' }}
            onClick={(e) => e.stopPropagation()}
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
                        ? 'w-6 bg-sky-400'
                        : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-sky-200'
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

export default StudentFeedback;