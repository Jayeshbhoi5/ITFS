import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FaGraduationCap,
  FaCalendarAlt,
  FaTimes,
  FaBuilding,
  FaStar,
  FaCheck,
  FaLayerGroup,
  FaInfoCircle,
} from 'react-icons/fa';

const DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Artificial Intelligence and Data Science Engineering',
  'Mechanical Engineering',
  'Instrumentation and Control Engineering',
  'Electronics and Telecommunication Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Automation and Robotics',
  'Applied Sciences & Humanities',
  'Master of Business Administration',
];

const YEARS = ['FE', 'SE', 'TE', 'BE'];

const ACADEMIC_YEARS = [
  '2024-25',
  '2025-26',
  '2026-27',
  '2027-28',
  '2028-29',
  '2029-30',
];

// Compute current year and academic year based on selection date.
export const computeCurrentYearAndAcademic = (baseYear, selectedAt) => {
  const yearOrder = ['FE', 'SE', 'TE', 'BE'];
  const now = new Date();
  const selected = selectedAt ? new Date(selectedAt) : now;

  let advances = 0;
  let nextJuly = new Date(selected.getFullYear(), 6, 1);

  if (nextJuly <= selected) {
    nextJuly = new Date(selected.getFullYear() + 1, 6, 1);
  }

  while (nextJuly <= now) {
    advances++;
    nextJuly = new Date(nextJuly.getFullYear() + 1, 6, 1);
  }

  const normalized = String(baseYear || '').trim().toUpperCase();
  let baseIndex = yearOrder.indexOf(normalized);
  if (baseIndex === -1) {
    if (normalized.includes('1') || normalized.includes('FIRST')) baseIndex = 0;
    else if (normalized.includes('2') || normalized.includes('SECOND')) baseIndex = 1;
    else if (normalized.includes('3') || normalized.includes('THIRD')) baseIndex = 2;
    else if (normalized.includes('4') || normalized.includes('FOURTH') || normalized.includes('FINAL')) baseIndex = 3;
  }

  const currentYear = baseIndex !== -1
    ? yearOrder[Math.min(baseIndex + advances, yearOrder.length - 1)]
    : (baseYear || 'FE');

  const month = now.getMonth();
  const academicStartYear =
    month >= 6 ? now.getFullYear() : now.getFullYear() - 1;

  const academicYear = `${academicStartYear}-${String(
    academicStartYear + 1
  ).slice(-2)}`;

  return { currentYear, academicYear };
};

// Get current academic year (July–June cycle).
export const getCurrentAcademicYear = () => {
  const now = new Date();
  const month = now.getMonth();

  const startYear =
    month >= 6 ? now.getFullYear() : now.getFullYear() - 1;

  return `${startYear}-${String(startYear + 1).slice(-2)}`;
};

const DepartmentSelectionModal = ({
  isOpen,
  onClose,
  onSubmit,
  userType,
  currentDepartments = [],
  currentPrimaryDepartment = '',
  currentYear = '',
  canEdit = true,
  darkMode = false,
}) => {
  const [selectedDepartments, setSelectedDepartments] =
    useState(currentDepartments);

  const [primaryDepartment, setPrimaryDepartment] = useState(
    currentPrimaryDepartment || currentDepartments[0] || ''
  );

  const [selectedYear, setSelectedYear] = useState(currentYear || '');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [isZoomedOrCompact, setIsZoomedOrCompact] = useState(false);

  // Detect browser zoom (110%+) or compact screen height
  useEffect(() => {
    const checkZoom = () => {
      const ratio =
        window.outerWidth && window.innerWidth
          ? window.outerWidth / window.innerWidth
          : 1;
      const vpScale = window.visualViewport?.scale || 1;
      const vh = window.innerHeight || 800;

      // When zoomed to 110% or more (ratio >= 1.07 or vpScale >= 1.07) or constrained screen (vh < 640)
      const zoomed = ratio >= 1.07 || vpScale >= 1.07 || vh < 640;
      setIsZoomedOrCompact(zoomed);
    };

    checkZoom();
    window.addEventListener('resize', checkZoom);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkZoom);
    }
    return () => {
      window.removeEventListener('resize', checkZoom);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkZoom);
      }
    };
  }, []);

  // Sync department selection when the modal opens or departments change.
  const departmentsKey = JSON.stringify(currentDepartments);

  useEffect(() => {
    if (isOpen) {
      setSelectedDepartments(currentDepartments);
      setPrimaryDepartment(currentPrimaryDepartment || currentDepartments[0] || '');
      setSelectedYear(currentYear || '');
      setError('');
      setConfirm(false);
    }
  }, [isOpen, departmentsKey, currentPrimaryDepartment, currentYear]);

  if (!isOpen) return null;

  // Faculty can always edit; students follow canEdit.
  const isEditable = userType === 'faculty' ? true : canEdit;

  const handleDepartmentChange = (dept) => {
    if (!isEditable) return;

    if (userType === 'student') {
      setSelectedDepartments([dept]);
    } else {
      setSelectedDepartments((prev) => {
        if (prev.includes(dept)) {
          const updated = prev.filter((d) => d !== dept);
          if (primaryDepartment === dept) {
            setPrimaryDepartment(updated[0] || '');
          }
          return updated;
        } else {
          const updated = [...prev, dept];
          if (!primaryDepartment) {
            setPrimaryDepartment(dept);
          }
          return updated;
        }
      });
    }

    setError('');
  };

  const handlePrimaryChange = (dept) => {
    if (!isEditable) return;

    setPrimaryDepartment(dept);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isEditable) return;

    if (userType === 'faculty') {
      if (!primaryDepartment) {
        setError('Please select a primary department.');
        return;
      }

      if (!selectedDepartments.includes(primaryDepartment)) {
        setError(
          'Primary department must be in your selected departments.'
        );
        return;
      }

      if (selectedDepartments.length === 0) {
        setError('Please select at least one department.');
        return;
      }
    } else {
      if (selectedDepartments.length !== 1) {
        setError('Please select your department.');
        return;
      }

      if (!selectedYear) {
        setError('Please select your current year (FE/SE/TE/BE).');
        return;
      }
    }

    setConfirm(true);
  };

  const handleFinalConfirm = () => {
    if (!isEditable) return;

    if (userType === 'faculty') {
      onSubmit({
        departments: selectedDepartments,
        primaryDepartment,
      });
    } else {
      onSubmit({
        departments: selectedDepartments,
        year: selectedYear,
        academicYear: getCurrentAcademicYear(),
        yearSelectedAt: new Date().toISOString(),
      });
    }

    setConfirm(false);
  };

  const fieldStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    color: darkMode ? '#f8fafc' : '#0f172a',
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#bae6fd',
    colorScheme: darkMode ? 'dark' : 'light',
  };

  const optionStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    color: darkMode ? '#f8fafc' : '#0f172a',
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-2.5 sm:p-4"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        backgroundColor: darkMode
          ? 'rgba(15, 23, 42, 0.75)'
          : 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        isolation: 'isolate',
      }}
    >
      <div
        className={`relative w-full max-w-5xl my-auto dept-modal-scrollbar rounded-3xl transition-all fast-scale-in ${
          darkMode ? 'dark-mode dark' : ''
        }`}
        style={{
          position: 'relative',
          zIndex: 1,
          maxHeight: isZoomedOrCompact
            ? 'min(82vh, 520px)'
            : 'calc(100vh - 2rem)',
          overflowY: isZoomedOrCompact ? 'scroll' : 'auto',
          background: darkMode
            ? 'linear-gradient(145deg, #1e293b 0%, #172033 100%)'
            : '#ffffff',
          color: darkMode ? '#f8fafc' : '#0f172a',
          border: darkMode
            ? '1px solid rgba(255, 255, 255, 0.12)'
            : '1px solid #e0f2fe',
          boxShadow: darkMode
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            : '0 25px 60px -15px rgba(2, 132, 199, 0.2), 0 0 0 1px rgba(186, 230, 253, 0.6)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-modal-title"
      >
        <div className="p-6 sm:p-7">
          {/* Header */}
          <div
            className="flex items-start justify-between pb-3.5 mb-4 border-b"
            style={{
              borderColor: darkMode
                ? 'rgba(255, 255, 255, 0.1)'
                : '#e0f2fe',
            }}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 ${
                  darkMode
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                    : 'bg-sky-50 text-sky-600 border border-sky-200 shadow-sm'
                }`}
              >
                <FaBuilding className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2
                  id="department-modal-title"
                  className="font-extrabold tracking-tight text-xl sm:text-2xl"
                  style={{
                    background: darkMode
                      ? 'linear-gradient(135deg, #ffffff 0%, #bae6fd 100%)'
                      : 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                  }}
                >
                  {isEditable
                    ? 'Select Department'
                    : 'Department Selection Locked'}
                </h2>

                <p
                  className={`mt-0.5 text-xs sm:text-sm font-medium ${
                    darkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {userType === 'faculty'
                    ? 'Select your primary department and any additional departments you teach in.'
                    : 'Select your department and academic details. You can only change this once later.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105 cursor-pointer shrink-0"
              style={{
                backgroundColor: darkMode
                  ? 'rgba(255, 255, 255, 0.06)'
                  : '#f1f5f9',
                color: darkMode ? '#cbd5e1' : '#64748b',
                border: darkMode
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid #e2e8f0',
              }}
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="mb-4 p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-shake"
              style={{
                backgroundColor: darkMode
                  ? 'rgba(239, 68, 68, 0.15)'
                  : '#fee2e2',
                color: darkMode ? '#fca5a5' : '#dc2626',
                border: darkMode
                  ? '1px solid rgba(239, 68, 68, 0.35)'
                  : '1px solid #fca5a5',
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Locked notice */}
          {!isEditable && userType === 'student' && (
            <div
              className="mb-4 p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5"
              style={{
                backgroundColor: darkMode
                  ? 'rgba(234, 179, 8, 0.12)'
                  : '#fef9c3',
                color: darkMode ? '#fde047' : '#a16207',
                border: darkMode
                  ? '1px solid rgba(234, 179, 8, 0.3)'
                  : '1px solid #fde047',
              }}
            >
              <FaInfoCircle className="w-4 h-4 shrink-0" />
              <span>
                You have already changed your department. Further changes are
                not allowed.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Section 1: Available Departments */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <FaLayerGroup
                    className={`w-3.5 h-3.5 ${
                      darkMode ? 'text-sky-400' : 'text-sky-600'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      darkMode ? 'text-sky-400' : 'text-sky-800'
                    }`}
                  >
                    Available Departments
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {userType === 'faculty' && (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: darkMode
                          ? 'rgba(56, 189, 248, 0.15)'
                          : '#e0f2fe',
                        color: darkMode ? '#38bdf8' : '#0284c7',
                        border: darkMode
                          ? '1px solid rgba(56, 189, 248, 0.3)'
                          : '1px solid #bae6fd',
                      }}
                    >
                      {selectedDepartments.length} Selected
                    </span>
                  )}
                  <span
                    className={`text-xs ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {userType === 'faculty'
                      ? 'Multiple selectable'
                      : 'Choose 1 department'}
                  </span>
                </div>
              </div>

              {/* Department Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {DEPARTMENTS.map((dept) => {
                  const isSelected = selectedDepartments.includes(dept);

                  return (
                    <div
                      key={dept}
                      role="button"
                      tabIndex={isEditable ? 0 : -1}
                      onClick={(e) => {
                        e.preventDefault();
                        handleDepartmentChange(dept);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleDepartmentChange(dept);
                        }
                      }}
                      style={{
                        borderRadius: '0.8rem',
                        padding: '0.68rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: isEditable ? 'pointer' : 'not-allowed',
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                        background: isSelected
                          ? darkMode
                            ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.22) 0%, rgba(56, 189, 248, 0.12) 100%)'
                            : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
                          : darkMode
                          ? 'rgba(255, 255, 255, 0.04)'
                          : '#ffffff',
                        color: isSelected
                          ? darkMode
                            ? '#ffffff'
                            : '#0369a1'
                          : darkMode
                          ? '#f1f5f9'
                          : '#1e293b',
                        border: isSelected
                          ? darkMode
                            ? '1.5px solid #38bdf8'
                            : '1.5px solid #0284c7'
                          : darkMode
                          ? '1px solid rgba(255, 255, 255, 0.09)'
                          : '1px solid #e2e8f0',
                        boxShadow: isSelected
                          ? darkMode
                            ? '0 3px 12px -2px rgba(56, 189, 248, 0.25)'
                            : '0 3px 10px rgba(2, 132, 199, 0.12)'
                          : 'none',
                        opacity: !isEditable && !isSelected ? 0.45 : 1,
                        transform: isSelected ? 'translateY(-1px)' : 'none',
                      }}
                      className={
                        isEditable && !isSelected
                          ? darkMode
                            ? 'hover:border-sky-400/50 hover:bg-white/[0.07] hover:-translate-y-0.5'
                            : 'hover:border-sky-300 hover:bg-sky-50/60 hover:-translate-y-0.5'
                          : ''
                      }
                    >
                      {/* Custom checkbox/radio indicator */}
                      <div
                        className="flex-shrink-0 flex items-center justify-center transition-all duration-200"
                        style={{
                          width: '19px',
                          height: '19px',
                          borderRadius:
                            userType === 'faculty' ? '5px' : '50%',
                          border: isSelected
                            ? darkMode
                              ? '1.5px solid #38bdf8'
                              : '1.5px solid #0284c7'
                            : darkMode
                            ? '1.5px solid rgba(255, 255, 255, 0.3)'
                            : '1.5px solid #94a3b8',
                          backgroundColor: isSelected
                            ? darkMode
                              ? '#0284c7'
                              : '#0284c7'
                            : 'transparent',
                        }}
                      >
                        {isSelected &&
                          (userType === 'faculty' ? (
                            <FaCheck
                              style={{
                                color: '#ffffff',
                                fontSize: '9px',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: '#ffffff',
                              }}
                            />
                          ))}
                      </div>

                      <span
                        className="text-xs sm:text-[13.5px] leading-snug select-none line-clamp-2"
                        style={{
                          fontWeight: isSelected ? 700 : 500,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {dept}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Faculty Primary Department */}
            {userType === 'faculty' && (
              <div
                className="mb-4 py-3 px-4 rounded-2xl transition-all"
                style={{
                  backgroundColor: darkMode
                    ? 'rgba(255, 255, 255, 0.03)'
                    : '#f0f9ff',
                  border: darkMode
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid #bae6fd',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FaStar className="w-3.5 h-3.5 text-amber-400" />
                  <label
                    className="font-bold text-xs sm:text-sm"
                    style={{
                      color: darkMode ? '#e2e8f0' : '#075985',
                    }}
                  >
                    Primary Department <span className="text-red-500">*</span>
                  </label>
                </div>

                <select
                  value={primaryDepartment}
                  onChange={(e) => handlePrimaryChange(e.target.value)}
                  disabled={!isEditable || selectedDepartments.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all outline-none focus:ring-2 focus:ring-sky-400/30 cursor-pointer"
                  style={fieldStyle}
                >
                  <option value="" style={optionStyle}>
                    {selectedDepartments.length === 0
                      ? 'Select at least one department above first'
                      : 'Select primary department'}
                  </option>

                  {selectedDepartments.map((dept) => (
                    <option key={dept} value={dept} style={optionStyle}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Section 2: Student Year */}
            {userType === 'student' && (
              <div
                className="mb-4 py-3 px-4 rounded-2xl"
                style={{
                  backgroundColor: darkMode
                    ? 'rgba(255, 255, 255, 0.03)'
                    : '#f0f9ff',
                  border: darkMode
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid #bae6fd',
                }}
              >
                {/* Current Year */}
                <div>
                  <label
                    className="flex items-center gap-1.5 mb-1.5 font-bold text-xs sm:text-sm"
                    style={{
                      color: darkMode ? '#e2e8f0' : '#075985',
                    }}
                  >
                    <FaGraduationCap className="text-sky-500 w-4 h-4" />
                    <span>
                      Current Year <span className="text-red-500">*</span>
                    </span>
                  </label>

                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setError('');
                    }}
                    disabled={!isEditable}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all outline-none focus:ring-2 focus:ring-sky-400/30 cursor-pointer"
                    style={fieldStyle}
                  >
                    <option value="" style={optionStyle}>
                      Select year (FE / SE / TE / BE)
                    </option>

                    {YEARS.map((yr) => (
                      <option key={yr} value={yr} style={optionStyle}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Section 3: Footer buttons */}
            <div
              className="flex justify-end items-center gap-3 pt-3.5 border-t"
              style={{
                borderColor: darkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : '#e0f2fe',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: darkMode
                    ? 'rgba(255, 255, 255, 0.08)'
                    : '#f1f5f9',
                  color: darkMode ? '#e2e8f0' : '#475569',
                  border: darkMode
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : '1px solid #cbd5e1',
                }}
              >
                Cancel
              </button>

              {isEditable && (
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:brightness-110 cursor-pointer shadow-md"
                  style={{
                    background:
                      'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                    border: '1px solid rgba(125, 211, 252, 0.4)',
                  }}
                >
                  <span>Save Details</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Confirmation Dialog */}
        {confirm && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2147483647,
              backgroundColor: 'rgba(0, 0, 0, 0.28)',
              backdropFilter: 'none',
              isolation: 'isolate',
            }}
          >
            <div
              className="rounded-3xl p-5 sm:p-6 w-full max-w-md transition-all"
              style={{
                position: 'relative',
                zIndex: 1,
                background: darkMode
                  ? 'linear-gradient(145deg, #1e293b 0%, #172033 100%)'
                  : '#ffffff',
                color: darkMode ? '#f8fafc' : '#0f172a',
                border: darkMode
                  ? '1px solid rgba(255, 255, 255, 0.15)'
                  : '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: darkMode
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 0, 0, 0.5)'
                  : '0 20px 45px -10px rgba(0, 0, 0, 0.38), 0 0 30px rgba(0, 0, 0, 0.15)',
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="department-confirm-title"
            >
              <h3
                id="department-confirm-title"
                className="text-base sm:text-lg font-bold mb-1.5"
                style={{
                  background: darkMode
                    ? 'linear-gradient(135deg, #ffffff 0%, #bae6fd 100%)'
                    : 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Confirm Department Selection
              </h3>

              <p
                className={`mb-5 text-xs sm:text-sm ${
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {userType === 'faculty'
                  ? 'Are you sure you want to update your department selection?'
                  : 'Are you sure? You can only change your department selection once later.'}
              </p>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirm(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                  style={{
                    backgroundColor: darkMode
                      ? 'rgba(255, 255, 255, 0.08)'
                      : '#f1f5f9',
                    color: darkMode ? '#e2e8f0' : '#475569',
                    border: darkMode
                      ? '1px solid rgba(255, 255, 255, 0.15)'
                      : '1px solid #cbd5e1',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  className="px-5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:brightness-110 cursor-pointer shadow-md"
                  style={{
                    background:
                      'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                    border: '1px solid rgba(125, 211, 252, 0.4)',
                  }}
                >
                  <span>Confirm</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default DepartmentSelectionModal;