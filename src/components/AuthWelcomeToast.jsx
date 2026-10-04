import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Toast from './Toast';

const AuthWelcomeToast = () => {
  const location = useLocation();
  const [welcomeToast, setWelcomeToast] = useState(null);
  const shownIdsRef = useRef(new Set());

  const processPendingToast = useCallback(() => {
    try {
      const raw = sessionStorage.getItem('pending_welcome_toast');
      if (raw) {
        const data = JSON.parse(raw);
        const toastId = `${data.name}_${data.timestamp || 0}`;
        if (data && data.name && Date.now() - (data.timestamp || 0) < 60000) {
          if (!shownIdsRef.current.has(toastId)) {
            shownIdsRef.current.add(toastId);
            setWelcomeToast({
              name: data.name,
              role: data.role || '',
            });
            setTimeout(() => {
              try {
                sessionStorage.removeItem('pending_welcome_toast');
              } catch (_) {}
            }, 3000);
          }
        } else {
          sessionStorage.removeItem('pending_welcome_toast');
        }
      }
    } catch (_) {
      try {
        sessionStorage.removeItem('pending_welcome_toast');
      } catch (_) {}
    }
  }, []);

  // Check on route change
  useEffect(() => {
    processPendingToast();
  }, [location.pathname, processPendingToast]);

  // Also listen for instant event from login / signup without waiting for navigation
  useEffect(() => {
    const handleAuthWelcome = (e) => {
      if (e?.detail?.name) {
        const toastId = `${e.detail.name}_${Date.now()}`;
        shownIdsRef.current.add(toastId);
        setWelcomeToast({
          name: e.detail.name,
          role: e.detail.role || '',
        });
      }
    };

    window.addEventListener('auth_welcome_toast', handleAuthWelcome);
    return () => {
      window.removeEventListener('auth_welcome_toast', handleAuthWelcome);
    };
  }, []);

  const handleClose = useCallback(() => {
    setWelcomeToast(null);
  }, []);

  if (!welcomeToast) return null;

  return (
    <Toast
      message={`Welcome back, ${welcomeToast.name}!`}
      type="info"
      onClose={handleClose}
    />
  );
};

export default AuthWelcomeToast;
