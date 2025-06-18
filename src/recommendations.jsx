// src/utils/recommendations.jsx
import { useMemo } from 'react';

export const useRecommendations = (user, activities) => {
  return useMemo(() => {
    if (!user || !activities?.length) return [];
    
    return activities
      .filter(activity => {
        const branchMatch = !user.branch || activity.branch === user.branch;
        const yearMatch = !user.year || activity.year === user.year;
        return branchMatch && yearMatch;
      })
      .sort((a, b) => {
        // Sort by rating, then by due date (soonest first)
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return new Date(a.dueDate) - new Date(b.dueDate);
      })
      .slice(0, 5); // Return top 5 recommendations
  }, [user, activities]);
};