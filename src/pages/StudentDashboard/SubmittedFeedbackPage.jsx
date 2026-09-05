import React, { useState } from 'react';
import Sidebar from './StudentSidebar';
import Navbar from './Navbar';
import { FaStar, FaSearch, FaThLarge, FaList, FaCalendarAlt, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';



// You can remove the darkMode useEffect since setDarkModeInStorage handles document updates
const SubmittedFeedbackPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Sample data for activities with submitted feedback
  const submittedActivities = [
    { 
      id: 3, 
      title: 'DBMS Practical', 
      image: 'https://res.cloudinary.com/dxssqb6l8/image/upload/v1605293736/technologies/database_z1qhz7.jpg', 
      description: 'Database management system practical session', 
      branch: 'Computer Science', 
      year: '2nd Year',
      faculty: 'Prof. Patel',
      submissionDate: '12 Mar 2025',
      rating: 4.5,
      feedback: 'The practical session was very informative. The hands-on experience was valuable for understanding database concepts better.'
    },
    { 
      id: 5, 
      title: 'Machine Learning', 
      image: 'https://res.cloudinary.com/dxssqb6l8/image/upload/v1605293735/technologies/ml_plak1o.jpg', 
      description: 'Introduction to machine learning concepts', 
      branch: 'Computer Science', 
      year: '4th Year',
      faculty: 'Prof. Singh',
      submissionDate: '15 Mar 2025',
      rating: 5.0,
      feedback: 'Excellent workshop! The concepts were explained clearly with good examples. I especially enjoyed the practical implementation part.'
    },
    { 
      id: 6, 
      title: 'Web Development', 
      image: 'https://res.cloudinary.com/dxssqb6l8/image/upload/v1605293735/technologies/web_lzwcwu.jpg', 
      description: 'Frontend and backend web development basics', 
      branch: 'Information Technology', 
      year: '2nd Year',
      faculty: 'Prof. Joshi',
      submissionDate: '08 Mar 2025',
      rating: 4.0,
      feedback: 'The workshop was informative. I learned a lot about HTML, CSS, and JavaScript. The hands-on exercises were helpful, but more time for practice would have been beneficial.'
    },
    { 
      id: 7, 
      title: 'Data Structures', 
      image: 'https://res.cloudinary.com/dxssqb6l8/image/upload/v1605293735/technologies/data_h0qvyt.jpg', 
      description: 'Implementation of various data structures', 
      branch: 'Computer Science', 
      year: '2nd Year',
      faculty: 'Prof. Kumar',
      submissionDate: '05 Mar 2025',
      rating: 4.8,
      feedback: 'Great practical session! The implementation of different data structures helped me understand the concepts better. The professor was very helpful in clarifying doubts.'
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

  const handleViewFeedback = (activityId) => {
    const act = submittedActivities.find(a => a.id === activityId);
    navigate(`/viewfeedbackpage/${activityId}`, {
      state: { activity: act }
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter activities based on search term
  const filteredActivities = submittedActivities.filter(activity => 
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    activity.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    activity.faculty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to render stars based on rating
  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <FaStar 
            key={i} 
            className={`${i < Math.floor(rating) 
              ? 'text-yellow-400' 
              : i < rating 
                ? 'text-yellow-400' 
                : 'text-gray-300'
            } ${viewMode === 'grid' ? 'w-3 h-3' : 'w-4 h-4'}`}
          />
        ))}
        <span className={`ml-1 ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} transition-colors duration-300`}>
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
            Submitted Feedback
          </h2>
          
          {/* View mode toggle */}
          <div className={`flex items-center space-x-2 p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition ${viewMode === 'list' ? 
                (darkMode ? 'bg-blue-400 text-white' : 'bg-blue-600 text-white') : 
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
        
        {/* Search box */}
        <div className="mb-6">
          <div className={`flex items-center p-2 rounded-md ${
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
        
        {/* List of activities with submitted feedback */}
        <div className={`rounded-lg shadow-md mb-8 ${
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
                      <div className="absolute top-2 right-2 bg-green-200 text-black px-2 py-1 rounded-full text-xs flex items-center">
                        Completed
                      </div>
                    </div>
                    <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                      <h4 className="font-bold text-lg mb-1">{activity.title}</h4>
                      <p className="text-sm mb-2 line-clamp-2">{activity.description}</p>
                      <div className="flex justify-between mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {activity.branch}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {activity.year}
                        </span>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-xs mb-2">Faculty: {activity.faculty}</p>
                        <p className="text-xs mb-2">Submitted: {activity.submissionDate}</p>
                        <div className="flex items-center mt-1 mb-2">
                          <span className="text-xs mr-2">Your Rating:</span>
                          {renderStars(activity.rating)}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Your Feedback:</p>
                        <p className="text-xs text-gray-500 dark:text-gray-300 line-clamp-3">{activity.feedback}</p>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <button 
                          onClick={() => handleViewFeedback(activity.id)}
                          className={`px-3 py-1 rounded text-xs ${
                            darkMode ? 'bg-green-700 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'
                          } text-white`}
                        >
                          View Full Feedback
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4 p-6">
                {filteredActivities.map(activity => (
                  <div 
                    key={activity.id} 
                    className={`rounded-lg shadow overflow-hidden transition-all duration-300 hover:shadow-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 h-40 md:h-auto relative">
                        <img 
                          src={activity.image} 
                          alt={activity.title} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-green-100 text-black px-2 py-1 rounded-full text-xs">
                          Completed
                        </div>
                      </div>
                      <div className="p-4 md:w-3/4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold">{activity.title}</h3>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {activity.branch}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                            }`}>
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
                            <span>Submitted: {activity.submissionDate}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Your Rating:</span>
                            {renderStars(activity.rating)}
                          </div>
                        </div>
                        
                        <div className="border-t pt-3 mt-2 border-gray-200 dark:border-gray-600">
                          <p className="text-sm font-medium mb-1">Your Feedback:</p>
                          <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-2">
                            {activity.feedback}
                          </p>
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                          <button 
                            onClick={() => handleViewFeedback(activity.id)}
                            className={`px-4 py-2 rounded text-sm ${
                              darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'
                            } text-white`}
                          >
                            View Full Feedback
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
              <p className="text-lg">No submitted feedback found matching your criteria.</p>
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
        activePage="submitted"
      />
    </div>
  );
};

export default SubmittedFeedbackPage;