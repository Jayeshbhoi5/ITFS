import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import {
  FaUser, FaCalendarAlt, FaStar, FaTimes, FaExpand, FaCompress,
  FaChevronLeft, FaChevronRight, FaSearchPlus, FaSearchMinus, FaFilePdf,
  FaDownload, FaRedo
} from 'react-icons/fa';
import { getDarkModeFromStorage, setDarkModeInStorage } from './darkModeUtils';
import Navbar from './Navbar';
import Sidebar from './StudentSidebar';
import { ViewFeedbackSkeleton } from '../../components/FeedbackSkeleton';

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

const ViewFeedbackPage = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialActivity = location.state?.activity || null;
  const [feedback, setFeedback] = useState(null);
  const [activity, setActivity] = useState(initialActivity);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => { try { return JSON.parse(sessionStorage.getItem('sidebarOpen')) || false; } catch { return false; } });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage());
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastTapRef = useRef(0);
  const modalContainerRef = useRef(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const touchMovedRef = useRef(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setDarkModeInStorage(newMode);
  };

  const getCurrentUserId = () => {
    return auth.currentUser?.uid;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchFeedbackAndActivity = async () => {
      try {
        if (!activity) {
          setLoading(true);
        }

        // Fetch activity details
        const activityRef = doc(db, 'activities', activityId);
        const activitySnap = await getDoc(activityRef);

        if (!activitySnap.exists()) {
          throw new Error('Activity not found');
        }

        const activityData = {
          id: activitySnap.id,
          ...activitySnap.data()
        };
        setActivity(activityData);

        // Fetch feedback
        const userId = getCurrentUserId();
        if (!userId) {
          throw new Error('User not authenticated');
        }

        let feedbackData = null;

        // Try query with userId
        let q = query(
          collection(db, 'feedback'),
          where('activityId', '==', activityId),
          where('userId', '==', userId)
        );
        let feedbackSnapshot = await getDocs(q);

        // If no results, try with studentId
        if (feedbackSnapshot.empty) {
          q = query(
            collection(db, 'feedback'),
            where('activityId', '==', activityId),
            where('studentId', '==', userId)
          );
          feedbackSnapshot = await getDocs(q);
        }

        // Fallback search
        if (feedbackSnapshot.empty) {
          q = query(collection(db, 'feedback'), where('activityId', '==', activityId));
          feedbackSnapshot = await getDocs(q);

          if (!feedbackSnapshot.empty) {
            const potentialMatch = feedbackSnapshot.docs.find(d => {
              const data = d.data();
              return data.userId?.includes(userId) || data.studentId?.includes(userId) ||
                     data.userEmail === auth.currentUser?.email;
            });

            if (potentialMatch) {
              feedbackData = { id: potentialMatch.id, ...potentialMatch.data() };
            } else {
              const firstDoc = feedbackSnapshot.docs[0];
              feedbackData = { id: firstDoc.id, ...firstDoc.data() };
            }
          }
        } else {
          const feedbackDoc = feedbackSnapshot.docs[0];
          feedbackData = { id: feedbackDoc.id, ...feedbackDoc.data() };
        }

        if (!feedbackData) {
          throw new Error('Feedback not found. Please ensure you have submitted feedback for this activity.');
        }

        // Normalize comments field
        if (!feedbackData.comments) {
          feedbackData.comments = feedbackData.comment || feedbackData.feedback || feedbackData.text || feedbackData.description || '';
        }

        setFeedback(feedbackData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching feedback or activity:', err);
        setError(err.message || 'Failed to load feedback.');
        setLoading(false);
      }
    };

    fetchFeedbackAndActivity();
  }, [activityId]);

  // Aggregate all images belonging to the activity
  const activityImages = useMemo(() => {
    const list = [];
    const main = activity?.mainImage || activity?.image;
    if (main) list.push(main);

    if (Array.isArray(activity?.fileUrls) && activity.fileUrls.length > 0) {
      activity.fileUrls.forEach(f => {
        const url = typeof f === 'string' ? f : f?.url;
        if (url && !list.includes(url)) list.push(url);
      });
    }
    if (Array.isArray(activity?.images) && activity.images.length > 0) {
      activity.images.forEach(img => {
        const url = typeof img === 'string' ? img : img?.url;
        if (url && !list.includes(url)) list.push(url);
      });
    }
    return list;
  }, [activity]);

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
        setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
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

  const closeImageModal = () => {
    if (document.fullscreenElement) {
      try { document.exitFullscreen(); } catch {}
    }
    setIsImageModalOpen(false);
    resetZoom();
  };

  const handleBackdropClick = () => {
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

  const handlePrevImage = (e) => {
    if (e) e.stopPropagation();
    resetZoom();
    setActiveImageIndex(prev => (prev === 0 ? activityImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    if (e) e.stopPropagation();
    resetZoom();
    setActiveImageIndex(prev => (prev === activityImages.length - 1 ? 0 : prev + 1));
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
      } else if (e.key === 'ArrowLeft' && activityImages.length > 1) {
        handlePrevImage();
      } else if (e.key === 'ArrowRight' && activityImages.length > 1) {
        handleNextImage();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, zoomLevel, activityImages.length]);

  const renderStarRating = (rating) => {
    const numericRating = typeof rating === 'string' ? parseFloat(rating) : (rating || 0);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <FaStar
            key={i}
            className={`w-4 h-4 ${i < Math.round(numericRating) ? 'text-yellow-400' : (darkMode ? 'text-gray-600' : 'text-gray-300')}`}
          />
        ))}
      </div>
    );
  };

  const getComments = () => {
    if (!feedback) return 'No comments provided';
    const c = feedback.comments || feedback.comment || feedback.feedback || '';
    return c.trim() ? c : 'No comments provided';
  };

  const activityTitle = activity?.activityName || activity?.title || 'Untitled Activity';
  const currentImage = activityImages[activeImageIndex] || activity?.mainImage || activity?.image || null;
  const currentIsPdf = isPdfUrl(currentImage);

  if (loading && !activity) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'} transition-colors duration-300`}>
        <Navbar 
          darkMode={darkMode} 
          toggleSidebar={toggleSidebar} 
          showProfileMenu={showProfileMenu}
          toggleProfileMenu={toggleProfileMenu}
          sidebarOpen={sidebarOpen}
        />
        <Sidebar 
          darkMode={darkMode}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          toggleDarkMode={toggleDarkMode}
          activePage="activities"
        />
        <div className={`p-4 sm:p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out`}>
          <ViewFeedbackSkeleton darkMode={darkMode} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'} transition-colors duration-300`}>
        <Navbar 
          darkMode={darkMode} 
          toggleSidebar={toggleSidebar} 
          showProfileMenu={showProfileMenu}
          toggleProfileMenu={toggleProfileMenu}
          sidebarOpen={sidebarOpen}
        />
        <Sidebar 
          darkMode={darkMode}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          toggleDarkMode={toggleDarkMode}
          activePage="activities"
        />
        <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out`}>
          <div className="text-center p-8 rounded-xl bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200 max-w-lg mx-auto border border-red-200 dark:border-red-800">
            <p className="mb-4">{error}</p>
            <button
              onClick={() => navigate('/AllActivitiesPage')}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors cursor-pointer"
              style={{ border: 'none' }}
            >
              Back to Activities
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'} transition-colors duration-300`}>
      <Navbar 
        darkMode={darkMode} 
        toggleSidebar={toggleSidebar} 
        showProfileMenu={showProfileMenu}
        toggleProfileMenu={toggleProfileMenu}
        sidebarOpen={sidebarOpen}
      />

      <Sidebar 
        darkMode={darkMode}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleDarkMode={toggleDarkMode}
        activePage="activities"
      />

      <div className={`p-6 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out page-smooth-enter`}>
        <div className={`rounded-xl shadow-sm border transition-colors duration-300 page-smooth-enter ${
          darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-gray-200'
        }`}>
          <div className="p-6">
            {/* Back arrow + breadcrumb row */}
            <div className="flex items-center gap-2.5 mb-5">
              <button
                type="button"
                onClick={() => navigate('/AllActivitiesPage')}
                className="flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none cursor-pointer transition-colors"
                style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}
                title="Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() => navigate('/AllActivitiesPage')}
                >
                  Activities
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  View Feedback
                </span>
              </div>
            </div>

            {/* Top row: Title + Meta details on left, Modern Stacked Image Card on right */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
  <div className="flex-1">
    {/* Activity title */}
    <h2
      className={`text-2xl font-bold mb-3 leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}
      style={{ wordBreak: 'break-word' }}
    >
      {activityTitle}
    </h2>

    {/* Activity meta row — divider strip, no boxes/icons, bold colored values */}
    <div
      className={`flex flex-wrap items-center divide-x mb-3 ${
        darkMode ? 'divide-gray-700' : 'divide-gray-200'
      }`}
    >
      {(activity.facultyName || activity.faculty) && (
        <div className="flex items-center pr-3">
          <span className="text-sm font-extrabold tracking-tight" style={{ color: '#1d4ed8' }}>
            {activity.facultyName || activity.faculty}
          </span>
        </div>
      )}

      {(activity.courseName || activity.branch) && (
        <div className="flex items-center px-3">
          <span className="text-sm font-extrabold tracking-tight" style={{ color: '#6d28d9' }}>
            {activity.courseName || activity.branch}
          </span>
        </div>
      )}

      {(activity.activityDate || activity.date) && (
        <div className="flex items-center px-3">
          <span className="text-sm font-extrabold tracking-tight" style={{ color: '#b45309' }}>
            {activity.activityDate ? new Date(activity.activityDate).toLocaleDateString() : activity.date}
          </span>
        </div>
      )}

      {(activity.className || activity.year) && (
        <div className="flex items-center pl-3">
          <span className="text-sm font-extrabold tracking-tight" style={{ color: '#047857' }}>
            {activity.className || activity.year}
          </span>
        </div>
      )}
    </div>

    {activity.description && (
      <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {activity.description}
      </p>
    )}
  </div>

              {/* Modern Gesture Stacked Image Card */}
              {currentImage && (
                <div className="flex-shrink-0 flex flex-col items-center justify-center md:justify-end pt-1">
                  <div
                    onClick={() => setIsImageModalOpen(true)}
                    className="relative group cursor-pointer select-none p-2"
                    title="Click to view photo"
                  >
                    {/* Layer 1: background tilt card */}
                    <div className="absolute inset-2 rounded-2xl bg-indigo-200 dark:bg-indigo-900/60 transform rotate-6 scale-95 opacity-70 group-hover:rotate-12 transition-transform duration-300"></div>
                    {/* Layer 2: secondary tilt card */}
                    <div className="absolute inset-2 rounded-2xl bg-blue-200 dark:bg-blue-800/60 transform -rotate-3 scale-95 opacity-80 group-hover:-rotate-6 transition-transform duration-300"></div>
                    {/* Foreground main card */}
                    <div className="relative w-36 h-28 sm:w-44 sm:h-32 rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                      <ActivityThumbnail
                        src={currentImage}
                        alt={activityTitle}
                        darkMode={darkMode}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold backdrop-blur-xs gap-1">
                        <FaExpand className="text-xs" />
                        <span>View</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow controls below thumbnail if multiple images */}
                  {activityImages.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs border active:scale-95"
                        style={{
                          background: darkMode ? '#374151' : '#ffffff',
                          borderColor: darkMode ? '#4b5563' : '#d1d5db',
                          color: darkMode ? '#e5e7eb' : '#374151',
                          padding: 0
                        }}
                        title="Previous image"
                      >
                        <FaChevronLeft className="text-[10px]" />
                      </button>
                      <span className={`text-[11px] font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {activeImageIndex + 1} / {activityImages.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs border active:scale-95"
                        style={{
                          background: darkMode ? '#374151' : '#ffffff',
                          borderColor: darkMode ? '#4b5563' : '#d1d5db',
                          color: darkMode ? '#e5e7eb' : '#374151',
                          padding: 0
                        }}
                        title="Next image"
                      >
                        <FaChevronRight className="text-[10px]" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ratings Section */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-blue-500"></div>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading feedback details...</span>
              </div>
            ) : (
              <>
                {feedback && (
                  <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-4 w-1 rounded-full bg-blue-600 dark:bg-blue-500" />
                  <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    Submitted Ratings
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { label: 'Overall Rating',        val: feedback.rating           },
                    { label: 'Ease of Understanding', val: feedback.understandability },
                    { label: 'Engagement Level',      val: feedback.engagement        },
                    { label: 'Content Relevance',     val: feedback.relevance         },
                  ].map(({ label, val }) => {
                    const score = typeof val === 'string' ? parseFloat(val) : (val || 0);
                    const pct = (score / 5) * 100;
                    return (
                      <div
                        key={label}
                        className={`rounded-xl border p-4 transition-all duration-200 hover:shadow-xs ${
                          darkMode
                            ? 'bg-gray-800/90 border-gray-700/80 hover:border-blue-500/40'
                            : 'bg-white border-gray-200 hover:border-blue-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                            {label}
                          </span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            darkMode 
                              ? 'bg-blue-950/50 text-blue-300 border-blue-800/60' 
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {score > 0 ? `${score} / 5` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`w-4 h-4 ${i < Math.round(score) ? 'text-yellow-400' : (darkMode ? 'text-gray-600' : 'text-gray-300')}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comments block */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 rounded-full bg-blue-600 dark:bg-blue-500" />
                <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Comments
                </span>
              </div>
              <div className={`rounded-xl p-4 text-sm leading-relaxed border ${
                darkMode
                  ? 'bg-gray-800/80 border-gray-700 text-gray-200'
                  : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}>
                {getComments()}
              </div>
            </div>

            {/* Suggestions block */}
            {feedback?.suggestions && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-1 rounded-full bg-blue-600 dark:bg-blue-500" />
                  <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    Suggestions for Improvement
                  </span>
                </div>
                <div className={`rounded-xl p-4 text-sm leading-relaxed border ${
                  darkMode
                    ? 'bg-gray-800/80 border-gray-700 text-gray-200'
                    : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}>
                  {feedback.suggestions}
                </div>
              </div>
            )}

            {/* Submission Date */}
            {feedback?.createdAt && (
              <div className="pt-2 flex justify-end">
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border ${
                  darkMode
                    ? 'bg-gray-800 text-gray-400 border-gray-700'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                  <FaCalendarAlt className="opacity-60 text-blue-500" />
                  Submitted on:{' '}
                  {feedback.createdAt.toDate
                    ? new Date(feedback.createdAt.toDate()).toLocaleString()
                    : new Date(feedback.createdAt).toLocaleString()}
                </span>
              </div>
            )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* Full-Screen Zoom Image Modal */}
      {isImageModalOpen && (currentImage || activity?.mainImage || activity?.image) && (
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
              {activityImages.length > 1 && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 flex-shrink-0"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)'
                  }}
                >
                  {activeImageIndex + 1} / {activityImages.length}
                </span>
              )}
              {activityTitle && (
                <span 
                  className="text-xs sm:text-sm font-semibold truncate inline-block"
                  style={{
                    color: '#ffffff',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)'
                  }}
                  title={activityTitle}
                >
                  {activityTitle}
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
            {activityImages.length > 1 && (
              <button
                type="button"
                onClick={handlePrevImage}
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
                pdfUrl={currentImage}
                title={activityTitle}
                pagesCount={activity?.pages || activity?.pdfPages || null}
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
                src={currentImage} 
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
            {activityImages.length > 1 && (
              <button
                type="button"
                onClick={handleNextImage}
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
          {activityImages.length > 1 && (
            <div 
              className="w-full flex items-center justify-center pb-3 pt-2 z-30 flex-shrink-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 70%, transparent 100%)'
              }}
              onClick={handleBackdropClick}
            >
              <div className="flex justify-center gap-1.5 py-1" onClick={e => e.stopPropagation()}>
                {activityImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetZoom();
                      setActiveImageIndex(idx);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === activeImageIndex
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
    </div>
  );
};

export default ViewFeedbackPage;