import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '../UserSessionContext';

const DashboardRedirect = () => {
  const { user, loading } = useUserSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user?.role === 'HOD') {
        navigate('/hod-dashboard', { replace: true });
      } else if (user?.role === 'Faculty') {
        navigate('/faculty-dashboard', { replace: true });
      } else if (user?.role === 'Student') {
        navigate('/student-dashboard', { replace: true });
      } else if (user) {
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  // Display a message while the redirection is happening.
  return (
    <div className="flex justify-center items-center h-screen">
      <p>Redirecting to your dashboard...</p>
    </div>
  );
};

export default DashboardRedirect; 