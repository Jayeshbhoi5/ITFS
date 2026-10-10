import React, { createContext, useState, useContext, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useUserSession } from '../../UserSessionContext';

const ActivityContext = createContext();

export const ActivityProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserSession();

  // Real-time updates for activities
  useEffect(() => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    if (user.role === 'Student' && (!user.departments || user.departments.length === 0)) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe;
    
    try {
      if (user.role === 'Faculty') {
        // Faculty only sees their own activities
        const q = query(
          collection(db, 'activities'),
          where('facultyId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedActivities = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setActivities(fetchedActivities);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching faculty activities:", error);
          setLoading(false);
        });
      } 
      else if (user.role === 'Student') {
        // Students see activities for any of their departments
        const q = query(
          collection(db, 'activities'),
          where('departments', 'array-contains-any', user.departments),
          orderBy('createdAt', 'desc')
        );
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedActivities = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setActivities(fetchedActivities);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching student activities:", error);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error setting up real-time listener:", error);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const addActivity = async (newActivity) => {
    if (!user || user.role !== 'Faculty') {
      throw new Error('Only faculty can add activities');
    }

    try {
      // Add to Firestore first
      const docRef = await addDoc(collection(db, 'activities'), {
        ...newActivity,
        facultyId: user.uid,
        facultyName: user.name,
        createdAt: serverTimestamp()
      });

      // Then update local state
      setActivities(prev => [...prev, {
        id: docRef.id,
        ...newActivity
      }]);
      
      return docRef.id;
    } catch (error) {
      console.error("Error adding activity:", error);
      throw error;
    }
  };

  const verifyActivityOwnership = (activityId) => {
    if (!user) return false;
    const activity = activities.find(a => a.id === activityId);
    return activity?.facultyId === user.uid;
  };

  return (
    <ActivityContext.Provider value={{ 
      activities, 
      loading,
      addActivity,
      verifyActivityOwnership
    }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivities = () => useContext(ActivityContext);