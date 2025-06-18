import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ActivityCarousel = ({ darkMode, activities }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToPrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? activities.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const isLastSlide = currentIndex === activities.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (slideIndex) => {
    if (isTransitioning || slideIndex === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(slideIndex);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Auto slide functionality
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

  // Return placeholder if no activities
  if (activities.length === 0) {
    return (
      <div className={`p-6 rounded-lg shadow-md mb-8 transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
      }`}>
        <h3 className="text-xl font-bold mb-4">Faculty Dashboard</h3>
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

  // Get previous slide index
  const getPrevIndex = () => {
    return currentIndex === 0 ? activities.length - 1 : currentIndex - 1;
  };

  // Get next slide index
  const getNextIndex = () => {
    return currentIndex === activities.length - 1 ? 0 : currentIndex + 1;
  };

  return (
    <div className="p-6 mb-8">
      <div className="relative h-80">
        {/* CAROUSEL DISPLAY AREA - with 3 visible slides */}
        <div className="relative h-full overflow-hidden">
          {/* Previous Slide */}
          <div 
            className={`absolute w-3/4 h-4/5 top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 rounded-lg transition-all duration-500 ease-in-out opacity-40 transform scale-75 z-10 ${isTransitioning ? 'blur-sm' : ''}`}
          >
            {activities[getPrevIndex()]?.image ? (
              <img 
                src={activities[getPrevIndex()].image} 
                alt={activities[getPrevIndex()].title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg">
                <div className="text-4xl opacity-50">
                  {activities[getPrevIndex()]?.title?.charAt(0) || '📊'}
                </div>
              </div>
            )}
          </div>
          
          {/* Current Slide */}
          <div 
            className={`absolute w-full max-w-xl h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-2xl z-20 transition-all duration-500 ease-in-out transform scale-100 ${isTransitioning ? 'scale-95 opacity-90' : ''}`}
          >
            {activities[currentIndex]?.image ? (
              <img 
                src={activities[currentIndex].image} 
                alt={activities[currentIndex].title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg">
                <div className="text-6xl opacity-50">
                  {activities[currentIndex]?.title?.charAt(0) || '📊'}
                </div>
              </div>
            )}
            <div className="w-full h-full flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent rounded-lg">
              <div className="p-6 text-white">
                <h4 className="text-2xl font-bold">{activities[currentIndex].title}</h4>
                <p className="mt-2">{activities[currentIndex].description}</p>
                <div className="flex justify-between mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    darkMode ? 'bg-blue-600' : 'bg-blue-500 text-white'
                  }`}>
                    {activities[currentIndex].branch}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    darkMode ? 'bg-green-600' : 'bg-green-500 text-white'
                  }`}>
                    {activities[currentIndex].year}
                  </span>
                </div>
                {activities[currentIndex].renderStars && (
                  <div className="mt-3">{activities[currentIndex].renderStars()}</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Next Slide */}
          <div 
            className={`absolute w-3/4 h-4/5 top-1/2 right-0 -translate-y-1/2 translate-x-1/4 rounded-lg transition-all duration-500 ease-in-out opacity-40 transform scale-75 z-10 ${isTransitioning ? 'blur-sm' : ''}`}
          >
            {activities[getNextIndex()]?.image ? (
              <img 
                src={activities[getNextIndex()].image} 
                alt={activities[getNextIndex()].title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg">
                <div className="text-4xl opacity-50">
                  {activities[getNextIndex()]?.title?.charAt(0) || '📊'}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Left/Right Arrows */}
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

        {/* Line texture indicator instead of dots */}
     
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center z-30">
  {activities.map((_, index) => (
    <button
      key={index}
      onClick={() => goToSlide(index)}
      className={`h-1 w-8 mx-1.5 transition-all duration-300 ${
        index === currentIndex 
          ? (darkMode ? 'bg-blue-500' : 'bg-blue-600') 
          : (darkMode ? 'bg-gray-600' : 'bg-gray-300')
      }`}
      aria-label={`Go to slide ${index + 1}`}
    />
  ))}
</div>
      </div>
    </div>
  );
};

export default ActivityCarousel;