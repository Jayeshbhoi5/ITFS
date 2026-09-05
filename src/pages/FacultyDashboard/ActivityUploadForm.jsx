import React, { useState, useEffect, useRef } from 'react';
import { FaUpload, FaImage, FaVideo, FaSpinner, FaTimes, FaCheckCircle, FaCalendarAlt, FaBook, FaUser, FaBuilding } from 'react-icons/fa';
import { useActivities } from './ActivityContext';
import { uploadToCloudinary } from '../../cloudinaryUtils';
import { useUserSession } from '../../UserSessionContext';

const ActivityUploadForm = ({ darkMode, onSuccess }) => {
  const { addActivity } = useActivities();
  const { user } = useUserSession();

  const getCurrentAcademicYear = () => {
    const now = new Date();
    const month = now.getMonth();
    const startYear = month >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    return `${startYear}-${String(startYear + 1).slice(-2)}`;
  };

  const [formData, setFormData] = useState({
    academicYear: getCurrentAcademicYear(),
    semester: 'I',
    courseName: '',
    className: 'TE',
    facultyName: user?.name || '',
    department: user?.departments && user.departments.length > 0 ? user.departments[0] : '',
    departments: user?.primaryDepartment ? [user.primaryDepartment] : (user?.departments ? [user.departments[0]] : []),
    activityName: '',
    description: '',
    files: [],
    activityDate: new Date().toISOString().split('T')[0]
  });

  const [filePreview, setFilePreview] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedActivityName, setUploadedActivityName] = useState('');
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length) {
      setFormErrors(prev => ({ ...prev, files: 'Files must be <10MB each' }));
      return;
    }
    const newPreviews = files.map(file => ({ name: file.name, type: file.type, url: URL.createObjectURL(file) }));
    setFilePreview(prev => [...prev, ...newPreviews]);
    setFormData(prev => ({ ...prev, files: [...prev.files, ...files] }));
    setFormErrors(prev => ({ ...prev, files: null }));
  };

  const removeFile = (index) => {
    setFilePreview(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.courseName.trim()) errors.courseName = 'Required';
    if (!formData.activityName.trim()) errors.activityName = 'Required';
    if (!formData.description.trim()) errors.description = 'Required';
    if (!formData.department) errors.department = 'Please select a department';
    setFormErrors(errors);
    return !Object.keys(errors).length;
  };

  const uploadFilesToCloudinary = async (files) => {
    const fileUrls = [];
    for (let i = 0; i < files.length; i++) {
      const result = await uploadToCloudinary(files[i]);
      fileUrls.push(result);
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }
    return fileUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;
    if (user?.role !== 'Faculty') {
      setFormErrors({ submit: 'Only faculty can upload activities' });
      return;
    }
    setIsSubmitting(true);
    setUploadProgress(0);
    try {
      let fileUrls = [];
      if (formData.files.length > 0) fileUrls = await uploadFilesToCloudinary(formData.files);
      const activityData = {
        academicYear: formData.academicYear,
        semester: formData.semester,
        courseName: formData.courseName,
        className: formData.className,
        facultyName: formData.facultyName,
        activityName: formData.activityName,
        description: formData.description,
        activityDate: formData.activityDate,
        totalStudents: 0, averageRating: 0, comments: [],
        fileCount: fileUrls.length, fileUrls,
        mainImage: fileUrls.length > 0 ? fileUrls[0].url : null,
        status: 'Active',
        facultyId: user?.uid,
        department: formData.department,
        departments: formData.departments,
        targetBranches: [], targetYears: [], targetSemesters: []
      };
      if (!activityData.facultyId || !activityData.department) throw new Error('Missing required user information');
      await addActivity(activityData);
      setUploadedActivityName(formData.activityName);
      setFormData({
        academicYear: getCurrentAcademicYear(), semester: 'I', courseName: '', className: 'TE',
        facultyName: user?.name || '',
        department: user?.departments && user.departments.length > 0 ? user.departments[0] : '',
        departments: user?.primaryDepartment ? [user.primaryDepartment] : (user?.departments ? [user.departments[0]] : []),
        activityName: '', description: '', files: [],
        activityDate: new Date().toISOString().split('T')[0]
      });
      setFilePreview([]);
      setUploadProgress(0);
      setIsModalOpen(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      setFormErrors({ submit: error.message.includes('user information') ? 'Please complete your profile before uploading' : 'Failed to upload activity. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const primaryDept = user?.primaryDepartment || (user?.departments && user.departments[0]);
    if (primaryDept && (!formData.departments || formData.departments.length === 0)) {
      setFormData(prev => ({ ...prev, departments: [primaryDept] }));
    }
  // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target)) setDeptDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const inputCls = `w-full p-2.5 rounded-xl border text-sm transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' : 'bg-white border-gray-200 text-gray-800 focus:border-blue-500'}`;
  const labelCls = `block mb-1.5 text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`;
  const sectionCls = `rounded-2xl border p-5 mb-5 ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-100'}`;

  return (
    <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-gray-900 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-gray-100'}`}
      style={{ animation: 'fadeInUp 0.4s ease' }}>

      {/* Header */}
      <div className={`px-6 py-4 flex items-center gap-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'bg-blue-900/40' : 'bg-blue-50'}`}>
          <FaUpload className="text-blue-600 text-sm" />
        </div>
        <h2 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Upload Activity</h2>
      </div>

      <div className="p-6">
        {formErrors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
            <span className="text-red-500">⚠</span> {formErrors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Section 1 — Academic Info */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-4">
              <FaCalendarAlt className="text-blue-500 text-sm" />
              <h3 className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Academic Information</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Academic Year</label>
                <select name="academicYear" value={formData.academicYear} onChange={handleInputChange} className={inputCls}>
                  {['2024-25','2025-26','2026-27','2027-28','2028-29','2029-30'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Semester</label>
                <select name="semester" value={formData.semester} onChange={handleInputChange} className={inputCls}>
                  <option value="I">Semester I</option>
                  <option value="II">Semester II</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Class</label>
                <select name="className" value={formData.className} onChange={handleInputChange} className={inputCls}>
                  {['FE','SE','TE','BE'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Activity Date</label>
                <input type="date" name="activityDate" value={formData.activityDate} onChange={handleInputChange}
                  className={inputCls} style={{ colorScheme: darkMode ? 'dark' : 'light' }} />
              </div>
            </div>
          </div>

          {/* Section 2 — Course & Faculty */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-4">
              <FaBook className="text-blue-500 text-sm" />
              <h3 className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Course & Faculty</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Course Name</label>
                <input type="text" name="courseName" value={formData.courseName} onChange={handleInputChange}
                  placeholder="e.g. Data Structures"
                  className={`${inputCls} ${formErrors.courseName ? 'border-red-400' : ''}`} />
                {formErrors.courseName && <p className="text-red-500 text-xs mt-1">{formErrors.courseName}</p>}
              </div>
              <div>
                <label className={labelCls}>Faculty Name</label>
                <div className="relative flex items-center">
                  <FaUser className="absolute left-3 text-gray-400 text-xs pointer-events-none" />
                  <input type="text" name="facultyName" value={formData.facultyName} onChange={handleInputChange}
                    className={`${inputCls} pl-8 opacity-60 cursor-not-allowed`} disabled />
                </div>
              </div>
              <div ref={deptDropdownRef}>
                <label className={labelCls}>Departments</label>
                <div className="relative">
                  <button type="button"
                    className={`${inputCls} text-left flex justify-between items-center`}
                    onClick={() => setDeptDropdownOpen(o => !o)}>
                    <span className="truncate text-sm">
                      {formData.departments && formData.departments.length > 0 ? formData.departments.join(', ') : 'Select department(s)'}
                    </span>
                    <span className="text-gray-400 text-xs ml-2">▼</span>
                  </button>
                  {deptDropdownOpen && (
                    <div className={`absolute z-20 mt-1 w-full rounded-xl shadow-lg border max-h-48 overflow-y-auto ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                      {user?.departments && user.departments.map(dept => (
                        <label key={dept} className={`flex items-center px-3 py-2 cursor-pointer text-sm ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-blue-50'}`}>
                          <input type="checkbox"
                            checked={formData.departments?.includes(dept) || false}
                            onChange={e => {
                              const checked = e.target.checked;
                              setFormData(prev => {
                                let nd = prev.departments ? [...prev.departments] : [];
                                if (checked) { if (!nd.includes(dept)) nd.push(dept); }
                                else nd = nd.filter(d => d !== dept);
                                return { ...prev, departments: nd };
                              });
                            }}
                            className="mr-2 accent-blue-600" />
                          {dept}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formErrors.departments && <p className="text-red-500 text-xs mt-1">{formErrors.departments}</p>}
              </div>
            </div>
          </div>

          {/* Section 3 — Activity Details */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-4">
              <FaBuilding className="text-blue-500 text-sm" />
              <h3 className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Activity Details</h3>
            </div>
            <div className="mb-4">
              <label className={labelCls}>Activity Name</label>
              <input type="text" name="activityName" value={formData.activityName} onChange={handleInputChange}
                placeholder="e.g. Workshop on Machine Learning"
                className={`${inputCls} ${formErrors.activityName ? 'border-red-400' : ''}`} />
              {formErrors.activityName && <p className="text-red-500 text-xs mt-1">{formErrors.activityName}</p>}
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4"
                placeholder="Describe the activity, its objectives and outcomes..."
                className={`${inputCls} resize-none ${formErrors.description ? 'border-red-400' : ''}`} />
              {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
            </div>
          </div>

          {/* Section 4 — File Upload */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-4">
              <FaImage className="text-blue-500 text-sm" />
              <h3 className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Media Upload</h3>
            </div>
            <label className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-2xl py-8 cursor-pointer transition-all ${
              darkMode ? 'border-gray-600 hover:border-blue-500 hover:bg-blue-900/10' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/60'
            } ${formErrors.files ? 'border-red-400' : ''}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <FaImage className="text-blue-500 text-xl" />
              </div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Click to upload or drag & drop</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, MP4 — max 10MB each</p>
              <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
            </label>
            {formErrors.files && <p className="text-red-500 text-xs mt-2">{formErrors.files}</p>}

            {filePreview.length > 0 && (
              <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-3">
                {filePreview.map((file, index) => (
                  <div key={index} className="relative group">
                    {file.type.includes('image') ? (
                      <img src={file.url} alt="Preview" className="h-20 w-full object-cover rounded-xl" />
                    ) : (
                      <div className={`h-20 w-full rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <FaVideo className="text-2xl text-gray-400" />
                      </div>
                    )}
                    <button type="button" onClick={() => removeFile(index)}
                      style={{ background: 'rgba(239,68,68,0.9)', border: 'none', padding: 0, width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      className="absolute -top-1.5 -right-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <FaTimes size={9} />
                    </button>
                    <p className="text-xs mt-1 truncate text-gray-400">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress bar */}
          {isSubmitting && (
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Uploading files...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50 text-sm">
              {isSubmitting ? <><FaSpinner className="animate-spin" /> Uploading...</> : <><FaUpload /> Upload Activity</>}
            </button>
          </div>

        </form>
      </div>

      {/* Success Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className={`relative rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
            style={{ animation: 'scaleIn 0.25s ease' }}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-green-500 text-3xl" />
            </div>
            <h2 className="text-xl font-bold mb-2">Activity Uploaded!</h2>
            <p className="text-gray-500 text-sm mb-6">"{uploadedActivityName}" has been published successfully.</p>
            <button onClick={() => setIsModalOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-all">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityUploadForm;
