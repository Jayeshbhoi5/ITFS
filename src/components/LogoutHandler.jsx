import { useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { app } from '../firebaseConfig';

const LogoutHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      const auth = getAuth(app);
      try {
        await signOut(auth);
        // Clear any other session/local storage if necessary
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('userId');
      } catch (error) {
        console.error("Logout failed:", error);
      }
      // Finally, navigate to the homepage. This happens even if signOut fails.
      navigate('/', { replace: true });
    };

    performLogout();
  }, [navigate]); // Add navigate to dependency array

  // Render nothing. The user will see a blank page on the /logout route for a fraction of a second.
  return null;
};

export default LogoutHandler; 