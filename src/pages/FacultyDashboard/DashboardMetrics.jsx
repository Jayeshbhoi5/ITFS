import React from 'react';

const DashboardMetrics = ({ darkMode, dashboardMetrics }) => {
  const cards = [
    {
      label: 'Total Activities',
      value: dashboardMetrics.totalActivities,
      colorLight: 'text-blue-600',
      colorDark: 'text-blue-400',
      accent: 'bg-blue-50 border-blue-100',
      accentDark: 'border-gray-700',
    },
    {
      label: 'Feedback Received',
      value: dashboardMetrics.totalFeedback,
      colorLight: 'text-green-600',
      colorDark: 'text-green-400',
      accent: 'bg-green-50 border-green-100',
      accentDark: 'border-gray-700',
    },
    {
      label: 'Average Rating',
      value: `${dashboardMetrics.averageRating.toFixed(1)}/5`,
      colorLight: 'text-yellow-600',
      colorDark: 'text-yellow-400',
      accent: 'bg-yellow-50 border-yellow-100',
      accentDark: 'border-gray-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {cards.map(({ label, value, colorLight, colorDark, accent, accentDark }) => (
        <div
          key={label}
          className={`p-6 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md ${
            darkMode
              ? `bg-gray-800 text-gray-100 ${accentDark}`
              : `${accent} text-gray-800`
          }`}
        >
          <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {label}
          </h3>
          <p className={`text-4xl font-bold ${darkMode ? colorDark : colorLight}`}>
            {value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default DashboardMetrics;
