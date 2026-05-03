import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserSession } from '../UserSessionContext';

const AuthRedirect = ({ children }) => {
  const { user, loading } = useUserSession();

  // While we are checking the user's status, show nothing or a loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Authenticating...</p>
      </div>
    );
  }

  // If loading is finished and there is no user, redirect to the login page.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a user is logged in, render the component that was passed in (e.g., a dashboard)
  return children;
};

export default AuthRedirect; 