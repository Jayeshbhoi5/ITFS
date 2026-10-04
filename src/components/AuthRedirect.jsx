import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserSession } from '../UserSessionContext';

const AuthRedirect = ({ children }) => {
  const { user, loading } = useUserSession();

  if (!user) {
    if (loading) return children;
    return <Navigate to="/login" replace />;
  }

  const isVerified = user.isGoogleUser || user.emailVerified;
  if (!isVerified) {
    return <Navigate to="/" replace state={{ unverifiedEmail: user.email }} />;
  }

  return children;
};

export default AuthRedirect;
