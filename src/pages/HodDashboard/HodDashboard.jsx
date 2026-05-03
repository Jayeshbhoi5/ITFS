import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useUserSession } from '../../UserSessionContext';
import { collection, onSnapshot, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import FacultyPerformance from './FacultyPerformance';
import FacultyDetailView from './FacultyDetailView';
import { getDarkModeFromStorage, setDarkModeInStorage } from '../FacultyDashboard/darkModeUtils';
import Spinner from '../../components/Spinner';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast from '../../components/Toast';

const HodDashboard = () => {
  const { user } = useUserSession();
  const location = useLocation();
  const [facultyInDept, setFacultyInDept] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('performance');
  const [selectedFacultyId, setSelectedFacultyId] = useState(null);
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [facultyToRemove, setFacultyToRemove] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (location.state?.activeView) {
      setActiveView(location.state.activeView);
      setSelectedFacultyId(null);
    }
  }, [location.state]);

  useEffect(() => {
    setDarkModeInStorage(darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  useEffect(() => {
    if (user && user.department) {
      setLoading(true);
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('role', '==', 'Faculty'),
          where('primaryDepartment', '==', user.department)
        );
        
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const departmentFaculty = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const uniqueFaculty = Array.from(new Map(departmentFaculty.map(item => [item.email, item])).values());
        setFacultyInDept(uniqueFaculty);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching faculty:", error);
      setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleRemoveClick = (facultyId) => {
    setFacultyToRemove(facultyId);
    setShowConfirmModal(true);
  };

  const confirmRemove = async () => {
    if (!facultyToRemove) return;
      try {
      const userDocRef = doc(db, 'users', facultyToRemove);
      await updateDoc(userDocRef, { primaryDepartment: '' });
      setToast({ show: true, message: 'Faculty removed successfully!', type: 'success' });
      } catch (error) {
        console.error("Error removing faculty: ", error);
      setToast({ show: true, message: 'Failed to remove faculty.', type: 'error' });
    } finally {
      setShowConfirmModal(false);
      setFacultyToRemove(null);
    }
  };

  const handleBack = () => {
    setSelectedFacultyId(null);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`min-h-full ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'} transition-colors duration-300`}>
      <Navbar 
        toggleSidebar={toggleSidebar} 
        sidebarOpen={sidebarOpen} 
        darkMode={darkMode}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar} 
          darkMode={darkMode} 
          activeView={activeView}
          setActiveView={setActiveView}
        />
        
        <main className={`flex-1 overflow-x-hidden overflow-y-auto transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}>
          <div className="p-6 pt-20">
            <div className="px-6">
              {selectedFacultyId ? (
                <>
                  <div className="flex items-center mb-4">
                  <button 
  onClick={handleBack} 
  title="Back to list" 
  className="mr-2 cursor-pointer bg-transparent border-none p-0 transition-all duration-200 hover:scale-110 focus:outline-none"
>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    className="w-8 h-8"
  >
    <path 
      d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-900 hover:text-blue-600 transition-colors duration-200"
    />
  </svg>
</button>
                    <h1 className="text-2xl font-semibold text-gray-900">Faculty Details</h1>
                  </div>
                  <FacultyDetailView facultyId={selectedFacultyId} onBack={handleBack} darkMode={darkMode} />
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {user?.department} Department Overview
                  </h1>
                  
                  {activeView === 'management' && (
                    <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                      <h2 className="text-xl font-semibold text-gray-700">Faculty Members</h2>
                      <div className="mt-4">
                        {loading ? <Spinner /> : (
                          <ul className="divide-y divide-gray-200">
                            {facultyInDept.length > 0 ? facultyInDept.map(faculty => (
                              <li key={faculty.id} className="py-4 flex justify-between items-center">
                                <div>
                                  <p className="text-lg font-medium text-gray-900">{faculty.name}</p>
                                  <p className="text-sm text-gray-500">{faculty.email}</p>
                                </div>
                                <button 
                                  onClick={() => handleRemoveClick(faculty.id)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                  Remove
                                </button>
                              </li>
                            )) : <p>No faculty members found in this department.</p>}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {activeView === 'performance' && <FacultyPerformance onSelectFaculty={setSelectedFacultyId} darkMode={darkMode} />}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmRemove}
        title="Confirm Removal"
        message="Are you sure you want to remove this faculty member from your department?"
      />
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
};

export default HodDashboard; 