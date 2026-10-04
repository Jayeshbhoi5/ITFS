import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useSearchParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};
import { ActivityUserStatusProvider } from './pages/StudentDashboard/ActivityUserStatusManager';
import { useUserSession } from './UserSessionContext';
import { ActivityProvider } from './pages/FacultyDashboard/ActivityContext';

import Abouthome from "./pages/Abouthome";
import Contacthome from "./pages/Contacthome";
import SignupPage from "./pages/Signup";
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
import StudentFeedback from './pages/FacultyDashboard/StudentFeedback';
import FacultyProfile from "./pages/FacultyDashboard/FacultyProfile";

import StudentMetrics from "./pages/StudentDashboard/StudentMetrics";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import StudentProfile from "./pages/StudentDashboard/StudentProfile";
import StudentSidebar from "./pages/StudentDashboard/StudentSidebar";
import StudentAboutUs from "./pages/StudentDashboard/AboutUs";
import StudentContactUs from "./pages/StudentDashboard/ContactUs";
import PendingFeedbackPage from "./pages/StudentDashboard/PendingFeedbackPage";
import AllActivitiesPage from "./pages/StudentDashboard/AllActivitiesPage";
import ProvideFeedbackPage from "./pages/StudentDashboard/ProvideFeedbackPage";
import SubmittedFeedbackPage from "./pages/StudentDashboard/SubmittedFeedbackPage";
import ViewFeedbackPage from "./pages/StudentDashboard/ViewFeedbackPage";

import { getDarkModeFromStorage, setDarkModeInStorage } from "./pages/StudentDashboard/darkModeUtils";
import HodDashboard from './pages/HodDashboard/HodDashboard';
import HodAboutUs from './pages/HodDashboard/AboutUs';
import HodContactUs from './pages/HodDashboard/ContactUs';
import AuthRedirect from './components/AuthRedirect';
import DashboardRedirect from './components/DashboardRedirect';
import LogoutHandler from './components/LogoutHandler';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

const AuthActionHandler = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  if (mode === 'resetPassword') {
    return <Navigate to={`/reset-password?oobCode=${encodeURIComponent(oobCode || '')}`} replace />;
  }
  if (mode === 'verifyEmail') {
    return <Navigate to={`/verify-email?oobCode=${encodeURIComponent(oobCode || '')}`} replace />;
  }
  return <Navigate to="/" replace />;
};

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useUserSession();

  if (!user) {
    if (loading) return children;
    return <Navigate to="/login" replace />;
  }

  const isVerified = user.isGoogleUser || user.emailVerified;
  if (!isVerified) {
    return <Navigate to="/" replace state={{ unverifiedEmail: user.email }} />;
  }

  const userRole = (user.role || '').toLowerCase();
  const targetRole = (requiredRole || '').toLowerCase();

  if (requiredRole && userRole !== targetRole) {
    const dashboardPath = userRole === 'faculty' ? '/faculty-dashboard' :
                          userRole === 'hod' ? '/hod-dashboard' :
                          '/student-dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

const RoleBasedAboutRedirect = () => {
  const { user, loading } = useUserSession();

  if (!user) {
    if (loading) return null;
    return <Navigate to="/abouthome" replace />;
  }

  switch (user.role) {
    case 'Student':
      return <Navigate to="/student-about" replace />;
    case 'Faculty':
      return <Navigate to="/faculty-about" replace />;
    case 'HOD':
      return <Navigate to="/hod-dashboard/about" replace />;
    default:
      return <Navigate to="/abouthome" replace />;
  }
};

const RoleBasedContactRedirect = ({ darkMode }) => {
  const { user, loading } = useUserSession();

  if (!user) {
    if (loading) return null;
    return <Contacthome darkMode={darkMode} />;
  }

  switch (user.role) {
    case 'Student':
      return <StudentContactUs darkMode={darkMode} />;
    case 'Faculty':
      return <ContactUs darkMode={darkMode} />;
    case 'HOD':
      return <HodContactUs darkMode={darkMode} />;
    default:
      return <Contacthome darkMode={darkMode} />;
  }
};

const RoleBasedProfileRedirect = () => {
  const { user, loading } = useUserSession();

  if (!user) {
    if (loading) return null;
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || '').toLowerCase();
  if (role === 'student') {
    return <Navigate to="/student-profile" replace />;
  } else if (role === 'faculty' || role === 'hod') {
    return <Navigate to="/faculty-profile" replace />;
  }
  return <Navigate to="/" replace />;
};

import AuthWelcomeToast from './components/AuthWelcomeToast';

const App = () => {
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());

  useEffect(() => {
    setDarkModeInStorage(darkMode);
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleDarkChange = (e) => {
      if (e?.detail?.isDark !== undefined) {
        setDarkMode(e.detail.isDark);
      }
    };
    window.addEventListener('darkModeChange', handleDarkChange);
    return () => window.removeEventListener('darkModeChange', handleDarkChange);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {});
    return () => unsubscribe();
  }, []);

  return (
    <ActivityProvider>
      <ActivityUserStatusProvider>
        <Router>
          <ScrollToTop />
          <AuthWelcomeToast />
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/about" element={<RoleBasedAboutRedirect />} />
            <Route path="/faculty-about" element={<AuthRedirect><AboutUs darkMode={darkMode} /></AuthRedirect>} />
            <Route path="/student-about" element={<StudentAboutUs darkMode={darkMode} />} />
            <Route path="/abouthome" element={<Abouthome darkMode={darkMode} />} />
            <Route path="/contacthome" element={<Contacthome darkMode={darkMode} />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage darkMode={darkMode} />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/action" element={<AuthActionHandler />} />
            <Route path="/__/auth/action" element={<AuthActionHandler />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/LOGIN" element={<Navigate to="/" replace />} />
            <Route path="/forgotpassword" element={<ForgotPassword />} />

            <Route path="/contact" element={<RoleBasedContactRedirect darkMode={darkMode} />} />
            <Route path="/student/contact" element={<StudentContactUs darkMode={darkMode} />} />
            <Route path="/faculty/contact" element={<AuthRedirect><ContactUs darkMode={darkMode} /></AuthRedirect>} />

            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/student-dashboard" element={<AuthRedirect><StudentDashboard /></AuthRedirect>} />
            <Route path="/faculty-dashboard" element={<AuthRedirect><FacultyDashboard /></AuthRedirect>} />
            <Route
              path="/faculty-profile"
              element={
                <ProtectedRoute requiredRole="Faculty">
                  <FacultyProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-profile"
              element={
                <ProtectedRoute requiredRole="Student">
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route path="/profile" element={<RoleBasedProfileRedirect />} />
            <Route path="/hod-dashboard" element={<AuthRedirect><HodDashboard /></AuthRedirect>} />
            <Route path="/hod-dashboard/about" element={<AuthRedirect><HodAboutUs /></AuthRedirect>} />
            <Route path="/hod-dashboard/contact" element={<AuthRedirect><HodContactUs /></AuthRedirect>} />

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

            <Route path="/navbar" element={<Navbar />} />
            <Route path="/sidebar" element={<Sidebar />} />
            <Route path="/dashboardMetrics" element={<DashboardMetrics />} />
            <Route path="/activitycarousel" element={<ActivityCarousel />} />
            <Route path="/StudentMetrics" element={<StudentMetrics />} />
            <Route path="/StudentSidebar" element={<StudentSidebar />} />
            <Route path="/logout" element={<LogoutHandler />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ActivityUserStatusProvider>
    </ActivityProvider>
  );
};

export default App;
