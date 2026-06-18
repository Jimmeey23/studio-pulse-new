import React, { useState, useEffect } from 'react';
import { Info, Edit2, Save, X, Loader2, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { googleDriveService } from '@/services/googleDriveService';
import { useToast } from '@/hooks/use-toast';

type SalesContextKey =
  | 'sales-metrics'
  | 'sales-top-bottom'
  | 'sales-mom'
  | 'sales-yoy'
  | 'sales-product'
  | 'sales-category'
  | 'sales-soldby'
  | 'sales-payment'
  | 'sales-customer'
  | 'sales-deep-insights'
  | 'sales-overview';

interface EditableInfoPopoverProps {
  context: SalesContextKey;
  locationId?: 'kwality' | 'supreme' | 'kenkere' | 'all' | string;
  className?: string;
  size?: number;
  defaultContent?: React.ReactNode[];
}

export const EditableInfoPopover: React.FC<EditableInfoPopoverProps> = ({
  context,
  locationId = 'all',
  className,
  size = 16,
  defaultContent = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [customContent, setCustomContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load custom content from Google Drive on mount
  useEffect(() => {
    loadCustomContent();
  }, [context, locationId]);

  const loadCustomContent = async () => {
    setIsLoading(true);
    try {
      const savedContent = await googleDriveService.getPopoverContent(context, locationId);
      setCustomContent(savedContent);
      if (savedContent) {
        setContent(savedContent);
      } else {
        // Convert default content to string
        setContent(convertDefaultContentToString());
      }
    } catch (error) {
      console.error('Error loading custom content:', error);
      setContent(convertDefaultContentToString());
    } finally {
      setIsLoading(false);
    }
  };

  const convertDefaultContentToString = () => {
    if (!defaultContent || defaultContent.length === 0) {
      return 'No content available for this section.';
    }
    
    // Convert React nodes to plain text (you can customize this)
    return defaultContent.map((item, idx) => {
      if (typeof item === 'string') return item;
      if (React.isValidElement(item)) {
        // Extract text content from React elements
        const extractText = (node: any): string => {
          if (typeof node === 'string') return node;
          if (Array.isArray(node)) return node.map(extractText).join('');
          if (React.isValidElement(node) && (node.props as any).children) {
            return extractText((node.props as any).children);
          }
          return '';
        };
        return extractText(item);
      }
      return '';
    }).join('\n\n');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await googleDriveService.updatePopoverContent(context, locationId, content);
      
      if (success) {
        setCustomContent(content);
        setIsEditing(false);
        toast({
          title: "Content saved",
          description: "Your changes have been saved to Google Drive.",
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Error saving content",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(customContent || convertDefaultContentToString());
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to restore the default content?')) {
      return;
    }

    setIsSaving(true);
    try {
      const success = await googleDriveService.deletePopoverContent(context, locationId);
      
      if (success) {
        setCustomContent(null);
        const defaultText = convertDefaultContentToString();
        setContent(defaultText);
        setIsEditing(false);
        toast({
          title: "Content restored",
          description: "Default content has been restored.",
        });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error restoring content",
        description: "Failed to restore default content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      );
    }

    if (isEditing) {
      return (
        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder="Enter popover content here..."
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
            {customContent && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSaving}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Restore Default
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="info-popover-content space-y-4">
        <style dangerouslySetInnerHTML={{ 
          __html: `
            /* Base Styles - Limited Color Palette */
            .info-popover-content * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }
            
            .info-popover-content {
              background: #f8f9fa;
              color: #212529;
              line-height: 1.5;
              font-size: 14px;
            }
            
            .info-popover-content .container {
              max-width: 100%;
              background: white;
            }
            
            /* Header */
            .info-popover-content .header {
              background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
              color: white;
              padding: 1.25rem;
              border-bottom: 4px solid #3b82f6;
            }
            
            .info-popover-content .header h1 {
              font-size: 1.4rem;
              margin-bottom: 0.4rem;
              font-weight: 700;
            }
            
            .info-popover-content .header .subtitle {
              font-size: 0.85rem;
              opacity: 0.9;
              margin-bottom: 0.75rem;
            }
            
            .info-popover-content .period-badge {
              display: inline-block;
              background: rgba(255,255,255,0.15);
              padding: 0.35rem 0.7rem;
              border-radius: 4px;
              font-size: 0.8rem;
              font-weight: 600;
              border: 1px solid rgba(255,255,255,0.2);
            }
            
            /* Dashboard */
            .info-popover-content .dashboard {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 1rem;
              padding: 1.5rem;
              background: #f1f5f9;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .info-popover-content .metric-card {
              background: white;
              border-radius: 6px;
              padding: 1.25rem;
              border: 1px solid #e2e8f0;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            
            .info-popover-content .metric-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 0.75rem;
              padding-bottom: 0.5rem;
              border-bottom: 1px solid #f1f5f9;
            }
            
            .info-popover-content .metric-title {
              font-size: 0.8rem;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            
            .info-popover-content .metric-status {
              font-size: 0.7rem;
              font-weight: 600;
              padding: 0.2rem 0.5rem;
              border-radius: 4px;
            }
            
            .info-popover-content .status-excellent { background: #dbeafe; color: #1e40af; }
            .info-popover-content .status-warning { background: #fef3c7; color: #92400e; }
            .info-popover-content .status-critical { background: #fee2e2; color: #991b1b; }
            .info-popover-content .status-good { background: #d1fae5; color: #065f46; }
            
            .info-popover-content .metric-value {
              font-size: 1.6rem;
              font-weight: 700;
              margin-bottom: 0.4rem;
              color: #1e293b;
            }
            
            .info-popover-content .metric-change {
              display: flex;
              align-items: center;
              gap: 0.3rem;
              font-size: 0.8rem;
              font-weight: 600;
            }
            
            .info-popover-content .change-up { color: #16a34a; }
            .info-popover-content .change-down { color: #dc2626; }
            .info-popover-content .change-neutral { color: #64748b; }
            
            .info-popover-content .metric-note {
              font-size: 0.75rem;
              color: #64748b;
              margin-top: 0.5rem;
              padding-top: 0.5rem;
              border-top: 1px dashed #e2e8f0;
            }
            
            /* Navigation */
            .info-popover-content .nav {
              position: sticky;
              top: 0;
              background: white;
              border-bottom: 1px solid #e2e8f0;
              z-index: 10;
              padding: 0.75rem 1.5rem;
            }
            
            .info-popover-content .nav-list {
              display: flex;
              gap: 0.5rem;
              list-style: none;
              overflow-x: auto;
            }
            
            .info-popover-content .nav-item a {
              text-decoration: none;
              color: #475569;
              padding: 0.4rem 0.75rem;
              border-radius: 4px;
              font-size: 0.8rem;
              font-weight: 500;
              white-space: nowrap;
              border: 1px solid transparent;
            }
            
            .info-popover-content .nav-item.active a {
              background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
              color: white;
              border-color: #1e3a8a;
            }
            
            /* Sections */
            .info-popover-content .section {
              padding: 1.5rem;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .info-popover-content .section-header {
              margin-bottom: 1.25rem;
              padding-bottom: 0.75rem;
              border-bottom: 2px solid #f1f5f9;
            }
            
            .info-popover-content .section-title {
              font-size: 1.2rem;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 0.25rem;
            }
            
            .info-popover-content .section-subtitle {
              font-size: 0.85rem;
              color: #64748b;
            }
            
            /* Charts - Pure CSS */
            .info-popover-content .chart-container {
              height: 180px;
              margin: 1.25rem 0;
              position: relative;
              background: #f8fafc;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
              padding: 1rem;
            }
            
            .info-popover-content .chart-bars {
              display: flex;
              align-items: flex-end;
              height: calc(100% - 2rem);
              gap: 0.5rem;
            }
            
            .info-popover-content .chart-bar {
              flex: 1;
              background: linear-gradient(to top, #1e3a8a 0%, #3b82f6 100%);
              border-radius: 3px 3px 0 0;
              position: relative;
              min-height: 10px;
            }
            
            .info-popover-content .chart-bar.highlight {
              background: linear-gradient(to top, #059669 0%, #10b981 100%);
            }
            
            .info-popover-content .chart-bar.warning {
              background: linear-gradient(to top, #dc2626 0%, #ef4444 100%);
            }
            
            .info-popover-content .chart-bar-label {
              position: absolute;
              bottom: -1.5rem;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 0.7rem;
              color: #475569;
              font-weight: 500;
            }
            
            .info-popover-content .chart-bar-value {
              position: absolute;
              top: -1.5rem;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 0.75rem;
              font-weight: 600;
              color: #1e293b;
            }
            
            /* Insights */
            .info-popover-content .insights-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 1rem;
              margin-top: 1.25rem;
            }
            
            .info-popover-content .insight-card {
              background: white;
              border-radius: 6px;
              padding: 1.25rem;
              border: 1px solid #e2e8f0;
              border-left: 4px solid #3b82f6;
            }
            
            .info-popover-content .insight-card.critical { border-left-color: #dc2626; }
            .info-popover-content .insight-card.warning { border-left-color: #d97706; }
            .info-popover-content .insight-card.success { border-left-color: #059669; }
            
            .info-popover-content .insight-title {
              font-weight: 600;
              margin-bottom: 0.5rem;
              color: #1e293b;
              font-size: 0.9rem;
            }
            
            .info-popover-content .insight-content {
              font-size: 0.8rem;
              color: #475569;
              line-height: 1.5;
            }
            
            /* Key Metrics Table */
            .info-popover-content .metrics-table {
              width: 100%;
              border-collapse: collapse;
              margin: 1rem 0;
              font-size: 0.8rem;
            }
            
            .info-popover-content .metrics-table th {
              background: #f1f5f9;
              padding: 0.75rem;
              text-align: left;
              font-weight: 600;
              color: #334155;
              border-bottom: 2px solid #e2e8f0;
            }
            
            .info-popover-content .metrics-table td {
              padding: 0.75rem;
              border-bottom: 1px solid #f1f5f9;
            }
            
            .info-popover-content .metrics-table tr:hover {
              background: #f8fafc;
            }
            
            /* Trend Indicators */
            .info-popover-content .trend-indicator {
              display: inline-flex;
              align-items: center;
              gap: 0.25rem;
              font-size: 0.75rem;
              font-weight: 600;
              padding: 0.2rem 0.5rem;
              border-radius: 4px;
              background: #f1f5f9;
            }
            
            .info-popover-content .trend-up { color: #16a34a; }
            .info-popover-content .trend-down { color: #dc2626; }
            
            /* Highlight Box */
            .info-popover-content .highlight-box {
              background: #dbeafe;
              border-radius: 6px;
              padding: 1rem;
              margin: 1rem 0;
              border: 1px solid #3b82f6;
              font-size: 0.85rem;
              color: #1e40af;
            }
            
            .info-popover-content .highlight-box.success {
              background: #d1fae5;
              border-color: #10b981;
              color: #065f46;
            }
            
            .info-popover-content .highlight-box.warning {
              background: #fef3c7;
              border-color: #f59e0b;
              color: #92400e;
            }
            
            /* Action Items */
            .info-popover-content .action-item {
              background: white;
              border-radius: 6px;
              padding: 1rem;
              margin: 0.75rem 0;
              border: 1px solid #e2e8f0;
              display: flex;
              align-items: flex-start;
              gap: 0.75rem;
            }
            
            .info-popover-content .action-priority {
              padding: 0.2rem 0.5rem;
              border-radius: 4px;
              font-size: 0.7rem;
              font-weight: 600;
              background: #f1f5f9;
              min-width: 70px;
              text-align: center;
            }
            
            .info-popover-content .priority-high { background: #fee2e2; color: #991b1b; }
            .info-popover-content .priority-medium { background: #fef3c7; color: #92400e; }
            .info-popover-content .priority-low { background: #dbeafe; color: #1e40af; }
            
            .info-popover-content .action-details h4 {
              font-size: 0.9rem;
              margin-bottom: 0.4rem;
              color: #1e293b;
            }
            
            .info-popover-content .action-details p {
              font-size: 0.8rem;
              color: #475569;
              margin-bottom: 0.4rem;
            }
            
            /* Footer */
            .info-popover-content .footer {
              background: #1e293b;
              color: #cbd5e1;
              padding: 1.25rem;
              font-size: 0.8rem;
            }
            
            .info-popover-content .footer-note {
              opacity: 0.7;
              margin-top: 0.5rem;
              font-size: 0.75rem;
            }
            
            /* Analysis Note */
            .info-popover-content .analysis-note {
              background: #d1fae5;
              border-radius: 6px;
              padding: 1rem;
              margin: 1rem 0;
              border: 1px solid #10b981;
              font-size: 0.85rem;
              color: #065f46;
            }
            
            /* Product Performance Grid */
            .info-popover-content .product-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 1rem;
              margin-top: 1rem;
            }
            
            .info-popover-content .product-card {
              background: white;
              border-radius: 6px;
              padding: 1rem;
              border: 1px solid #e2e8f0;
              text-align: center;
            }
            
            .info-popover-content .product-card.highlight {
              border-color: #10b981;
              background: #f0fdf4;
            }
            
            .info-popover-content .product-name {
              font-weight: 600;
              font-size: 0.85rem;
              color: #1e293b;
              margin-bottom: 0.5rem;
            }
            
            .info-popover-content .product-value {
              font-size: 1.1rem;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 0.25rem;
            }
            
            .info-popover-content .product-metric {
              font-size: 0.75rem;
              color: #64748b;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
              .info-popover-content .dashboard {
                grid-template-columns: 1fr;
              }
              
              .info-popover-content .nav-list {
                flex-direction: column;
                gap: 0.25rem;
              }
              
              .info-popover-content .section {
                padding: 1rem;
              }
              
              .info-popover-content .insights-grid {
                grid-template-columns: 1fr;
              }
              
              .info-popover-content .product-grid {
                grid-template-columns: 1fr;
              }
            }
            
            /* Simple Scrollbar */
            .info-popover-content ::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            
            .info-popover-content ::-webkit-scrollbar-track {
              background: #f1f5f9;
            }
            
            .info-popover-content ::-webkit-scrollbar-thumb {
              background: #94a3b8;
              border-radius: 3px;
            }
          `
        }} />
        <div className="prose prose-slate prose-sm max-w-none">
          <div 
            className="whitespace-pre-wrap text-slate-700"
            dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }}
          />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Content
          </Button>
          {customContent && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Custom content
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Show summary"
          className={`${className ?? ''} inline-flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 p-1 shadow-sm hover:shadow transition relative`}
        >
          <Info width={size} height={size} />
          {customContent && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={{ top: 16, bottom: 16, left: 16, right: 16 }}
        className="z-[9999] w-[36rem] min-w-[20rem] max-w-[95vw] max-h-[80vh] overflow-y-auto overscroll-contain px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6 text-sm bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-slate-200 shadow-2xl rounded-xl ring-1 ring-slate-200 focus:outline-none"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">
              {context.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} 
              {locationId !== 'all' && (
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({locationId})
                </span>
              )}
            </h3>
          </div>
          {renderContent()}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EditableInfoPopover;
