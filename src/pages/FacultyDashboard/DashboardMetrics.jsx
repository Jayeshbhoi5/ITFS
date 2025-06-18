import React from 'react';

const DashboardMetrics = ({ darkMode, dashboardMetrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
      }`}>
        <h3 className="text-xl font-semibold mb-2">Total Activities</h3>
        <p className={`text-3xl font-bold ${
          darkMode ? 'text-blue-400' : 'text-blue-600'
        }`}>
          {dashboardMetrics.totalActivities}
        </p>
      </div>
      
      <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
      }`}>
        <h3 className="text-xl font-semibold mb-2">Feedback Received</h3>
        <p className={`text-3xl font-bold ${
          darkMode ? 'text-green-400' : 'text-green-600'
        }`}>
          {dashboardMetrics.totalFeedback}
        </p>
      </div>
      
     

      <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
      }`}>
        <h3 className="text-xl font-semibold mb-2">Average Rating</h3>
        <div className="flex items-center">
          <p className={`text-3xl font-bold ${
            darkMode ? 'text-yellow-400' : 'text-yellow-600'
          }`}>
            {dashboardMetrics.averageRating.toFixed(1)}
          </p>
          <p className="text-lg ml-1 mt-1">/5</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardMetrics;