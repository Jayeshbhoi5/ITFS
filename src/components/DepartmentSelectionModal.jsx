import React, { useState } from 'react';

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
  'Master of Business Administration'
];

const YEARS = ['FE', 'SE', 'TE', 'BE'];
const ACADEMIC_YEARS = ['2024-25','2025-26','2026-27','2027-28','2028-29','2029-30'];

// Given a base year (e.g. 'TE') and the date it was selected,
// compute the current effective year and academic year as of today.
// Advances by one step each July 1.
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

  const baseIndex = yearOrder.indexOf(baseYear);
  const currentIndex = Math.min(baseIndex + advances, yearOrder.length - 1);
  const currentYear = yearOrder[currentIndex];

  const month = now.getMonth();
  const academicStartYear = month >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const academicYear = `${academicStartYear}-${String(academicStartYear + 1).slice(-2)}`;

  return { currentYear, academicYear };
};

// Compute current academic year from today's date (July–June cycle)
const getCurrentAcademicYear = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-based; July = 6
  const startYear = month >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
};

const DepartmentSelectionModal = ({
  isOpen,
  onClose,
  onSubmit,
  userType, // 'faculty' or 'student'
  currentDepartments = [],
  canEdit = true // For faculty, this should always be true
}) => {
  const [selectedDepartments, setSelectedDepartments] = useState(currentDepartments);
  const [primaryDepartment, setPrimaryDepartment] = useState(currentDepartments[0] || '');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(getCurrentAcademicYear());
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  if (!isOpen) return null;

  // Override canEdit for faculty
  const isEditable = userType === 'faculty' ? true : canEdit;

  const handleDepartmentChange = (dept) => {
    if (userType === 'student') {
      setSelectedDepartments([dept]);
    } else {
      // faculty: allow multiple
      if (selectedDepartments.includes(dept)) {
        setSelectedDepartments(selectedDepartments.filter(d => d !== dept));
        if (primaryDepartment === dept) setPrimaryDepartment('');
      } else {
        setSelectedDepartments([...selectedDepartments, dept]);
      }
    }
    setError('');
  };

  const handlePrimaryChange = (dept) => {
    setPrimaryDepartment(dept);
    setError('');
  };

  const handleSubmit = () => {
    if (userType === 'faculty') {
      if (!primaryDepartment) {
        setError('Please select a primary department.');
        return;
      }
      if (!selectedDepartments.includes(primaryDepartment)) {
        setError('Primary department must be in your selected departments.');
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
      if (!selectedAcademicYear) {
        setError('Please select your current academic year.');
        return;
      }
    }
    setConfirm(true);
  };

  const handleFinalConfirm = () => {
    if (userType === 'faculty') {
      onSubmit({
        departments: selectedDepartments,
        primaryDepartment
      });
    } else {
      onSubmit({
        departments: selectedDepartments,
        year: selectedYear,
        academicYear: selectedAcademicYear,
        yearSelectedAt: new Date().toISOString(),
      });
    }
    setConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto relative">
        <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">
          {isEditable ? 'Select Department' : 'Department Selection Locked'}
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          {userType === 'faculty'
            ? 'Select your primary department and any additional departments you teach in.'
            : 'Select your department. You can only change this once later.'}
        </p>
        {error && <div className="mb-2 text-red-500 font-semibold">{error}</div>}
        {!isEditable && userType === 'student' && (
          <div className="mb-4 text-yellow-600 font-semibold">
            You have already changed your department. Further changes are not allowed.
          </div>
        )}
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <div className="mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              {DEPARTMENTS.map(dept => (
                <label key={dept} className={`flex flex-col items-center justify-center w-full h-[85px] p-3 rounded-lg cursor-pointer transition-colors border border-gray-200 dark:border-gray-700 shadow-sm text-base font-medium text-center ${selectedDepartments.includes(dept) ? 'bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-600' : 'bg-white dark:bg-gray-800'}`}>
                  <input
                    type={userType === 'faculty' ? 'checkbox' : 'radio'}
                    name="department"
                    value={dept}
                    checked={selectedDepartments.includes(dept)}
                    disabled={!isEditable}
                    onChange={() => handleDepartmentChange(dept)}
                    className="mb-1"
                  />
                  <span className="text-base leading-snug px-1 line-clamp-2">{dept}</span>
                </label>
              ))}
            </div>
          </div>
          {userType === 'faculty' && (
            <div className="mb-4">
              <label className="block mb-1 font-semibold">Primary Department:</label>
              <select
                value={primaryDepartment}
                onChange={e => handlePrimaryChange(e.target.value)}
                disabled={!isEditable}
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                <option value="">Select primary department</option>
                {selectedDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}
          {userType === 'student' && (
            <div className="mb-4 flex gap-4">
              <div className="flex-1">
                <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200">
                  Current Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedYear}
                  onChange={e => { setSelectedYear(e.target.value); setError(''); }}
                  disabled={!isEditable}
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                >
                  <option value="">Select year</option>
                  {YEARS.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAcademicYear}
                  onChange={e => { setSelectedAcademicYear(e.target.value); setError(''); }}
                  disabled={!isEditable}
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                >
                  <option value="">Select academic year</option>
                  {ACADEMIC_YEARS.map(ay => (
                    <option key={ay} value={ay}>{ay}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            {isEditable && (
              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold"
              >
                Save
              </button>
            )}
          </div>
        </form>
        {confirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-2 text-blue-700 dark:text-blue-300">Confirm Department Selection</h3>
              <p className="mb-4 text-gray-700 dark:text-gray-200">
                {userType === 'faculty'
                  ? 'Are you sure you want to update your department selection?'
                  : 'Are you sure? You can only change your department selection once later from settings.'}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirm(false)}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalConfirm}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentSelectionModal; 