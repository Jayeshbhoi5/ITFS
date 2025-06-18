import { getAuth, signOut } from "firebase/auth";
import { app } from "../../firebaseConfig";

export const handleLogout = async (navigate) => {
  try {
    const auth = getAuth(app);
    
    // Sign out from Firebase
    await signOut(auth);
    
    // Clear authentication-related storage
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userId');
    
    // Clear session storage but preserve certain keys
    const preservedSessionKeys = [
      'appSettings', 
      'userPreferences',
      'unsavedWorkData'
    ];
    
    // Clear all cookies (except those you want to preserve)
    const preservedCookies = ['language', 'theme'];
    document.cookie.split(";").forEach((c) => {
      const cookieName = c.split("=")[0].trim();
      if (!preservedCookies.includes(cookieName)) {
        document.cookie = `${cookieName}=; expires=${new Date(0).toUTCString()}; path=/`;
      }
    });
    
    // Navigate to homepage with replace to prevent back navigation
    navigate('/', { replace: true });
    
    // Force reload to ensure clean state
    window.location.href = '/';
  } catch (error) {
    console.error("Logout Error:", error);
    // Fallback navigation in case of error
    window.location.href = '/';
  }
};