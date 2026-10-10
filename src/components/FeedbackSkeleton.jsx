import React from 'react';
import { FaRegImage } from 'react-icons/fa';

/**
 * Soft Shimmer Skeleton Styles
 * Pure CSS wave effect sweeping from left to right across gentle, light-shaded elements without harsh outlines.
 */
export const SkeletonStyles = () => (
  <style>{`
    @keyframes itfs-shimmer-sweep {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
    .itfs-bone {
      position: relative;
      overflow: hidden;
      background-color: #e2e8f0; /* Gentle light slate - soft shade, not dark */
      border: none !important;
      outline: none !important;
    }
    .itfs-bone::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.65) 50%,
        rgba(255, 255, 255, 0) 100%
      );
      animation: itfs-shimmer-sweep 1.6s infinite ease-in-out;
      pointer-events: none;
    }
    .dark .itfs-bone {
      background-color: #334155; /* Soft slate-700 in dark mode */
      border: none !important;
      outline: none !important;
    }
    .dark .itfs-bone::after {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.16) 50%,
        rgba(255, 255, 255, 0) 100%
      );
    }

    .itfs-bone-subtle {
      position: relative;
      overflow: hidden;
      background-color: #edf2f7; /* Soft light gray - subtle secondary shade */
      border: none !important;
      outline: none !important;
    }
    .itfs-bone-subtle::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.55) 50%,
        rgba(255, 255, 255, 0) 100%
      );
      animation: itfs-shimmer-sweep 1.6s infinite ease-in-out;
      pointer-events: none;
    }
    .dark .itfs-bone-subtle {
      background-color: #242d3d;
      border: none !important;
      outline: none !important;
    }
    .dark .itfs-bone-subtle::after {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.12) 50%,
        rgba(255, 255, 255, 0) 100%
      );
    }
  `}</style>
);

/**
 * Skeleton for Activity List rows (Faculty StudentFeedback & Student AllActivities)
 */
export const ActivityListSkeleton = ({ count = 5, darkMode = false }) => {
  return (
    <div className="space-y-3 px-3 py-3 w-full animate-fade-in">
      <SkeletonStyles />
      {[...Array(count)].map((_, idx) => (
        <div
          key={idx}
          className={`p-4 rounded-2xl border transition-all duration-200 ${
            darkMode
              ? 'bg-gray-800/80 border-gray-700/70 shadow-[0_4px_14px_rgba(0,0,0,0.3)]'
              : 'bg-white border-slate-200/90 shadow-[0_4px_14px_rgba(2,132,199,0.06)]'
          }`}
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2.5">
              {/* Heading line */}
              <div
                className="h-5 sm:h-6 rounded-lg itfs-bone"
                style={{ width: `${72 + ((idx % 3) * 10)}%` }}
              />
              {/* Department badge line */}
              <div
                className="h-4 rounded-md itfs-bone-subtle"
                style={{ width: '45%' }}
              />
              {/* Text lines */}
              <div className="space-y-1.5 pt-1">
                <div className="h-3 w-full rounded itfs-bone-subtle" />
                <div className="h-3 w-4/5 rounded itfs-bone-subtle" />
              </div>
            </div>
            {/* Status pill */}
            <div className="h-6 w-16 rounded-full itfs-bone flex-shrink-0" />
          </div>

          {/* Footer: Date & Rating block */}
          <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-slate-100 dark:border-gray-700/60">
            <div className="h-4 w-24 rounded itfs-bone-subtle" />
            {/* Rating badge */}
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full itfs-bone" />
              <div className="h-4 w-12 rounded itfs-bone" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for Faculty reviewing Student Feedback detail panel
 * Features: Soft light shade, clean image block without text, prominent rating, and comment cards
 */
export const FeedbackDetailSkeleton = ({ darkMode = false }) => {
  return (
    <div className="w-full flex-1 flex flex-col p-5 sm:p-6 space-y-6 animate-fade-in">
      <SkeletonStyles />

      {/* Hero Header Skeleton */}
      <div
        className={`p-6 sm:p-7 rounded-2xl border ${
          darkMode
            ? 'bg-gray-800/80 border-gray-700/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
            : 'bg-white border-slate-200/90 shadow-[0_8px_24px_rgba(2,132,199,0.08)]'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 space-y-4 w-full">
            {/* Badge pills */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-24 rounded-full itfs-bone" />
              <div className="h-6 w-20 rounded-full itfs-bone-subtle" />
              <div className="h-6 w-20 rounded-full itfs-bone-subtle" />
            </div>

            {/* Bold Heading */}
            <div className="h-8 sm:h-9 w-5/6 rounded-xl itfs-bone" />

            {/* 3 Text Lines */}
            <div className="space-y-2 pt-1">
              <div className="h-3.5 w-full rounded-md itfs-bone-subtle" />
              <div className="h-3.5 w-11/12 rounded-md itfs-bone-subtle" />
              <div className="h-3.5 w-3/4 rounded-md itfs-bone-subtle" />
            </div>
          </div>

          {/* Clean Image Block placeholder (no loading text, no harsh outline) */}
          <div
            className="w-full md:w-60 h-40 sm:h-44 rounded-2xl itfs-bone flex-shrink-0 flex items-center justify-center shadow-xs"
          >
            <FaRegImage className="w-10 h-10 text-slate-400 dark:text-gray-500 opacity-60" />
          </div>
        </div>

        {/* Rating Block */}
        <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-gray-700/60">
          <div className="flex items-center gap-2">
            {/* Rating Stars row */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-md itfs-bone"
                />
              ))}
            </div>
            {/* Big Rating Number */}
            <div className="h-7 w-14 rounded-lg itfs-bone" />
          </div>

          <div className="h-4 w-32 rounded itfs-bone-subtle" />
        </div>
      </div>

      {/* Ratings distribution breakdown card */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border ${
          darkMode
            ? 'bg-gray-800/80 border-gray-700/80 shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
            : 'bg-white border-slate-200/90 shadow-[0_4px_16px_rgba(2,132,199,0.06)]'
        }`}
      >
        <div className="h-6 w-48 rounded-lg itfs-bone mb-4" />
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((r) => (
            <div key={r} className="flex items-center gap-3">
              <div className="h-4 w-4 rounded itfs-bone" />
              <div className="flex-1 h-3.5 rounded-full itfs-bone-subtle" />
              <div className="h-3.5 w-8 rounded itfs-bone" />
            </div>
          ))}
        </div>
      </div>

      {/* Student comment cards */}
      <div className="space-y-4">
        <div className="h-6 w-52 rounded-lg itfs-bone" />
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-2xl border ${
              darkMode
                ? 'bg-gray-800/80 border-gray-700/80 shadow-[0_4px_12px_rgba(0,0,0,0.25)]'
                : 'bg-white border-slate-200/90 shadow-[0_4px_12px_rgba(2,132,199,0.05)]'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Circular Avatar Bone */}
              <div className="w-12 h-12 rounded-full itfs-bone flex-shrink-0" />

              {/* Right column: Heading bar + 3 Text lines */}
              <div className="flex-1 space-y-2.5 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-5 w-44 sm:w-56 rounded-md itfs-bone" />
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, s) => (
                      <div key={s} className="w-4 h-4 rounded-sm itfs-bone" />
                    ))}
                  </div>
                </div>

                {/* 3 Text lines underneath */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="h-3.5 w-full rounded-md itfs-bone-subtle" />
                  <div className="h-3.5 w-11/12 rounded-md itfs-bone-subtle" />
                  <div className="h-3.5 w-3/4 rounded-md itfs-bone-subtle" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for Student Provide Feedback page
 */
export const ProvideFeedbackSkeleton = ({ darkMode = false }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in w-full">
      <SkeletonStyles />

      {/* Activity Card */}
      <div
        className={`p-6 sm:p-7 rounded-2xl border ${
          darkMode
            ? 'bg-gray-800/80 border-gray-700/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
            : 'bg-white border-slate-200/90 shadow-[0_8px_24px_rgba(2,132,199,0.08)]'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Image Block (no text, no harsh outline) */}
          <div
            className="w-full md:w-64 h-44 sm:h-48 rounded-2xl itfs-bone flex-shrink-0 flex items-center justify-center shadow-xs"
          >
            <FaRegImage className="w-10 h-10 text-slate-400 dark:text-gray-500 opacity-60" />
          </div>

          <div className="flex-1 space-y-3.5 w-full">
            <div className="flex items-center gap-2">
              <div className="h-6 w-28 rounded-full itfs-bone" />
              <div className="h-6 w-20 rounded-full itfs-bone-subtle" />
            </div>
            <div className="h-8 sm:h-9 w-5/6 rounded-xl itfs-bone" />
            <div className="space-y-2 pt-1">
              <div className="h-3.5 w-full rounded-md itfs-bone-subtle" />
              <div className="h-3.5 w-5/6 rounded-md itfs-bone-subtle" />
              <div className="h-3.5 w-2/3 rounded-md itfs-bone-subtle" />
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Form */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border space-y-6 ${
          darkMode
            ? 'bg-gray-800/80 border-gray-700/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
            : 'bg-white border-slate-200/90 shadow-[0_8px_24px_rgba(2,132,199,0.08)]'
        }`}
      >
        <div className="h-7 w-60 rounded-xl itfs-bone" />

        {/* 4 Rating Criteria Rows */}
        <div className="space-y-4 pt-1">
          {['Overall Experience', 'Understandability', 'Engagement', 'Relevance'].map((cat, i) => (
            <div
              key={i}
              className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                darkMode ? 'bg-gray-800/60 border-gray-700/60' : 'bg-slate-50/80 border-slate-200/80'
              }`}
            >
              <div className="space-y-1.5">
                <div className="h-5 w-44 rounded-lg itfs-bone" />
                <div className="h-3.5 w-56 rounded itfs-bone-subtle" />
              </div>
              <div className="flex items-center gap-2.5">
                {[...Array(5)].map((_, s) => (
                  <div
                    key={s}
                    className="w-9 h-9 rounded-xl itfs-bone"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comment textarea field placeholder */}
        <div className="space-y-2.5 pt-2">
          <div className="h-5 w-40 rounded-md itfs-bone" />
          <div
            className="w-full h-32 rounded-2xl itfs-bone"
          />
        </div>

        {/* Submit button placeholder */}
        <div className="flex justify-end pt-2">
          <div className="h-12 w-44 rounded-xl itfs-bone shadow-sm" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for Student View Feedback page
 */
export const ViewFeedbackSkeleton = ({ darkMode = false }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in w-full">
      <SkeletonStyles />

      {/* Top Activity Card */}
      <div
        className={`p-6 sm:p-7 rounded-2xl border ${
          darkMode
            ? 'bg-gray-800/80 border-gray-700/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
            : 'bg-white border-slate-200/90 shadow-[0_8px_24px_rgba(2,132,199,0.08)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div
            className="w-full sm:w-60 h-40 sm:h-44 rounded-2xl itfs-bone flex-shrink-0 flex items-center justify-center shadow-xs"
          >
            <FaRegImage className="w-10 h-10 text-slate-400 dark:text-gray-500 opacity-60" />
          </div>
          <div className="flex-1 space-y-3.5 w-full">
            <div className="h-8 sm:h-9 w-4/5 rounded-xl itfs-bone" />
            <div className="space-y-2 pt-1">
              <div className="h-3.5 w-full rounded-md itfs-bone-subtle" />
              <div className="h-3.5 w-5/6 rounded-md itfs-bone-subtle" />
              <div className="h-3.5 w-2/3 rounded-md itfs-bone-subtle" />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <div className="h-6 w-28 rounded-full itfs-bone" />
              <div className="h-6 w-24 rounded-full itfs-bone-subtle" />
            </div>
          </div>
        </div>
      </div>

      {/* Review Details Card */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border space-y-6 ${
          darkMode
            ? 'bg-gray-800/80 border-gray-700/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
            : 'bg-white border-slate-200/90 shadow-[0_8px_24px_rgba(2,132,199,0.08)]'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="h-7 w-52 rounded-xl itfs-bone" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-md itfs-bone" />
              ))}
            </div>
            <div className="h-7 w-12 rounded-lg itfs-bone" />
          </div>
        </div>

        {/* 4 Ratings criteria blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`p-4.5 rounded-2xl border space-y-2.5 ${
                darkMode ? 'bg-gray-800/60 border-gray-700/60' : 'bg-slate-50/80 border-slate-200/80'
              }`}
            >
              <div className="h-4 w-36 rounded-md itfs-bone" />
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, s) => (
                  <div key={s} className="w-4.5 h-4.5 rounded-sm itfs-bone" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comments section */}
        <div className="space-y-2.5 pt-2">
          <div className="h-5 w-40 rounded-md itfs-bone" />
          <div className={`p-5 rounded-2xl border space-y-2.5 ${darkMode ? 'bg-gray-800/60 border-gray-700/60' : 'bg-slate-50/80 border-slate-200/80'}`}>
            <div className="h-3.5 w-full rounded itfs-bone-subtle" />
            <div className="h-3.5 w-11/12 rounded itfs-bone-subtle" />
            <div className="h-3.5 w-3/4 rounded itfs-bone-subtle" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for Faculty Dashboard
 * Features:
 * - Header: Big "Faculty Dashboard" title + Overall Rating Badge
 * - Big Hero Carousel: soft light shaded image block (no text, no harsh outline), title, ratings, 3-line description
 * - 4 Metric Cards: with icon circle, big number, label
 * - 3 Summary Cards: Top Rated, Recent Feedback, and Distribution
 */
/**
 * Skeleton for Activity Carousel
 * Matches the exact 3-slide panoramic carousel geometry:
 * - Center active hero slide with overlay title & badge placeholders
 * - Left & Right flanking slide placeholders
 * - Dot indicators below
 */
export const ActivityCarouselSkeleton = ({ darkMode = false }) => {
  return (
    <div className="px-6 pt-4 pb-1 mb-2 w-full">
      <div className="relative w-full" style={{ height: '340px', minHeight: '340px' }}>
        {/* CAROUSEL DISPLAY AREA */}
        <div className="relative w-full overflow-hidden" style={{ height: '340px' }}>
          
          {/* 1. Left (Previous) Slide Placeholder */}
          <div 
            className="absolute w-3/4 top-1/2 left-0 rounded-xl opacity-40 z-10 overflow-hidden"
            style={{ 
              height: '260px',
              transform: 'translate(-25%, -50%) scale(0.75)',
              transformOrigin: 'center center'
            }}
          >
            <div className="w-full h-full itfs-bone rounded-xl relative overflow-hidden" />
          </div>
          
          {/* 2. Center (Current Active) Hero Slide Placeholder */}
          <div 
            className={`absolute w-full max-w-xl top-1/2 left-1/2 rounded-2xl z-20 overflow-hidden itfs-bone flex flex-col justify-end ${
              darkMode ? 'border border-sky-400/20' : 'border border-sky-100/80'
            }`}
            style={{
              height: '316px',
              transform: 'translate(-50%, -50%)',
              transformOrigin: 'center center',
              boxShadow: darkMode
                ? '0 0 2px rgba(56, 189, 248, 0.3), 0 8px 20px -4px rgba(0, 0, 0, 0.4)'
                : '0 8px 20px -4px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
            }}
          >
            {/* Center icon aura */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <FaRegImage className="w-12 h-12 text-slate-400 dark:text-gray-400" />
            </div>

            {/* Slide Details Overlay - Soft subtle shadow gradient */}
            <div 
              style={{ 
                background: darkMode 
                  ? 'linear-gradient(to top, rgba(3, 25, 41, 0.55) 0%, rgba(3, 25, 41, 0.18) 60%, transparent 100%)' 
                  : 'linear-gradient(to top, rgba(15, 45, 75, 0.22) 0%, rgba(15, 45, 75, 0.06) 60%, transparent 100%)' 
              }}
              className="relative z-10 p-4 pb-5 rounded-b-2xl w-full"
            >
              {/* Row 1: Title */}
              <div className="h-4 w-3/5 rounded-md itfs-bone-subtle opacity-75 mb-2.5" />
              
              {/* Row 2: Badges (branch, rating/faculty, year) - soft & subtle */}
              <div className="flex items-center justify-between gap-2">
                <div className="h-5 w-20 rounded-full itfs-bone-subtle opacity-60" />
                <div className="h-5 w-20 rounded-full itfs-bone-subtle opacity-60" />
                <div className="h-5 w-14 rounded-full itfs-bone-subtle opacity-60" />
              </div>
            </div>
          </div>
          
          {/* 3. Right (Next) Slide Placeholder */}
          <div 
            className="absolute w-3/4 top-1/2 right-0 rounded-xl opacity-35 z-10 overflow-hidden"
            style={{ 
              height: '260px',
              transform: 'translate(25%, -50%) scale(0.75)',
              transformOrigin: 'center center'
            }}
          >
            <div className="w-full h-full itfs-bone rounded-xl relative overflow-hidden" />
          </div>
        </div>
      </div>

      {/* Slide Dot Indicators */}
      <div className="flex items-center justify-center space-x-1.5 mt-3">
        <div className="w-6 h-2 rounded-full itfs-bone" />
        <div className="w-2 h-2 rounded-full itfs-bone-subtle" />
        <div className="w-2 h-2 rounded-full itfs-bone-subtle" />
      </div>
    </div>
  );
};

export const FacultyDashboardSkeleton = ({ darkMode = false }) => {
  return (
    <div className="w-full animate-fade-in">
      <SkeletonStyles />

      {/* Top Header: Title + Overall Rating Badge */}
      <div className="flex justify-between items-center mb-4">
        {/* BIG Heading */}
        <div className="h-8 w-60 rounded-lg itfs-bone" />

        {/* Overall Rating Badge */}
        <div
          className={`px-4 py-2 rounded-lg border flex items-center gap-2.5 ${
            darkMode
              ? 'bg-gray-800 border-gray-700/80 shadow-sm'
              : 'bg-gray-100 border-gray-200/80 shadow-sm'
          }`}
        >
          <div className="h-4 w-24 rounded itfs-bone-subtle" />
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-3.5 h-3.5 rounded-sm itfs-bone" />
            ))}
          </div>
          <div className="h-5 w-7 rounded-md itfs-bone" />
        </div>
      </div>

      {/* Hero Activity Carousel Skeleton with 3-Slide Panoramic Placement */}
      <div className="mb-3">
        <ActivityCarouselSkeleton darkMode={darkMode} />
      </div>

      {/* 3 Dashboard Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-xl border shadow-sm transition-all ${
              darkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="h-3.5 w-32 rounded-md itfs-bone-subtle mb-3" />
            <div className="h-9 w-20 rounded-lg itfs-bone" />
          </div>
        ))}
      </div>

      {/* Feedback Summary (3 Columns) */}
      <div className="space-y-4 pt-2">
        <div className="h-7 w-52 rounded-xl itfs-bone" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {[...Array(3)].map((_, colIdx) => (
            <div
              key={colIdx}
              className={`p-6 rounded-2xl border space-y-4 ${
                darkMode
                  ? 'bg-gray-800/80 border-gray-700/80 shadow-[0_4px_16px_rgba(0,0,0,0.25)]'
                  : 'bg-white border-slate-200/90 shadow-[0_4px_16px_rgba(2,132,199,0.06)]'
              }`}
            >
              <div className="h-5 w-40 rounded-lg itfs-bone mb-2" />
              {[...Array(3)].map((_, itemIdx) => (
                <div
                  key={itemIdx}
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-slate-50/80 border-slate-200/70'
                  }`}
                >
                  <div className="h-4 w-4/5 rounded-md itfs-bone" />
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-3.5 w-20 rounded itfs-bone-subtle" />
                    <div className="h-3.5 w-12 rounded itfs-bone-subtle" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for All Activities Page (Student Dashboard)
 * Features image blocks in both Card View and List View layouts.
 */
export const AllActivitiesSkeleton = ({ viewMode = 'card', count = 6, darkMode = false }) => {
  return (
    <div className="w-full animate-fade-in">
      <SkeletonStyles />
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(count)].map((_, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                darkMode
                  ? 'bg-gray-800/80 border-gray-700/80 shadow-[0_4px_14px_rgba(0,0,0,0.3)]'
                  : 'bg-white border-slate-200/90 shadow-[0_4px_14px_rgba(2,132,199,0.06)]'
              }`}
            >
              {/* IMAGE BLOCK - Soft, clean placeholder with icon, no text, no harsh outline */}
              <div className="w-full h-44 rounded-xl itfs-bone flex items-center justify-center mb-4 shadow-2xs">
                <FaRegImage className="w-9 h-9 text-slate-400 dark:text-gray-500 opacity-60" />
              </div>

              {/* Badges row */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-20 rounded-full itfs-bone" />
                <div className="h-5 w-24 rounded-full itfs-bone-subtle" />
              </div>

              {/* Title */}
              <div className="h-6 w-4/5 rounded-lg itfs-bone mb-2.5" />

              {/* Description lines */}
              <div className="space-y-1.5 mb-4">
                <div className="h-3 w-full rounded itfs-bone-subtle" />
                <div className="h-3 w-3/4 rounded itfs-bone-subtle" />
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-gray-700/60 flex items-center justify-between">
                <div className="h-4 w-24 rounded itfs-bone-subtle" />
                <div className="h-8 w-28 rounded-xl itfs-bone" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {[...Array(count)].map((_, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center gap-4 transition-all ${
                darkMode
                  ? 'bg-gray-800/80 border-gray-700/80 shadow-[0_4px_14px_rgba(0,0,0,0.3)]'
                  : 'bg-white border-slate-200/90 shadow-[0_4px_14px_rgba(2,132,199,0.06)]'
              }`}
            >
              {/* IMAGE BLOCK on the left */}
              <div className="w-full md:w-52 h-40 rounded-xl itfs-bone flex-shrink-0 flex items-center justify-center shadow-2xs">
                <FaRegImage className="w-9 h-9 text-slate-400 dark:text-gray-500 opacity-60" />
              </div>

              {/* Details on the right */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-20 rounded-full itfs-bone" />
                  <div className="h-5 w-24 rounded-full itfs-bone-subtle" />
                </div>
                <div className="h-6 w-3/4 rounded-lg itfs-bone" />
                <div className="space-y-1.5">
                  <div className="h-3 w-full rounded itfs-bone-subtle" />
                  <div className="h-3 w-4/5 rounded itfs-bone-subtle" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-gray-700/60">
                  <div className="h-4 w-28 rounded itfs-bone-subtle" />
                  <div className="h-8 w-32 rounded-xl itfs-bone" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Skeleton for Student Dashboard
 * Features:
 * - 3-Slide Panoramic Activity Carousel skeleton matching real carousel
 * - 3 Metric cards skeleton
 */
export const StudentDashboardSkeleton = ({ darkMode = false }) => {
  return (
    <div className="w-full space-y-7 animate-fade-in">
      <SkeletonStyles />

      {/* Hero Activity Carousel Skeleton with 3-Slide Panoramic Placement */}
      <div className="mb-3">
        <ActivityCarouselSkeleton darkMode={darkMode} />
      </div>

      {/* 3 Dashboard Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-xl border shadow-sm transition-all ${
              darkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-3.5 w-32 rounded-md itfs-bone-subtle" />
              <div className="w-5 h-5 rounded-md itfs-bone" />
            </div>
            <div className="h-9 w-20 rounded-lg itfs-bone mb-2" />
            <div className="h-3.5 w-44 rounded itfs-bone-subtle" />
          </div>
        ))}
      </div>
    </div>
  );
};


