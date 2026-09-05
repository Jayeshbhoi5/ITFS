import React from 'react';
import { FaClock, FaCheckCircle, FaBook } from 'react-icons/fa';

const StudentMetrics = ({ darkMode, dashboardMetrics }) => {
  const cards = [
    {
      label: 'Pending Feedback',
      value: dashboardMetrics.pendingFeedback,
      sub: 'Activities awaiting your feedback',
      icon: FaClock,
      colorLight: 'text-red-600',
      colorDark: 'text-red-400',
      accent: 'bg-red-50 border-red-100',
    },
    {
      label: 'Feedback Submitted',
      value: dashboardMetrics.feedbackSubmitted,
      sub: "Activities you've provided feedback for",
      icon: FaCheckCircle,
      colorLight: 'text-green-600',
      colorDark: 'text-green-400',
      accent: 'bg-green-50 border-green-100',
    },
    {
      label: 'Total Activities',
      value: dashboardMetrics.totalActivities,
      sub: 'All activities assigned to you',
      icon: FaBook,
      colorLight: 'text-blue-600',
      colorDark: 'text-blue-400',
      accent: 'bg-blue-50 border-blue-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {cards.map(({ label, value, sub, icon: Icon, colorLight, colorDark, accent }) => (
        <div
          key={label}
          className={`p-6 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md ${
            darkMode
              ? 'bg-gray-800 text-gray-100 border-gray-700'
              : `${accent} text-gray-800`
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {label}
            </h3>
            <Icon className={`text-xl ${darkMode ? colorDark : colorLight}`} />
          </div>
          <p className={`text-4xl font-bold ${darkMode ? colorDark : colorLight}`}>
            {value}
          </p>
          <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">{sub}</p>
        </div>
      ))}
    </div>
  );
};

export default StudentMetrics;
