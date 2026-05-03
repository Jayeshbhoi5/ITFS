import React, { useState, useEffect } from 'react';
import Sidebar from './StudentSidebar';
import Navbar from './Navbar';
import DashboardMetrics from './StudentMetrics';
import ActivityCarousel from './ActivityCarousel';
import { useActivities } from "../FacultyDashboard/ActivityContext";
import { useActivityUserStatus } from "./ActivityUserStatusManager";
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from "../../firebaseConfig";
import { useUserSession } from '../../UserSessionContext';

const StudentDashboard = () => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "enabled"
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const { user, setUser } = useUserSession();
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptEditMode, setDeptEditMode] = useState(false);
  
  // Get activities from context
  const { activities: contextActivities } = useActivities();
  
  // Get user status context
  const { submittedActivities, isActivitySubmitted, loading: statusLoading } = useActivityUserStatus() || {};
  
  // Process activities from context to calculate metrics
  useEffect(() => {
    if (contextActivities && contextActivities.length > 0) {
      // Process the activities similar to AllActivitiesPage
      const processedActivities = contextActivities.map(activity => {
        const submitted = isActivitySubmitted ? isActivitySubmitted(activity.id) : false;
        
        return {
          id: activity.id,
          title: activity.activityName || 'Untitled Activity',
          branch: activity.courseName || activity.branch || '',
          year: activity.className || activity.year || '',
          faculty: activity.facultyName || '',
          image: activity.mainImage || 'https://placehold.co/600x400/lightgray/white?text=Activity',
          status: submitted ? 'submitted' : 'pending',
          averageRating: activity.averageRating || 0
        };
      });
      
      setActivities(processedActivities);
      setLoading(false);
    } else if (!statusLoading) {
      setLoading(false);
    }
  }, [contextActivities, statusLoading, isActivitySubmitted]);
  
  // Calculate dashboard metrics from activities
  const calculateDashboardMetrics = () => {
    // Handle empty activities array
    if (!activities || activities.length === 0) {
      return {
        pendingFeedback: 0,
        feedbackSubmitted: 0,
        totalActivities: 0,
        averageRating: 0.0
      };
    }
    
    // Filter activities by status
    const submittedActivities = activities.filter(activity => activity.status === 'submitted');
    const pendingActivities = activities.filter(activity => activity.status === 'pending');
    
    // Calculate average rating from submitted activities
    const totalRating = submittedActivities.reduce((sum, activity) => {
      return sum + (parseFloat(activity.averageRating) || 0);
    }, 0);
    
    const averageRating = submittedActivities.length > 0 
      ? (totalRating / submittedActivities.length).toFixed(1) 
      : 0.0;
      
    return {
      pendingFeedback: pendingActivities.length,
      feedbackSubmitted: submittedActivities.length,
      totalActivities: activities.length,
      averageRating: averageRating
    };
  };
  
  // Sample data for activities that need feedback (fallback if contextActivities is empty)
  const pendingActivities = activities.length > 0 
    ? activities.filter(activity => activity.status === 'pending')
    : [
        { 
          id: 1, 
          title: 'Workshop on IoT', 
          image: '10.jpg', 
          description: 'Interactive session on Internet of Things', 
          branch: 'Computer Science', 
          year: '3rd Year',
          faculty: 'Prof. Sharma'
        },
        { 
          id: 2, 
          title: 'Python Programming', 
          image: '10.jpg', 
          description: 'Hands-on programming workshop', 
          branch: 'Information Technology', 
          year: '2nd Year',
          faculty: 'Prof. Mehta'
        },
        { 
          id: 3, 
          title: 'DBMS Practical', 
          image: '10.jpg', 
          description: 'Database management system practical session', 
          branch: 'Computer Science', 
          year: '2nd Year',
          faculty: 'Prof. Patel'
        },
        { 
          id: 4, 
          title: 'Circuit Design', 
          image: 'https://res.cloudinary.com/dxssqb6l8/image/upload/v1605293735/technologies/circuit_rbjqal.jpg', 
          description: 'Electronic circuit design workshop', 
          branch: 'Electronics', 
          year: '3rd Year',
          faculty: 'Prof. Gupta'
        },
        { 
          id: 5, 
          title: 'Machine Learning', 
          image: 'https://res.cloudinary.com/dxssqb6l8/image/upload/v1605293735/technologies/ml_plak1o.jpg', 
          description: 'Introduction to machine learning concepts', 
          branch: 'Computer Science', 
          year: '4th Year',
          faculty: 'Prof. Singh'
        },
      ];

  const dashboardMetrics = calculateDashboardMetrics();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "enabled");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "disabled");
    }
  }, [darkMode]);

  useEffect(() => {
    if (user && user.role === 'Student') {
      if (!user.departments || user.departments.length === 0) {
        setShowDeptModal(true);
        setDeptEditMode(false);
      }
    }
  }, [user]);

  // Handler for department edit from Navbar/profile
  const handleEditDepartment = () => {
    if (user && user.departmentChangeCount < 1) {
      setShowDeptModal(true);
      setDeptEditMode(true);
    }
  };

  // Save department selection to Firestore
  const handleDeptSubmit = async ({ departments }) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      const newChangeCount = deptEditMode ? 1 : (user.departmentChangeCount || 0);
      await updateDoc(userRef, {
        departments,
        departmentChangeCount: newChangeCount,
      });

      setUser({
        ...user,
        departments,
        departmentChangeCount: newChangeCount,
      });
      
      setShowDeptModal(false);
      setDeptEditMode(false);
    } catch (err) {
      alert('Failed to update department. Please try again.');
    }
  };

  return (
    <div className={`min-h-full ${darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-800"}`}>
      {/* Department Selection Modal */}
      <DepartmentSelectionModal
        isOpen={showDeptModal}
        onClose={() => { if (!user.departments || user.departments.length === 0) return; setShowDeptModal(false); setDeptEditMode(false); }}
        onSubmit={handleDeptSubmit}
        userType="student"
        currentDepartments={user?.departments || []}
        canEdit={user?.departmentChangeCount < 1 || (!user.departments || user.departments.length === 0)}
      />
      {/* Navigation Bar */}
      <Navbar 
        darkMode={darkMode} 
        toggleSidebar={toggleSidebar} 
        showProfileMenu={showProfileMenu}
        toggleProfileMenu={toggleProfileMenu}
        sidebarOpen={sidebarOpen}
        onEditDepartment={handleEditDepartment}
      />
      {/* Block dashboard if department not set */}
      {(!user?.departments || user.departments.length === 0) ? (
        <div className="flex justify-center items-center h-96 text-xl font-semibold">Please select your department to continue.</div>
      ) : (
        <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} min-h-screen transition-all duration-300 ease-in-out`}>
          {loading || statusLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <ActivityCarousel 
                darkMode={darkMode}
                activities={pendingActivities}
              />
              {/* Dashboard Metrics */}
              <DashboardMetrics 
                darkMode={darkMode} 
                dashboardMetrics={dashboardMetrics} 
              />
            </>
          )}
        </div>
      )}
      {/* Sidebar */}
      <Sidebar 
  darkMode={darkMode} 
  sidebarOpen={sidebarOpen} 
  toggleSidebar={toggleSidebar}
  toggleDarkMode={toggleDarkMode} 
  activePage="dashboard" // This should be "dashboard" for dashboard page
/>
    </div>
  );
};

export default StudentDashboard;