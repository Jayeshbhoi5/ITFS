import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from './StudentSidebar';
import Navbar from './Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaCalendarAlt, FaUser, FaChalkboardTeacher, FaStar, FaEdit, FaEye, FaExpand, FaCompress, FaTimes, FaChevronLeft, FaChevronRight, FaChevronUp, FaThLarge, FaList, FaSearchPlus, FaSearchMinus, FaFilePdf, FaDownload, FaRedo } from 'react-icons/fa';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { useActivities } from "../FacultyDashboard/ActivityContext";
import { useActivityUserStatus } from "./ActivityUserStatusManager";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useUserSession } from '../../UserSessionContext';
import { computeCurrentYearAndAcademic, getCurrentAcademicYear } from '../../components/DepartmentSelectionModal';
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';
import { AllActivitiesSkeleton } from '../../components/FeedbackSkeleton';
import EmptyActivitiesState from '../../components/EmptyActivitiesState';

// Helper to determine the student's current/default year (FE/SE/TE/BE)
export const getStudentDefaultYear = (userData) => {
  if (!userData) return '';
  const base = userData.baseYear || userData.year;
  if (base && userData.yearSelectedAt) {
    const { currentYear } = computeCurrentYearAndAcademic(base, userData.yearSelectedAt);
    if (currentYear) return currentYear;
  }
  return userData.year || userData.baseYear || '';
};

// PDF detection & preview helpers
const isPdfUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return cleanUrl.endsWith('.pdf') || cleanUrl.includes('/pdf/') || cleanUrl.includes('.pdf');
};

const getCloudinaryPdfPageUrl = (pdfUrl, pageNumber = 1, width = 1200) => {
  if (!pdfUrl || typeof pdfUrl !== 'string') return null;
  if (!pdfUrl.includes('cloudinary.com')) return null;

  let url = pdfUrl;
  const transform = `/image/upload/pg_${pageNumber},w_${width},c_limit,f_auto,q_auto/`;
  if (url.includes('/raw/upload/')) {
    url = url.replace('/raw/upload/', transform);
  } else if (url.includes('/image/upload/')) {
    url = url.replace('/image/upload/', transform);
  } else if (url.includes('/upload/')) {
    url = url.replace('/upload/', transform);
  }
  // Change .pdf extension to .jpg so Cloudinary serves page as image
  url = url.replace(/\.pdf(\?.*)?$/i, '.jpg$1');
  return url;
};

const getCloudinaryPdfPage1 = (pdfUrl) => getCloudinaryPdfPageUrl(pdfUrl, 1, 600);

// Known page counts for existing Cloudinary PDFs to avoid 400 Bad Request probes
const KNOWN_PDF_PAGES = {
  'STQA_Crossword_U3_4_laamgc': 2,
  'NLP_research_paper_review_ddvrgv': 2,
};

const getKnownPdfPages = (url) => {
  if (!url) return null;
  for (const [key, count] of Object.entries(KNOWN_PDF_PAGES)) {
    if (url.includes(key)) return count;
  }
  return null;
};

// Global cache for rendered PDF thumbnails so each PDF page 1 is generated once
const pdfThumbnailCache = new Map();
let pdfjsLibPromise = null;

const loadPdfJs = () => {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsLibPromise) return pdfjsLibPromise;

  pdfjsLibPromise = new Promise((resolve, reject) => {
    if (document.querySelector('script[data-pdfjs]')) {
      const checkInterval = setInterval(() => {
        if (window.pdfjsLib) {
          clearInterval(checkInterval);
          resolve(window.pdfjsLib);
        }
      }, 50);
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('data-pdfjs', 'true');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      try {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('pdfjsLib not loaded'));
        }
      } catch (err) {
        reject(err);
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
  return pdfjsLibPromise;
};

let jsPdfLibPromise = null;
const loadJsPdf = () => {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (window.jsPDF) return Promise.resolve(window.jsPDF);
  if (jsPdfLibPromise) return jsPdfLibPromise;

  jsPdfLibPromise = new Promise((resolve, reject) => {
    if (document.querySelector('script[data-jspdf]')) {
      const checkInterval = setInterval(() => {
        const ctor = window.jspdf?.jsPDF || window.jsPDF;
        if (ctor) {
          clearInterval(checkInterval);
          resolve(ctor);
        }
      }, 50);
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('data-jspdf', 'true');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      const ctor = window.jspdf?.jsPDF || window.jsPDF;
      if (ctor) {
        resolve(ctor);
      } else {
        reject(new Error('jsPDF not loaded'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load jsPDF library'));
    document.head.appendChild(script);
  });
  return jsPdfLibPromise;
};

// Reusable Activity Thumbnail component with 1st page PDF preview
const ActivityThumbnail = ({ src, alt, darkMode, className = "" }) => {
  const isPdf = isPdfUrl(src);
  const [thumbUrl, setThumbUrl] = useState(() => {
    if (!isPdf) return src;
    if (pdfThumbnailCache.has(src)) return pdfThumbnailCache.get(src);
    return getCloudinaryPdfPage1(src) || src;
  });
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isPdf) {
      setThumbUrl(src);
      return;
    }

    if (pdfThumbnailCache.has(src)) {
      setThumbUrl(pdfThumbnailCache.get(src));
      return;
    }

    const cloudUrl = getCloudinaryPdfPage1(src);
    if (cloudUrl) {
      setThumbUrl(cloudUrl);
      return; // Cloudinary directly delivers page 1 as an image, no need for PDF.js
    }

    let isCancelled = false;
    // PDF.js client-side 1st page rendering only for non-Cloudinary PDFs
    loadPdfJs()
      .then(async (pdfjs) => {
        if (isCancelled) return;
        const loadingTask = pdfjs.getDocument({
          url: src,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true
        });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const scale = 500 / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (!isCancelled) {
          pdfThumbnailCache.set(src, dataUrl);
          setThumbUrl(dataUrl);
        }
      })
      .catch(() => {
        // Fallback handled by handleImageError
      });

    return () => {
      isCancelled = true;
    };
  }, [src, isPdf]);

  const handleImageError = (e) => {
    if (isPdf) {
      setLoadError(true);
    } else if (thumbUrl !== 'https://placehold.co/600x400/lightgray/white?text=Activity') {
      setThumbUrl('https://placehold.co/600x400/lightgray/white?text=Activity');
    } else if (e?.target) {
      e.target.style.display = 'none';
    }
  };

  if (isPdf && loadError) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-3 text-center transition-all ${
        darkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-700'
      }`}>
        <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mb-2 shadow-sm border border-red-500/20">
          <FaFilePdf className="text-xl" />
        </div>
        <span className="text-xs font-bold line-clamp-1 max-w-[90%]">{alt || 'PDF Document'}</span>
        <span className="text-[10px] text-slate-400 mt-0.5">Click to view</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-900/5">
      <img
        src={thumbUrl}
        alt={alt}
        className={`w-full h-full object-cover transition-transform duration-500 ${className}`}
        onError={handleImageError}
      />
    </div>
  );
};

// Scrollable Multi-Page PDF Document Viewer for Fullscreen Lightbox Modal
const PdfModalViewer = ({ 
  pdfUrl, 
  title, 
  pagesCount, 
  zoomLevel, 
  onToggleZoom, 
  onZoomIn, 
  onZoomOut, 
  onResetZoom, 
  darkMode 
}) => {
  const initialCount = pagesCount || getKnownPdfPages(pdfUrl) || 1;
  const [pages, setPages] = useState(() => {
    const arr = [];
    for (let i = 1; i <= initialCount; i++) arr.push(i);
    return arr;
  });
  const [totalPages, setTotalPages] = useState(initialCount);
  const [failedPages, setFailedPages] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [usePdfJs, setUsePdfJs] = useState(!pdfUrl.includes('cloudinary.com'));
  const [pdfJsPages, setPdfJsPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState('1');
  const [rotation, setRotation] = useState(0);
  const scrollContainerRef = useRef(null);
  const [slotNode, setSlotNode] = useState(() => {
    return typeof document !== 'undefined' ? document.getElementById('pdf-modal-toolbar-slot') : null;
  });

  useEffect(() => {
    const el = document.getElementById('pdf-modal-toolbar-slot');
    if (el) setSlotNode(el);
  }, []);

  useEffect(() => {
    const determinedPages = pagesCount || getKnownPdfPages(pdfUrl) || 1;
    setTotalPages(determinedPages);
    const arr = [];
    for (let i = 1; i <= determinedPages; i++) arr.push(i);
    setPages(arr);
    setFailedPages(new Set());
    setLoading(false);
    setCurrentPage(1);
    setInputPage('1');
    setRotation(0);
  }, [pdfUrl, pagesCount]);

  useEffect(() => {
    setInputPage(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    if (usePdfJs && !pdfUrl.includes('cloudinary.com')) {
      let isCancelled = false;
      setLoading(true);
      loadPdfJs().then(async (pdfjs) => {
        if (isCancelled) return;
        try {
          const loadingTask = pdfjs.getDocument({
            url: pdfUrl,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true
          });
          const pdf = await loadingTask.promise;
          if (isCancelled) return;
          setTotalPages(pdf.numPages);
          const rendered = [];
          for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;
            rendered.push({ pageNum: p, dataUrl: canvas.toDataURL('image/jpeg', 0.85) });
          }
          if (!isCancelled) {
            setPdfJsPages(rendered);
            setLoading(false);
          }
        } catch {
          if (!isCancelled) setLoading(false);
        }
      });
      return () => {
        isCancelled = true;
      };
    }
  }, [usePdfJs, pdfUrl]);

  const handlePageLoad = () => {
    setLoading(false);
  };

  const handlePageError = (pageNumber) => {
    setFailedPages(prev => new Set(prev).add(pageNumber));
  };

  const validPages = pages.filter(p => !failedPages.has(p));

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const containerRect = scrollContainerRef.current.getBoundingClientRect();
    const pagesList = usePdfJs ? pdfJsPages.map(p => p.pageNum) : validPages;
    for (const p of pagesList) {
      const el = document.getElementById(`pdf-page-${p}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= containerRect.top + 160 && rect.bottom >= containerRect.top + 40) {
          if (currentPage !== p) {
            setCurrentPage(p);
          }
          break;
        }
      }
    }
  };

  const jumpToPage = (pageNum) => {
    const p = parseInt(pageNum, 10);
    if (!isNaN(p) && p >= 1 && p <= (totalPages || 1)) {
      setCurrentPage(p);
      setInputPage(String(p));
      const el = document.getElementById(`pdf-page-${p}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      setInputPage(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      jumpToPage(inputPage);
    }
  };

  const handlePageInputBlur = () => {
    jumpToPage(inputPage);
  };

  const handleRotate = (e) => {
    if (e) e.stopPropagation();
    setRotation(prev => (prev + 90) % 360);
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e) => {
    if (e) e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);

    const safeTitle = (title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
    let downloadUrl = pdfUrl;
    if (pdfUrl.includes('cloudinary.com')) {
      if (!downloadUrl.includes('fl_attachment')) {
        downloadUrl = downloadUrl.includes('/upload/')
          ? downloadUrl.replace('/upload/', `/upload/fl_attachment:${safeTitle}/`)
          : downloadUrl;
      }
    }

    // 1. Attempt direct download if server allows raw PDF delivery
    let directSuccess = false;
    try {
      const response = await fetch(downloadUrl, { mode: 'cors' });
      if (response.ok && response.status === 200) {
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
          const blob = await response.blob();
          if (blob && blob.size > 2000) {
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${safeTitle}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
            directSuccess = true;
          }
        }
      }
    } catch {
      directSuccess = false;
    }

    if (directSuccess) {
      setIsDownloading(false);
      return;
    }

    // 2. Direct download is blocked (e.g. Cloudinary 401 Unauthorized for raw PDF).
    // Automatically compile all document pages into a genuine multi-page PDF using jsPDF!
    try {
      const JsPdf = await loadJsPdf();
      const pageImages = [];

      if (usePdfJs && pdfJsPages.length > 0) {
        for (const p of pdfJsPages) {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = p.dataUrl;
          });
          pageImages.push({
            dataUrl: p.dataUrl,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height
          });
        }
      } else {
        const pagesToExport = validPages.length > 0 ? validPages : [1];
        for (const pageNum of pagesToExport) {
          const pageUrl = getCloudinaryPageUrl(pdfUrl, pageNum);
          const corsUrl = pageUrl + (pageUrl.includes('?') ? '&' : '?') + 'download_cors=1';
          
          const imgData = await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                resolve({
                  dataUrl: canvas.toDataURL('image/jpeg', 0.95),
                  width: canvas.width,
                  height: canvas.height
                });
              } catch (canvasErr) {
                reject(canvasErr);
              }
            };
            img.onerror = () => reject(new Error(`Failed to load page ${pageNum}`));
            img.src = corsUrl;
          });
          pageImages.push(imgData);
        }
      }

      if (pageImages.length > 0) {
        let pdfDoc = null;
        for (let i = 0; i < pageImages.length; i++) {
          const { dataUrl, width, height } = pageImages[i];
          const orientation = width > height ? 'landscape' : 'portrait';
          if (i === 0) {
            pdfDoc = new JsPdf({
              orientation,
              unit: 'px',
              format: [width, height],
              hotfixes: ['px_scaling']
            });
            pdfDoc.addImage(dataUrl, 'JPEG', 0, 0, width, height);
          } else {
            pdfDoc.addPage([width, height], orientation);
            pdfDoc.addImage(dataUrl, 'JPEG', 0, 0, width, height);
          }
        }
        pdfDoc.save(`${safeTitle}.pdf`);
      }
    } catch (genErr) {
      console.error('Multi-page PDF generation error:', genErr);
      // Fallback: download page 1 image if compilation fails
      const fallbackUrl = getCloudinaryPageUrl(pdfUrl, 1);
      const link = document.createElement('a');
      link.href = fallbackUrl;
      link.download = `${safeTitle}.jpg`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  const toolbarContent = (
    <div 
      className="flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-xl shadow-lg select-none"
      style={{
        backgroundColor: '#323639',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Page Jump: [ 1 ] / {totalPages} */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <input
          type="number"
          min={1}
          max={totalPages || 1}
          value={inputPage}
          onChange={(e) => setInputPage(e.target.value)}
          onKeyDown={handlePageInputKeyDown}
          onBlur={handlePageInputBlur}
          className="dark-number-input w-9 sm:w-11 h-6 text-center rounded font-semibold text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-sky-400"
          style={{
            backgroundColor: '#202124',
            color: '#ffffff',
            colorScheme: 'dark',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            padding: '0 1px'
          }}
          title="Type page number and press Enter"
        />
        <span className="text-xs sm:text-sm font-medium text-white/80 select-none">
          / {totalPages || 1}
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-white/20 mx-0.5 sm:mx-1" />

      {/* Zoom Out */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (onZoomOut) onZoomOut(e);
        }}
        disabled={zoomLevel <= 1}
        className="w-6 sm:w-7 h-6 sm:h-7 rounded flex items-center justify-center transition-all cursor-pointer hover:bg-white/15 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-white"
        title="Zoom Out"
      >
        <FaSearchMinus className="text-[11px] sm:text-xs" />
      </button>

      {/* Zoom Percentage / Reset */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (onResetZoom) onResetZoom(e);
          else if (onToggleZoom) onToggleZoom(e);
        }}
        className="text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-medium hover:bg-white/15 transition-all cursor-pointer active:scale-95 text-white/90"
        title="Reset zoom (100%)"
      >
        {Math.round(zoomLevel * 100)}%
      </button>

      {/* Zoom In */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (onZoomIn) onZoomIn(e);
        }}
        disabled={zoomLevel >= 3.5}
        className="w-6 sm:w-7 h-6 sm:h-7 rounded flex items-center justify-center transition-all cursor-pointer hover:bg-white/15 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-white"
        title="Zoom In"
      >
        <FaSearchPlus className="text-[11px] sm:text-xs" />
      </button>

      {/* Divider */}
      <div className="h-4 w-px bg-white/20 mx-0.5 sm:mx-1" />

      {/* Rotate Button */}
      <button
        type="button"
        onClick={handleRotate}
        className="w-6 sm:w-7 h-6 sm:h-7 rounded flex items-center justify-center transition-all cursor-pointer hover:bg-white/15 active:scale-95 text-white/90 hover:text-white"
        title="Rotate clockwise (90°)"
      >
        <FaRedo className="text-[11px] sm:text-xs" />
      </button>

      {/* Divider */}
      <div className="h-4 w-px bg-white/20 mx-0.5 sm:mx-1" />

      {/* Download Button */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-6 sm:w-7 h-6 sm:h-7 rounded flex items-center justify-center transition-all cursor-pointer hover:bg-white/15 active:scale-95 disabled:opacity-50 disabled:cursor-wait text-white/90 hover:text-white"
        title={isDownloading ? "Generating multi-page PDF..." : "Download PDF document"}
      >
        {isDownloading ? (
          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <FaDownload className="text-[11px] sm:text-xs" />
        )}
      </button>
    </div>
  );

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="pdf-dark-scrollbar w-full h-full flex flex-col items-center overflow-y-auto px-2 sm:px-4 pt-1 pb-4"
      style={{
        maxHeight: '88vh',
        colorScheme: 'dark',
        scrollbarWidth: 'thin',
        scrollbarColor: '#64748b #0f172a'
      }}
      onClick={(e) => {}}
    >
      {slotNode ? createPortal(toolbarContent, slotNode) : toolbarContent}

      <div 
        className="flex flex-col items-center gap-6 pb-10 transition-all duration-200"
        style={{
          width: `${Math.min(zoomLevel * 100, 220)}%`,
          maxWidth: zoomLevel <= 1 ? '820px' : `${Math.round(820 * zoomLevel)}px`
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={onToggleZoom}
      >
        {usePdfJs ? (
          pdfJsPages.length > 0 ? (
            pdfJsPages.map(({ pageNum, dataUrl }) => (
              <div 
                key={pageNum}
                id={`pdf-page-${pageNum}`}
                className="w-full flex flex-col rounded-sm sm:rounded-md overflow-hidden transition-all"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.7)' : '0 10px 30px rgba(0,0,0,0.2)',
                  border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  transform: `rotate(${rotation}deg)`
                }}
              >
                <img
                  src={dataUrl}
                  alt={`Page ${pageNum}`}
                  className="w-full h-auto object-contain select-none"
                  draggable={false}
                />
              </div>
            ))
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-white/70">
              <FaFilePdf className="text-4xl text-red-500 animate-pulse mb-3" />
              <p className="text-sm font-medium">Loading document pages...</p>
            </div>
          )
        ) : (
          validPages.map((pageNum) => (
            <div 
              key={pageNum}
              id={`pdf-page-${pageNum}`}
              className="w-full flex flex-col rounded-sm sm:rounded-md overflow-hidden transition-all"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.7)' : '0 10px 30px rgba(0,0,0,0.2)',
                border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                transform: `rotate(${rotation}deg)`
              }}
            >
              <img
                src={getCloudinaryPdfPageUrl(pdfUrl, pageNum, 1400)}
                alt={`Page ${pageNum}`}
                className="w-full h-auto object-contain select-none"
                onLoad={handlePageLoad}
                onError={() => handlePageError(pageNum)}
                draggable={false}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AllActivitiesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() => { try { return JSON.parse(sessionStorage.getItem('sidebarOpen')) || false; } catch { return false; } });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('itfs_all_activities_view_mode') || 'list';
    } catch {
      return 'list';
    }
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('itfs_all_activities_view_mode', mode);
    } catch {}
  };
  const [academicYearFilter, setAcademicYearFilter] = useState(() => {
    try {
      const isManual = sessionStorage.getItem('itfs_student_filter_is_manual') === 'true';
      if (isManual) {
        const saved = sessionStorage.getItem('itfs_student_academic_year_filter');
        if (saved !== null && saved !== undefined) return saved;
      }
      const savedSession = sessionStorage.getItem('itfs_student_academic_year_filter');
      if (savedSession) return savedSession;
    } catch {}
    return getCurrentAcademicYear();
  });
  const [classNameFilter, setClassNameFilter] = useState(() => {
    try {
      const isManual = sessionStorage.getItem('itfs_student_filter_is_manual') === 'true';
      if (isManual) {
        const saved = sessionStorage.getItem('itfs_student_class_name_filter');
        if (saved !== null && saved !== undefined) return saved;
      }
      const savedSession = sessionStorage.getItem('itfs_student_class_name_filter');
      if (savedSession) return savedSession;
    } catch {}
    return '';
  });
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityRatings, setActivityRatings] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [feedbackEditStatus, setFeedbackEditStatus] = useState({});
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState([]);
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modalActivityTitle, setModalActivityTitle] = useState('');
  const [modalPagesCount, setModalPagesCount] = useState(null);
  const currentModalItem = modalImages[activeModalImageIndex] || modalImages[0] || '';
  const currentIsPdf = isPdfUrl(currentModalItem);
  const lastTapRef = useRef(0);
  const modalContainerRef = useRef(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const touchMovedRef = useRef(false);
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAcademicYearFilterChange = (val) => {
    setAcademicYearFilter(val);
    try {
      sessionStorage.setItem('itfs_student_academic_year_filter', val);
      sessionStorage.setItem('itfs_student_filter_is_manual', 'true');
      if (user?.uid) sessionStorage.setItem('itfs_student_filter_uid', user.uid);
    } catch {}
  };

  const handleClassNameFilterChange = (val) => {
    setClassNameFilter(val);
    try {
      sessionStorage.setItem('itfs_student_class_name_filter', val);
      sessionStorage.setItem('itfs_student_filter_is_manual', 'true');
      if (user?.uid) sessionStorage.setItem('itfs_student_filter_uid', user.uid);
    } catch {}
  };

  // Scroll to top listener (triggers after scrolling approximately 1 page down, not immediately)
  useEffect(() => {
    const handleScroll = (e) => {
      const scrollPos = 
        window.pageYOffset || 
        document.documentElement.scrollTop || 
        document.body.scrollTop || 
        document.getElementById('root')?.scrollTop || 
        (e?.target?.scrollTop) || 
        0;
      
      const pageHeight = window.innerHeight || 600;
      const onePageDownThreshold = Math.max(pageHeight * 0.75, 480);

      if (scrollPos > onePageDownThreshold) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const scrollToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      if (document.documentElement) {
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (document.body) {
        document.body.scrollTo({ top: 0, behavior: 'smooth' });
      }
      const root = document.getElementById('root');
      if (root) {
        root.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      window.scrollTo(0, 0);
    }
  };
  
  // Get activities from context
  const { activities: contextActivities, loading: contextLoading, refreshActivities } = useActivities();

  // Get dark mode from storage
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  
  // Get user session for default filter values
  const { user, setUser, loading: userLoading } = useUserSession();

  // Get user status context
  const { submittedActivities = [], isActivitySubmitted = () => false, loading: statusLoading = false } = useActivityUserStatus() || {};

  // Auto-set default filters from department form on login
  // If the user has manually changed a filter during this session, do NOT overwrite it
  useEffect(() => {
    if (!user) return;

    let isManual = false;
    let savedUid = '';
    try {
      isManual = sessionStorage.getItem('itfs_student_filter_is_manual') === 'true';
      savedUid = sessionStorage.getItem('itfs_student_filter_uid');
    } catch {}

    // If user changed (different UID), clear manual filter flags so new user gets fresh defaults
    if (savedUid && savedUid !== user.uid) {
      isManual = false;
      try {
        sessionStorage.removeItem('itfs_student_filter_is_manual');
        sessionStorage.removeItem('itfs_student_academic_year_filter');
        sessionStorage.removeItem('itfs_student_class_name_filter');
        sessionStorage.setItem('itfs_student_filter_uid', user.uid);
      } catch {}
    }

    const calculatedAcademicYear = getCurrentAcademicYear();
    const calculatedYear = getStudentDefaultYear(user);

    if (isManual) {
      // Respect user's explicit filter choice made during this session
      return;
    }

    // Apply default filters automatically!
    setAcademicYearFilter(calculatedAcademicYear);
    if (calculatedYear) {
      setClassNameFilter(calculatedYear);
    }

    try {
      sessionStorage.setItem('itfs_student_academic_year_filter', calculatedAcademicYear);
      if (calculatedYear) {
        sessionStorage.setItem('itfs_student_class_name_filter', calculatedYear);
      }
      sessionStorage.setItem('itfs_student_filter_uid', user.uid);
    } catch {}
  }, [user?.uid, user?.baseYear, user?.yearSelectedAt, user?.year]);
  
  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setDarkModeInStorage(newMode);
  };

  // Handle department update from modal
  const handleDepartmentUpdate = async (data) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const activeAcademicYear = data.academicYear || getCurrentAcademicYear();
    const newChangeCount = (user.departmentChangeCount || 0) + 1;

    // Close modal and show success toast immediately with ZERO delay
    setShowDeptModal(false);
    showToastMessage('Department updated successfully!', 'success');

    // Optimistically update session user state and filters instantly
    if (setUser) {
      setUser({
        ...user,
        departments: data.departments,
        year: data.year,
        academicYear: activeAcademicYear,
        baseYear: data.year,
        yearSelectedAt: data.yearSelectedAt,
        departmentChangeCount: newChangeCount,
      });
    }
    if (data.year) {
      setClassNameFilter(data.year);
      try { sessionStorage.setItem('itfs_student_class_name_filter', data.year); } catch {}
    }
    setAcademicYearFilter(activeAcademicYear);
    try { sessionStorage.setItem('itfs_student_academic_year_filter', activeAcademicYear); } catch {}
    try { 
      sessionStorage.removeItem('itfs_student_filter_is_manual');
      sessionStorage.setItem('itfs_student_filter_uid', user.uid);
    } catch {}

    // Save to Firestore in background
    try {
      await updateDoc(userRef, {
        departments: data.departments,
        year: data.year,
        academicYear: activeAcademicYear,
        baseYear: data.year,
        yearSelectedAt: data.yearSelectedAt,
        departmentChangeCount: newChangeCount,
      });
    } catch (err) {
      console.error('Error updating department in Firestore:', err);
      showToastMessage('Failed to save to database. Please check your connection.', 'error');
    }
  };

  // Toast notification function
  const showToastMessage = (message, type = 'info') => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Update tab from URL if needed
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['all', 'pending', 'submitted'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Fetch latest activity data directly from Firestore for each activity
  const fetchLatestActivityData = async (activityId) => {
    try {
      const activityRef = doc(db, 'activities', activityId);
      const activitySnap = await getDoc(activityRef);
      
      if (activitySnap.exists()) {
        return {
          id: activitySnap.id,
          ...activitySnap.data()
        };
      }
      return null;
    } catch (err) {
      console.error(`Error fetching latest data for activity ${activityId}:`, err);
      return null;
    }
  };

  // Fetch user feedback for a specific activity
  const fetchUserFeedback = async (activityId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return null;

      // Try different field combinations for query
      // First try with userId field
      let q = query(
        collection(db, 'feedback'), 
        where('activityId', '==', activityId),
        where('userId', '==', userId)
      );
      
      let feedbackSnapshot = await getDocs(q);
      
      // If no results, try with studentId field
      if (feedbackSnapshot.empty) {
        q = query(
          collection(db, 'feedback'), 
          where('activityId', '==', activityId),
          where('studentId', '==', userId)
        );
        
        feedbackSnapshot = await getDocs(q);
      }
      
      // If still no results, try just by activityId
      if (feedbackSnapshot.empty) {
        q = query(
          collection(db, 'feedback'), 
          where('activityId', '==', activityId)
        );
        
        feedbackSnapshot = await getDocs(q);
        
        // Try to find one matching this user
        if (!feedbackSnapshot.empty) {
          const potentialMatch = feedbackSnapshot.docs.find(doc => {
            const data = doc.data();
            return data.userId?.includes(userId) || data.studentId?.includes(userId) || 
                   data.userEmail === auth.currentUser?.email;
          });
          
          if (potentialMatch) {
            return {
              id: potentialMatch.id,
              ...potentialMatch.data()
            };
          }
        }
      } else if (!feedbackSnapshot.empty) {
        // Found a direct match with one of the first two queries
        const feedbackDoc = feedbackSnapshot.docs[0];
        return {
          id: feedbackDoc.id,
          ...feedbackDoc.data()
        };
      }
      
      return null;
    } catch (err) {
      console.error(`Error fetching feedback for activity ${activityId}:`, err);
      return null;
    }
  };

  // Process activities from context
  useEffect(() => {
    const processActivities = async () => {
      // If context or user session is still loading, maintain skeleton loading state
      if (contextLoading || userLoading || statusLoading) {
        setLoading(true);
        return;
      }

      if (contextActivities && contextActivities.length > 0) {
        try {
          setLoading(true);
          
          const processedActivities = await Promise.all(contextActivities.map(async (data) => {
            // For activities, always fetch the latest data to get updated ratings
            let latestData = data;
            const freshData = await fetchLatestActivityData(data.id);
            if (freshData) {
              latestData = freshData;
            }
            
            // Format date strings
            const activityDate = latestData.activityDate ? new Date(latestData.activityDate) : null;
            const formattedDate = activityDate ? activityDate.toLocaleDateString() : '';
            
            // Calculate due date (30 days after activity date)
            const dueDate = activityDate ? new Date(activityDate) : new Date();
            dueDate.setDate(dueDate.getDate() + 30);
            
            // If it's a submitted activity, also fetch user's personal feedback to get rating and edit status
            let userRating = 0;
            if (isActivitySubmitted(latestData.id)) {
              const userFeedback = await fetchUserFeedback(latestData.id);
              if (userFeedback && userFeedback.rating) {
                userRating = parseFloat(userFeedback.rating);
                
                // Store this rating in the state for quick access
                setActivityRatings(prev => ({
                  ...prev,
                  [latestData.id]: userRating
                }));

                // Store edit status
                setFeedbackEditStatus(prev => ({
                  ...prev,
                  [latestData.id]: userFeedback.hasBeenEdited || false
                }));
              }
            }
            
            // Extract all image URLs
            const allImages = [];
            if (latestData.mainImage) allImages.push(latestData.mainImage);
            if (Array.isArray(latestData.fileUrls)) {
              latestData.fileUrls.forEach(f => {
                const url = typeof f === 'string' ? f : f?.url;
                if (url && !allImages.includes(url)) allImages.push(url);
              });
            }
            if (Array.isArray(latestData.images)) {
              latestData.images.forEach(img => {
                const url = typeof img === 'string' ? img : img?.url;
                if (url && !allImages.includes(url)) allImages.push(url);
              });
            }

            return {
              id: latestData.id,
              title: latestData.activityName || 'Untitled Activity',
              description: latestData.description || '',
              branch: latestData.courseName || latestData.branch || '',
              year: latestData.className || latestData.year || '',
              faculty: latestData.facultyName || '',
              date: formattedDate,
              dueDate: dueDate.toISOString().split('T')[0],
              image: latestData.mainImage || (allImages.length > 0 ? allImages[0] : 'https://placehold.co/600x400/lightgray/white?text=Activity'),
              images: allImages,
              pages: latestData.pages || latestData.pdfPages || null,
              fileUrls: latestData.fileUrls || [],
              mainImage: latestData.mainImage || null,
              totalUsers: latestData.totalStudents || 0,
              averageRating: latestData.averageRating || 0,
              userRating: userRating,
              academicYear: latestData.academicYear,
            };
          }));
          
          setActivities(processedActivities);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error processing activities:", err);
          setError("Failed to process activities. Please try again later.");
          setLoading(false);
        }
      } else {
        setActivities([]);
        setLoading(false);
      }
    };

    processActivities();
  }, [contextActivities, contextLoading, userLoading, statusLoading, isActivitySubmitted]);

  // Refresh data when returning from feedback submission and ensure activeTab is 'all'
  useEffect(() => {
    if (location.state?.fromActivities || location.state?.feedbackSubmitted) {
      setActiveTab('all');
      setLoading(true);
      
      // If the context has a refresh function, use it
      if (typeof refreshActivities === 'function') {
        refreshActivities();
      }
    }
  }, [location.state, refreshActivities]);

  // Dynamic list of selectable academic years including current and active filter
  const availableAcademicYears = useMemo(() => {
    const list = ['2024-25', '2025-26', '2026-27', '2027-28', '2028-29', '2029-30'];
    const cur = getCurrentAcademicYear();
    if (cur && !list.includes(cur)) list.push(cur);
    if (academicYearFilter && !list.includes(academicYearFilter) && academicYearFilter !== 'all') {
      list.push(academicYearFilter);
    }
    return list;
  }, [academicYearFilter]);

  // Memoize filtered activities
  const filteredActivities = useMemo(() => {
    // Make sure we have activities data
    if (!activities || activities.length === 0) {
      return [];
    }

    // Make sure we have the user status function
    const checkSubmitted = typeof isActivitySubmitted === 'function' 
      ? isActivitySubmitted 
      : () => false;

    // Map activities to include submission status
    const activitiesWithStatus = activities.map(activity => {
      const submitted = checkSubmitted(activity.id);
      return { 
        ...activity, 
        status: submitted ? 'submitted' : 'pending',
        // Use the stored user rating if available
        averageRating: activityRatings[activity.id] || activity.averageRating || 0
      };
    });
    
    // Then filter based on tab and search
    return activitiesWithStatus.filter(activity => {
      // Filter by tab
      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'submitted' && activity.status === 'submitted') ||
        (activeTab === 'pending' && activity.status === 'pending');
      
      // Filter by search term
      const matchesSearch = searchTerm 
        ? activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          activity.faculty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.branch?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      // Filter by academic year and class name (shows all activities when "All Academic Years" or "All Years" selected)
      const matchesAcademicYear = 
        !academicYearFilter || 
        academicYearFilter === '' || 
        academicYearFilter === 'all' || 
        (activity.academicYear && activity.academicYear.toString().trim().toLowerCase() === academicYearFilter.toString().trim().toLowerCase());

      const matchesClassName = 
        !classNameFilter || 
        classNameFilter === '' || 
        classNameFilter === 'all' || 
        (activity.year && activity.year.toString().trim().toLowerCase() === classNameFilter.toString().trim().toLowerCase());
      
      return matchesTab && matchesSearch && matchesAcademicYear && matchesClassName;
    });
  }, [activities, searchTerm, activeTab, isActivitySubmitted, activityRatings, academicYearFilter, classNameFilter]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleActivitySelect = (activityId) => {
    const selectedActivity = activities.find(activity => activity.id === activityId);
    if (selectedActivity) {
      navigate(`/ProvideFeedbackPage/${activityId}`, {
        state: {
          activity: selectedActivity,
          fromActivities: true
        }
      });
    }
  };

  const handleViewFeedback = (activityId) => {
    const selectedActivity = activities.find(activity => activity.id === activityId);
    navigate(`/viewfeedbackpage/${activityId}`, {
      state: {
        activity: selectedActivity
      }
    });
  };

  const handleEditFeedback = async (activityId) => {
    // Find the activity from the locally processed 'activities' list.
    // This is crucial because this list contains the formatted properties 
    // like 'title' and 'dueDate' that the ProvideFeedbackPage expects.
    const activityToEdit = activities.find(act => act.id === activityId);

    if (activityToEdit) {
      // Pass the full, processed activity object via state.
      navigate(`/ProvideFeedbackPage/${activityId}`, {
        state: {
          activity: activityToEdit,
          isEditing: true
        }
      });
    } else {
      console.error("Could not find activity to edit in the processed list.");
      showToastMessage("Error: Could not load activity data to edit.", "error");
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Calculate days remaining until due date
  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location);
    url.searchParams.set('tab', activeTab);
    window.history.pushState({}, '', url);
  }, [activeTab]);

  // Function to render star ratings (optically centered and perfectly even)
  const renderStarRating = (rating) => {
    const numRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
    const fullStars = Math.floor(numRating);
    const halfStar = numRating % 1 >= 0.5;
    const emptyStars = Math.max(0, 5 - fullStars - (halfStar ? 1 : 0));

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle', lineHeight: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', lineHeight: 0 }}>
          {[...Array(fullStars)].map((_, i) => (
            <FaStar key={`full-${i}`} style={{ color: '#f59e0b', width: '13px', height: '13px', display: 'block' }} />
          ))}
          {halfStar && <FaStar key="half" style={{ color: '#f59e0b', width: '13px', height: '13px', display: 'block' }} />}
          {[...Array(emptyStars)].map((_, i) => (
            <FaStar key={`empty-${i}`} style={{ color: darkMode ? '#4b5563' : '#d1d5db', width: '13px', height: '13px', display: 'block' }} />
          ))}
        </div>
        <span 
          style={{ 
            fontSize: '13px', 
            fontWeight: 600, 
            color: darkMode ? '#94a3b8' : '#64748b', 
            marginLeft: '4px',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          ({numRating.toFixed(1)})
        </span>
      </div>
    );
  };

  // Renders description with 2 lines preview, and "more..." placed directly inline on the 2nd (topic) line
  const renderDescription = (activity) => {
    const desc = activity.description || '';
    if (!desc.trim()) {
      return <p className="leading-relaxed" style={{ margin: 0 }}>No description provided.</p>;
    }

    const isExpanded = expandedActivityId === activity.id;

    if (isExpanded) {
      return (
        <div>
          <span className="whitespace-pre-wrap leading-relaxed inline" style={{ margin: 0 }}>
            {desc}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedActivityId(null);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: darkMode ? '#38bdf8' : '#0284c7',
              fontWeight: 700,
              fontSize: '12px',
              padding: 0,
              marginLeft: '6px',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline'
            }}
            className="hover:underline active:opacity-80"
          >
            Show less
          </button>
        </div>
      );
    }

    // Split lines by newline
    const lines = desc.split('\n');
    let hasMore = false;
    let previewLines = [];

    if (lines.length > 2) {
      // Multiple lines: show only line 1 and line 2 (e.g. topic line)
      let line2 = lines[1];
      if (line2.length > 85) {
        line2 = line2.substring(0, 80).trim() + '...';
      }
      previewLines = [lines[0], line2];
      hasMore = true;
    } else if (lines.length === 2) {
      // 2 lines: check total length across the 2 lines
      if (lines[0].length + lines[1].length > 160) {
        previewLines = [lines[0], lines[1].substring(0, 75).trim() + '...'];
        hasMore = true;
      } else {
        previewLines = [lines[0], lines[1]];
        hasMore = false;
      }
    } else {
      // Single continuous paragraph: show 2 full lines preview (~165 chars) and "more..." at 2nd line
      if (desc.length > 165) {
        previewLines = [desc.substring(0, 160).trim() + '...'];
        hasMore = true;
      } else {
        previewLines = [desc];
        hasMore = false;
      }
    }

    const previewText = previewLines.join('\n');

    return (
      <div>
        <span className="whitespace-pre-wrap leading-relaxed inline" style={{ margin: 0 }}>
          {previewText}
          {hasMore && !previewText.endsWith('...') ? '... ' : ' '}
        </span>
        {hasMore && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedActivityId(activity.id);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: darkMode ? '#38bdf8' : '#0284c7',
              fontWeight: 700,
              fontSize: '12px',
              padding: 0,
              marginLeft: '4px',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline'
            }}
            className="hover:underline active:opacity-80"
          >
            more...
          </button>
        )}
      </div>
    );
  };

  const calculateAverageRating = useMemo(() => {
    if (!submittedActivities.length) return 0;
    
    const sum = submittedActivities.reduce((total, activityId) => {
      return total + (activityRatings[activityId] || 0);
    }, 0);
    
    return (sum / submittedActivities.length).toFixed(1);
  }, [submittedActivities, activityRatings]);

  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleToggleZoom = (e) => {
    if (e) e.stopPropagation();
    if (zoomLevel > 1) {
      resetZoom();
    } else {
      setZoomLevel(2.2);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = (e) => {
    if (e) e.stopPropagation();
    setZoomLevel(prev => Math.min(Number((prev + 0.4).toFixed(1)), 3.5));
  };

  const handleZoomOut = (e) => {
    if (e) e.stopPropagation();
    setZoomLevel(prev => {
      const next = Math.max(Number((prev - 0.4).toFixed(1)), 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleTouchStart = (e) => {
    touchMovedRef.current = false;
    if (e.touches && e.touches.length === 1) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (zoomLevel > 1) {
        setIsDragging(true);
        setDragStart({ x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y });
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length === 1) {
      const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
      if (dx > 8 || dy > 8) {
        touchMovedRef.current = true;
        hasDraggedRef.current = true;
      }
      if (isDragging && zoomLevel > 1) {
        setPanOffset({
          x: e.touches[0].clientX - dragStart.x,
          y: e.touches[0].clientY - dragStart.y
        });
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (touchMovedRef.current) {
      setTimeout(() => {
        hasDraggedRef.current = false;
        touchMovedRef.current = false;
      }, 150);
    }
  };

  const handleImageTouchEnd = (e) => {
    if (!touchMovedRef.current) {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        handleToggleZoom(e);
      }
      lastTapRef.current = now;
    }
  };

  const handleMouseDown = (e) => {
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    if (zoomLevel > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      const dx = Math.abs(e.clientX - dragStartPosRef.current.x);
      const dy = Math.abs(e.clientY - dragStartPosRef.current.y);
      if (dx > 5 || dy > 5) {
        hasDraggedRef.current = true;
      }
      e.preventDefault();
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (hasDraggedRef.current) {
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 150);
    }
  };

  const handleBackdropClick = (e) => {
    if (hasDraggedRef.current || touchMovedRef.current) {
      return;
    }
    closeImageModal();
  };

  const toggleNativeFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        if (modalContainerRef.current?.requestFullscreen) {
          modalContainerRef.current.requestFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    } catch (err) {
      console.log('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isImageModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (zoomLevel > 1) {
          resetZoom();
        } else {
          closeImageModal();
        }
      } else if (e.key === 'ArrowLeft' && modalImages.length > 1) {
        handlePrevModalImage();
      } else if (e.key === 'ArrowRight' && modalImages.length > 1) {
        handleNextModalImage();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, zoomLevel, modalImages.length]);

  const openImageModal = (activityOrImages, initialIndex = 0) => {
    let imagesList = [];
    let title = '';
    let pagesCount = null;
    if (Array.isArray(activityOrImages)) {
      imagesList = activityOrImages;
    } else if (activityOrImages && typeof activityOrImages === 'object') {
      title = activityOrImages.title || activityOrImages.activityName || '';
      pagesCount = activityOrImages.pages || activityOrImages.pdfPages || null;
      if (Array.isArray(activityOrImages.images) && activityOrImages.images.length > 0) {
        imagesList = activityOrImages.images;
      } else if (activityOrImages.mainImage) {
        imagesList = [activityOrImages.mainImage];
      } else if (activityOrImages.image) {
        imagesList = [activityOrImages.image];
      }
    } else if (typeof activityOrImages === 'string') {
      imagesList = [activityOrImages];
    }
    
    setModalImages(imagesList);
    setModalActivityTitle(title);
    setModalPagesCount(pagesCount);
    setActiveModalImageIndex(initialIndex);
    resetZoom();
    setIsImageModalOpen(true);
  };

  const handlePrevModalImage = (e) => {
    if (e) e.stopPropagation();
    resetZoom();
    setActiveModalImageIndex(prev => (prev === 0 ? modalImages.length - 1 : prev - 1));
  };

  const handleNextModalImage = (e) => {
    if (e) e.stopPropagation();
    resetZoom();
    setActiveModalImageIndex(prev => (prev === modalImages.length - 1 ? 0 : prev + 1));
  };

  const closeImageModal = () => {
    if (document.fullscreenElement) {
      try { document.exitFullscreen(); } catch {}
    }
    setIsImageModalOpen(false);
    setModalImages([]);
    setModalPagesCount(null);
    setActiveModalImageIndex(0);
    resetZoom();
  };

  const renderCardView = (activity) => {
    const days = getDaysRemaining(activity.dueDate);
    const isUrgent = days <= 3;
    const isSoon = days <= 7;

    return (
      <div 
        key={activity.id} 
        className="group/card activity-item-hover rounded-2xl flex flex-col justify-between overflow-hidden"
      >
        {/* Compact Image Block */}
        <div className="p-3 pb-0">
          <div 
            className="relative group/img cursor-pointer select-none rounded-xl overflow-hidden w-full h-36 transition-all duration-300"
            onClick={() => openImageModal(activity)}
            style={{
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(226, 232, 240, 0.9)',
              boxShadow: darkMode ? '0 2px 8px rgba(0, 0, 0, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
              backgroundColor: darkMode ? '#0f172a' : '#f8fafc'
            }}
          >
            <ActivityThumbnail 
              src={activity.image} 
              alt={activity.title} 
              darkMode={darkMode}
              className=""
            />
            {/* Status Pill Badge over top-right */}
            <div className="absolute top-2.5 right-2.5 z-10">
              <span 
                style={{
                  backgroundColor: activity.status === 'pending'
                    ? (darkMode ? 'rgba(239, 68, 68, 0.9)' : 'rgba(254, 242, 242, 0.95)')
                    : (darkMode ? 'rgba(34, 197, 94, 0.9)' : 'rgba(240, 253, 244, 0.95)'),
                  color: activity.status === 'pending'
                    ? (darkMode ? '#ffffff' : '#dc2626')
                    : (darkMode ? '#ffffff' : '#16a34a'),
                  border: activity.status === 'pending'
                    ? (darkMode ? '1px solid rgba(248, 113, 113, 0.8)' : '1.5px solid #f87171')
                    : (darkMode ? '1px solid rgba(74, 222, 128, 0.8)' : '1.5px solid #4ade80'),
                  borderRadius: '9999px',
                  padding: '2px 9px',
                  fontSize: '11px',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                  backdropFilter: 'blur(6px)'
                }}
              >
                {activity.status === 'pending' ? 'Pending' : 'Submitted'}
              </span>
            </div>

            {/* Academic Year Badge over bottom-left */}
            {activity.academicYear && (
              <div className="absolute bottom-2.5 left-2.5 z-10">
                <span 
                  style={{
                    backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.92)',
                    color: darkMode ? '#93c5fd' : '#1d4ed8',
                    border: darkMode ? '1px solid rgba(147, 197, 253, 0.4)' : '1px solid #bfdbfe',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backdropFilter: 'blur(6px)'
                  }}
                >
                  {activity.academicYear}
                </span>
              </div>
            )}

            {/* Hover Overlay with View Badge */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3">
              <span 
                className="text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md"
                style={{ 
                  background: darkMode ? 'rgba(51, 65, 85, 0.92)' : 'rgba(241, 245, 249, 0.95)', 
                  border: darkMode ? '1px solid rgba(148, 163, 184, 0.35)' : '1px solid rgba(203, 213, 225, 0.9)', 
                  boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.12)',
                  color: darkMode ? '#f8fafc' : '#334155'
                }}
              >
                <FaExpand className="text-[10px]" />
                <span>View</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex-grow flex flex-col justify-between">
          <div>
            {/* Title & Badges */}
            <div className="mb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                {activity.branch && (
                  <span 
                    style={{
                      backgroundColor: darkMode ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff',
                      color: darkMode ? '#c4b5fd' : '#6d28d9',
                      border: darkMode ? '1px solid rgba(196, 181, 253, 0.35)' : '1px solid #ddd6fe',
                      borderRadius: '6px',
                      padding: '1px 8px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    {activity.branch}
                  </span>
                )}
                {activity.year && (
                  <span 
                    style={{
                      backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
                      color: darkMode ? '#fcd34d' : '#b45309',
                      border: darkMode ? '1px solid rgba(252, 211, 77, 0.35)' : '1px solid #fde68a',
                      borderRadius: '6px',
                      padding: '1px 8px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    {activity.year}
                  </span>
                )}
              </div>

              <h3
                className="text-base font-bold leading-snug overflow-hidden mb-1.5"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  color: darkMode ? '#f8fafc' : '#0f172a',
                  fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                  letterSpacing: '-0.01em',
                }}
                title={activity.title}
              >
                {activity.title}
              </h3>
            </div>

            {/* Description (immediately below title) */}
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              {renderDescription(activity)}
            </div>
          </div>

          {/* Bottom Area: Faculty name sticks to that line (exact above that line), followed by divider line and footer actions */}
          <div className="mt-auto">
            {/* Faculty & Date Row: Stuck exact above the divider line */}
            <div className="flex items-center justify-between text-xs pb-2">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0 }}>
                  <FaUser style={{ color: darkMode ? '#9ca3af' : '#374151', width: '11px', height: '11px', flexShrink: 0 }} />
                </span>
                <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '12px', flexShrink: 0 }}>Faculty:</span>
                <span style={{ fontWeight: 600, color: darkMode ? '#f1f5f9' : '#0f172a', fontSize: '12px' }} className="truncate">
                  {activity.faculty || 'Not specified'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }} title={`Due: ${new Date(activity.dueDate).toLocaleDateString()}`}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0 }}>
                  <FaCalendarAlt style={{ color: darkMode ? '#9ca3af' : '#374151', width: '11px', height: '11px', flexShrink: 0 }} />
                </span>
                <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '12px' }}>
                  {activity.date}
                </span>
              </div>
            </div>

            {/* That Line */}
            <div className="pt-2.5 border-t border-slate-100/90 dark:border-slate-700/60">
              {activity.status === 'pending' ? (
                <div className="flex items-center justify-between gap-2">
                  {days < 0 ? (
                    <div 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                        color: darkMode ? '#fca5a5' : '#b91c1c',
                        borderRadius: '9999px',
                        padding: '3px 9px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                      <span>{Math.abs(days)}d overdue</span>
                    </div>
                  ) : days === 0 ? (
                    <div 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
                        color: darkMode ? '#fcd34d' : '#b45309',
                        borderRadius: '9999px',
                        padding: '3px 9px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                      <span>Due today</span>
                    </div>
                  ) : (
                    <div 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: isUrgent
                          ? (darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2')
                          : isSoon
                            ? (darkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7')
                            : (darkMode ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7'),
                        color: isUrgent
                          ? (darkMode ? '#fca5a5' : '#b91c1c')
                          : isSoon
                            ? (darkMode ? '#fcd34d' : '#b45309')
                            : (darkMode ? '#86efac' : '#15803d'),
                        borderRadius: '9999px',
                        padding: '3px 9px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      <span 
                        style={{ 
                          width: '5px', 
                          height: '5px', 
                          borderRadius: '50%', 
                          backgroundColor: isUrgent ? '#ef4444' : isSoon ? '#f59e0b' : '#22c55e' 
                        }} 
                      />
                      <span>{days}d left</span>
                    </div>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivitySelect(activity.id);
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all duration-200 active:scale-95 hover:brightness-110 ml-auto"
                    style={{ background: 'linear-gradient(135deg,#0284c7,#075985)', color: '#fff', boxShadow: '0 3px 10px rgba(2,132,199,0.3)' }}
                  >
                    Provide Feedback
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-1.5">
                  {/* Rating in place of overdue / remaining days */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: darkMode ? '#94a3b8' : '#64748b' }}>Rating:</span>
                    {renderStarRating(activity.averageRating)}
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                    {feedbackEditStatus[activity.id] ? (
                      <button 
                        disabled={true}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-not-allowed select-none transition-all duration-200"
                        style={{
                          background: darkMode 
                            ? 'linear-gradient(135deg, rgba(51, 65, 85, 0.6) 0%, rgba(30, 41, 59, 0.7) 100%)' 
                            : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                          color: darkMode ? '#94a3b8' : '#64748b',
                          border: darkMode ? '1px solid rgba(71, 85, 105, 0.6)' : '1px solid rgba(203, 213, 225, 0.8)',
                        }}
                        title="Feedback has already been edited"
                      >
                        <FaEdit className="w-3 h-3 opacity-70" />
                        <span>Edited</span>
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFeedback(activity.id);
                        }}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all duration-200 active:scale-95 hover:brightness-110"
                        style={{ background: 'linear-gradient(135deg,#0284c7,#075985)', color: '#fff', boxShadow: '0 3px 10px rgba(2,132,199,0.3)' }}
                        title="Edit Feedback"
                      >
                        <FaEdit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFeedback(activity.id);
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white transition-all duration-200 active:scale-95 hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg,#059669,#065f46)', boxShadow: '0 3px 10px rgba(5,150,105,0.3)' }}
                    >
                      View Feedback
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderListView = (activity) => {
    const days = getDaysRemaining(activity.dueDate);
    const isUrgent = days <= 3;
    const isSoon = days <= 7;

    return (
      <div 
        key={activity.id} 
        className="activity-item-hover rounded-2xl overflow-hidden"
      >
        <div className="flex flex-col md:flex-row">
          {/* Modern Image Container */}
          <div className="p-3.5 sm:p-4 flex items-center justify-center flex-shrink-0">
            <div 
              className="relative group cursor-pointer select-none rounded-xl overflow-hidden w-full md:w-52 h-40 transition-all duration-300"
              onClick={() => openImageModal(activity)}
              style={{
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(226, 232, 240, 0.9)',
                boxShadow: darkMode ? '0 2px 8px rgba(0, 0, 0, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                backgroundColor: darkMode ? '#0f172a' : '#f8fafc'
              }}
            >
              <ActivityThumbnail 
                src={activity.image} 
                alt={activity.title} 
                darkMode={darkMode}
                className=""
              />
              {/* Hover Overlay with View Badge (Mild grey background, just 'View') */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                <span 
                  className="text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md"
                  style={{ 
                    background: darkMode ? 'rgba(51, 65, 85, 0.92)' : 'rgba(241, 245, 249, 0.95)', 
                    border: darkMode ? '1px solid rgba(148, 163, 184, 0.35)' : '1px solid rgba(203, 213, 225, 0.9)', 
                    boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.12)',
                    color: darkMode ? '#f8fafc' : '#334155'
                  }}
                >
                  <FaExpand className="text-[10px]" />
                  <span>View</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-4 sm:p-4.5 flex-grow flex flex-col justify-between">
            <div>
              {/* Title and Top Badges */}
              <div className="flex justify-between items-start mb-2.5 gap-3">
                <h3
                  className="text-base sm:text-lg font-bold leading-snug overflow-hidden"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                    flex: '1 1 0%',
                    color: darkMode ? '#f8fafc' : '#0f172a',
                    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                    letterSpacing: '-0.01em',
                  }}
                >
                  {activity.title}
                </h3>
                <div className="flex flex-wrap gap-1.5 flex-shrink-0 justify-end items-center" style={{ maxWidth: '58%' }}>
                  {/* Academic Year: Mild Blue */}
                  {activity.academicYear && (
                    <span 
                      style={{
                        backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                        color: darkMode ? '#93c5fd' : '#1d4ed8',
                        border: darkMode ? '1px solid rgba(147, 197, 253, 0.35)' : '1px solid #bfdbfe',
                        borderRadius: '8px',
                        padding: '2px 9px',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {activity.academicYear}
                    </span>
                  )}
                  {/* Branch: Mild Purple */}
                  {activity.branch && (
                    <span 
                      style={{
                        backgroundColor: darkMode ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff',
                        color: darkMode ? '#c4b5fd' : '#6d28d9',
                        border: darkMode ? '1px solid rgba(196, 181, 253, 0.35)' : '1px solid #ddd6fe',
                        borderRadius: '8px',
                        padding: '2px 9px',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {activity.branch}
                    </span>
                  )}
                  {/* Year (FE / SE / TE / BE): Mild Amber / Warm Gold (avoids duplicate green with submitted) */}
                  {activity.year && (
                    <span 
                      style={{
                        backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
                        color: darkMode ? '#fcd34d' : '#b45309',
                        border: darkMode ? '1px solid rgba(252, 211, 77, 0.35)' : '1px solid #fde68a',
                        borderRadius: '8px',
                        padding: '2px 9px',
                        fontSize: '11px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {activity.year}
                    </span>
                  )}
                  {/* Pending / Submitted with clean red / green outline effect */}
                  <span 
                    style={{
                      backgroundColor: activity.status === 'pending'
                        ? (darkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2')
                        : (darkMode ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4'),
                      color: activity.status === 'pending'
                        ? (darkMode ? '#fca5a5' : '#dc2626')
                        : (darkMode ? '#86efac' : '#16a34a'),
                      border: activity.status === 'pending'
                        ? (darkMode ? '1.5px solid rgba(248, 113, 113, 0.6)' : '1.5px solid #f87171')
                        : (darkMode ? '1.5px solid rgba(74, 222, 128, 0.6)' : '1.5px solid #4ade80'),
                      boxShadow: activity.status === 'pending'
                        ? '0 1px 3px rgba(239, 68, 68, 0.12)'
                        : '0 1px 3px rgba(34, 197, 94, 0.12)',
                      borderRadius: '8px',
                      padding: '2px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {activity.status === 'pending' ? 'Pending' : 'Submitted'}
                  </span>
                </div>
              </div>

              {/* Description (max 2 lines preview in collapsed mode, with more... at 2nd line) */}
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3">
                {renderDescription(activity)}
              </div>

              {/* Meta Details Row with previous black/neutral icons, properly centered */}
              <div 
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  columnGap: '20px',
                  rowGap: '8px',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
                  border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                  marginBottom: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0, marginTop: '-2px' }}>
                    <FaUser style={{ color: darkMode ? '#9ca3af' : '#374151', width: '12px', height: '12px', flexShrink: 0 }} />
                  </span>
                  <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>Faculty:</span>
                  <span style={{ fontWeight: 600, color: darkMode ? '#f1f5f9' : '#0f172a', fontSize: '13px' }} className="truncate max-w-[140px] sm:max-w-none">
                    {activity.faculty || 'Not specified'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0, marginTop: '-2px' }}>
                    <FaCalendarAlt style={{ color: darkMode ? '#9ca3af' : '#374151', width: '12px', height: '12px', flexShrink: 0 }} />
                  </span>
                  <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>Date:</span>
                  <span style={{ fontWeight: 500, color: darkMode ? '#f1f5f9' : '#0f172a', fontSize: '13px' }}>
                    {activity.date}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0, marginTop: '-2px' }}>
                    <FaChalkboardTeacher style={{ color: darkMode ? '#9ca3af' : '#374151', width: '12px', height: '12px', flexShrink: 0 }} />
                  </span>
                  <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>Due:</span>
                  <span style={{ fontWeight: 500, color: darkMode ? '#f1f5f9' : '#0f172a', fontSize: '13px' }}>
                    {new Date(activity.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer: Due/Overdue Badge (Soft pill, no harsh outline) & Actions */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-100/90 dark:border-slate-700/60">
              {activity.status === 'pending' ? (
                <>
                  {days < 0 ? (
                    <div 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                        color: darkMode ? '#fca5a5' : '#b91c1c',
                        border: 'none',
                        borderRadius: '9999px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                      <span>{Math.abs(days)} days overdue</span>
                    </div>
                  ) : days === 0 ? (
                    <div 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
                        color: darkMode ? '#fcd34d' : '#b45309',
                        border: 'none',
                        borderRadius: '9999px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                      <span>Due today</span>
                    </div>
                  ) : (
                    <div 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: isUrgent
                          ? (darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2')
                          : isSoon
                            ? (darkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7')
                            : (darkMode ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7'),
                        color: isUrgent
                          ? (darkMode ? '#fca5a5' : '#b91c1c')
                          : isSoon
                            ? (darkMode ? '#fcd34d' : '#b45309')
                            : (darkMode ? '#86efac' : '#15803d'),
                        border: 'none',
                        borderRadius: '9999px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      <span 
                        style={{ 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          backgroundColor: isUrgent ? '#ef4444' : isSoon ? '#f59e0b' : '#22c55e' 
                        }} 
                      />
                      <span>{days} days remaining</span>
                    </div>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivitySelect(activity.id);
                    }}
                    className="text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-200 active:scale-95 hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg,#0284c7,#075985)', color: '#fff', boxShadow: '0 4px 14px rgba(2,132,199,0.35)' }}
                  >
                    Provide Feedback
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', lineHeight: 1 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: darkMode ? '#94a3b8' : '#64748b', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>Rating:</span>
                    {renderStarRating(activity.averageRating)}
                  </div>
                  <div className="flex items-center space-x-2">
                    {feedbackEditStatus[activity.id] ? (
                      <button 
                        disabled={true}
                        className="text-sm font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-not-allowed select-none transition-all duration-200"
                        style={{
                          background: darkMode 
                            ? 'linear-gradient(135deg, rgba(51, 65, 85, 0.6) 0%, rgba(30, 41, 59, 0.7) 100%)' 
                            : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                          color: darkMode ? '#94a3b8' : '#64748b',
                          border: darkMode ? '1px solid rgba(71, 85, 105, 0.6)' : '1px solid rgba(203, 213, 225, 0.8)',
                          boxShadow: darkMode ? '0 2px 6px rgba(0, 0, 0, 0.2)' : '0 2px 6px rgba(148, 163, 184, 0.15)',
                        }}
                        title="Feedback has already been edited"
                      >
                        <FaEdit className="w-3.5 h-3.5 opacity-70" />
                        <span>Edited</span>
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFeedback(activity.id);
                        }}
                        className="text-sm font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-200 active:scale-95 hover:brightness-110"
                        style={{ background: 'linear-gradient(135deg,#0284c7,#075985)', color: '#fff', boxShadow: '0 4px 14px rgba(2,132,199,0.35)' }}
                        title="Edit Feedback"
                      >
                        <FaEdit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFeedback(activity.id);
                      }}
                      className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all duration-200 active:scale-95 hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg,#059669,#065f46)', boxShadow: '0 4px 14px rgba(5,150,105,0.35)' }}
                    >
                      View Feedback
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen pt-[4.5rem] ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'} transition-colors duration-300`}>
      {/* Navigation Bar */}
      <Navbar 
        darkMode={darkMode} 
        toggleSidebar={toggleSidebar} 
        showProfileMenu={showProfileMenu}
        toggleProfileMenu={toggleProfileMenu}
        sidebarOpen={sidebarOpen}
        user={user}
        onEditDepartment={() => setShowDeptModal(true)}
      />

      {/* Sidebar */}
      <Sidebar 
        darkMode={darkMode}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleDarkMode={toggleDarkMode}
        activePage="all-activities"
      />

      {/* Department Selection Modal */}
      <DepartmentSelectionModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onSubmit={handleDepartmentUpdate}
        userType="student"
        currentDepartments={user?.departments || []}
        currentPrimaryDepartment={user?.primaryDepartment || user?.departments?.[0] || ''}
        currentYear={user?.year || user?.baseYear || ''}
        canEdit={(user?.departmentChangeCount || 0) < 1}
        darkMode={darkMode}
      />

      {/* Content area */}
      <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out min-h-screen flex flex-col fast-fade-in`}>
        <h2 className="text-2xl font-bold tracking-tight mb-5"
          style={{ color: darkMode ? '#38bdf8' : '#0369a1' }}>
          All Activities
        </h2>
        
        {/* Tab navigation */}
        <div className="mb-5 flex">
          <div 
            className="inline-flex items-center p-1 rounded-xl transition-colors"
            style={{
              backgroundColor: darkMode ? '#1e293b' : '#f1f5f9',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0'
            }}
          >
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95 ${
                activeTab === 'all'
                  ? 'text-white shadow-md'
                  : darkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700/60' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
              style={activeTab === 'all' ? { background: 'linear-gradient(135deg,#0284c7,#075985)', boxShadow: '0 4px 14px rgba(2,132,199,0.35)' } : {}}
            >
              All
            </button>
            <button 
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95 ${
                activeTab === 'pending'
                  ? 'text-white shadow-md'
                  : darkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700/60' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
              style={activeTab === 'pending' ? { background: 'linear-gradient(135deg,#0284c7,#075985)', boxShadow: '0 4px 14px rgba(2,132,199,0.35)' } : {}}
            >
              Pending
            </button>
            <button 
              onClick={() => setActiveTab('submitted')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95 ${
                activeTab === 'submitted'
                  ? 'text-white shadow-md'
                  : darkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700/60' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
              style={activeTab === 'submitted' ? { background: 'linear-gradient(135deg,#0284c7,#075985)', boxShadow: '0 4px 14px rgba(2,132,199,0.35)' } : {}}
            >
              Submitted
            </button>
          </div>
        </div>
        
        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-grow min-w-[240px]">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <FaSearch className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="Search by activity, faculty, or keyword..."
                value={searchTerm}
                onChange={handleSearch}
                className={`w-full rounded-xl py-2.5 pl-10 pr-10 text-sm border transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  darkMode 
                    ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-700' 
                    : 'bg-white text-gray-800 placeholder-gray-400 border-gray-200 hover:border-gray-300'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  title="Clear search"
                  type="button"
                >
                  <FaTimes className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Academic Year Filter */}
            <div className="relative">
              <select
                value={academicYearFilter}
                onChange={(e) => handleAcademicYearFilterChange(e.target.value)}
                className={`w-full md:w-auto rounded-xl py-2.5 pl-3.5 pr-9 text-sm font-medium border transition-all duration-200 appearance-none shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  darkMode 
                    ? 'bg-gray-800 text-gray-200 border-gray-700 hover:border-gray-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <option value="">All Academic Years</option>
                {availableAcademicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {/* Class Name Filter */}
            <div className="relative">
              <select
                value={classNameFilter}
                onChange={(e) => handleClassNameFilterChange(e.target.value)}
                className={`w-full md:w-auto rounded-xl py-2.5 pl-3.5 pr-9 text-sm font-medium border transition-all duration-200 appearance-none shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  darkMode 
                    ? 'bg-gray-800 text-gray-200 border-gray-700 hover:border-gray-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <option value="">All Years</option>
                <option value="FE">FE</option>
                <option value="SE">SE</option>
                <option value="TE">TE</option>
                <option value="BE">BE</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* View Mode Switcher (List vs Card View) */}
            <div 
              className={`flex items-center p-1 rounded-xl border shadow-sm transition-all duration-200 ml-auto ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <button
                type="button"
                onClick={() => handleViewModeChange('list')}
                title="List View"
                aria-label="List View"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: viewMode === 'list' 
                    ? '#0284c7' 
                    : 'transparent',
                  color: viewMode === 'list' 
                    ? '#ffffff' 
                    : (darkMode ? '#94a3b8' : '#64748b')
                }}
                className={viewMode === 'list' ? 'shadow-sm' : 'hover:opacity-80'}
              >
                <FaList style={{ width: '13px', height: '13px' }} />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('card')}
                title="Card View"
                aria-label="Card View"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: viewMode === 'card' 
                    ? '#0284c7' 
                    : 'transparent',
                  color: viewMode === 'card' 
                    ? '#ffffff' 
                    : (darkMode ? '#94a3b8' : '#64748b')
                }}
                className={viewMode === 'card' ? 'shadow-sm' : 'hover:opacity-80'}
              >
                <FaThLarge style={{ width: '13px', height: '13px' }} />
                <span className="hidden sm:inline">Card</span>
              </button>
            </div>
        </div>
        
        {/* Loading State with image block */}
        {(loading || contextLoading || userLoading || statusLoading) && (
          <div className="py-2">
            <AllActivitiesSkeleton viewMode={viewMode} count={viewMode === 'card' ? 6 : 4} darkMode={darkMode} />
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="text-center p-8 rounded-lg bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
            <p>{error}</p>
          </div>
        )}
        
        {/* Activities List or Card View */}
        {!loading && !contextLoading && !userLoading && !statusLoading && !error && (
          <div className="flex-grow">
            {filteredActivities.length > 0 ? (
              viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredActivities.map((activity) => renderCardView(activity))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActivities.map((activity) => renderListView(activity))}
                </div>
              )
            ) : (
              <EmptyActivitiesState
                title="No activities found"
                darkMode={darkMode}
                stickerClassName="w-64 h-52 sm:w-80 sm:h-64 md:w-96 md:h-72"
              />
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          toastMessage.includes('error') || toastMessage.includes('cannot be edited')
            ? 'bg-red-600 text-white'
            : toastMessage.includes('success') || toastMessage.includes('Opening')
            ? 'bg-green-600 text-white'
            : darkMode ? 'bg-blue-800 text-white' : 'bg-blue-600 text-white'
        } ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
      {isImageModalOpen && modalImages.length > 0 && (
        <div 
          ref={modalContainerRef}
          className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden select-none"
          style={{
            backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.94)' : 'rgba(10, 15, 29, 0.92)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={handleBackdropClick}
        >
          {/* Top Bar Floating Controls */}
          <div 
            className="w-full flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 z-30 flex-shrink-0 gap-2"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)'
            }}
            onClick={handleBackdropClick}
          >
            {/* Top Left: Title, Counter, and PDF badge */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 max-w-[28%] sm:max-w-[36%]" onClick={e => e.stopPropagation()}>
              {modalImages.length > 1 && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 flex-shrink-0"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)'
                  }}
                >
                  {activeModalImageIndex + 1} / {modalImages.length}
                </span>
              )}
              {modalActivityTitle && (
                <span 
                  className="text-xs sm:text-sm font-semibold truncate inline-block"
                  style={{
                    color: '#ffffff',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)'
                  }}
                  title={modalActivityTitle}
                >
                  {modalActivityTitle}
                </span>
              )}
            </div>

            {/* Top Center: PDF Toolbar Slot */}
            {currentIsPdf && (
              <div id="pdf-modal-toolbar-slot" className="flex items-center justify-center min-w-0 flex-1 px-1" onClick={e => e.stopPropagation()} />
            )}

            {/* Top Right: Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
              {!currentIsPdf && (
                <>
                  {/* Zoom Out Button */}
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'rgba(255, 255, 255, 0.14)',
                      color: '#ffffff',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      padding: 0
                    }}
                    title="Zoom Out (-)"
                  >
                    <FaSearchMinus className="text-xs" />
                  </button>

                  {/* Zoom Level Indicator / Reset Button */}
                  {zoomLevel > 1 && (
                    <button
                      type="button"
                      onClick={resetZoom}
                      className="text-xs px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer active:scale-95"
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: '1px solid #38bdf8',
                        padding: '2px 8px'
                      }}
                      title="Click to reset zoom (100%)"
                    >
                      {Math.round(zoomLevel * 100)}%
                    </button>
                  )}

                  {/* Zoom In Button */}
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3.5}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'rgba(255, 255, 255, 0.14)',
                      color: '#ffffff',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      padding: 0
                    }}
                    title="Zoom In (+)"
                  >
                    <FaSearchPlus className="text-xs" />
                  </button>
                </>
              )}

              {/* Native Fullscreen Toggle */}
              <button
                type="button"
                onClick={toggleNativeFullscreen}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95"
                style={{
                  background: 'rgba(255, 255, 255, 0.14)',
                  color: '#ffffff',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: 0
                }}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <FaCompress className="text-xs" /> : <FaExpand className="text-xs" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeImageModal}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ml-1"
                style={{
                  background: 'rgba(239, 68, 68, 0.8)',
                  color: '#ffffff',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(248, 113, 113, 0.5)',
                  padding: 0
                }}
                title="Close (Esc)"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          </div>

          {/* Center Container */}
          <div 
            className="flex-1 w-full h-full flex items-center justify-center relative overflow-hidden px-2 sm:px-4 md:px-6 py-2"
            onClick={handleBackdropClick}
            onMouseDown={!currentIsPdf ? handleMouseDown : undefined}
            onMouseMove={!currentIsPdf ? handleMouseMove : undefined}
            onMouseUp={!currentIsPdf ? handleMouseUp : undefined}
            onMouseLeave={!currentIsPdf ? handleMouseUp : undefined}
            onTouchStart={!currentIsPdf ? handleTouchStart : undefined}
            onTouchMove={!currentIsPdf ? handleTouchMove : undefined}
            onTouchEnd={!currentIsPdf ? handleTouchEnd : undefined}
          >
            {/* Left Nav Arrow */}
            {modalImages.length > 1 && (
              <button
                type="button"
                onClick={handlePrevModalImage}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                  padding: 0
                }}
                title="Previous item"
              >
                <FaChevronLeft className="text-base" />
              </button>
            )}

            {/* Content: PDF Viewer or Image */}
            {currentIsPdf ? (
              <PdfModalViewer
                pdfUrl={currentModalItem}
                title={modalActivityTitle}
                pagesCount={modalPagesCount}
                zoomLevel={zoomLevel}
                onToggleZoom={handleToggleZoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={resetZoom}
                darkMode={darkMode}
              />
            ) : (
              /* The Image Itself */
              <img 
                src={currentModalItem} 
                alt="Activity full view"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={handleToggleZoom}
                onTouchEnd={handleImageTouchEnd}
                draggable={false}
                style={{
                  maxHeight: '84vh',
                  maxWidth: '92vw',
                  objectFit: 'contain',
                  transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                  transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)',
                  cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.6))'
                }}
                className="rounded-lg"
              />
            )}

            {/* Right Nav Arrow */}
            {modalImages.length > 1 && (
              <button
                type="button"
                onClick={handleNextModalImage}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                  padding: 0
                }}
                title="Next image"
              >
                <FaChevronRight className="text-base" />
              </button>
            )}
          </div>

          {/* Bottom Bar: Thumbnail dots (when multiple images) */}
          {modalImages.length > 1 && (
            <div 
              className="w-full flex items-center justify-center pb-3 pt-2 z-30 flex-shrink-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 70%, transparent 100%)'
              }}
              onClick={handleBackdropClick}
            >
              <div className="flex justify-center gap-1.5 py-1" onClick={e => e.stopPropagation()}>
                {modalImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetZoom();
                      setActiveModalImageIndex(idx);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === activeModalImageIndex
                        ? 'w-6 bg-sky-400'
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    style={{ border: 'none', padding: 0 }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* High-Contrast Floating Scroll-to-Top Button (Distinct from blue buttons, highly visible) */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        title="Scroll to top"
        style={{
          position: 'fixed',
          bottom: '26px',
          right: '26px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: darkMode 
            ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' 
            : 'linear-gradient(135deg, #0284c7 0%, #075985 100%)',
          color: '#ffffff',
          border: '2px solid rgba(255, 255, 255, 0.65)',
          boxShadow: darkMode 
            ? '0 6px 24px rgba(2, 132, 199, 0.6), 0 0 16px rgba(56, 189, 248, 0.5)' 
            : '0 6px 22px rgba(2, 132, 199, 0.45), 0 2px 8px rgba(0, 0, 0, 0.15)',
          cursor: 'pointer',
          zIndex: 99999,
          opacity: showScrollTop ? 1 : 0,
          visibility: showScrollTop ? 'visible' : 'hidden',
          transform: showScrollTop ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.8)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: 0,
          outline: 'none',
          pointerEvents: showScrollTop ? 'auto' : 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.12)';
          e.currentTarget.style.boxShadow = darkMode 
            ? '0 10px 30px rgba(147, 51, 234, 0.75), 0 0 22px rgba(99, 102, 241, 0.7)' 
            : '0 10px 28px rgba(79, 70, 229, 0.58), 0 0 16px rgba(124, 58, 237, 0.45)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = showScrollTop ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.8)';
          e.currentTarget.style.boxShadow = darkMode 
            ? '0 6px 24px rgba(99, 102, 241, 0.6), 0 0 16px rgba(147, 51, 234, 0.5)' 
            : '0 6px 22px rgba(79, 70, 229, 0.42), 0 2px 8px rgba(0, 0, 0, 0.15)';
        }}
      >
        <FaChevronUp style={{ width: '16px', height: '16px', color: '#ffffff' }} />
      </button>
    </div>
  );
};

export default AllActivitiesPage;