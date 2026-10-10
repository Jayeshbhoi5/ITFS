import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { ActivityCarouselEmptyState } from '../../components/EmptyActivitiesState';

// Fallback image when activity image fails or is missing
const FALLBACK_IMAGE = "https://placehold.co/600x400/lightgray/white?text=Activity";

/**
 * Check if the URL points to a PDF
 */
const isPdfUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return cleanUrl.endsWith('.pdf') || cleanUrl.includes('/pdf/') || cleanUrl.includes('.pdf');
};

/**
 * Format image URL for Cloudinary PDFs or raster images
 */
const getCarouselImageUrl = (url) => {
  if (!url || typeof url !== 'string') return FALLBACK_IMAGE;
  if (url.includes('text=No+Image') || url.includes('No%20Image') || url.toLowerCase().includes('no+image') || url.trim() === '') {
    return FALLBACK_IMAGE;
  }
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

/**
 * Student Dashboard Activity Carousel Component
 */
const ActivityCarousel = ({ darkMode, activities = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  // Navigation handlers
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

  // Auto-slide functionality (every 5s)
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

  // If no activities, render modern 3-sticker panoramic empty state
  if (activities.length === 0) {
    return (
      <div className="px-6 pt-4 pb-4 mb-8 w-full">
        <ActivityCarouselEmptyState darkMode={darkMode} className="w-full" />
      </div>
    );
  }

  const getPrevIndex = () => (currentIndex === 0 ? activities.length - 1 : currentIndex - 1);
  const getNextIndex = () => (currentIndex === activities.length - 1 ? 0 : currentIndex + 1);

  const prevActivity = activities[getPrevIndex()];
  const currentActivity = activities[currentIndex];
  const nextActivity = activities[getNextIndex()];

  return (
    <div className="px-6 pt-6 pb-1 mb-8">
      <div className="relative w-full" style={{ height: '340px', minHeight: '340px' }}>
        {/* CAROUSEL DISPLAY AREA */}
        <div className="relative w-full overflow-hidden" style={{ height: '340px' }}>
          
          {/* 1. Left (Previous) Slide */}
          {activities.length > 1 && (
            <div 
              className={`absolute w-3/4 top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 rounded-xl transition-all duration-500 ease-in-out opacity-40 transform scale-75 z-10 overflow-hidden ${
                isTransitioning ? 'blur-sm' : ''
              }`}
              style={{ height: '260px' }}
            >
              {prevActivity?.image || prevActivity?.mainImage ? (
                <div className="relative w-full h-full">
                  <img 
                    src={getCarouselImageUrl(prevActivity.image || prevActivity.mainImage)} 
                    alt={prevActivity.title || 'Previous Activity'}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_IMAGE;
                    }}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-600/40 via-slate-500/20 to-transparent rounded-b-xl">
                    <h4 className="text-sm md:text-base font-bold text-white truncate drop-shadow-md" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
                      {prevActivity.title}
                    </h4>
                    <div className="flex justify-between items-center mt-1.5">
                      <p className="text-xs text-sky-200 font-medium truncate">
                        {prevActivity.faculty || 'Faculty not specified'}
                      </p>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-900/80 border border-sky-400/30 text-white font-medium">
                        {prevActivity.branch || 'Branch not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-xl p-4">
                  <div className="text-4xl opacity-50 mb-2">
                    {prevActivity?.title?.charAt(0) || '📊'}
                  </div>
                  <h4 className="text-lg font-bold text-center">
                    {prevActivity?.title}
                  </h4>
                  <p className="text-sm text-center mt-1">
                    {prevActivity?.faculty || 'Faculty not specified'}
                  </p>
                  <p className="text-xs mt-1 px-2 py-1 rounded bg-gray-300 dark:bg-gray-600">
                    {prevActivity?.branch || 'Branch not specified'}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* 2. Center (Current Active) Slide */}
          <div 
            className={`absolute ${activities.length > 1 ? 'w-full max-w-xl' : 'w-full max-w-2xl'} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-xl z-20 transition-all duration-500 ease-in-out transform scale-100 overflow-hidden ${
              isTransitioning ? 'scale-95 opacity-90' : ''
            }`}
            style={{
              height: '316px',
              border: darkMode ? '1px solid #38bdf8' : 'none',
              boxShadow: darkMode
                ? '0 0 2px rgba(56, 189, 248, 0.55), 0 8px 20px -4px rgba(0, 0, 0, 0.5)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
          >
            {currentActivity?.image || currentActivity?.mainImage ? (
              <div className="relative w-full h-full">
                <img 
                  src={getCarouselImageUrl(currentActivity.image || currentActivity.mainImage)} 
                  alt={currentActivity.title || 'Current Activity'}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_IMAGE;
                  }}
                  className="w-full h-full object-cover rounded-2xl"
                />
                
                {/* Slide Details Overlay */}
                <div 
                  style={{ background: 'linear-gradient(to top, rgba(15, 60, 90, 0.45) 0%, rgba(15, 60, 90, 0.20) 65%, transparent 100%)' }}
                  className="absolute bottom-0 left-0 right-0 p-4 pb-6 rounded-b-2xl"
                >
                  {currentActivity?.title && (
                    <h3 className="text-base md:text-lg font-bold text-white mb-2 truncate" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
                      {currentActivity.title}
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
                      {currentActivity?.faculty || currentActivity?.branch}
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
                      {currentActivity?.year || 'Current'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-2xl p-6">
                <div className="text-6xl opacity-50 mb-4">
                  {currentActivity?.title?.charAt(0) || '📊'}
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
                    {currentActivity?.faculty || currentActivity?.branch}
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
                    {currentActivity?.year || 'Current'}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* 3. Right (Next) Slide */}
          {activities.length > 1 && (
            <div 
              className={`absolute w-3/4 top-1/2 right-0 -translate-y-1/2 translate-x-1/4 rounded-xl transition-all duration-500 ease-in-out opacity-40 transform scale-75 z-10 overflow-hidden ${
                isTransitioning ? 'blur-sm' : ''
              }`}
              style={{ height: '260px' }}
            >
              {nextActivity?.image || nextActivity?.mainImage ? (
                <div className="relative w-full h-full">
                  <img 
                    src={getCarouselImageUrl(nextActivity.image || nextActivity.mainImage)} 
                    alt={nextActivity.title || 'Next Activity'}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_IMAGE;
                    }}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div 
                    style={{ background: 'linear-gradient(to top, rgba(15, 60, 90, 0.45) 0%, rgba(15, 60, 90, 0.20) 65%, transparent 100%)' }}
                    className="absolute bottom-0 left-0 right-0 p-4 rounded-b-xl"
                  >
                    <h4 className="text-sm md:text-base font-bold text-white truncate" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
                      {nextActivity.title}
                    </h4>
                    <div className="flex justify-between items-center mt-1.5">
                      <p className="text-xs text-cyan-200 font-medium truncate" style={{ color: '#7dd3fc' }}>
                        {nextActivity.faculty || 'Faculty not specified'}
                      </p>
                      <span 
                        style={{ background: 'rgba(7, 89, 133, 0.85)', border: '1px solid rgba(125, 211, 252, 0.4)' }}
                        className="text-xs px-2.5 py-0.5 rounded-full text-white font-medium"
                      >
                        {nextActivity.branch || 'Branch not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-xl p-4">
                  <div className="text-4xl opacity-50 mb-2">
                    {nextActivity?.title?.charAt(0) || '📊'}
                  </div>
                  <h4 className="text-lg font-bold text-center">
                    {nextActivity?.title}
                  </h4>
                  <p className="text-sm text-center mt-1">
                    {nextActivity?.faculty || 'Faculty not specified'}
                  </p>
                  <p className="text-xs mt-1 px-2 py-1 rounded bg-gray-300 dark:bg-gray-600">
                    {nextActivity?.branch || 'Branch not specified'}
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

      {/* Slide Dot Indicators */}
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