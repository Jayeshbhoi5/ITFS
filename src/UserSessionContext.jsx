import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { computeCurrentYearAndAcademic } from './components/DepartmentSelectionModal';

const UserSessionContext = createContext();

const SESSION_CACHE_KEY = 'itfs_user_session';

const readCachedUser = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCachedUser = (nextUser) => {
  try {
    if (nextUser?.uid) {
      sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(nextUser));
    } else {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
};

const resolveStudentYearData = (userData, userDocRef) => {
  let effectiveYear = userData.year;
  let effectiveAcademicYear = userData.academicYear;
  const base = userData.baseYear || userData.year;
  if (base && userData.yearSelectedAt) {
    const { currentYear, academicYear } = computeCurrentYearAndAcademic(base, userData.yearSelectedAt);
    if (currentYear) {
      effectiveYear = currentYear;
    }
    if (academicYear) {
      effectiveAcademicYear = academicYear;
    }
    if ((currentYear && currentYear !== userData.year) || (academicYear && academicYear !== userData.academicYear)) {
      try {
        if (userDocRef) {
          updateDoc(userDocRef, {
            year: effectiveYear,
            academicYear: effectiveAcademicYear,
            baseYear: base
          }).catch(() => {});
        }
      } catch {}
    }
  }
  return { effectiveYear, effectiveAcademicYear };
};

export const UserSessionProvider = ({ children }) => {
  const cachedUser = readCachedUser();
  const [user, setUserState] = useState(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);

  const setUser = (nextUser) => {
    setUserState(nextUser);
    writeCachedUser(nextUser);
  };

  const refreshSession = async () => {
    const auth = getAuth();
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const updatedAuthUser = auth.currentUser;
      try {
        const userDocRef = doc(db, 'users', updatedAuthUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const isGoogleUser = updatedAuthUser.providerData.some(p => p.providerId === 'google.com');
          const preferredName = (isGoogleUser && updatedAuthUser.displayName) ? updatedAuthUser.displayName : (userData.name || userData.displayName || updatedAuthUser.displayName || '');
          const rawRole = userData.role || '';
          const normalizedRole = rawRole.toLowerCase() === 'student' ? 'Student' :
                                 rawRole.toLowerCase() === 'faculty' ? 'Faculty' :
                                 rawRole.toLowerCase() === 'hod' ? 'HOD' : rawRole;

          let effectiveYear = userData.year;
          let effectiveAcademicYear = userData.academicYear;
          if (normalizedRole === 'Student') {
            const resolved = resolveStudentYearData(userData, userDocRef);
            effectiveYear = resolved.effectiveYear;
            effectiveAcademicYear = resolved.effectiveAcademicYear;
          }

          setUser({
            uid: updatedAuthUser.uid,
            email: updatedAuthUser.email,
            emailVerified: updatedAuthUser.emailVerified,
            isGoogleUser,
            ...userData,
            role: normalizedRole,
            year: effectiveYear,
            academicYear: effectiveAcademicYear,
            name: preferredName,
            displayName: preferredName
          });
        }
      } catch (e) {
        console.error("Error refreshing session:", e);
      }
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const currentFilterUid = sessionStorage.getItem('itfs_student_filter_uid');
          if (currentFilterUid && currentFilterUid !== authUser.uid) {
            sessionStorage.removeItem('itfs_student_academic_year_filter');
            sessionStorage.removeItem('itfs_student_class_name_filter');
            sessionStorage.removeItem('itfs_student_filter_is_manual');
          }
          sessionStorage.setItem('itfs_student_filter_uid', authUser.uid);
        } catch {}

        const isGoogleUser = authUser.providerData.some(p => p.providerId === 'google.com');
        const TEST_EMAILS = ['a@kbtcoe.org', 'b@kbtcoe.org', 'jwj475.mail@gmail.com'];
        const isTestAccount = TEST_EMAILS.includes((authUser.email || '').toLowerCase());

        // Show UI immediately with auth basics; enrich from Firestore in background
        const bootstrapUser = {
          uid: authUser.uid,
          email: authUser.email,
          emailVerified: isTestAccount ? true : authUser.emailVerified,
          isGoogleUser,
          name: authUser.displayName || cachedUser?.name || '',
          displayName: authUser.displayName || cachedUser?.displayName || '',
          role: cachedUser?.role || 'Unknown',
          ...(cachedUser?.uid === authUser.uid ? cachedUser : {}),
        };
        setUser(bootstrapUser);
        setLoading(false);

        try {
          try {
            await authUser.reload();
          } catch (rErr) {
            console.warn("User reload in onAuthStateChanged:", rErr);
          }

          const userDocRef = doc(db, 'users', authUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const preferredName = (isGoogleUser && authUser.displayName) ? authUser.displayName : (userData.name || userData.displayName || authUser.displayName || '');
            
            const rawRole = userData.role || '';
            const normalizedRole = rawRole.toLowerCase() === 'student' ? 'Student' :
                                   rawRole.toLowerCase() === 'faculty' ? 'Faculty' :
                                   rawRole.toLowerCase() === 'hod' ? 'HOD' : rawRole;

            let effectiveYear = userData.year;
            let effectiveAcademicYear = userData.academicYear;
            if (normalizedRole === 'Student') {
              const resolved = resolveStudentYearData(userData, userDocRef);
              effectiveYear = resolved.effectiveYear;
              effectiveAcademicYear = resolved.effectiveAcademicYear;
            }

            setUser({
              uid: authUser.uid,
              email: authUser.email,
              emailVerified: isTestAccount ? true : authUser.emailVerified,
              isGoogleUser,
              ...userData,
              role: normalizedRole,
              year: effectiveYear,
              academicYear: effectiveAcademicYear,
              name: preferredName,
              displayName: preferredName
            });
          } else {
            setUser({
              uid: authUser.uid,
              email: authUser.email,
              emailVerified: isTestAccount ? true : authUser.emailVerified,
              isGoogleUser,
              name: authUser.displayName || '',
              displayName: authUser.displayName || '',
              role: 'Unknown'
            });
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      } else {
        try {
          sessionStorage.removeItem('itfs_student_academic_year_filter');
          sessionStorage.removeItem('itfs_student_class_name_filter');
          sessionStorage.removeItem('itfs_student_filter_is_manual');
          sessionStorage.removeItem('itfs_student_filter_uid');
        } catch {}
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const userRole = user ? user.role : null;

  return (
    <UserSessionContext.Provider value={{ user, loading, userRole, setUser, refreshSession }}>
      {children}
    </UserSessionContext.Provider>
  );
};

export const useUserSession = () => {
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error('useUserSession must be used within a UserSessionProvider');
  }
  return context;
};