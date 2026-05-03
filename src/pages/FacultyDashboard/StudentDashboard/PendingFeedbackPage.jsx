import React, { useState } from 'react';
import Sidebar from './StudentSidebar';
import Navbar from './Navbar';
import ProvideFeedbackPage from './ProvideFeedbackPage';

import { FaFilter, FaSearch, FaCalendarAlt, FaUser, FaChalkboardTeacher, FaThLarge, FaList } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';



// You can remove the darkMode useEffect since setDarkModeInStorage handles document updates
const PendingFeedbackPage = () => {
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedActivity, setSelectedActivity] = useState(null); // Add state to track selected activity
  const navigate = useNavigate();

  // Sample data for activities that need feedback
  const pendingActivities = [
    { 
      id: 1, 
      title: 'Workshop on IoT', 
      image: 'https://res.cloudinary.com/dxssqb6l8/image/upload/v1605293735/technologies/iot_nqf3vj.jpg', 
      description: 'Interactive session on Internet of Things', 
      branch: 'Computer Science', 
      year: '3rd Year',
      faculty: 'Prof. Sharma',
      date: '2025-02-15',
      dueDate: '2025-03-25',
      status: 'pending'
    },
    { 
      id: 2, 
      title: 'Python Programming', 
      image: 'https://res.cloudinary.com/dxssqb6l8/image/upload/v1605293735/technologies/python_ymiwtn.jpg', 
      description: 'Hands-on programming workshop', 
      branch: 'Information Technology', 
      year: '2nd Year',
      faculty: 'Prof. Mehta',
      date: '2025-02-10',
      dueDate: '2025-03-20',
      status: 'pending'
    },
    { 
      id: 3, 
      title: 'DBMS Practical', 
      image: 'https://res.cloudinary.com/dxssqb6l8/image/upload/v1605293736/technologies/database_z1qhz7.jpg', 
      description: 'Database management system practical session', 
      branch: 'Computer Science', 
      year: '2nd Year',
      faculty: 'Prof. Patel',
      date: '2025-01-25',
      dueDate: '2025-03-15',
      status: 'pending'
    },
    { 
      id: 4, 
      title: 'Circuit Design', 
      image: 'https://res.cloudinary.com/dxssqb6l8/image/upload/v1605293735/technologies/circuit_rbjqal.jpg', 
      description: 'Electronic circuit design workshop', 
      branch: 'Electronics', 
      year: '3rd Year',
      faculty: 'Prof. Gupta',
      date: '2025-01-20',
      dueDate: '2025-03-10',
      status: 'pending'
    },
    { 
      id: 5, 
      title: 'Machine Learning', 
      image: 'https://res.cloudinary.com/dxssqb6l8/image/upload/v1605293735/technologies/ml_plak1o.jpg', 
      description: 'Introduction to machine learning concepts', 
      branch: 'Computer Science', 
      year: '4th Year',
      faculty: 'Prof. Singh',
      date: '2025-01-15',
      dueDate: '2025-03-05',
      status: 'pending'
    },
  ];

const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());

// Replace your toggle function with:
const toggleDarkMode = () => {
  const newMode = !darkMode;
  setDarkMode(newMode);
  setDarkModeInStorage(newMode);
};

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleProvideFeedback = (activityId) => {
    // Find the activity by ID
    const activity = pendingActivities.find(act => act.id === activityId);
    if (activity) {
      setSelectedActivity(activity);
    }
  };

  // Filter activities based on search term and selected branch
  const filteredActivities = pendingActivities.filter(activity => {
    const matchesSearch = 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      activity.faculty.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = 
      selectedBranch === 'All' || 
      activity.branch === selectedBranch;
    
    return matchesSearch && matchesBranch;
  });

  // Calculate days remaining until due date
  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Return to activity list
  const handleBackToList = () => {
    setSelectedActivity(null);
  };

  // If an activity is selected, render the feedback form
  if (selectedActivity) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'} transition-colors duration-300`}>
        {/* Navigation Bar */}
        <Navbar 
          darkMode={darkMode} 
          toggleSidebar={toggleSidebar} 
          showProfileMenu={showProfileMenu}
          toggleProfileMenu={toggleProfileMenu}
          sidebarOpen={sidebarOpen}
        />

        {/* Content area */}
        <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} min-h-screen transition-all duration-300 ease-in-out`}>
          <div className="mb-4">
            <button 
              onClick={handleBackToList}
              className={`px-4 py-2 rounded text-sm ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              ← Back to Activities
            </button>
          </div>
          
          <ProvideFeedbackPage 
            darkMode={darkMode} 
            activity={selectedActivity} 
          />
        </div>
        
        {/* Sidebar */}
        <Sidebar 
          darkMode={darkMode} 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar}
          toggleDarkMode={toggleDarkMode} 
          activePage="pending"
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'} transition-colors duration-300`}>
      {/* Navigation Bar */}
      <Navbar 
        darkMode={darkMode} 
        toggleSidebar={toggleSidebar} 
        showProfileMenu={showProfileMenu}
        toggleProfileMenu={toggleProfileMenu}
        sidebarOpen={sidebarOpen}
      />

      {/* Content area */}
      <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} min-h-screen transition-all duration-300 ease-in-out`}>
      <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
            Pending Feedback
          </h2>
          
          {/* View mode toggle */}
          <div className={`flex items-center space-x-2 p-2 rounded-lg  ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition  ${viewMode === 'list' ? 
                (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') : 
                (darkMode ? 'text-blue-400' : 'text-blue-600')}`}
            >
              <FaList />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition ${viewMode === 'grid' ? 
                (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') : 
                (darkMode ? 'text-blue-400' : 'text-blue-600')}`}
            >
              <FaThLarge />
            </button>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="mb-6 ">
          <div className={`flex items-center p-2 rounded-md  ${
            darkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <FaSearch className="text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search activities..." 
              className={`bg-transparent border-none outline-none flex-grow ${
                darkMode ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-500'
              }`}
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        {/* Pending Activities */}
        <div className={`rounded-lg shadow-md mb-8  ${
          darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
        }`}>
          {filteredActivities.length > 0 ? (
            viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {filteredActivities.map(activity => (
                  <div 
                    key={activity.id} 
                    className={`rounded-lg overflow-hidden shadow-md transition-transform duration-300 hover:shadow-xl hover:-translate-y-1`}
                  >
                    <div className="h-40 overflow-hidden relative">
                      <img 
                        src={activity.image} 
                        alt={activity.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-red-200 text-black px-2 py-1 rounded-full text-xs flex items-center">
                        Pending
                      </div>
                    </div>
                    <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                      <h4 className="font-bold text-lg mb-1">{activity.title}</h4>
                      <p className="text-sm mb-2 line-clamp-2">{activity.description}</p>
                      <div className="flex justify-between mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          darkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {activity.branch}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          darkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                        }`}>
                          {activity.year}
                        </span>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-xs mb-2">Faculty: {activity.faculty}</p>
                        <p className="text-xs mb-2">Date: {new Date(activity.date).toLocaleDateString()}</p>
                        <p className="text-xs">Due: {new Date(activity.dueDate).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="mt-3">
                        <div className={`px-3 py-1 rounded-full text-xs inline-block ${
                          getDaysRemaining(activity.dueDate) <= 3
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : getDaysRemaining(activity.dueDate) <= 7
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {getDaysRemaining(activity.dueDate)} days remaining
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <button 
                          onClick={() => handleProvideFeedback(activity.id)}
                          className={`px-3 py-1 rounded text-xs ${
                            darkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-700 hover:bg-blue-800'
                          } text-white`}
                        >
                          Provide Feedback
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4 p-6">
                {filteredActivities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className={`rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 h-48 md:h-auto relative">
                        <img 
                          src={activity.image} 
                          alt={activity.title} 
                          className="w-full h-full object-cover"
                        />
                      <div className="absolute top-2 right-2 bg-red-200 text-black px-2 py-1 rounded-full text-xs flex items-center">
                      Pending
                        </div>
                      </div>
                      <div className="p-4 md:w-3/4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold">{activity.title}</h3>
                            <div className="flex space-x-2">
                              <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs">
                                {activity.branch}
                              </span>
                              <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                                {activity.year}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{activity.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <FaUser className="mr-2" />
                              <span>Faculty: {activity.faculty}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <FaCalendarAlt className="mr-2" />
                              <span>Date: {new Date(activity.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <FaChalkboardTeacher className="mr-2" />
                              <span>Due: {new Date(activity.dueDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className={`px-3 py-1 rounded-full text-xs ${
                            getDaysRemaining(activity.dueDate) <= 3
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : getDaysRemaining(activity.dueDate) <= 7
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {getDaysRemaining(activity.dueDate)} days remaining
                          </div>
                          <button 
                            onClick={() => handleProvideFeedback(activity.id)}
                            className={`text-sm font-medium px-4 py-2 rounded ${
                              darkMode 
                                ? 'bg-blue-700 hover:bg-blue-800 text-white'
                                : 'bg-blue-700 hover:bg-blue-800 text-white'
                            }`}
                          >
                            Provide Feedback
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center p-8">
              <p className="text-lg">No pending activities found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Sidebar */}
      <Sidebar 
        darkMode={darkMode} 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        toggleDarkMode={toggleDarkMode} 
        activePage="pending"
      />
    </div>
  );
};

export default PendingFeedbackPage;