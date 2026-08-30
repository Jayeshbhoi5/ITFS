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
                <div className="absolute bottom-0 left-0 right-0 p-4 rounded-b-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white bg-blue-600 px-3 py-1 rounded-full shadow-md">
                      {activities[currentIndex].faculty || activities[currentIndex].branch}
                    </span>
                    <span className="text-sm font-bold text-white bg-blue-600 px-3 py-1 rounded-full shadow-md">
                      {activities[currentIndex].year}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg p-6">
                <div className="text-6xl opacity-50 mb-4">
                  {activities[currentIndex]?.title?.charAt(0) || '📊'}
                </div>
                <div className="flex justify-between items-center mt-2 w-full">
                  <p className="text-sm font-bold text-white bg-blue-600 px-3 py-1 rounded-full shadow-md">
                    {activities[currentIndex].faculty || activities[currentIndex].branch}
                  </p>
                  <p className="text-sm font-bold text-white bg-blue-600 px-3 py-1 rounded-full shadow-md">
                    {activities[currentIndex].year}
                  </p>
                </div>
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
                style={{
                  width: index === currentIndex ? '10px' : '8px',
                  height: index === currentIndex ? '10px' : '8px',
                  borderRadius: '50%',
                  margin: '0 4px',
                  padding: 0,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                className={index === currentIndex
                  ? (darkMode ? 'bg-blue-400' : 'bg-blue-600')
                  : (darkMode ? 'bg-gray-500' : 'bg-gray-400')
                }
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