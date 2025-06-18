import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ActivityCarousel = ({ darkMode, activities }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const goToPrevious = () => {
    if (isTransitioning || activities.length <= 1) return;
    setIsTransitioning(true);
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? activities.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToNext = () => {
    if (isTransitioning || activities.length <= 1) return;
    setIsTransitioning(true);
    const isLastSlide = currentIndex === activities.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (slideIndex) => {
    if (isTransitioning || slideIndex === currentIndex || activities.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex(slideIndex);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  useEffect(() => {
    if (activities.length <= 1) return;
    
    const slideInterval = setInterval(() => {
      if (!isTransitioning) {
        const isLastSlide = currentIndex === activities.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setIsTransitioning(true);
        setCurrentIndex(newIndex);
        setTimeout(() => setIsTransitioning(false), 500);
      }
    }, 5000);

    return () => clearInterval(slideInterval);
  }, [currentIndex, activities.length, isTransitioning]);

  if (activities.length === 0) {
    return (
      <div className={`p-6 rounded-lg shadow-md mb-8 transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
      }`}>
        <h3 className="text-xl font-bold mb-4">Student Dashboard</h3>
        <div className="text-center py-8 h-64 flex flex-col items-center justify-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl mb-4 ${
            darkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <span>📊</span>
          </div>
          <p>No activities available</p>
          <p className="text-sm mt-2 text-gray-500">Activities will appear here once created</p>
        </div>
      </div>
    );
  }

  const getPrevIndex = () => {
    return currentIndex === 0 ? activities.length - 1 : currentIndex - 1;
  };

  const getNextIndex = () => {
    return currentIndex === activities.length - 1 ? 0 : currentIndex + 1;
  };

  return (
    <div className="p-6 mb-8">
      <div className="relative h-80">
        <div className="relative h-full overflow-hidden">
          {/* Previous Slide */}
          {activities.length > 1 && (
            <div className={`absolute w-3/4 h-4/5 top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 rounded-lg transition-all duration-500 ease-in-out opacity-40 transform scale-75 z-10 ${isTransitioning ? 'blur-sm' : ''}`}>
              {activities[getPrevIndex()]?.image ? (
                <div className="relative w-full h-full">
                  <img 
                    src={activities[getPrevIndex()].image} 
                    alt={activities[getPrevIndex()].title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                    <h4 className="text-lg font-bold text-white truncate">
                      {activities[getPrevIndex()].title}
                    </h4>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-white/80 truncate">
                        {activities[getPrevIndex()].faculty || 'Faculty not specified'}
                      </p>
                      <span className="text-xs px-2 py-1 rounded bg-white/20 text-white">
                        {activities[getPrevIndex()].branch || 'Branch not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-4xl opacity-50 mb-2">
                    {activities[getPrevIndex()]?.title?.charAt(0) || '📊'}
                  </div>
                  <h4 className="text-lg font-bold text-center">
                    {activities[getPrevIndex()].title}
                  </h4>
                  <p className="text-sm text-center mt-1">
                    {activities[getPrevIndex()].faculty || 'Faculty not specified'}
                  </p>
                  <p className="text-xs mt-1 px-2 py-1 rounded bg-gray-300 dark:bg-gray-600">
                    {activities[getPrevIndex()].branch || 'Branch not specified'}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Current Slide */}
          <div className={`absolute ${activities.length > 1 ? 'w-full max-w-xl' : 'w-full max-w-2xl'} h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-2xl z-20 transition-all duration-500 ease-in-out transform scale-100 ${isTransitioning ? 'scale-95 opacity-90' : ''}`}>
            {activities[currentIndex]?.image ? (
              <div className="relative w-full h-full">
                <img 
                  src={activities[currentIndex].image} 
                  alt={activities[currentIndex].title}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="text-2xl font-bold px-3 py-1 rounded-full bg-blue-500 text-white">
                      {activities[currentIndex].title}
                    </h4>
                    {activities[currentIndex].year && (
                      <span className="text-sm px-3 py-1 rounded-full bg-green-500 text-white">
                        Year: {activities[currentIndex].year}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-sm px-3 py-1 rounded-full bg-purple-500 text-white">
                      Faculty: {activities[currentIndex].faculty || 'Not specified'}
                    </p>
                    <span className="text-sm px-3 py-1 rounded-full bg-orange-500 text-white">
                      {activities[currentIndex].branch || 'Branch not specified'}
                    </span>
                  </div>
                  <p className="mt-3 text-white/80 text-sm">
                    {activities[currentIndex].description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg p-6">
                <div className="text-6xl opacity-50 mb-4">
                  {activities[currentIndex]?.title?.charAt(0) || '📊'}
                </div>
                <h4 className="text-2xl font-bold px-4 py-2 rounded-full bg-blue-500 text-white mb-3">
                  {activities[currentIndex].title}
                </h4>
                <p className="text-lg px-4 py-2 rounded-full bg-purple-500 text-white mb-2">
                  Faculty: {activities[currentIndex].faculty || 'Not specified'}
                </p>
                <p className="text-sm px-3 py-1 rounded-full bg-orange-500 text-white mb-3">
                  Branch: {activities[currentIndex].branch || 'Not specified'}
                </p>
                {activities[currentIndex].year && (
                  <p className="text-sm px-3 py-1 rounded-full bg-green-500 text-white">
                    Year: {activities[currentIndex].year}
                  </p>
                )}
                <p className="mt-4 text-sm text-center text-gray-700 dark:text-gray-300">
                  {activities[currentIndex].description}
                </p>
              </div>
            )}
          </div>
          
          {/* Next Slide */}
          {activities.length > 1 && (
            <div className={`absolute w-3/4 h-4/5 top-1/2 right-0 -translate-y-1/2 translate-x-1/4 rounded-lg transition-all duration-500 ease-in-out opacity-40 transform scale-75 z-10 ${isTransitioning ? 'blur-sm' : ''}`}>
              {activities[getNextIndex()]?.image ? (
                <div className="relative w-full h-full">
                  <img 
                    src={activities[getNextIndex()].image} 
                    alt={activities[getNextIndex()].title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                    <h4 className="text-lg font-bold text-white truncate">
                      {activities[getNextIndex()].title}
                    </h4>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-white/80 truncate">
                        {activities[getNextIndex()].faculty || 'Faculty not specified'}
                      </p>
                      <span className="text-xs px-2 py-1 rounded bg-white/20 text-white">
                        {activities[getNextIndex()].branch || 'Branch not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-4xl opacity-50 mb-2">
                    {activities[getNextIndex()]?.title?.charAt(0) || '📊'}
                  </div>
                  <h4 className="text-lg font-bold text-center">
                    {activities[getNextIndex()].title}
                  </h4>
                  <p className="text-sm text-center mt-1">
                    {activities[getNextIndex()].faculty || 'Faculty not specified'}
                  </p>
                  <p className="text-xs mt-1 px-2 py-1 rounded bg-gray-300 dark:bg-gray-600">
                    {activities[getNextIndex()].branch || 'Branch not specified'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Navigation Arrows */}
        {activities.length > 1 && (
          <>
            <FaChevronLeft 
              onClick={goToPrevious}
              className={`
                absolute top-1/2 left-2 -translate-y-1/2 z-30 text-2xl cursor-pointer
                ${darkMode ? 'text-white' : 'text-gray-800'}
                ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
            <FaChevronRight 
              onClick={goToNext}
              className={`
                absolute top-1/2 right-2 -translate-y-1/2 z-30 text-2xl cursor-pointer
                ${darkMode ? 'text-white' : 'text-gray-800'}
                ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
          </>
        )}

        {/* Slide Indicators */}
        {activities.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center z-30">
            {activities.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-0 w-8 mx-1.5 transition-all duration-300 ${
                  index === currentIndex 
                    ? (darkMode ? 'bg-blue-500' : 'bg-blue-600') 
                    : (darkMode ? 'bg-gray-600' : 'bg-gray-300')
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCarousel;