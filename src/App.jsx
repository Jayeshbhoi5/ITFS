import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ActivityUserStatusProvider } from './pages/StudentDashboard/ActivityUserStatusManager';
import { UserSessionProvider, useUserSession } from './UserSessionContext'; // Import from UserSessionContext.jsx
import { ActivityProvider } from './pages/FacultyDashboard/ActivityContext';  // Add this import

// Import all existing components
import Abouthome from "./pages/Abouthome"
import SignupPage from "./pages/Signup";
import LoginPage from "./pages/LoginPage";
import ForgotPassword from "./pages/ForgotPassword";
import Homepage from "./pages/Homepage";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import FacultyDashboard from "./pages/FacultyDashboard/FacultyDashboard";
import Navbar from "./pages/FacultyDashboard/Navbar";
import Sidebar from "./pages/FacultyDashboard/Sidebar";
import DashboardMetrics from "./pages/FacultyDashboard/DashboardMetrics";
import ActivityCarousel from "./pages/FacultyDashboard/ActivityCarousel";
import UploadActivity from './pages/FacultyDashboard/UploadActivity';
import ActivityUploadForm from './pages/FacultyDashboard/ActivityUploadForm';
import StudentFeedback from './pages/FacultyDashboard/StudentFeedback';

// Student dashboard imports
import StudentMetrics from "./pages/StudentDashboard/StudentMetrics";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import StudentSidebar from "./pages/StudentDashboard/StudentSidebar";
import PendingFeedbackPage from "./pages/StudentDashboard/PendingFeedbackPage";
import AllActivitiesPage from "./pages/StudentDashboard/AllActivitiesPage";
import ProvideFeedbackPage from "./pages/StudentDashboard/ProvideFeedbackPage";
import SubmittedFeedbackPage from "./pages/StudentDashboard/SubmittedFeedbackPage";
import ViewFeedbackPage from "./pages/StudentDashboard/ViewFeedbackPage";

import { getDarkModeFromStorage, setDarkModeInStorage } from "./pages/StudentDashboard/darkModeUtils";

// Enhanced Protected Route component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useUserSession();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'Faculty' ? '/facultydashboard' : '/StudentDashboard'} replace />;
  }

  return children;
};

function App() {
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    setDarkModeInStorage(darkMode);
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserSessionProvider>
    <ActivityProvider>
      <ActivityUserStatusProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/about" element={<AboutUs darkMode={darkMode} />} />
            <Route path="/abouthome" element={<Abouthome darkMode={darkMode} />} />
            <Route path="/contact" element={<ContactUs darkMode={darkMode} />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgotpassword" element={<ForgotPassword />} />

            {/* Faculty Protected Routes */}
            <Route 
              path="/facultydashboard" 
              element={
                <ProtectedRoute requiredRole="Faculty">
                  <FacultyDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/uploadactivity" 
              element={
                <ProtectedRoute requiredRole="Faculty">
                  <UploadActivity />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/studentfeedback" 
              element={
                <ProtectedRoute requiredRole="Faculty">
                  <StudentFeedback />
                </ProtectedRoute>
              } 
            />

            {/* Student Protected Routes */}
            <Route 
              path="/StudentDashboard" 
              element={
                <ProtectedRoute requiredRole="Student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/PendingFeedbackPage" 
              element={
                <ProtectedRoute requiredRole="Student">
                  <PendingFeedbackPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ProvideFeedbackPage/:activityId" 
              element={
                <ProtectedRoute requiredRole="Student">
                  <ProvideFeedbackPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/SubmittedFeedbackPage" 
              element={
                <ProtectedRoute requiredRole="Student">
                  <SubmittedFeedbackPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/AllActivitiesPage" 
              element={
                <ProtectedRoute requiredRole="Student">
                  <AllActivitiesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/viewfeedbackpage/:activityId" 
              element={
                <ProtectedRoute requiredRole="Student">
                  <ViewFeedbackPage />
                </ProtectedRoute>
              } 
            />

            {/* Component showcase routes (optional) */}
            <Route path="/navbar" element={<Navbar />} />
            <Route path="/sidebar" element={<Sidebar />} />
            <Route path="/dashboardMetrics" element={<DashboardMetrics />} />
            <Route path="/activitycarousel" element={<ActivityCarousel />} />
            <Route path="/StudentMetrics" element={<StudentMetrics />} />
            <Route path="/StudentSidebar" element={<StudentSidebar />} />
          </Routes>
        </Router>
        
      </ActivityUserStatusProvider>
      </ActivityProvider>
    </UserSessionProvider>
  );
}

export default App;