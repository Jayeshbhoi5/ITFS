import React, { useState } from 'react';
import { FaClock, FaCheckCircle, FaBook, FaStar } from 'react-icons/fa';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import AllActivitiesPage from './AllActivitiesPage';


// You can remove the darkMode useEffect since setDarkModeInStorage handles document updates
const StudentMetrics = ({ darkMode, dashboardMetrics }) => {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold">Pending Feedback</h3>
          <FaClock className={`text-2xl ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
        </div>
        <p className={`text-3xl font-bold ${
          darkMode ? 'text-red-400' : 'text-red-600'
        }`}>
          {dashboardMetrics.pendingFeedback}
        </p>
        <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
          Activities awaiting your feedback
        </p>
      </div>
      
      <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold">Feedback Submitted</h3>
          <FaCheckCircle className={`text-2xl ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
        </div>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
          {dashboardMetrics.feedbackSubmitted}
        </p>
        <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
          Activities you've provided feedback for
        </p>
      </div>
      
      <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold">Total Activities</h3>
          <FaBook className={`text-2xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <p className={`text-3xl font-bold ${
          darkMode ? 'text-blue-400' : 'text-blue-600'
        }`}>
          {dashboardMetrics.totalActivities}
        </p>
        <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
          All activities assigned to you
        </p>
      </div>
      
      
    </div>
  );
};

export default StudentMetrics;