import React, { useState, useEffect, useRef } from 'react';
import { FaUpload, FaImage, FaVideo, FaSpinner, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { useActivities } from './ActivityContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "../../firebaseConfig";
import { uploadToCloudinary } from '../../cloudinaryUtils';
import { useUserSession } from '../../UserSessionContext';

const ActivityUploadForm = ({ darkMode, onSuccess }) => {
  const { addActivity } = useActivities();
  const { user } = useUserSession();
  
  // Form state
  const [formData, setFormData] = useState({
    academicYear: '2025-26',
    semester: 'I',
    courseName: '',
    className: 'TE',
    facultyName: user?.name || '',
    department: user?.departments && user.departments.length > 0 ? user.departments[0] : '',
    activityName: '',
    description: '',
    files: [],
    activityDate: new Date().toISOString().split('T')[0]
  });

  // UI state
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

    const newPreviews = files.map(file => ({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file)
    }));

    setFilePreview(prev => [...prev, ...newPreviews]);
    setFormData(prev => ({ ...prev, files: [...prev.files, ...files] }));
    setFormErrors(prev => ({ ...prev, files: null }));
  };

  const removeFile = (index) => {
    setFilePreview(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
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
      try {
        const result = await uploadToCloudinary(files[i]);
        fileUrls.push(result);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    }
    return fileUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    if (!validateForm()) return;
    if (user?.role !== 'Faculty') {
      setFormErrors({...formErrors, submit: 'Only faculty can upload activities'});
      return;
    }
    
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      let fileUrls = [];
      if (formData.files.length > 0) {
        fileUrls = await uploadFilesToCloudinary(formData.files);
      }
      
      const activityData = {
        academicYear: formData.academicYear,
        semester: formData.semester,
        courseName: formData.courseName,
        className: formData.className,
        facultyName: formData.facultyName,
        activityName: formData.activityName,
        description: formData.description,
        activityDate: formData.activityDate,
        totalStudents: 0,
        averageRating: 0,
        comments: [],
        fileCount: fileUrls.length,
        fileUrls: fileUrls,
        mainImage: fileUrls.length > 0 ? fileUrls[0].url : null,
        status: 'Active',
        facultyId: user?.uid,
        department: formData.department,
        departments: formData.departments,
        targetBranches: [],
        targetYears: [],
        targetSemesters: []
      };
      
      if (!activityData.facultyId || !activityData.department) {
        throw new Error('Missing required user information');
      }
  
      // Only call addActivity once
      await addActivity(activityData);
      
      setUploadedActivityName(formData.activityName);
      
      // Reset form
      setFormData({
        academicYear: '2025-26',
        semester: 'I',
        courseName: '',
        className: 'TE',
        facultyName: user?.name || '',
        department: user?.departments && user.departments.length > 0 ? user.departments[0] : '',
        activityName: '',
        description: '',
        files: [],
        activityDate: new Date().toISOString().split('T')[0]
      });
      setFilePreview([]);
      setUploadProgress(0);
      setIsModalOpen(true);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error uploading activity:', error);
      setFormErrors({
        ...formErrors,
        submit: error.message.includes('user information') 
          ? 'Please complete your profile before uploading' 
          : 'Failed to upload activity. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const SuccessModal = () => (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${isModalOpen ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsModalOpen(false)}></div>
      <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl z-10 max-w-md w-full mx-4 text-center ${darkMode ? 'dark' : ''}`}>
        <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Activity Uploaded!</h2>
        <p className="mb-4">Thank you for uploading "{uploadedActivityName}"</p>
        <button
          onClick={() => setIsModalOpen(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    if (user?.role !== 'Faculty') {
      setFormErrors({...formErrors, 
        submit: 'You do not have permission to upload activities'
      });
    }
  }, [user]);

  useEffect(() => {
    const primaryDept = user?.primaryDepartment || (user?.departments && user.departments[0]);
    if (primaryDept && (!formData.departments || formData.departments.length === 0)) {
      setFormData(prev => ({ ...prev, departments: [primaryDept] }));
    }
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target)) {
        setDeptDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}>
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <FaUpload className="mr-2" /> Upload Activity
      </h2>

      {formErrors.submit && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {formErrors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block mb-2 font-medium">Academic Year</label>
            <select
              name="academicYear"
              value={formData.academicYear}
              onChange={handleInputChange}
              className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
            >
              {['2024-25', '2025-26', '2026-27', '2027-28', '2028-29', '2029-30'].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Semester</label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
              className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
            >
              <option value="I">I</option>
              <option value="II">II</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Course Name</label>
            <input
              type="text"
              name="courseName"
              value={formData.courseName}
              onChange={handleInputChange}
              placeholder="Enter course name"
              className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} ${formErrors.courseName ? 'border-red-500' : ''}`}
            />
            {formErrors.courseName && <p className="text-red-500 text-sm mt-1">{formErrors.courseName}</p>}
          </div>

          <div>
            <label className="block mb-2 font-medium">Class</label>
            <select
              name="className"
              value={formData.className}
              onChange={handleInputChange}
              className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
            >
              {['FE', 'SE', 'TE', 'BE'].map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Faculty Name</label>
            <input
              type="text"
              name="facultyName"
              value={formData.facultyName}
              onChange={handleInputChange}
              className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              disabled
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">Departments</label>
            <div className="relative" ref={deptDropdownRef}>
              <button
                type="button"
                className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-black'} text-left focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onClick={() => setDeptDropdownOpen((open) => !open)}
              >
                {formData.departments && formData.departments.length > 0
                  ? formData.departments.join(', ')
                  : 'Select department(s)'}
                <span className="float-right">▼</span>
              </button>
              {deptDropdownOpen && (
                <div className={`absolute z-10 mt-1 w-full rounded-lg shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} border border-gray-200 max-h-60 overflow-y-auto`}>
                  {user?.departments && user.departments.map(dept => (
                    <label key={dept} className="flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800">
                      <input
                        type="checkbox"
                        checked={formData.departments?.includes(dept) || false}
                        onChange={e => {
                          const checked = e.target.checked;
                          setFormData(prev => {
                            let newDepts = prev.departments ? [...prev.departments] : [];
                            if (checked) {
                              if (!newDepts.includes(dept)) newDepts.push(dept);
                            } else {
                              newDepts = newDepts.filter(d => d !== dept);
                            }
                            return { ...prev, departments: newDepts };
                          });
                        }}
                        className="mr-2"
                      />
                      {dept}
                    </label>
                  ))}
                </div>
              )}
            </div>
            {formErrors.departments && <p className="text-red-500 text-sm mt-1">{formErrors.departments}</p>}
          </div>

          <div>
            <label className="block mb-2 font-medium">Activity Name</label>
            <input
              type="text"
              name="activityName"
              value={formData.activityName}
              onChange={handleInputChange}
              placeholder="Activity name"
              className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} ${formErrors.activityName ? 'border-red-500' : ''}`}
            />
            {formErrors.activityName && <p className="text-red-500 text-sm mt-1">{formErrors.activityName}</p>}
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium">Activity Date</label>
          <input
            type="date"
            name="activityDate"
            value={formData.activityDate}
            onChange={handleInputChange}
            className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
            style={{ colorScheme: darkMode ? 'dark' : 'light' }}
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} ${formErrors.description ? 'border-red-500' : ''}`}
          ></textarea>
          {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium">Upload Files</label>
          <div className={`border-2 border-dashed rounded-lg p-6 text-center ${darkMode ? 'border-gray-600' : 'border-gray-300'} ${formErrors.files ? 'border-red-500' : ''}`}>
            <label className="cursor-pointer">
              <div className="flex flex-col items-center justify-center">
                <div className="flex">
                  <FaImage className="text-2xl mr-2" />
                  <FaVideo className="text-2xl" />
                </div>
                <p className="mt-2">Click or drag files to upload</p>
                <p className="text-sm mt-1">JPG, PNG, MP4 (Max: 10MB each)</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          {formErrors.files && <p className="text-red-500 text-sm mt-1">{formErrors.files}</p>}
        </div>

        {filePreview.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Uploaded Files:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filePreview.map((file, index) => (
                <div key={index} className="relative group">
                  {file.type.includes('image') ? (
                    <img src={file.url} alt="Preview" className="h-24 w-full object-cover rounded-lg" />
                  ) : (
                    <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <FaVideo className="text-3xl" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                  >
                    <FaTimes size={12} />
                  </button>
                  <p className="text-xs mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isSubmitting && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm mt-1 text-center">Uploading: {uploadProgress}%</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <FaUpload className="mr-2" />
                Upload Activity
              </>
            )}
          </button>
        </div>
      </form>

      <SuccessModal />
    </div>
  );
};

export default ActivityUploadForm;