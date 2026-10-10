import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserSession } from '../UserSessionContext';

const DashboardRedirect = () => {
  const { user, loading } = useUserSession();

  if (!user) {
    if (loading) return null;
    return <Navigate to="/" replace />;
  }

  if (!user.isGoogleUser && !user.emailVerified) {
    return <Navigate to="/" replace state={{ unverifiedEmail: user.email }} />;
  }

  const roleLower = (user.role || '').toLowerCase();
  if (!roleLower || roleLower === 'unknown') {
    return null;
  }
  if (roleLower === 'hod') {
    return <Navigate to="/hod-dashboard" replace />;
  }
  if (roleLower === 'faculty') {
    return <Navigate to="/faculty-dashboard" replace />;
  }
  return <Navigate to="/student-dashboard" replace />;
};

export default DashboardRedirect;
