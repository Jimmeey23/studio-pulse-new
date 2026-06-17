import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Info, 
  Pin, 
  PinOff, 
  X, 
  GripHorizontal, 
  Edit2, 
  Save, 
  Eye, 
  Copy, 
  Download, 
  Maximize2,
  RefreshCw,
  Sparkles,
  Brain,
  Tabs
} from 'lucide-react';
import { Button } from './button';
import { Textarea } from './textarea';
import { Tabs as TabsComponent, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SummaryDisplay } from './SummaryDisplay';
import { summaryManager } from '@/services/summaryManager';
import { useDataContext } from '@/hooks/useDataContext';
import { useToast } from '@/hooks/use-toast';
import { useDataSource } from '@/contexts/DataSourceContext';

interface InfoPopoverProps {
  context: string;
  locationId: string;
  iframeSrc?: string;
  startAsSidebar?: boolean;
}

const MIN_WIDTH = 320;
const MAX_WIDTH = 800;

const normalizePopoverLocationCandidates = (locationId: string): string[] => {
  const normalized = (locationId || '').trim().toLowerCase();

  if (!normalized || normalized === 'all' || normalized.includes('all locations')) {
    return ['all'];
  }

  const candidates = new Set<string>();

  if (normalized === 'kwality' || normalized.includes('kwality') || normalized.includes('kemps')) {
    candidates.add('kwality');
  }
  if (normalized === 'supreme' || normalized.includes('supreme') || normalized.includes('bandra')) {
    candidates.add('supreme');
  }
  if (normalized === 'kenkere' || normalized.includes('kenkere') || normalized.includes('bengaluru') || normalized.includes('bangalore')) {
    candidates.add('kenkere');
  }
  if (normalized === 'popup' || normalized === 'pop-up' || normalized.includes('pop up') || normalized.includes('pop-up')) {
    candidates.add('popup');
  }

  candidates.add(encodeURIComponent(locationId));
  candidates.add('all');

  return Array.from(candidates);
};

const getPopoverCacheKey = (src: string) => `popover-html-cache:${src}`;

const InfoPopover: React.FC<InfoPopoverProps> = ({
  context,
  locationId,
  iframeSrc,
  startAsSidebar = true
}) => {
  const storageKey = `info-sidebar-${context}-${locationId}`;

  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(storageKey + ':width');
    return saved ? parseInt(saved, 10) : 450;
  });
  const [pinned, setPinned] = useState(() => {
    const saved = localStorage.getItem(storageKey + ':pinned');
    return saved ? JSON.parse(saved) : false;
  });

  const [isSidebarMode, setIsSidebarMode] = useState(() => {
    const saved = localStorage.getItem(storageKey + ':sidebar');
    return saved ? JSON.parse(saved) : startAsSidebar;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(() => {
    const saved = localStorage.getItem(storageKey + ':content');
    if (saved) {
      return saved;
    } else {
      return `# ${context}\n\n**Location:** ${locationId}\n\nAdd your notes and insights here...`;
    }
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0); // Force iframe refresh
  const [iframeOk, setIframeOk] = useState<boolean | null>(null); // null = unknown, true = ok, false = not ok
  const [iframeHtmlFallback, setIframeHtmlFallback] = useState<string | null>(null);
  const [resolvedIframeSrc, setResolvedIframeSrc] = useState<string | null>(null);
  
  // AI Summary states
  const [activeTab, setActiveTab] = useState<'content' | 'summary'>('content');
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  
  // Get contextual data for AI analysis
  const { data: contextData, activeFilters, dateRange } = useDataContext(context, locationId);
  const { toast } = useToast();
  const { mode } = useDataSource();

  const panelRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(storageKey + ':width', String(width));
  }, [width, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey + ':pinned', JSON.stringify(pinned));
  }, [pinned, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey + ':open', JSON.stringify(open));
  }, [open, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey + ':sidebar', JSON.stringify(isSidebarMode));
  }, [isSidebarMode, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey + ':content', content);
  }, [content, storageKey]);

  // Close on outside click if not pinned
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open || pinned) return;
      const el = panelRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && !el.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, pinned]);

  // Close on Escape key if not pinned
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!open || pinned) return;
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, pinned]);

  // Resize handlers
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - e.clientX));
      setWidth(newWidth);
    };
    const onUp = () => (draggingRef.current = false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startDrag = () => {
    draggingRef.current = true;
  };

  const handleSave = () => {
    setIsEditing(false);
    // Content is automatically saved to localStorage via useEffect
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(content);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${context}-${locationId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleMode = () => {
    setIsSidebarMode(!isSidebarMode);
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-md font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/\n/gim, '<br/>');
  };

  // AI Summary handlers
  const handleGenerateSummary = async () => {
    if (summaryLoading) return;
    
    setSummaryLoading(true);
    setSummaryError(null);
    
    try {
      // Switch to summary tab
      setActiveTab('summary');
      
      // Use fallback data if contextData is empty
      const dataToAnalyze = contextData && contextData.length > 0 
        ? contextData 
        : [{
            context: context,
            location: locationId,
            timestamp: new Date().toISOString(),
            placeholder: 'Sample analytics data for ' + context
          }];
      
      const result = await summaryManager.generateSummary({
        context,
        locationId,
        data: dataToAnalyze,
        tableName: context.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        activeFilters,
        dateRange,
        forceRegenerate: false
      });
      
      if (result.success && result.summary) {
        setAiSummary(result.summary);
        toast({
          title: "AI Summary Generated",
          description: result.fromCache ? "Retrieved from cache" : "Generated new insights",
        });
      } else {
        setSummaryError(result.error || 'Failed to generate summary');
        toast({
          title: "Summary Generation Failed",
          description: result.error || 'Unknown error occurred',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Summary generation error:', error);
      setSummaryError(error.message || 'Failed to generate summary');
      toast({
        title: "Summary Generation Failed",
        description: error.message || 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setSummaryLoading(false);
    }
  };
  
  const handleRegenerateSummary = () => {
    // Force regeneration
    handleGenerateSummary();
  };
  
  const handleDeleteSummary = () => {
    setAiSummary(null);
    setSummaryError(null);
    toast({
      title: "Summary Cleared",
      description: "AI summary has been removed",
    });
  };

  // Build iframe URL: prefer explicit prop, otherwise map to existing HTML files
  const getIframeSrc = () => {
    if (iframeSrc) return iframeSrc;
    
    // Use the new directory structure for all contexts including sales-overview
    const contextMappings: Record<string, string> = {
      'class-attendance': 'class-attendance-overview',
      'sales-overview': 'sales-overview',
      'executive-overview': 'executive-overview',
      'class-attendance-overview': 'class-attendance-overview',
      'class-formats-overview': 'class-formats-overview', 
      'funnel-leads-overview': 'funnel-leads-overview',
      'client-retention-overview': 'client-retention-overview',
      'trainer-performance-overview': 'trainer-performance-overview',
      'discounts-promotions-overview': 'discounts-promotions-overview',
      'sessions-overview': 'sessions-overview',
      'patterns-trends-overview': 'patterns-trends-overview',
      'outlier-analysis-overview': 'outlier-analysis-overview',
      'expiration-analytics-overview': 'expiration-analytics-overview',
      'late-cancellations-overview': 'late-cancellations-overview'
    };
    
    const mappedContext = contextMappings[context] || context;
    const directoryPath = `/popovers/${mappedContext}/${encodeURIComponent(locationId)}.html`;
    
    return directoryPath;
  };

  const src = getIframeSrc();
  const srcCandidates = React.useMemo(() => {
    if (iframeSrc) {
      return [iframeSrc, '/popovers/default-template.html'];
    }

    const contextMappings: Record<string, string> = {
      'class-attendance': 'class-attendance-overview',
      'sales-overview': 'sales-overview',
      'executive-overview': 'executive-overview',
      'class-attendance-overview': 'class-attendance-overview',
      'class-formats-overview': 'class-formats-overview',
      'funnel-leads-overview': 'funnel-leads-overview',
      'client-retention-overview': 'client-retention-overview',
      'trainer-performance-overview': 'trainer-performance-overview',
      'discounts-promotions-overview': 'discounts-promotions-overview',
      'sessions-overview': 'sessions-overview',
      'patterns-trends-overview': 'patterns-trends-overview',
      'outlier-analysis-overview': 'outlier-analysis-overview',
      'expiration-analytics-overview': 'expiration-analytics-overview',
      'late-cancellations-overview': 'late-cancellations-overview'
    };

    const mappedContext = contextMappings[context] || context;
    const locationCandidates = normalizePopoverLocationCandidates(locationId);
    return [
      ...locationCandidates.map((candidate) => `/popovers/${mappedContext}/${candidate}.html`),
      src,
      '/popovers/default-template.html'
    ].filter(Boolean);
  }, [context, iframeSrc, locationId, src]);

  // Pre-flight check: try to fetch the HTML for the iframe source so we can render
  // a fallback (inline HTML) if the iframe cannot load (or the file is missing).
  useEffect(() => {
    if (!srcCandidates.length) return;
    let cancelled = false;
    setIframeOk(null);
    setIframeHtmlFallback(null);
    setResolvedIframeSrc(null);

    const resolveContent = async () => {
      for (const candidate of srcCandidates) {
        try {
          const response = await fetch(candidate, { method: 'GET', cache: 'no-store' });
          if (!response.ok) continue;

          const html = await response.text();
          if (cancelled) return;

          localStorage.setItem(getPopoverCacheKey(candidate), html);
          setResolvedIframeSrc(candidate);
          setIframeHtmlFallback(html);
          setIframeOk(true);
          return;
        } catch {
          const cached = localStorage.getItem(getPopoverCacheKey(candidate));
          if (cached) {
            if (cancelled) return;
            setResolvedIframeSrc(candidate);
            setIframeHtmlFallback(cached);
            setIframeOk(true);
            return;
          }
        }
      }

      if (!cancelled) {
        setResolvedIframeSrc(srcCandidates[0] || src);
        setIframeOk(false);
        setIframeHtmlFallback(null);
      }
    };

    void resolveContent();

    return () => { cancelled = true; };
  }, [src, srcCandidates, iframeKey]);

  const renderSidebar = () => (
    <div
      ref={panelRef}
      className="absolute top-0 right-0 bottom-0 bg-white/95 backdrop-blur-md shadow-2xl border-l border-white/20 pointer-events-auto flex flex-col"
      style={{ width }}
    >
      {/* Enhanced Header with Controls */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/80 backdrop-blur-md transition-all duration-300 hover:bg-white/90 group">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-gray-800">
            {context} - {locationId}
          </h3>
        </div>
        <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(!isEditing)}
            className="h-7 w-7 p-0"
            title="Edit content"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPreviewMode(!previewMode)}
            className="h-7 w-7 p-0"
            title="Toggle preview"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleGenerateSummary}
            className="h-7 w-7 p-0 text-purple-600 hover:text-purple-700"
            title="Generate AI Summary"
            disabled={summaryLoading}
          >
            {summaryLoading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Brain className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-7 w-7 p-0"
            title="Copy content"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="h-7 w-7 p-0"
            title="Download content"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleMode}
            className="h-7 w-7 p-0"
            title="Toggle modal view"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPinned(!pinned)}
            className={`h-7 w-7 p-0 ${pinned ? 'bg-blue-100' : ''}`}
            title={pinned ? 'Unpin panel' : 'Pin panel'}
          >
            <Pin className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIframeKey(prev => prev + 1)}
            className="h-7 w-7 p-0"
            title="Refresh content"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="h-7 w-7 p-0"
            title="Close"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content Area with Tabs */}
      <div className="flex-1 overflow-hidden">
        <TabsComponent value={activeTab} onValueChange={(value) => setActiveTab(value as 'content' | 'summary')} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Summary
              {aiSummary && <div className="w-2 h-2 bg-green-500 rounded-full" />}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="flex-1 overflow-hidden mt-2">
            {isEditing ? (
              <div className="h-full flex flex-col p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">Editing Mode</span>
                  <Button size="sm" onClick={handleSave} className="flex items-center space-x-1">
                    <Save className="h-3 w-3" />
                    <span>Save</span>
                  </Button>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 resize-none font-mono text-sm"
                  placeholder="Enter your content here... (Supports basic Markdown)"
                />
              </div>
            ) : (
              <div className="h-full">
                {previewMode ? (
                  <div className="p-4 prose max-w-none h-full overflow-auto">
                    <div dangerouslySetInnerHTML={{
                      __html: renderMarkdown(content || 'No content yet. Click the edit button to add content.')
                    }} />
                  </div>
                ) : (
                  <div className="h-full">
                    {iframeOk === null ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-sm text-slate-500">Checking content...</div>
                      </div>
                    ) : iframeOk === true && mode !== 'offline' && resolvedIframeSrc ? (
                      <iframe
                        key={`iframe-sidebar-${iframeKey}`}
                        src={resolvedIframeSrc}
                        className="w-full h-full border-0"
                        title={`Info for ${context} - ${locationId}`}
                        loading="eager"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-downloads"
                        allow="clipboard-read; clipboard-write; geolocation; microphone; camera; encrypted-media"
                        referrerPolicy="no-referrer-when-downgrade"
                        style={{
                          border: 'none',
                          overflow: 'auto',
                          width: '100%',
                          height: '100%',
                          display: 'block'
                        }}
                        onLoad={() => {
                          setIframeError(false);
                        }}
                        onError={() => {
                          console.error(`Iframe failed to load: ${resolvedIframeSrc}`);
                          setIframeError(true);
                          setIframeOk(false);
                        }}
                      />
                    ) : (
                      // iframe failed the preflight or fetch; render inline HTML fallback if available
                      iframeHtmlFallback ? (
                        <div className="p-4 h-full overflow-auto" dangerouslySetInnerHTML={{ __html: iframeHtmlFallback }} />
                      ) : (
                        <div className="flex items-center justify-center h-full p-4">
                          <div className="text-center">
                            <div className="text-red-500 text-lg mb-2">⚠️ Content Not Available</div>
                            <div className="text-gray-600 text-sm mb-4">Unable to load: {(resolvedIframeSrc || src).split('?')[0]}</div>
                            <div className="flex gap-2 justify-center">
                              <a href={resolvedIframeSrc || src} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Open in new tab</a>
                              <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                              >
                                Create Content
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="summary" className="flex-1 overflow-hidden mt-2">
            <div className="h-full overflow-auto p-4">
              {summaryError ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-red-500 mb-4">{summaryError}</div>
                  <Button onClick={handleGenerateSummary} disabled={summaryLoading}>
                    {summaryLoading ? 'Generating...' : 'Try Again'}
                  </Button>
                </div>
              ) : aiSummary ? (
                <SummaryDisplay 
                  summary={aiSummary}
                  onRegenerate={handleRegenerateSummary}
                  onDelete={handleDeleteSummary}
                  showActions={true}
                  variant="default"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="mb-6">
                    <Sparkles className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">AI-Powered Insights</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      Generate deep, contextual analysis of your {context.replace('-', ' ')} data with AI-powered insights and recommendations.
                    </p>
                  </div>
                  <Button 
                    onClick={handleGenerateSummary} 
                    disabled={summaryLoading}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    {summaryLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                    {summaryLoading ? 'Generating Summary...' : 'Generate AI Summary'}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </TabsComponent>
      </div>

      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 h-full w-2 cursor-col-resize bg-transparent hover:bg-blue-200 transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag();
        }}
      />

      {/* Width Indicator */}
      <div className="absolute left-0 bottom-2 -ml-10 flex items-center rotate-90">
        <div className="flex items-center gap-1 text-xs text-slate-500 px-2 py-1 bg-white/80 rounded shadow-sm">
          <GripHorizontal className="w-3 h-3" />
          <span>{Math.round(width)}px</span>
        </div>
      </div>
    </div>
  );

  const renderModal = () => (
    <div className="fixed inset-0 z-[9999] pointer-events-auto bg-black/20 flex items-center justify-center p-8" onClick={(e) => { if (e.target === e.currentTarget && !pinned) setOpen(false); }}>
      <div 
        ref={panelRef}
        className="bg-white/95 backdrop-blur-md rounded-lg shadow-2xl flex flex-col max-w-4xl w-full h-full max-h-[90vh] border border-white/20"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/80 backdrop-blur-md transition-all duration-300 hover:bg-white/90 group">
          <h3 className="text-lg font-semibold text-gray-800">
            {context} - {locationId}
          </h3>
          <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              className="h-7 w-7 p-0"
              title="Edit content"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPreviewMode(!previewMode)}
              className="h-7 w-7 p-0"
              title="Toggle preview"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="h-7 w-7 p-0"
              title="Copy content"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownload}
              className="h-7 w-7 p-0"
              title="Download content"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMode}
              className="h-7 w-7 p-0"
              title="Toggle sidebar view"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIframeKey(prev => prev + 1)}
              className="h-7 w-7 p-0"
              title="Refresh content"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="h-7 w-7 p-0"
              title="Close"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <div className="h-full flex flex-col p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">Editing Mode</span>
                <Button size="sm" onClick={handleSave} className="flex items-center space-x-1">
                  <Save className="h-3 w-3" />
                  <span>Save</span>
                </Button>
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 resize-none font-mono text-sm"
                placeholder="Enter your content here... (Supports basic Markdown)"
              />
            </div>
          ) : (
            <div className="h-full">
              {previewMode ? (
                <div className="p-6 prose max-w-none h-full overflow-auto">
                  <div dangerouslySetInnerHTML={{
                    __html: renderMarkdown(content || 'No content yet. Click the edit button to add content.')
                  }} />
                </div>
              ) : (
                <div className="h-full">
                  {iframeOk === null ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-sm text-slate-500">Checking content...</div>
                    </div>
                  ) : iframeOk === true && mode !== 'offline' && resolvedIframeSrc ? (
                    <iframe
                      key={`iframe-modal-${iframeKey}`}
                      src={resolvedIframeSrc}
                      className="w-full h-full border-0"
                      title={`Info for ${context} - ${locationId}`}
                      loading="eager"
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-downloads"
                      allow="clipboard-read; clipboard-write; geolocation; microphone; camera; encrypted-media"
                      referrerPolicy="no-referrer-when-downgrade"
                      style={{
                        border: 'none',
                        overflow: 'auto',
                        width: '100%',
                        height: '100%',
                        display: 'block'
                      }}
                      onLoad={() => {
                        setIframeError(false);
                      }}
                      onError={() => {
                        console.error(`Iframe failed to load: ${resolvedIframeSrc}`);
                        setIframeError(true);
                        setIframeOk(false);
                      }}
                    />
                  ) : (
                    iframeHtmlFallback ? (
                      <div className="p-6 h-full overflow-auto" dangerouslySetInnerHTML={{ __html: iframeHtmlFallback }} />
                    ) : (
                      <div className="absolute inset-0 bg-white flex items-center justify-center p-4">
                        <div className="text-center">
                          <div className="text-red-500 text-lg mb-2">⚠️ Content Not Available</div>
                          <div className="text-gray-600 text-sm mb-4">Unable to load: {(resolvedIframeSrc || src).split('?')[0]}</div>
                          <div className="flex gap-2 justify-center">
                            <a href={resolvedIframeSrc || src} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Open in new tab</a>
                            <button 
                              onClick={() => {
                                setIsEditing(true);
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            >
                              Create Content
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render the trigger and the portal'ed sidebar/modal
  return (
    <>
      <div className="flex items-center gap-2">
        <button
          aria-label="Open info panel"
          title="Open info panel"
          onClick={() => setOpen((s) => !s)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-transparent border-0 hover:bg-white/10 transition-colors duration-200 neon-info-icon"
          style={{
            color: '#ffffff',
            animation: 'neonColorCycle 3s ease-in-out infinite'
          }}
        >
          <Info className="w-4 h-4 drop-shadow-lg" />
        </button>
      </div>

      <style>{`
        @keyframes neonColorCycle {
          0%, 100% { color: #ffffff; }
          25% { color: #fef3c7; }
          50% { color: #fed7aa; }
          75% { color: #fbbf24; }
        }
      `}</style>

      {typeof document !== 'undefined' && createPortal(
        open ? (
          <div className="fixed inset-0 z-[9999] pointer-events-none">
            {isSidebarMode ? (
              <>
                {/* Backdrop - transparent to allow interaction with background data */}
                <div className="absolute inset-0 pointer-events-none" />
                {renderSidebar()}
              </>
            ) : (
              renderModal()
            )}
          </div>
        ) : null,
        document.body
      )}
    </>
  );
};

export default InfoPopover;
export { InfoPopover };
