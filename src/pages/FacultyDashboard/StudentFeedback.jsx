import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "../../firebaseConfig";
import { resolveStudentDisplayName } from '../../utils/resolveStudentDisplayName';
import { useUserSession } from '../../UserSessionContext';
import { FaStarHalfAlt, FaStar, FaRegStar, FaTimes, FaEdit, FaTrash, FaCheckSquare, FaRegSquare, FaListUl, FaClone, FaExpand, FaCompress, FaChevronLeft, FaChevronRight, FaChevronUp, FaChevronDown, FaUser, FaCalendarAlt, FaComments, FaChartBar, FaGraduationCap, FaBuilding, FaSearchPlus, FaSearchMinus, FaFilePdf, FaDownload, FaRedo } from 'react-icons/fa';
import LogoutConfirmation from '../../components/LogoutConfirmation';
import { useNavigate } from 'react-router-dom';
import DepartmentSelectionModal from '../../components/DepartmentSelectionModal';
import { ActivityListSkeleton, FeedbackDetailSkeleton } from '../../components/FeedbackSkeleton';
import EmptyActivitiesState from '../../components/EmptyActivitiesState';

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
  url = url.replace(/\.pdf(\?.*)?$/i, '.jpg$1');
  return url;
};

const getCloudinaryPdfPage1 = (pdfUrl) => getCloudinaryPdfPageUrl(pdfUrl, 1, 600);

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
    script.onerror = () => reject(new Error('Failed to load pdf.js'));
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

// Sub-component for rendering thumbnail
const ActivityThumbnail = ({ src, alt, className = '', darkMode = false }) => {
  const isPdf = isPdfUrl(src);
  const [thumbUrl, setThumbUrl] = useState(() => {
    if (!isPdf) return src;
    const cloudUrl = getCloudinaryPdfPage1(src);
    if (cloudUrl) return cloudUrl;
    if (pdfThumbnailCache.has(src)) return pdfThumbnailCache.get(src);
    return 'https://placehold.co/600x400/lightgray/white?text=Loading+PDF...';
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
      return;
    }

    let isCancelled = false;
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
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [src, isPdf]);

  const handleImageError = () => {
    if (isPdf) {
      setLoadError(true);
    } else {
      setThumbUrl('https://placehold.co/600x400/lightgray/white?text=Activity');
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

const StudentFeedback = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUserSession();
  
  // Faculty & Admin users have edit and delete permissions (students do not)
  const hasEditDeletePermission = Boolean(user && user.role !== 'Student');
  
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [sidebarOpen, setSidebarOpen] = useState(() => { try { return JSON.parse(sessionStorage.getItem('sidebarOpen')) || false; } catch { return false; } });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [showCompleteFeedback, setShowCompleteFeedback] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [detailedFeedbackLoading, setDetailedFeedbackLoading] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editDeptDropdownOpen, setEditDeptDropdownOpen] = useState(false);
  const editDeptDropdownRef = useRef(null);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editForm, setEditForm] = useState({
    activityName: '',
    description: '',
    courseName: '',
    department: '',
    departments: [],
    className: '',
    academicYear: '',
    semester: '',
    activityDate: ''
  });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deletingActivities, setDeletingActivities] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [isMultiDelete, setIsMultiDelete] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [activityForDeptChange, setActivityForDeptChange] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
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
  const lastTapRef = useRef(0);
  const modalContainerRef = useRef(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const touchMovedRef = useRef(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const getCollapseStorageKey = (currentUser) => {
    if (currentUser?.uid) return `activityHeaderCollapsed_${currentUser.uid}`;
    if (currentUser?.email) return `activityHeaderCollapsed_${currentUser.email}`;
    return 'activityHeaderCollapsed';
  };

  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(() => {
    try {
      const key = getCollapseStorageKey(user);
      const stored = sessionStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored);
      return false;
    } catch {
      return false;
    }
  });

  const detailsScrollRef = useRef(null);
  const [showDetailsScrollTop, setShowDetailsScrollTop] = useState(false);

  const handleDetailsScroll = (e) => {
    const top = e?.target?.scrollTop || 0;
    setShowDetailsScrollTop(top > 160);
  };

  const scrollDetailsToTop = () => {
    if (detailsScrollRef.current) {
      detailsScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleWinScroll = () => {
      if (showMobileDetail && window.scrollY > 200) {
        setShowDetailsScrollTop(true);
      } else if (!detailsScrollRef.current || detailsScrollRef.current.scrollTop <= 160) {
        if (!showMobileDetail || window.scrollY <= 200) {
          setShowDetailsScrollTop(false);
        }
      }
    };
    window.addEventListener('scroll', handleWinScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWinScroll);
  }, [showMobileDetail]);

  useEffect(() => {
    setShowDetailsScrollTop(false);
    if (detailsScrollRef.current) {
      detailsScrollRef.current.scrollTop = 0;
    }
  }, [selectedActivity?.id]);

  // Keep state in sync if the logged-in user changes or loads
  useEffect(() => {
    try {
      const key = getCollapseStorageKey(user);
      const stored = sessionStorage.getItem(key);
      if (stored !== null) {
        setIsHeaderCollapsed(JSON.parse(stored));
      } else {
        setIsHeaderCollapsed(false);
      }
    } catch {
      /* ignore */
    }
  }, [user?.uid, user?.email]);

  const toggleHeaderCollapse = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    setIsHeaderCollapsed((prev) => {
      const next = !prev;
      try {
        const key = getCollapseStorageKey(user);
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('activityCommentsCollapsed')) || false;
    } catch {
      return false;
    }
  });

  const toggleCommentsCollapse = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    setIsCommentsCollapsed((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem('activityCommentsCollapsed', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setDarkModeInStorage(newMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleDepartmentSubmit = async ({ departments, primaryDepartment }) => {
    if (activityForDeptChange) {
      const targetActivity = activityForDeptChange;
      const updateData = {
        department: primaryDepartment || departments[0],
        departments: departments,
        updatedAt: new Date()
      };

      // Close modal and update state instantly
      setShowDepartmentModal(false);
      setActivityForDeptChange(null);
      setActivities(prev => prev.map(a => a.id === targetActivity.id ? { ...a, ...updateData } : a));
      showToastMessage('Activity department updated successfully!');

      try {
        const activityRef = doc(db, 'activities', targetActivity.id);
        await updateDoc(activityRef, updateData);
      } catch (err) {
        console.error('Error updating activity department:', err);
        showToastMessage('Failed to save to database. Please check your connection.');
      }
      return;
    }

    if (!user) return;

    // Close modal and show success toast immediately with ZERO delay
    setShowDeptModal(false);
    showToastMessage('Department updated successfully!');

    const updatedUser = {
      ...user,
      departments: departments,
      primaryDepartment: primaryDepartment,
    };
    if (setUser) {
      setUser(updatedUser);
    }

    // Save to Firestore in background
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        departments: departments,
        primaryDepartment: primaryDepartment,
      });
    } catch (error) {
      console.error('Error updating user departments:', error);
      showToastMessage('Failed to update department in database');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  useEffect(() => {
    const handleDeptDropdownOutside = (event) => {
      if (editDeptDropdownRef.current && !editDeptDropdownRef.current.contains(event.target)) {
        setEditDeptDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDeptDropdownOutside);
    return () => {
      document.removeEventListener('mousedown', handleDeptDropdownOutside);
    };
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        
        if (!user) {
          setActivities([]);
          setSelectedActivity(null);
          return;
        }
        
        let activitiesQuery;
        
        if (user.role === 'Faculty') {
          activitiesQuery = query(
            collection(db, 'activities'),
            where('facultyId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
        } else if (user.role === 'Student') {
          activitiesQuery = query(
            collection(db, 'activities'),
            where('className', '==', user.className),
            orderBy('createdAt', 'desc')
          );
        } else {
          activitiesQuery = query(
            collection(db, 'activities'),
            orderBy('createdAt', 'desc'),
            limit(20)
          );
        }

        const querySnapshot = await getDocs(activitiesQuery);
        
        const activityPromises = querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          const feedbackQuery = query(
            collection(db, 'feedback'),
            where('activityId', '==', doc.id)
          );
          
          const feedbackSnapshot = await getDocs(feedbackQuery);
          const feedbackComments = await Promise.all(feedbackSnapshot.docs.map(async (feedbackDoc) => {
            const feedbackData = feedbackDoc.data();
            const rawRating = Number(feedbackData.rating || feedbackData.overallRating || 0);
            const studentName = await resolveStudentDisplayName(feedbackData);
            return {
              id: feedbackDoc.id,
              studentName,
              studentId: feedbackData.studentId,
              rating: rawRating,
              understandability: Number(feedbackData.understandability || 0),
              engagement: Number(feedbackData.engagement || 0),
              relevance: Number(feedbackData.relevance || 0),
              comment: feedbackData.comment,
              suggestions: feedbackData.suggestions,
              timestamp: feedbackData.timestamp,
              createdAt: feedbackData.createdAt // <-- Ensure this is included
            };
          }));
          
          const ratings = feedbackComments.map(c => c.rating).filter(r => r > 0);
          const averageRating = ratings.length > 0 ? 
            ratings.reduce((a, b) => a + b, 0) / ratings.length : (Number(data.averageRating) || 0);
          
          // Aggregate all activity images
          const allImages = [];
          if (data.mainImage) allImages.push(data.mainImage);
          if (Array.isArray(data.fileUrls)) {
            data.fileUrls.forEach(f => {
              const url = typeof f === 'string' ? f : f?.url;
              if (url && !allImages.includes(url)) allImages.push(url);
            });
          }
          if (Array.isArray(data.images)) {
            data.images.forEach(img => {
              const url = typeof img === 'string' ? img : img?.url;
              if (url && !allImages.includes(url)) allImages.push(url);
            });
          }

          const rawDate = data.activityDate || data.createdAt;
          const displayDate = formatDateDMY(rawDate);

          return {
            id: doc.id,
            ...data,
            date: displayDate,
            averageRating: averageRating,
            comments: feedbackComments || [],
            totalStudents: data.totalStudents || 0,
            feedbackCount: feedbackComments.length,
            branch: data.className || 'Unknown',
            year: data.academicYear || 'Unknown',
            image: data.mainImage || (allImages.length > 0 ? allImages[0] : 'https://placehold.co/600x400/lightgray/white?text=Activity'),
            images: allImages,
            mainImage: data.mainImage || null,
            fileUrls: data.fileUrls || [],
            department: data.department || 'Unknown'
          };
        });
        
        const fetchedActivities = await Promise.all(activityPromises);
        setActivities(fetchedActivities);
        
        if (fetchedActivities.length > 0 && !selectedActivity) {
          setSelectedActivity(fetchedActivities[0]);
        } else if (fetchedActivities.length === 0) {
          setSelectedActivity(null);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
        setSelectedActivity(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, [user]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMultiSelectMode && 
        !event.target.closest('.activities-left-panel') && 
        !event.target.closest('.delete-confirmation-modal') &&
        !event.target.closest('button[title*="Delete"]')
      ) {
        setIsMultiSelectMode(false);
        setSelectedActivities(new Set());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMultiSelectMode]);

  // Debug useEffect - now hasEditDeletePermission is available
  useEffect(() => {
    console.log('State update - isMultiSelectMode:', isMultiSelectMode);
    console.log('State update - selectedActivities size:', selectedActivities.size);
    console.log('State update - hasEditDeletePermission:', hasEditDeletePermission);
  }, [isMultiSelectMode, selectedActivities, hasEditDeletePermission]);

  useEffect(() => {
    console.log('Current user:', user);
    console.log('User role:', user?.role);
    console.log('Has edit/delete permission:', hasEditDeletePermission);
  }, [user, hasEditDeletePermission]);

  const formatDateDMY = (dateInput) => {
    if (!dateInput) return 'No date';
    try {
      let d;
      if (dateInput?.toDate) {
        d = dateInput.toDate();
      } else if (typeof dateInput === 'string' && dateInput.includes('-')) {
        // e.g. "2026-09-05" - avoid UTC offset issue by splitting
        const parts = dateInput.split('T')[0].split('-');
        if (parts.length === 3) {
          const year = parts[0];
          const month = parseInt(parts[1], 10);
          const day = parseInt(parts[2], 10);
          return `${day}/${month}/${year}`;
        }
        d = new Date(dateInput);
      } else {
        d = new Date(dateInput);
      }
      if (isNaN(d.getTime())) return String(dateInput);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return String(dateInput);
    }
  };

  const getRatingColor = (rating, hasFeedback) => {
    if (!hasFeedback || rating === 0) return darkMode ? '#94a3b8' : '#0f172a'; // black / dark for 0 reviews / 0 rating
    if (rating >= 4.5) return '#10b981'; // 5 stars -> green
    if (rating >= 3) return '#eab308'; // 3 and 4 stars -> yellow / amber (#eab308)
    return '#ef4444'; // 1 and 2 stars -> red
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    let stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar key={`full-${i}`} className="h-4 w-4" style={{ color: '#fbbf24' }} />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <FaStarHalfAlt key="half" className="h-4 w-4" style={{ color: '#fbbf24' }} />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaRegStar key={`empty-${i}`} className="h-4 w-4" style={{ color: '#fde68a' }} />
      );
    }
    
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  const handleViewCompleteFeedback = async (feedbackId) => {
    try {
      setDetailedFeedbackLoading(true);
      
      const feedback = selectedActivity.comments.find(f => f.id === feedbackId);
      if (feedback) {
        setSelectedFeedback(feedback);
        setShowCompleteFeedback(true);
      }
    } catch (error) {
      console.error('Error loading detailed feedback:', error);
    } finally {
      setDetailedFeedbackLoading(false);
    }
  };

  const closeCompleteFeedback = () => {
    setShowCompleteFeedback(false);
    setSelectedFeedback(null);
  };
  
  const toggleMultiSelectMode = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsMultiSelectMode((prev) => {
      const newMode = !prev;
      console.log('Multi-select mode toggled to:', newMode);
      return newMode;
    });
    setSelectedActivities(new Set());
    console.log('Multi-select mode state updated');
  };

  const toggleActivitySelection = (activityId) => {
    console.log('Toggling selection for activity:', activityId);
    setSelectedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
        console.log('Deselected activity:', activityId);
      } else {
        newSet.add(activityId);
        console.log('Selected activity:', activityId);
      }
      console.log('Total selected activities:', Array.from(newSet));
      console.log('Selected activities size:', newSet.size);
      return newSet;
    });
  };

  const handleSelectAll = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (activities.length === 0) return;
    setSelectedActivities((prev) => {
      if (prev.size === activities.length) {
        console.log('Deselecting all activities');
        return new Set();
      } else {
        console.log('Selecting all activities:', activities.length);
        return new Set(activities.map((a) => a.id));
      }
    });
  };

  // Single activity delete function
  const deleteActivity = (activityId) => {
    setActivityToDelete(activityId);
    setIsMultiDelete(false);
    setShowDeleteConfirmation(true);
  };

  // Multi-select delete function
const handleDeleteConfirm = async () => {
  console.log('handleDeleteConfirm called');
  console.log('isMultiDelete:', isMultiDelete);
  console.log('selectedActivities:', Array.from(selectedActivities));
  console.log('activityToDelete:', activityToDelete);

  try {
    setDeletingActivities(true);
    setDeleteError(null);

    if (isMultiDelete) {
      // Delete multiple activities
      const activitiesToDelete = Array.from(selectedActivities);
      console.log('Starting multi-delete for activities:', activitiesToDelete);
      
      if (activitiesToDelete.length === 0) {
        throw new Error('No activities selected for deletion');
      }
      
      // Process each activity deletion
      for (let i = 0; i < activitiesToDelete.length; i++) {
        const activityId = activitiesToDelete[i];
        console.log(`Processing deletion ${i + 1}/${activitiesToDelete.length} for activity:`, activityId);
        
        try {
          // Delete related feedback first
          console.log('Querying feedback for activity:', activityId);
          const feedbackQuery = query(
            collection(db, 'feedback'),
            where('activityId', '==', activityId)
          );
          
          const feedbackSnapshot = await getDocs(feedbackQuery);
          console.log(`Found ${feedbackSnapshot.docs.length} feedback documents for activity ${activityId}`);
          
          // Delete feedback documents one by one
          for (const feedbackDoc of feedbackSnapshot.docs) {
            console.log('Deleting feedback document:', feedbackDoc.id);
            await deleteDoc(feedbackDoc.ref);
          }
          
          // Delete the activity document
          console.log('Deleting activity document:', activityId);
          const activityRef = doc(db, 'activities', activityId);
          await deleteDoc(activityRef);
          console.log('Successfully deleted activity:', activityId);
          
        } catch (err) {
          console.error(`Failed to delete activity ${activityId}:`, err);
          throw new Error(`Failed to delete activity: ${err.message}`);
        }
      }
      
      console.log('All activities deleted successfully, updating local state');
      
      // Update local state - remove deleted activities
      setActivities((prevActivities) => {
        const filteredActivities = prevActivities.filter((activity) => !selectedActivities.has(activity.id));
        console.log('Activities after deletion:', filteredActivities.length);
        return filteredActivities;
      });
      
      // Clear selection if selected activity was deleted
      if (selectedActivity && selectedActivities.has(selectedActivity.id)) {
        console.log('Selected activity was deleted, clearing selection');
        setSelectedActivity((prevSelected) => {
          const remainingActivities = activities.filter((activity) => !selectedActivities.has(activity.id));
          return remainingActivities.length > 0 ? remainingActivities[0] : null;
        });
        setShowMobileDetail(false);
      }
      
      // Reset multi-select state
      setSelectedActivities(new Set());
      setIsMultiSelectMode(false);
      
      console.log('Multi-delete operation completed successfully');
      
    } else {
      // Delete single activity
      console.log('Starting single delete for activity:', activityToDelete);
      
      if (!activityToDelete) {
        throw new Error('No activity selected for deletion');
      }
      
      // Delete related feedback first
      console.log('Querying feedback for single activity:', activityToDelete);
      const feedbackQuery = query(
        collection(db, 'feedback'),
        where('activityId', '==', activityToDelete)
      );
      
      const feedbackSnapshot = await getDocs(feedbackQuery);
      console.log(`Found ${feedbackSnapshot.docs.length} feedback documents`);
      
      // Delete feedback documents
      for (const feedbackDoc of feedbackSnapshot.docs) {
        console.log('Deleting feedback document:', feedbackDoc.id);
        await deleteDoc(feedbackDoc.ref);
      }
      
      // Delete the activity document
      console.log('Deleting single activity document:', activityToDelete);
      const activityRef = doc(db, 'activities', activityToDelete);
      await deleteDoc(activityRef);
      
      // Update local state
      setActivities((prevActivities) => {
        const filteredActivities = prevActivities.filter((activity) => activity.id !== activityToDelete);
        console.log('Activities after single deletion:', filteredActivities.length);
        return filteredActivities;
      });
      
      // Clear selection if selected activity was deleted
      if (selectedActivity && selectedActivity.id === activityToDelete) {
        console.log('Selected activity was deleted, clearing selection');

        setSelectedActivity((prevSelected) => {
          const remainingActivities = activities.filter((activity) => activity.id !== activityToDelete);
          return remainingActivities.length > 0 ? remainingActivities[0] : null;
        });
        setShowMobileDetail(false);
      }
      
      console.log('Single delete operation completed successfully');
    }
        const deletedCount = isMultiDelete ? selectedActivities.size : 1;
       showToastMessage(`Successfully deleted ${deletedCount} activity `);

    // Close modal and reset states
    setShowDeleteConfirmation(false);
    setActivityToDelete(null);
    setIsMultiDelete(false);
    setDeleteError(null);
    

  } catch (error) {
    console.error('Error in handleDeleteConfirm:', error);
    setDeleteError(`Failed to delete activities: ${error.message}`);
  } finally {
    setDeletingActivities(false);
    console.log('Delete operation finished');
  }
};
 const handleMultiDelete = () => {
  console.log('handleMultiDelete called');
  console.log('Selected activities size:', selectedActivities.size);
  console.log('Selected activities array:', Array.from(selectedActivities));
  console.log('hasEditDeletePermission:', hasEditDeletePermission);
  
  if (selectedActivities.size === 0) {
    console.log('No activities selected for deletion');
    alert('Please select activities to delete');
    return;
  }
  
  console.log('Setting multi-delete confirmation modal');
  setIsMultiDelete(true);
  setActivityToDelete(null);
  setDeleteError(null);
  setShowDeleteConfirmation(true);
};

  const openEditModal = async (activity) => {
    setEditingActivity(activity);
    
    let actDepts = [];
    if (Array.isArray(activity.departments) && activity.departments.length > 0) {
      actDepts = [...activity.departments];
    } else if (activity.department) {
      actDepts = [activity.department];
    } else if (user?.primaryDepartment) {
      actDepts = [user.primaryDepartment];
    } else if (Array.isArray(user?.departments) && user.departments.length > 0) {
      actDepts = [...user.departments];
    }

    const primaryDept = actDepts[0] || activity.department || user?.primaryDepartment || (user?.departments && user.departments[0]) || '';

    setEditForm({
      activityName: activity.activityName || '',
      description: activity.description || '',
      courseName: activity.courseName || '',
      department: primaryDept,
      departments: actDepts,
      className: activity.className || '',
      academicYear: activity.academicYear || '',
      semester: activity.semester || '',
      activityDate: activity.activityDate || ''
    });
    setEditDeptDropdownOpen(false);
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const chosenDepartments = Array.isArray(editForm.departments) && editForm.departments.length > 0
        ? editForm.departments
        : (editForm.department ? [editForm.department] : []);

      if (chosenDepartments.length === 0) {
        showToastMessage('Please select at least one department', 'error');
        return;
      }

      const primaryDept = chosenDepartments[0] || editForm.department || '';
      const updateData = {
        ...editForm,
        department: primaryDept,
        departments: chosenDepartments,
        date: formatDateDMY(editForm.activityDate),
        updatedAt: new Date()
      };

      const activityRef = doc(db, 'activities', editingActivity.id);
      await updateDoc(activityRef, updateData);

      setActivities(prevActivities =>
        prevActivities.map(activity =>
          activity.id === editingActivity.id
            ? { ...activity, ...updateData }
            : activity
        )
      );

      if (selectedActivity?.id === editingActivity.id) {
        setSelectedActivity(prev => ({ ...prev, ...updateData }));
      }

      setShowEditModal(false);
      setEditingActivity(null);
      setEditDeptDropdownOpen(false);
      showToastMessage(`Activity updated successfully!`);

    } catch (error) {
      console.error('Error updating activity:', error);
      showToastMessage(`Failed to update activity. Please try again`);
    }
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    handleLogout();
    setShowLogoutConfirm(false);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleOpenDepartmentModal = (activity) => {
    setActivityForDeptChange(activity);
    setShowDepartmentModal(true);
  };




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

  const openImageModal = (activityOrImages, initialIndex = 0) => {
    let imagesList = [];
    let title = '';
    let pages = null;
    if (Array.isArray(activityOrImages)) {
      imagesList = activityOrImages;
    } else if (activityOrImages && typeof activityOrImages === 'object') {
      title = activityOrImages.activityName || activityOrImages.title || '';
      pages = activityOrImages.pages || activityOrImages.pdfPages || null;
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
    setModalActivityTitle(title || (selectedActivity?.activityName || selectedActivity?.title || ''));
    setModalPagesCount(pages || selectedActivity?.pages || selectedActivity?.pdfPages || null);
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
    setActiveModalImageIndex(0);
    setModalPagesCount(null);
    resetZoom();
  };

  const handleBackdropClick = () => {
    if (hasDraggedRef.current || touchMovedRef.current) {
      return;
    }
    closeImageModal();
  };

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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode
        ? 'bg-gray-900 text-gray-100'
        : 'text-gray-800'
    }`}
    style={{
      backgroundColor: darkMode ? '#111827' : '#f8fafc',
      backgroundImage: darkMode
        ? 'radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)'
        : 'radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
      backgroundSize: '24px 24px'
    }}
    >
      {/* Department Selection Modal */}
      <DepartmentSelectionModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onSubmit={handleDepartmentSubmit}
        userType={user?.role === 'Faculty' ? 'faculty' : 'student'}
        currentDepartments={user?.departments || []}
        currentPrimaryDepartment={user?.primaryDepartment || user?.departments?.[0] || ''}
        canEdit={true}
        darkMode={darkMode}
      />

      <Navbar 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        toggleSidebar={toggleSidebar} 
        showProfileMenu={showProfileMenu}
        toggleProfileMenu={toggleProfileMenu} 
        sidebarOpen={sidebarOpen}
        user={user}
        onEditDepartment={() => setShowDeptModal(true)}
      />

      {/* Department Display */}
      {user?.role === 'Student' && user?.departments && user.departments.length > 0 && (
        <div className="px-6 pt-4 pb-2">
          <div className="inline-block bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200 rounded-full px-4 py-2 text-sm font-semibold shadow-sm border border-sky-200/60">
            Your Department: {user.departments[0]}
          </div>
        </div>
      )}

      <div className={`p-5 lg:p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out page-smooth-enter`}>
        <div className="flex flex-col lg:flex-row items-start gap-5 lg:gap-6">
          {/* ── Left panel: strictly locked/sticky, internal scroll only ── */}
          <div className={`activities-left-panel w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-18 z-10 rounded-2xl border flex-col overflow-hidden ${
            showMobileDetail ? 'hidden lg:flex' : 'flex'
          } ${
            darkMode
              ? 'bg-gray-800 border-gray-700 shadow-lg'
              : 'bg-white border-slate-200/80 shadow-md'
          }`} style={{ maxHeight: 'calc(100vh - 3.5rem)', height: 'calc(100vh - 3.5rem)' }}>
            {/* Panel header — fixed inside panel */}
            <div className={`px-4 py-4 flex-shrink-0 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-100 bg-slate-50/80'}`}>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-sky-900/50 text-sky-300' : 'bg-sky-100 text-sky-600'}`}>
                  <FaListUl className="h-4 w-4" />
                </div>
                <h2 className={`text-base font-bold flex-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Your Activities</h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleMultiSelectMode}
                    className={`p-2 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center justify-center h-8 w-8 cursor-pointer shadow-xs ${
                      isMultiSelectMode
                        ? 'border-sky-400 text-sky-700 shadow-sm'
                        : 'border-sky-200 text-sky-600 hover:border-sky-300'
                    }`}
                    style={{
                      backgroundColor: isMultiSelectMode ? '#bae6fd' : '#f0f9ff',
                      color: '#0284c7',
                      borderWidth: '1px'
                    }}
                    title={isMultiSelectMode ? "Exit Multi-Select" : "Multi-Select"}
                  >
                    <FaClone className="h-3.5 w-3.5" style={{ color: '#0284c7' }} />
                  </button>
                  {isMultiSelectMode && activities.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="p-2 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center justify-center h-8 w-8 cursor-pointer shadow-xs"
                      style={{
                        backgroundColor: selectedActivities.size === activities.length ? '#0284c7' : '#f0f9ff',
                        color: selectedActivities.size === activities.length ? '#ffffff' : '#0284c7',
                        borderWidth: '1px',
                        borderColor: selectedActivities.size === activities.length ? '#0284c7' : '#bae6fd'
                      }}
                      title={selectedActivities.size === activities.length ? "Deselect All" : "Select All"}
                    >
                      {selectedActivities.size === activities.length ? (
                        <FaCheckSquare className="h-3.5 w-3.5" style={{ color: '#ffffff' }} />
                      ) : (
                        <FaRegSquare className="h-3.5 w-3.5" style={{ color: '#0284c7' }} />
                      )}
                    </button>
                  )}
                  {isMultiSelectMode && selectedActivities.size > 0 && hasEditDeletePermission && (
                    <button
                      type="button"
                      onClick={(e) => {
                        if (e) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                        handleMultiDelete();
                      }}
                      className="p-2 text-white rounded-xl hover:opacity-90 transition-all duration-200 flex items-center justify-center h-8 w-8 shadow-sm cursor-pointer"
                      style={{ backgroundColor: '#ef4444', border: 'none', color: '#ffffff' }}
                      title={`Delete ${selectedActivities.size} Selected`}
                    >
                      <FaTrash size={14} style={{ color: '#ffffff' }} />
                    </button>
                  )}
                </div>
              </div>
              {loading ? (
                <div className="h-3.5 w-24 rounded itfs-bone mt-1.5" />
              ) : (
                <p className={`text-xs mt-1.5 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                  {isMultiSelectMode && selectedActivities.size > 0
                    ? `${selectedActivities.size} of ${activities.length} selected`
                    : `${activities.length} activit${activities.length === 1 ? 'y' : 'ies'}`}
                </p>
              )}
            </div>
            
            {/* Scrollable activity list */}
            {loading ? (
              <ActivityListSkeleton count={6} darkMode={darkMode} />
            ) : activities.length > 0 ? (
              <div className="activities-container activity-panel-scroll flex-1 px-3 py-3 space-y-2">
                {activities.map((activity, idx) => {
                  const isSelected = selectedActivity && selectedActivity.id === activity.id;
                  return (
                    <div 
                      key={activity.id}
                      onClick={() => {
                        if (!isMultiSelectMode) {
                          setSelectedActivity(activity);
                          setIsDescriptionExpanded(false);
                          setShowMobileDetail(true);
                        }
                      }}
                      style={{
                        animationDelay: `${idx * 30}ms`,
                        backgroundColor: isSelected
                          ? (darkMode ? 'rgba(14, 165, 233, 0.1)' : '#f1f8fe')
                          : (darkMode ? 'rgba(31, 41, 55, 0.4)' : '#ffffff'),
                        border: isSelected
                          ? (darkMode ? '1px solid #0284c7' : '1px solid #38bdf8')
                          : (darkMode ? '1px solid rgba(55, 65, 81, 0.6)' : '1px solid #e2e8f0'),
                        borderLeft: isSelected
                          ? (darkMode ? '4px solid #38bdf8' : '4px solid #0284c7')
                          : (darkMode ? '1px solid rgba(55, 65, 81, 0.6)' : '1px solid #e2e8f0'),
                        boxShadow: isSelected
                          ? '0 4px 14px rgba(14, 165, 233, 0.1)'
                          : 'none'
                      }}
                      className={`faculty-activity-row ${isSelected ? 'is-selected z-10' : ''} p-3.5 rounded-2xl cursor-pointer transition-all duration-200 relative`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div
                          onClick={(e) => {
                            if (!isMultiSelectMode) {
                              e.stopPropagation();
                              setSelectedActivity(activity);
                              setIsDescriptionExpanded(false);
                              setShowMobileDetail(true);
                            }
                          }}
                          className="flex-1 min-w-0"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`font-semibold text-sm leading-snug ${
                              isSelected 
                                ? darkMode ? 'text-sky-400 font-bold' : 'text-sky-600 font-bold' 
                                : darkMode ? 'text-gray-100' : 'text-gray-800'
                            }`}>
                              <span
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  wordBreak: 'break-word',
                                }}
                                title={activity.activityName}
                              >
                                {activity.activityName}
                              </span>
                            </h3>
                            {isSelected && (
                              <span className="flex h-2 w-2 relative mt-1.5 mr-0.5 shrink-0" title="Selected">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                              </span>
                            )}
                          </div>
                          {(Array.isArray(activity.departments) && activity.departments.length > 0) ? (
                            <span className={`block text-xs mt-0.5 truncate ${
                              isSelected 
                                ? darkMode ? 'text-gray-300' : 'text-slate-600' 
                                : darkMode ? 'text-gray-400' : 'text-sky-600/75'
                            }`}>
                              {activity.departments.join(', ')}
                            </span>
                          ) : (
                            activity.department && (
                              <span className={`block text-xs mt-0.5 truncate ${
                                isSelected 
                                ? darkMode ? 'text-gray-300' : 'text-slate-600' 
                                : darkMode ? 'text-gray-400' : 'text-sky-600/75'
                              }`}>
                                {activity.department}
                              </span>
                            )
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{activity.date}</span>
                            <div className="flex items-center gap-1">
                              <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded-md border"
                                style={{
                                  color: getRatingColor(activity.averageRating, activity.feedbackCount > 0),
                                  backgroundColor: `${getRatingColor(activity.averageRating, activity.feedbackCount > 0)}1A`,
                                  borderColor: `${getRatingColor(activity.averageRating, activity.feedbackCount > 0)}40`
                                }}
                              >
                                {activity.feedbackCount > 0 ? activity.averageRating.toFixed(1) : '0.0'}
                              </span>
                              <FaStar
                                className="h-3 w-3"
                                style={{ color: getRatingColor(activity.averageRating, activity.feedbackCount > 0) }}
                              />
                              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>({activity.feedbackCount})</span>
                            </div>
                          </div>
                        </div>
                        {isMultiSelectMode && (
                          <span
                            className="ml-1 cursor-pointer flex-shrink-0"
                            onClick={e => {
                              e.stopPropagation();
                              toggleActivitySelection(activity.id);
                            }}
                          >
                            {selectedActivities.has(activity.id) ? (
                              <FaCheckSquare className="h-4 w-4 text-sky-500" />
                            ) : (
                              <FaRegSquare className="h-4 w-4 text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 px-3 flex-1 flex flex-col items-center justify-center">
                <EmptyActivitiesState
                  title="No activities found"
                  darkMode={darkMode}
                  bordered={false}
                  className="py-2"
                  stickerClassName="w-40 h-32 sm:w-48 sm:h-38 mx-auto"
                  titleClassName={darkMode ? "text-sm sm:text-base font-semibold text-gray-300" : "text-sm sm:text-base font-semibold text-slate-600"}
                />
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="hidden lg:flex flex-1 min-w-0">
              <FeedbackDetailSkeleton darkMode={darkMode} />
            </div>
          ) : selectedActivity ? (
            <div className={`w-full lg:flex-1 min-w-0 animate-fade-in-up ${showMobileDetail ? 'block' : 'hidden lg:block'}`} key={selectedActivity.id}>
              <div
                className={`rounded-2xl shadow-lg overflow-hidden border flex flex-col relative ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
                }`}
                style={{ maxHeight: 'calc(100vh - 3.5rem)', height: 'calc(100vh - 3.5rem)' }}
              >
                {/* Hero header — fixed/locked at top */}
              <div
  onMouseEnter={() => setIsHeaderHovered(true)}
  onMouseLeave={() => setIsHeaderHovered(false)}
  className={`relative flex-shrink-0 z-10 border-b px-6 overflow-hidden group transition-all duration-300 ${
    isHeaderCollapsed
      ? 'pt-3 pb-3.5 bg-gray-100/90 dark:bg-gray-800/95 border-gray-200 dark:border-gray-700 shadow-2xs'
      : `pt-5 pb-6 bg-gradient-to-br from-slate-50 to-sky-50/50 dark:bg-gray-800 backdrop-blur-xs transition-colors duration-200 ${
          isHeaderHovered ? 'border-gray-300 dark:border-gray-600' : 'border-slate-100 dark:border-gray-700/80'
        }`
  }`}
>
  {/* Soft decorative aura — purely visual, sits behind everything */}
  <div
    className="pointer-events-none absolute -top-16 -right-10 rounded-full"
    style={{
      width: '14rem',
      height: '14rem',
      background: darkMode
        ? 'radial-gradient(circle, rgba(56,189,248,0.10), transparent 70%)'
        : 'radial-gradient(circle, rgba(2,132,199,0.10), transparent 70%)',
      filter: 'blur(4px)',
    }}
  />

  {/* Full-width line with grey effect when arrow appears */}
  <div
    className={`absolute bottom-0 left-0 right-0 h-[1.5px] transition-all duration-200 pointer-events-none ${
      isHeaderHovered
        ? 'bg-gray-300 dark:bg-gray-600 opacity-100'
        : 'bg-transparent opacity-0'
    }`}
  />

  <div className="lg:hidden mb-4 relative">
    <button
      type="button"
      onClick={() => setShowMobileDetail(false)}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
      style={{
        backgroundColor: darkMode ? '#1e293b' : '#f0f9ff',
        color: darkMode ? '#38bdf8' : '#0284c7',
        border: darkMode ? '1px solid #334155' : '1px solid #bae6fd',
      }}
    >
      <FaChevronLeft className="text-xs" style={{ color: darkMode ? '#38bdf8' : '#0284c7' }} />
      <span>Back to Activities</span>
    </button>
  </div>

  {hasEditDeletePermission && !isMultiSelectMode && (
    <div
      className={`absolute right-4 flex items-center gap-1.5 z-20 transition-all duration-200 ${
        isHeaderCollapsed ? 'top-3' : 'top-4'
      }`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openEditModal(selectedActivity);
        }}
        className="p-2 sm:p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-95 shadow-xs"
        style={{ backgroundColor: '#0369a1', color: '#ffffff' }}
        title="Edit Activity"
      >
        <FaEdit size={14} style={{ color: '#ffffff' }} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          deleteActivity(selectedActivity.id);
        }}
        className="p-2 sm:p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-95 shadow-xs"
        style={{ backgroundColor: '#b91c1c', color: '#ffffff' }}
        title="Delete Activity"
      >
        <FaTrash size={14} style={{ color: '#ffffff' }} />
      </button>
    </div>
  )}

  {/* Center Collapse / Expand Arrow — proper circle, shows 'collapse' / 'expand' on hover */}
  <div
    className="absolute bottom-1 left-1/2 z-30 transition-all duration-200"
    style={{
      transform: 'translateX(-50%)',
      opacity: isHeaderHovered ? 1 : 0,
      pointerEvents: isHeaderHovered ? 'auto' : 'none',
    }}
  >
    <button
      type="button"
      onClick={toggleHeaderCollapse}
      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-115 active:scale-95 cursor-pointer border shadow-xs hover:shadow-md ${
        darkMode
          ? 'bg-gray-800 text-gray-300 border-gray-600 hover:text-white hover:bg-gray-700 hover:border-gray-500 hover:ring-2 hover:ring-gray-600/60'
          : 'bg-white text-gray-600 border-gray-300 hover:text-gray-900 hover:bg-gray-100 hover:border-gray-400 hover:ring-2 hover:ring-gray-300/80'
      }`}
      style={{ backdropFilter: 'blur(4px)' }}
      title={isHeaderCollapsed ? "expand" : "collapse"}
      aria-label={isHeaderCollapsed ? "expand" : "collapse"}
    >
      {isHeaderCollapsed ? (
        <FaChevronDown className="w-2.5 h-2.5 opacity-80" />
      ) : (
        <FaChevronUp className="w-2.5 h-2.5 opacity-80" />
      )}
    </button>
  </div>

  <div className={`relative flex flex-col md:flex-row justify-between gap-4 ${isHeaderCollapsed ? 'md:items-center' : 'md:items-start'}`}>
    {/* Left Column: Title (and if collapsed, image thumbnail before title) */}
    <div className={`flex-1 min-w-0 ${isHeaderCollapsed ? 'pr-20' : (selectedActivity.image ? 'pr-4' : 'pr-20')}`}>
      <div className="flex items-center gap-3">
        <span
          className="w-1.5 rounded-full flex-shrink-0 transition-all duration-300"
          style={{
            height: isHeaderCollapsed ? '1.5rem' : '1.9rem',
            background: darkMode
              ? 'linear-gradient(180deg, #38bdf8, #0284c7)'
              : 'linear-gradient(180deg, #38bdf8, #0369a1)',
          }}
        />

        {/* Small image appears BEFORE title in collapsed mode */}
        {isHeaderCollapsed && selectedActivity.image && (
          <div
            className="relative cursor-pointer select-none flex-shrink-0 transition-all duration-300 hover:scale-105"
            onClick={() => openImageModal(selectedActivity)}
            title={isPdfUrl(selectedActivity.image) ? "Click to view PDF" : "Click to view photo"}
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-xs border border-slate-200/80 dark:border-gray-700/80 bg-gray-100">
              <ActivityThumbnail
                src={selectedActivity.image}
                alt={selectedActivity.activityName}
                darkMode={darkMode}
              />
            </div>
          </div>
        )}

        <h2
          className={`font-bold leading-snug tracking-tight transition-all duration-300 ${
            isHeaderCollapsed ? 'text-base sm:text-lg text-slate-800 dark:text-slate-100 truncate' : 'text-xl sm:text-2xl text-slate-900 dark:text-white'
          }`}
          style={{ wordBreak: 'break-word' }}
          title={selectedActivity.activityName}
        >
          {selectedActivity.activityName}
        </h2>
      </div>

      {/* When expanded: show pills and rating */}
      {!isHeaderCollapsed && (
        <>
          {/* Metadata — plain, uniform pastel pills, no icons */}
          <div className="flex flex-wrap items-center gap-2 mt-4 ml-[calc(0.375rem+0.75rem)]">
            {selectedActivity.facultyName && (
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold select-none transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: darkMode ? 'rgba(2,132,199,0.14)' : '#e0f2fe',
                  color: darkMode ? '#7dd3fc' : '#075985',
                  boxShadow: '0 1px 3px rgba(2,132,199,0.08)',
                }}
              >
                {selectedActivity.facultyName}
              </span>
            )}
            {(selectedActivity.className || selectedActivity.year) && (
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold select-none transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: darkMode ? 'rgba(5,150,105,0.14)' : '#ecfdf5',
                  color: darkMode ? '#6ee7b7' : '#065f46',
                  boxShadow: '0 1px 3px rgba(5,150,105,0.06)',
                }}
              >
                {selectedActivity.className || selectedActivity.year}
              </span>
            )}

            {(selectedActivity.departments?.length > 0 || selectedActivity.department) && (
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold select-none transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: darkMode ? 'rgba(79,70,229,0.14)' : '#eef2ff',
                  color: darkMode ? '#a5b4fc' : '#3730a3',
                  boxShadow: '0 1px 3px rgba(79,70,229,0.06)',
                }}
              >
                {Array.isArray(selectedActivity.departments)
                  ? selectedActivity.departments.join(', ')
                  : selectedActivity.department}
              </span>
            )}

            {(selectedActivity.courseName || selectedActivity.branch) && (
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold select-none transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: darkMode ? 'rgba(124,58,237,0.14)' : '#f5f3ff',
                  color: darkMode ? '#c4b5fd' : '#5b21b6',
                  boxShadow: '0 1px 3px rgba(124,58,237,0.06)',
                }}
              >
                {selectedActivity.courseName || selectedActivity.branch}
              </span>
            )}

            {selectedActivity.academicYear && (
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold select-none transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: darkMode ? 'rgba(217,119,6,0.14)' : '#fffbeb',
                  color: darkMode ? '#fcd34d' : '#92400e',
                  boxShadow: '0 1px 3px rgba(217,119,6,0.06)',
                }}
              >
                {selectedActivity.academicYear}
                {selectedActivity.semester ? ` (Sem ${selectedActivity.semester})` : ''}
              </span>
            )}

            {selectedActivity.date && (
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold select-none transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: darkMode ? 'rgba(100,116,139,0.14)' : '#f1f5f9',
                  color: darkMode ? '#cbd5e1' : '#334155',
                  boxShadow: '0 1px 3px rgba(100,116,139,0.06)',
                }}
              >
                {selectedActivity.date}
              </span>
            )}
          </div>

          {/* Rating — no background, no border, plain and clean */}
          <div className="flex items-center gap-2 mt-4 ml-[calc(0.375rem+0.75rem)]">
            <div className="flex items-center gap-0.5">{renderStars(selectedActivity.averageRating)}</div>
            <span
              className="text-sm font-bold"
              style={{ color: getRatingColor(selectedActivity.averageRating, selectedActivity.feedbackCount > 0) }}
            >
              {selectedActivity.averageRating.toFixed(1)}
            </span>
            <span className={darkMode ? 'text-gray-500' : 'text-slate-300'}>•</span>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              {selectedActivity.feedbackCount} reviews
            </span>
          </div>
        </>
      )}
    </div>

    {/* Right Column: Full Image block in expanded mode */}
    {!isHeaderCollapsed && selectedActivity.image && (
      <div className="flex-shrink-0 flex flex-col items-center justify-center md:justify-end transition-all duration-300">
        <div
          className="relative group/img cursor-pointer select-none p-2"
          onClick={() => openImageModal(selectedActivity)}
          title={isPdfUrl(selectedActivity.image) ? "Click to view PDF" : "Click to view photo"}
        >
          <div className="absolute inset-2 rounded-2xl bg-sky-200/60 dark:bg-sky-800/40 transform rotate-6 scale-95 opacity-70 group-hover/img:rotate-12 transition-transform duration-300"></div>
          <div className="absolute inset-2 rounded-2xl bg-sky-100/80 dark:bg-sky-700/40 transform -rotate-3 scale-95 opacity-80 group-hover/img:-rotate-6 transition-transform duration-300"></div>
          <div className="relative w-44 h-32 sm:w-52 sm:h-36 rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-gray-700 bg-gray-100 transition-all duration-300 group-hover/img:scale-105 group-hover/img:shadow-xl">
            <ActivityThumbnail
              src={selectedActivity.image}
              alt={selectedActivity.activityName}
              darkMode={darkMode}
            />
            <div className="absolute inset-0 bg-sky-900/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold backdrop-blur-xs gap-1">
              <FaExpand className="text-xs" />
              <span>View</span>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
                {/* Scrollable details: Description, Feedback Summary, Student Comments */}
                <div
                  ref={detailsScrollRef}
                  onScroll={handleDetailsScroll}
                  className="p-6 flex-1 overflow-y-auto custom-light-scrollbar"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: darkMode ? '#4B5563 transparent' : '#CBD5E1 transparent'
                  }}
                >
                  {/* Description */}
                  {!isHeaderCollapsed && (
                    <div className="mb-6 animate-fade-in-up">
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-sky-100'}`}>
                        <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-sky-300' : 'text-sky-600'}`}>Description</h3>
                        <div>
                          <p className={`whitespace-pre-wrap text-sm leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {isDescriptionExpanded || (selectedActivity.description || '').length <= 250
                              ? selectedActivity.description
                              : `${(selectedActivity.description || '').substring(0, 250)}...`}
                          </p>
                          {(selectedActivity.description || '').length > 250 && (
                            <button
                              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                              className="text-sky-500 hover:text-sky-600 hover:underline mt-1 text-sm bg-transparent border-none p-0 cursor-pointer"
                            >
                              {isDescriptionExpanded ? 'Show less' : 'Read more...'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Rating summary card */}
                  {!isHeaderCollapsed && (
                    <div className={`mb-6 p-5 rounded-2xl border animate-fade-in-up ${
                      darkMode ? 'bg-gray-750 border-gray-700' : 'bg-gradient-to-br from-sky-50/80 to-white border-sky-100'
                    }`}>
                      <div className="flex items-center gap-2 mb-4">
                        <FaChartBar className={`h-4 w-4 ${darkMode ? 'text-sky-400' : 'text-sky-500'}`} />
                        <h3 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-sky-900'}`}>Student Feedback Summary</h3>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div>
                          <div className="flex items-end gap-2">
                            <span
                              className="text-5xl font-bold"
                              style={{ color: getRatingColor(selectedActivity.averageRating, selectedActivity.feedbackCount > 0) }}
                            >
                              {selectedActivity.averageRating.toFixed(1)}
                            </span>
                            <span className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>out of 5</span>
                          </div>
                          <div className="flex mt-1">{renderStars(selectedActivity.averageRating)}</div>
                          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                            {selectedActivity.feedbackCount} student review{selectedActivity.feedbackCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <div className="w-full sm:w-64">
                          {[5, 4, 3, 2, 1].map(rating => {
                            const count = (selectedActivity.comments || []).filter(c => {
                              const r = Math.round(Number(c.rating || 0));
                              return r === rating;
                            }).length;
                            const total = selectedActivity.feedbackCount || (selectedActivity.comments ? selectedActivity.comments.length : 0);
                            const percentage = total > 0 ? (count / total) * 100 : 0;
                            
                            return (
                              <div key={rating} className="flex items-center mt-2 gap-2">
                                <span className={`text-xs w-3 font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{rating}</span>
                                <FaStar className="h-3 w-3 flex-shrink-0" style={{ color: '#fbbf24' }} />
                                <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-slate-200/80'}`}>
                                  <div 
                                    className="h-full rounded-full transition-all duration-500" 
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor: percentage > 0 ? '#eab308' : 'transparent'
                                    }}
                                  ></div>
                                </div>
                                <span className={`text-xs ml-1 w-6 text-right font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Student comments */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <FaComments className={`h-4 w-4 ${darkMode ? 'text-sky-400' : 'text-sky-500'}`} />
                      <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-sky-900'}`}>Student Comments</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-600 border border-slate-200/80'}`}>
                        {selectedActivity.comments?.length || 0}
                      </span>
                    </div>

                    {selectedActivity.comments && selectedActivity.comments.length > 0 ? (
                      <div className="space-y-3 transition-all duration-300">
                        {selectedActivity.comments.map((comment, index) => (
                          <div
                            key={comment.id || index}
                            className={`px-4 py-3.5 rounded-xl border transition-all duration-200 hover:shadow-md ${
                              darkMode
                                ? 'bg-gray-750 border-gray-700 hover:border-gray-600'
                                : 'bg-white border-sky-100 hover:border-sky-200 hover:shadow-sky-100/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <h4 className="font-semibold text-sm leading-none">{comment.studentName || 'Anonymous Student'}</h4>
                                <div className="flex items-center">{renderStars(comment.rating)}</div>
                              </div>
                              <span className={`text-xs flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {comment.createdAt
                                  ? (() => {
                                      if (comment.createdAt.toDate) {
                                        return comment.createdAt.toDate().toLocaleString('en-GB', {
                                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        });
                                      }
                                      const d = new Date(comment.createdAt);
                                      if (!isNaN(d)) {
                                        return d.toLocaleString('en-GB', {
                                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        });
                                      }
                                      return comment.createdAt;
                                    })()
                                  : '-'
                                }
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-4 mt-2.5">
                              <p className={`text-sm leading-relaxed flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  wordBreak: 'break-word',
                                }}>
                                {comment.comment || 'No comment provided'}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleViewCompleteFeedback(comment.id)}
                                style={{
                                  backgroundColor: '#0369a1',
                                  color: '#ffffff',
                                  border: '1px solid #0284c7'
                                }}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shadow-xs hover:brightness-110 active:scale-95 cursor-pointer whitespace-nowrap flex-shrink-0"
                              >
                                View Complete Feedback
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`p-8 rounded-xl border text-center ${
                        darkMode ? 'bg-gray-750 border-gray-700 text-gray-400' : 'bg-sky-50/50 border-sky-100 text-gray-500'
                      }`}>
                        <FaComments className={`h-8 w-8 mx-auto mb-2 ${darkMode ? 'text-gray-600' : 'text-sky-200'}`} />
                        <p className="text-sm">No comments available for this activity yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating Blue Scroll-To-Top Button in Student Comments / Details section */}
                {createPortal(
                  <button
                    type="button"
                    onClick={scrollDetailsToTop}
                    aria-label="Scroll to top of comments"
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
                      opacity: showDetailsScrollTop ? 1 : 0,
                      visibility: showDetailsScrollTop ? 'visible' : 'hidden',
                      transform: showDetailsScrollTop ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.8)',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      padding: 0,
                      outline: 'none',
                      pointerEvents: showDetailsScrollTop ? 'auto' : 'none'
                    }}
                    className="hover:scale-110 active:scale-95 transition-transform"
                  >
                    <FaChevronUp className="w-4 h-4 text-white" />
                  </button>,
                  document.body
                )}
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-1 items-center justify-center min-h-[28rem] animate-scale-in">
              <div className={`text-center p-10 rounded-2xl border ${
                darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-sky-100 bg-white/80 shadow-sm'
              }`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                  darkMode ? 'bg-sky-900/30' : 'bg-sky-100'
                }`}>
                  <FaComments className={`h-8 w-8 ${darkMode ? 'text-sky-400' : 'text-sky-400'}`} />
                </div>
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-sky-900'}`}>Select an activity to view feedback</h2>
                <p className={`mt-2 text-sm max-w-xs mx-auto ${darkMode ? 'text-gray-400' : 'text-sky-600/70'}`}>
                  Choose an activity from the list to see student comments and ratings
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showCompleteFeedback && selectedFeedback && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 transition-all"
          style={{
            backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(2.5px)',
            WebkitBackdropFilter: 'blur(2.5px)'
          }}
          onClick={closeCompleteFeedback}
        >
          {/* Webkit scrollbar styling for the modal */}
          <style>{`
            .sf-feedback-modal::-webkit-scrollbar { width: 4px; }
            .sf-feedback-modal::-webkit-scrollbar-track { border-radius: 8px; background: transparent; }
            .sf-feedback-modal::-webkit-scrollbar-thumb { border-radius: 8px; background: ${darkMode ? '#4b5563' : '#cbd5e1'}; }
            .sf-feedback-modal::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#6b7280' : '#94a3b8'}; }
            .sf-comment-scroll::-webkit-scrollbar { width: 2px; }
            .sf-comment-scroll::-webkit-scrollbar-track { border-radius: 4px; background: transparent; }
            .sf-comment-scroll::-webkit-scrollbar-thumb { border-radius: 4px; background: ${darkMode ? '#4b5563' : '#cbd5e1'}; }
            .sf-comment-scroll::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#6b7280' : '#94a3b8'}; }
          `}</style>
          <div
            className={`sf-feedback-modal rounded-2xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto animate-scale-in border ${
              darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-800 border-slate-200'
            }`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: darkMode ? '#4b5563 transparent' : '#cbd5e1 transparent',
              boxShadow: darkMode ? '0 25px 60px -10px rgba(0, 0, 0, 0.85)' : '0 25px 60px -10px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-sky-900'}`}>Complete Feedback Details</h2>
                
              </div>
              <button 
                type="button"
                onClick={closeCompleteFeedback}
                style={{
                  backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                  color: darkMode ? '#94a3b8' : '#64748b',
                  border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0'
                }}
                className="p-2 rounded-xl transition-all duration-200 hover:brightness-105 active:scale-95 cursor-pointer"
                title="Close"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
            
            <div className="border-b pb-4 mb-4">
              <div className="flex justify-between">
                <h3 className="font-medium text-lg">{selectedFeedback.studentName || 'Anonymous Student'}</h3>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {(() => {
                    // Prefer timestamp
                    if (selectedFeedback.timestamp?.toDate) {
                      return selectedFeedback.timestamp.toDate().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    }
                    // Firestore Timestamp object for createdAt
                    if (selectedFeedback.createdAt?.toDate) {
                      return selectedFeedback.createdAt.toDate().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    }
                    // ISO string or date string
                    if (typeof selectedFeedback.createdAt === 'string') {
                      const d = new Date(selectedFeedback.createdAt);
                      if (!isNaN(d)) {
                        return d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                      }
                    }
                    // Milliseconds number
                    if (typeof selectedFeedback.createdAt === 'number') {
                      const d = new Date(selectedFeedback.createdAt);
                      if (!isNaN(d)) {
                        return d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                      }
                    }
                    return '-';
                  })()}
                </span>
              </div>
            </div>
            
            {detailedFeedbackLoading ? (
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-sky-50/60 border-sky-100'}`}>
                    <h4 className={`font-medium mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-sky-700'}`}>Overall Rating</h4>
                    <div className="flex items-center">
                      {renderStars(selectedFeedback.rating)}
                      <span className="ml-2 font-bold">{selectedFeedback.rating}</span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-sky-50/60 border-sky-100'}`}>
                    <h4 className={`font-medium mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-sky-700'}`}>Understandability</h4>
                    <div className="flex items-center">
                      {renderStars(selectedFeedback.understandability)}
                      <span className="ml-2 font-bold">{selectedFeedback.understandability}</span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-sky-50/60 border-sky-100'}`}>
                    <h4 className={`font-medium mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-sky-700'}`}>Engagement</h4>
                    <div className="flex items-center">
                      {renderStars(selectedFeedback.engagement)}
                      <span className="ml-2 font-bold">{selectedFeedback.engagement}</span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-sky-50/60 border-sky-100'}`}>
                    <h4 className={`font-medium mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-sky-700'}`}>Relevance</h4>
                    <div className="flex items-center">
                      {renderStars(selectedFeedback.relevance)}
                      <span className="ml-2 font-bold">{selectedFeedback.relevance}</span>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-white border-sky-100'}`}>
                  <h4 className={`font-medium mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-sky-700'}`}>Student Comments</h4>
                  <div
                    className={`sf-comment-scroll text-sm leading-relaxed whitespace-pre-wrap break-words ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                    style={{
                      maxHeight: '4rem',
                      overflowY: 'auto',
                      paddingRight: '4px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: darkMode ? '#4b5563 transparent' : '#cbd5e1 transparent',
                    }}
                  >
                    {selectedFeedback.comment || 'No comments provided'}
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-white border-sky-100'}`}>
                  <h4 className={`font-medium mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-sky-700'}`}>Suggestions for Improvement</h4>
                  <div
                    className={`sf-comment-scroll text-sm leading-relaxed whitespace-pre-wrap break-words ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                    style={{
                      maxHeight: '9rem',
                      overflowY: 'auto',
                      paddingRight: '4px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: darkMode ? '#4b5563 transparent' : '#cbd5e1 transparent',
                    }}
                  >
                    {selectedFeedback.suggestions || 'No suggestions provided'}
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeCompleteFeedback}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  backgroundImage: 'linear-gradient(to right, #0284c7, #2563eb)'
                }}
                className="px-6 py-2.5 rounded-xl font-semibold text-white shadow-md shadow-sky-500/20 hover:brightness-110 active:brightness-95 transition-all cursor-pointer border-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          darkMode ? 'bg-green-800 text-white' : 'bg-green-600 text-white'
        } ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>)}
      {showEditModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 transition-all"
          style={{
            backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(2.5px)',
            WebkitBackdropFilter: 'blur(2.5px)'
          }}
          onClick={() => {
            setShowEditModal(false);
            setEditingActivity(null);
          }}
        >
          <div
            className={`${darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-slate-800 border border-slate-200'} rounded-2xl shadow-2xl w-full max-w-2xl mx-auto flex flex-col overflow-hidden fast-scale-in`}
            style={{ 
              maxHeight: '92vh', 
              height: '90vh',
              boxShadow: darkMode ? '0 25px 60px -10px rgba(0, 0, 0, 0.85)' : '0 25px 60px -10px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className={`px-6 py-4 border-b flex-shrink-0 flex justify-between items-center ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-100 bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-sky-900/50 text-sky-300' : 'bg-sky-100 text-sky-600'}`}>
                  <FaEdit className="h-4 w-4" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Edit Activity</h2>
                  
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingActivity(null);
                }}
                style={{
                  backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                  color: darkMode ? '#94a3b8' : '#64748b',
                  border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0'
                }}
                className="p-2 rounded-xl transition-all hover:brightness-105 active:scale-95 cursor-pointer"
                title="Close"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className={`flex-1 overflow-y-auto px-6 py-5 space-y-4 ${darkMode ? 'bg-gray-850' : 'bg-slate-50/60'}`} style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: darkMode ? '#4B5563 transparent' : '#CBD5E1 transparent'
            }}>
              <form id="editForm" onSubmit={handleEditSubmit} className="space-y-4">

                {/* Section: Basic details */}
                <div className={`rounded-2xl border p-4 shadow-2xs ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                  
                  <div className="space-y-3">
                    <div>
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Activity Name</label>
                      <input
                        type="text"
                        name="activityName"
                        value={editForm.activityName}
                        onChange={handleEditFormChange}
                        style={{
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs ${
                          darkMode ? 'border-gray-600 placeholder-gray-400' : 'border-slate-300 placeholder-slate-400'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Description</label>
                      <textarea
                        name="description"
                        value={editForm.description}
                        onChange={(e) => {
                          handleEditFormChange(e);
                          const textarea = e.target;
                          textarea.style.height = 'auto';
                          const newHeight = Math.min(Math.max(textarea.scrollHeight, 80), 200);
                          textarea.style.height = `${newHeight}px`;
                          textarea.style.overflowY = textarea.scrollHeight > 200 ? 'auto' : 'hidden';
                        }}
                        placeholder="Describe the activity, its objectives and outcomes..."
                        style={{
                          minHeight: '80px',
                          maxHeight: '200px',
                          overflowY: 'hidden',
                          scrollbarWidth: 'thin',
                          scrollbarColor: darkMode ? '#4b5563 #1f2937' : '#cbd5e1 #ffffff',
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs resize-none custom-light-scrollbar ${
                          darkMode ? 'border-gray-600 placeholder-gray-400' : 'border-slate-300 placeholder-slate-400'
                        }`}
                        rows="3"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Classification */}
                <div className={`rounded-2xl border p-4 shadow-2xs ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div ref={editDeptDropdownRef} className="relative">
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                        Departments
                      </label>
                     <button
  type="button"
  onClick={() => setEditDeptDropdownOpen(prev => !prev)}
 style={{
  backgroundColor: darkMode ? '#374151' : '#ffffff',
  color: darkMode ? '#ffffff' : '#0f172a',
  border: darkMode
    ? '1px solid #4b5563'
    : '1px solid #e2e8f0',
  boxSizing: 'border-box',
}}
className="w-full px-3.5 py-2.5 rounded-xl text-sm text-left flex justify-between items-center transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs cursor-pointer"
>
  <span className="truncate flex-1 pr-2">
    {editForm.departments && editForm.departments.length > 0
      ? editForm.departments.join(', ')
      : (editForm.department || 'Select department(s)')}
  </span>

  <span className="text-gray-400 text-xs flex-shrink-0">
    ▼
  </span>
</button>

                      {editDeptDropdownOpen && (
                        <div
                          className={`absolute z-30 mt-1.5 w-full rounded-xl shadow-xl border max-h-56 overflow-y-auto p-1.5 custom-light-scrollbar ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-slate-200'
                          }`}
                        >
                          {(() => {
                            const list = [];
                            if (Array.isArray(user?.departments) && user.departments.length > 0) {
                              user.departments.forEach(d => { if (d && !list.includes(d)) list.push(d); });
                            }
                            if (Array.isArray(editForm.departments)) {
                              editForm.departments.forEach(d => { if (d && !list.includes(d)) list.push(d); });
                            }
                            const deptsToShow = list.length > 0 ? list : DEPARTMENTS;

                            return deptsToShow.map(dept => {
                              const isChecked = editForm.departments?.includes(dept);
                              return (
                                <label
                                  key={dept}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-sky-50'
                                  }`}
                                >
                                <div
  style={{
    width: '16px',
    height: '16px',
    minWidth: '16px',
    minHeight: '16px',
    flexShrink: 0,
    boxSizing: 'border-box',
  }}
  className={`rounded border-2 flex items-center justify-center transition-colors ${
    isChecked
      ? darkMode
        ? 'border-sky-400 bg-transparent'
        : 'border-blue-700 bg-transparent'
      : darkMode
        ? 'border-gray-500 bg-transparent'
        : 'border-slate-300 bg-white'
  }`}
>
  {isChecked && (
    <svg
      style={{
        width: '10px',
        height: '10px',
        flexShrink: 0,
      }}
      className={darkMode ? 'text-sky-400' : 'text-blue-700'}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path
        d="M4 10.5l4 4 8-9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )}
</div>
                                  <input
                                    type="checkbox"
                                    checked={isChecked || false}
                                    onChange={e => {
                                      const checked = e.target.checked;
                                      setEditForm(prev => {
                                        let nd = prev.departments ? [...prev.departments] : [];
                                        if (checked) {
                                          if (!nd.includes(dept)) nd.push(dept);
                                        } else {
                                          nd = nd.filter(d => d !== dept);
                                        }
                                        return {
                                          ...prev,
                                          departments: nd,
                                          department: nd.length > 0 ? nd[0] : ''
                                        };
                                      });
                                    }}
                                    className="sr-only"
                                  />
                                  <span className={`text-sm truncate ${darkMode ? 'text-gray-200' : 'text-slate-800'}`}>
                                    {dept}
                                  </span>
                                </label>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Course Name</label>
                      <input
                        type="text"
                        name="courseName"
                        value={editForm.courseName}
                        onChange={handleEditFormChange}
                        style={{
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs ${
                          darkMode ? 'border-gray-600 placeholder-gray-400' : 'border-slate-300 placeholder-slate-400'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Class</label>
                      <select
                        name="className"
                        value={editForm.className}
                        onChange={handleEditFormChange}
                        style={{
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs ${
                          darkMode ? 'border-gray-600' : 'border-slate-300'
                        }`}
                        required
                      >
                        <option value="">Select Class</option>
                        <option value="FE">FE (First Year)</option>
                        <option value="SE">SE (Second Year)</option>
                        <option value="TE">TE (Third Year)</option>
                        <option value="BE">BE (Fourth Year)</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Academic Year</label>
                      <input
                        type="text"
                        name="academicYear"
                        placeholder="e.g. 2024-25"
                        value={editForm.academicYear}
                        onChange={handleEditFormChange}
                        style={{
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs ${
                          darkMode ? 'border-gray-600 placeholder-gray-400' : 'border-slate-300 placeholder-slate-400'
                        }`}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Schedule */}
                <div className={`rounded-2xl border p-4 shadow-2xs ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Semester</label>
                      <select
                        name="semester"
                        value={editForm.semester}
                        onChange={handleEditFormChange}
                        style={{
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs ${
                          darkMode ? 'border-gray-600' : 'border-slate-300'
                        }`}
                        required
                      >
                        <option value="">Select Semester</option>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Activity Date</label>
                      <input
                        type="date"
                        name="activityDate"
                        value={editForm.activityDate}
                        onChange={handleEditFormChange}
                        style={{
                          backgroundColor: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 shadow-2xs ${
                          darkMode ? 'border-gray-600' : 'border-slate-300'
                        }`}
                        required
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Fixed Footer */}
            <div className={`px-6 py-4 border-t flex-shrink-0 flex justify-end gap-3 ${
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-white'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingActivity(null);
                }}
                style={{
                  backgroundColor: darkMode ? '#374151' : '#f0f9ff',
                  color: darkMode ? '#e5e7eb' : '#0284c7'
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-all border border-transparent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  backgroundImage: 'linear-gradient(to right, #0284c7, #2563eb)'
                }}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:brightness-110 active:brightness-95 transition-all shadow-md shadow-sky-500/20 border-none cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      
     {showDeleteConfirmation && (
        <div 
          className="delete-confirmation-modal fixed inset-0 flex items-center justify-center z-50 p-4 transition-all"
          style={{
            backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(2.5px)',
            WebkitBackdropFilter: 'blur(2.5px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingActivities) {
              setShowDeleteConfirmation(false);
              setActivityToDelete(null);
              setIsMultiDelete(false);
              setDeleteError(null);
            }
          }}
        >
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-sm w-full shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-sky-100'}`}>
            <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Confirm Delete</h3>
            <p className={`mb-6 text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
              {isMultiDelete 
                ? `Are you sure you want to delete ${selectedActivities.size} selected activit${selectedActivities.size === 1 ? 'y' : 'ies'}? This action cannot be undone.`
                : `Are you sure you want to delete this activity? This action cannot be undone.`
              }
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-xs">
                <p>{deleteError}</p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setActivityToDelete(null);
                  setIsMultiDelete(false);
                  setDeleteError(null);
                }}
                style={{
                  backgroundColor: darkMode ? '#374151' : '#f0f9ff',
                  color: darkMode ? '#e5e7eb' : '#0284c7',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #bae6fd'
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all cursor-pointer"
                disabled={deletingActivities}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none'
                }}
                className={`px-4 py-2 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all cursor-pointer shadow-sm ${
                  deletingActivities ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={deletingActivities}
              >
                {deletingActivities ? 'Deleting...' : isMultiDelete ? `Delete ${selectedActivities.size} Activit${selectedActivities.size === 1 ? 'y' : 'ies'}` : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar 
        darkMode={darkMode} 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        toggleDarkMode={toggleDarkMode}
        activePage="comments" 
      />

      <LogoutConfirmation
        isOpen={showLogoutConfirm}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        darkMode={darkMode}
      />
      <DepartmentSelectionModal
        isOpen={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        onSubmit={handleDepartmentSubmit}
        userType="faculty" // Treat this as a faculty action for selecting a department
        currentDepartments={activityForDeptChange ? [activityForDeptChange.department] : []}
        currentPrimaryDepartment={activityForDeptChange?.department || ''}
        canEdit={true}
        darkMode={darkMode}
      />
      {/* Full-Screen Zoom Image Modal */}
      {isImageModalOpen && modalImages.length > 0 && (() => {
        const currentModalItem = modalImages[activeModalImageIndex] || modalImages[0];
        const currentIsPdf = isPdfUrl(currentModalItem);

        return (
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
              {/* Top Left: Title and Counter */}
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

              {/* Top Right: Zoom controls, Fullscreen toggle, Close */}
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

            {/* Center Image Container */}
            <div 
              className="flex-1 w-full h-full flex items-center justify-center relative overflow-hidden px-4"
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
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                    padding: 0
                  }}
                  title="Previous image"
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
        );
      })()}
    </div>
  );
};

export default StudentFeedback;