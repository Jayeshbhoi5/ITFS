import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};
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
import StudentAboutUs from "./pages/StudentDashboard/AboutUs"; // Import Student's AboutUs
import StudentContactUs from "./pages/StudentDashboard/ContactUs"; // Import Student's ContactUs
import PendingFeedbackPage from "./pages/StudentDashboard/PendingFeedbackPage";
import AllActivitiesPage from "./pages/StudentDashboard/AllActivitiesPage";
import ProvideFeedbackPage from "./pages/StudentDashboard/ProvideFeedbackPage";
import SubmittedFeedbackPage from "./pages/StudentDashboard/SubmittedFeedbackPage";
import ViewFeedbackPage from "./pages/StudentDashboard/ViewFeedbackPage";

import { getDarkModeFromStorage, setDarkModeInStorage } from "./pages/StudentDashboard/darkModeUtils";
import HodDashboard from './pages/HodDashboard/HodDashboard'; // Import HOD Dashboard
import HodAboutUs from './pages/HodDashboard/AboutUs';
import HodContactUs from './pages/HodDashboard/ContactUs';
import AuthRedirect from './components/AuthRedirect';
import DashboardRedirect from './components/DashboardRedirect'; // Import the new component
import LogoutHandler from './components/LogoutHandler';

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
    // Redirect to the correct dashboard based on the user's role
    const dashboardPath = user.role === 'Faculty' ? '/faculty-dashboard' :
                          user.role === 'HOD' ? '/hod-dashboard' :
                          '/student-dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

const RoleBasedAboutRedirect = () => {
  const { user } = useUserSession();

  if (!user) {
    // Redirect to the public "About Us" page if not logged in
    return <Navigate to="/abouthome" replace />;
  }

  // Redirect to the role-specific "About Us" page
  switch (user.role) {
    case 'Student':
      return <Navigate to="/student-about" replace />;
    case 'Faculty':
      return <Navigate to="/faculty-about" replace />; // Assuming a faculty-specific page exists or will be created
    case 'HOD':
      return <Navigate to="/hod-dashboard/about" replace />;
    default:
      return <Navigate to="/abouthome" replace />;
  }
};

const App = () => {
  const { user, loading } = useUserSession() || {};
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());

  useEffect(() => {
    setDarkModeInStorage(darkMode);
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // No need to set user or userRole here, as useUserSession handles it
      } else {
        // No need to set user or userRole here, as useUserSession handles it
      }
    });

    return () => unsubscribe();
  }, []);

  // Display a loading indicator while the user session is being determined.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <UserSessionProvider>
      <ActivityProvider>
        <ActivityUserStatusProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Homepage />} />
              <Route path="/about" element={<RoleBasedAboutRedirect />} />
              <Route path="/faculty-about" element={<AuthRedirect><AboutUs darkMode={darkMode} /></AuthRedirect>} /> 
              <Route path="/student-about" element={<StudentAboutUs darkMode={darkMode} />} />
              <Route path="/abouthome" element={<Abouthome darkMode={darkMode} />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgotpassword" element={<ForgotPassword />} />

              {/* Contact Us Routes */}
              <Route 
                path="/contact" 
                element={
                  <ProtectedRoute>
                    {user?.role === 'Student' ? <StudentContactUs darkMode={darkMode} /> : <ContactUs darkMode={darkMode} />}
                  </ProtectedRoute>
                } 
              />
              <Route path="/student/contact" element={<StudentContactUs darkMode={darkMode} />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/student-dashboard" element={<AuthRedirect><StudentDashboard /></AuthRedirect>} />
              <Route path="/faculty-dashboard" element={<AuthRedirect><FacultyDashboard /></AuthRedirect>} />
              <Route path="/hod-dashboard" element={<AuthRedirect><HodDashboard /></AuthRedirect>} />
              <Route path="/hod-dashboard/about" element={<AuthRedirect><HodAboutUs /></AuthRedirect>} />
              <Route path="/hod-dashboard/contact" element={<AuthRedirect><HodContactUs /></AuthRedirect>} />

              {/* Faculty Protected Routes */}
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
              <Route path="/logout" element={<LogoutHandler />} />
            </Routes>
          </Router>
        </ActivityUserStatusProvider>
      </ActivityProvider>
    </UserSessionProvider>
  );
}

export default App;