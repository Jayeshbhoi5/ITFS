import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const isPdfUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return cleanUrl.endsWith('.pdf') || cleanUrl.includes('/pdf/') || cleanUrl.includes('.pdf');
};

const getCarouselImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (isPdfUrl(url) && url.includes('cloudinary.com')) {
    let newUrl = url;
    const transform = '/image/upload/pg_1,w_800,c_limit,f_auto,q_auto/';
    if (newUrl.includes('/raw/upload/')) {
      newUrl = newUrl.replace('/raw/upload/', transform);
    } else if (newUrl.includes('/image/upload/')) {
      newUrl = newUrl.replace('/image/upload/', transform);
    } else if (newUrl.includes('/upload/')) {
      newUrl = newUrl.replace('/upload/', transform);
    }
    newUrl = newUrl.replace(/\.pdf(\?.*)?$/i, '.jpg$1');
    return newUrl;
  }
  return url;
};

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
    <div className="px-6 pt-6 pb-1 mb-8">
      <div className="relative w-full" style={{ height: '340px', minHeight: '340px' }}>
        <div className="relative w-full overflow-hidden" style={{ height: '340px' }}>
          {/* Previous Slide */}
          {activities.length > 1 && (
            <div 
              className={`absolute w-3/4 top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 rounded-xl transition-all duration-500 ease-in-out opacity-40 transform scale-75 z-10 overflow-hidden ${isTransitioning ? 'blur-sm' : ''}`}
              style={{ height: '260px' }}
            >
              {activities[getPrevIndex()]?.image || activities[getPrevIndex()]?.mainImage ? (
                <div className="relative w-full h-full">
                  <img 
                    src={getCarouselImageUrl(activities[getPrevIndex()].image || activities[getPrevIndex()].mainImage)} 
                    alt={activities[getPrevIndex()].title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60";
                    }}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-600/40 via-slate-500/20 to-transparent rounded-b-xl">
                    <h4 className="text-sm md:text-base font-bold text-white truncate drop-shadow-md" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
                      {activities[getPrevIndex()].title}
                    </h4>
                    <div className="flex justify-between items-center mt-1.5">
                      <p className="text-xs text-sky-200 font-medium truncate">
                        {activities[getPrevIndex()].faculty || 'Faculty not specified'}
                      </p>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-900/80 border border-sky-400/30 text-white font-medium">
                        {activities[getPrevIndex()].branch || 'Branch not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-xl p-4">
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
          <div 
            className={`absolute ${activities.length > 1 ? 'w-full max-w-xl' : 'w-full max-w-2xl'} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-xl z-20 transition-all duration-500 ease-in-out transform scale-100 overflow-hidden ${isTransitioning ? 'scale-95 opacity-90' : ''}`}
            style={{
              height: '316px',
              border: darkMode
                ? '1px solid #38bdf8'
                : 'none',
              boxShadow: darkMode
                ? '0 0 2px rgba(56, 189, 248, 0.55), 0 8px 20px -4px rgba(0, 0, 0, 0.5)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
          >
            {activities[currentIndex]?.image || activities[currentIndex]?.mainImage ? (
              <div className="relative w-full h-full">
                <img 
                  src={getCarouselImageUrl(activities[currentIndex].image || activities[currentIndex].mainImage)} 
                  alt={activities[currentIndex].title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60";
                  }}
                  className="w-full h-full object-cover rounded-2xl"
                />
                  <div 
                    style={{ background: 'linear-gradient(to top, rgba(15, 60, 90, 0.45) 0%, rgba(15, 60, 90, 0.20) 65%, transparent 100%)' }}
                    className="absolute bottom-0 left-0 right-0 p-4 pb-6 rounded-b-2xl"
                  >
                    {activities[currentIndex]?.title && (
                      <h3 className="text-base md:text-lg font-bold text-white mb-2 truncate" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
                        {activities[currentIndex].title}
                      </h3>
                    )}
                    <div className="flex justify-between items-center">
                      <span 
                        style={{ 
                          background: 'linear-gradient(135deg, #0284c7, #075985)', 
                          color: '#ffffff', 
                          boxShadow: '0 4px 14px rgba(7, 89, 133, 0.45)', 
                          border: '1px solid rgba(125, 211, 252, 0.5)' 
                        }}
                        className="text-xs md:text-sm font-semibold px-4 py-1 rounded-full tracking-wide"
                      >
                        {activities[currentIndex].faculty || activities[currentIndex].branch}
                      </span>
                      <span 
                        style={{ 
                          background: 'linear-gradient(135deg, #0284c7, #075985)', 
                          color: '#ffffff', 
                          boxShadow: '0 4px 14px rgba(7, 89, 133, 0.45)', 
                          border: '1px solid rgba(125, 211, 252, 0.5)' 
                        }}
                        className="text-xs md:text-sm font-semibold px-3.5 py-1 rounded-full tracking-wide"
                      >
                        {activities[currentIndex].year}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-2xl p-6">
                  <div className="text-6xl opacity-50 mb-4">
                    {activities[currentIndex]?.title?.charAt(0) || '📊'}
                  </div>
                  <div className="flex justify-between items-center mt-2 w-full">
                    <p 
                      style={{ 
                        background: 'linear-gradient(135deg, #0284c7, #075985)', 
                        color: '#ffffff', 
                        boxShadow: '0 4px 14px rgba(7, 89, 133, 0.45)', 
                        border: '1px solid rgba(125, 211, 252, 0.5)' 
                      }}
                      className="text-xs md:text-sm font-semibold px-4 py-1 rounded-full"
                    >
                      {activities[currentIndex].faculty || activities[currentIndex].branch}
                    </p>
                    <p 
                      style={{ 
                        background: 'linear-gradient(135deg, #0284c7, #075985)', 
                        color: '#ffffff', 
                        boxShadow: '0 4px 14px rgba(7, 89, 133, 0.45)', 
                        border: '1px solid rgba(125, 211, 252, 0.5)' 
                      }}
                      className="text-xs md:text-sm font-semibold px-3.5 py-1 rounded-full"
                    >
                      {activities[currentIndex].year}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Next Slide */}
            {activities.length > 1 && (
              <div 
                className={`absolute w-3/4 top-1/2 right-0 -translate-y-1/2 translate-x-1/4 rounded-xl transition-all duration-500 ease-in-out opacity-40 transform scale-75 z-10 overflow-hidden ${isTransitioning ? 'blur-sm' : ''}`}
                style={{ height: '260px' }}
              >
                {activities[getNextIndex()]?.image || activities[getNextIndex()]?.mainImage ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={getCarouselImageUrl(activities[getNextIndex()].image || activities[getNextIndex()].mainImage)} 
                      alt={activities[getNextIndex()].title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60";
                      }}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <div 
                      style={{ background: 'linear-gradient(to top, rgba(15, 60, 90, 0.45) 0%, rgba(15, 60, 90, 0.20) 65%, transparent 100%)' }}
                      className="absolute bottom-0 left-0 right-0 p-4 rounded-b-xl"
                    >
                      <h4 className="text-sm md:text-base font-bold text-white truncate" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
                        {activities[getNextIndex()].title}
                      </h4>
                      <div className="flex justify-between items-center mt-1.5">
                        <p className="text-xs text-cyan-200 font-medium truncate" style={{ color: '#7dd3fc' }}>
                          {activities[getNextIndex()].faculty || 'Faculty not specified'}
                        </p>
                        <span 
                          style={{ background: 'rgba(7, 89, 133, 0.85)', border: '1px solid rgba(125, 211, 252, 0.4)' }}
                          className="text-xs px-2.5 py-0.5 rounded-full text-white font-medium"
                        >
                          {activities[getNextIndex()].branch || 'Branch not specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-xl p-4">
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
              <button 
                onClick={goToPrevious}
                aria-label="Previous slide"
                style={{ 
                  backgroundColor: darkMode ? '#1e293b' : '#ffffff', 
                  color: darkMode ? '#38bdf8' : '#0284c7', 
                  boxShadow: darkMode ? '0 4px 14px rgba(0,0,0,0.4)' : '0 4px 14px rgba(2, 132, 199, 0.25)', 
                  border: darkMode ? '1px solid #334155' : '1px solid #e0f2fe' 
                }}
                className={`
                  absolute top-1/2 left-2 -translate-y-1/2 z-30 p-2.5 rounded-full transition-all
                  ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                `}
              >
                <FaChevronLeft className="text-sm" />
              </button>
              <button 
                onClick={goToNext}
                aria-label="Next slide"
                style={{ 
                  backgroundColor: darkMode ? '#1e293b' : '#ffffff', 
                  color: darkMode ? '#38bdf8' : '#0284c7', 
                  boxShadow: darkMode ? '0 4px 14px rgba(0,0,0,0.4)' : '0 4px 14px rgba(2, 132, 199, 0.25)', 
                  border: darkMode ? '1px solid #334155' : '1px solid #e0f2fe' 
                }}
                className={`
                  absolute top-1/2 right-2 -translate-y-1/2 z-30 p-2.5 rounded-full transition-all
                  ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                `}
              >
                <FaChevronRight className="text-sm" />
              </button>
            </>
          )}

      </div>

      {/* Slide Indicators - cleanly placed below the slides with breathing room */}
      {activities.length > 1 && (
        <div className="flex items-center justify-center space-x-1.5 mt-3">
          {activities.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: index === currentIndex ? '22px' : '7px',
                height: '7px',
                borderRadius: index === currentIndex ? '9999px' : '50%',
                padding: 0,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: index === currentIndex ? '#0284c7' : (darkMode ? '#475569' : '#bae6fd'),
                boxShadow: index === currentIndex ? '0 0 8px rgba(2, 132, 199, 0.6)' : 'none'
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityCarousel;