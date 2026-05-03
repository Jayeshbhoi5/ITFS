import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useUserSession } from '../../UserSessionContext';

const auth = getAuth();

const ActivityUserStatusContext = createContext(null);

export const useActivityUserStatus = () => {
  const context = useContext(ActivityUserStatusContext);
  if (!context) {
    throw new Error('useActivityUserStatus must be used within an ActivityUserStatusProvider');
  }
  return context;
};

export const ActivityUserStatusProvider = ({ children }) => {
  const [submittedActivities, setSubmittedActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserSession();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setSubmittedActivities([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for feedback changes
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let unsubscribe;

    try {
      const q = query(
        collection(db, 'feedback'),
        where('studentId', '==', userId)
      );
      
      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const activityIds = querySnapshot.docs.map(doc => doc.data().activityId);
        const uniqueActivityIds = [...new Set(activityIds)];
        setSubmittedActivities(uniqueActivityIds);
        setLoading(false);
      });
    } catch (error) {
      console.error("Error setting up feedback status listener:", error);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  const fetchSubmittedActivities = useCallback(async () => {
    try {
      if (!userId) {
        setLoading(false);
        return [];
      }
      
      setLoading(true);
      const feedbackRef = collection(db, 'feedback');
      const q = query(feedbackRef, where('studentId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const submittedIds = querySnapshot.docs.map(doc => doc.data().activityId);
      const uniqueSubmittedIds = [...new Set(submittedIds)];
      
      setSubmittedActivities(uniqueSubmittedIds);
      return uniqueSubmittedIds;
    } catch (error) {
      console.error('Error fetching submitted activities:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const submitFeedback = useCallback(async (activityId, feedbackData, isEdit = false) => {
    try {
      const user = auth.currentUser;
      console.log('Current User:', auth.currentUser);
      console.log('Feedback Data:', feedbackData);
      console.log('Is Edit Mode:', isEdit);
      if (!user) {
        throw new Error('User not authenticated');
      }
  
      // Validate user role (ensure it's a student)
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      if (!userData || userData.role !== 'Student') {
        throw new Error('Unauthorized: Only students can submit feedback');
      }
  
      // Validate activity exists
      const activityRef = doc(db, 'activities', activityId);
      const activitySnap = await getDoc(activityRef);
      if (!activitySnap.exists()) {
        throw new Error('Activity not found');
      }
  
      const activityData = activitySnap.data();
      
      // Check if feedback already exists
      const existingFeedbackQuery = query(
        collection(db, 'feedback'), 
        where('activityId', '==', activityId),
        where('studentId', '==', user.uid)
      );
      const existingFeedbackSnap = await getDocs(existingFeedbackQuery);
      
      if (!existingFeedbackSnap.empty && !isEdit) {
        throw new Error('You have already submitted feedback for this activity');
      }
      
      // If editing, update existing feedback
      if (isEdit && !existingFeedbackSnap.empty) {
        const existingFeedbackDoc = existingFeedbackSnap.docs[0];
        await updateDoc(existingFeedbackDoc.ref, {
          ...feedbackData,
          lastUpdated: serverTimestamp()
        });
        
        return { 
          success: true, 
          id: existingFeedbackDoc.id,
          message: 'Feedback updated successfully'
        };
      }
  
      // Generate a unique feedback document ID
      const feedbackRef = doc(collection(db, 'feedback'));
  
      // Prepare feedback data with server timestamp
      const completeData = {
        ...feedbackData,
        id: feedbackRef.id,
        studentId: user.uid,
        activityId,
        createdAt: serverTimestamp()
      };
  
      // Add feedback document 
      await setDoc(feedbackRef, completeData);
  
      // Update activity status
      await updateDoc(activityRef, {
        status: 'submitted',
        lastUpdated: serverTimestamp()
      });
  
      // Update local state
      setSubmittedActivities(prev => [...prev, activityId]);
  
      return { 
        success: true, 
        id: feedbackRef.id
      };
    } catch (error) {
      console.error('Detailed Error:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      return { 
        success: false, 
        error: error.message || 'Failed to submit feedback'
      };
    }
  }, []);

  const value = {
    submittedActivities,
    isActivitySubmitted: useCallback((activityId) => 
      submittedActivities.includes(activityId), 
    [submittedActivities]),
    submitFeedback,
    refreshStatus: useCallback(() => fetchSubmittedActivities(), [fetchSubmittedActivities]),
    loading
  };

  return (
    <ActivityUserStatusContext.Provider value={value}>
      {children}
    </ActivityUserStatusContext.Provider>
  );
};

export default ActivityUserStatusProvider;