import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Pin, PinOff, Save, Wand2, FileText, StickyNote, Edit3, Trash2, History, Eye, EyeOff } from 'lucide-react';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';

interface AiNotesProps {
  tableKey: string; // unique key per table (e.g., 'sessions:advancedAttendance')
  location?: string; // current selected location
  period?: string;   // e.g., '2025-10' or custom range id
  sectionId?: string; // DOM id of the table section
  initialSummary?: string; // optional generated summary
  author?: string; // optional author name/email
}

export const AiNotes: React.FC<AiNotesProps> = ({ tableKey, location, period, sectionId, initialSummary, author }) => {
  // Create unique storage keys that include location to ensure location-specific storage
  const locationKey = location || 'all-locations';
  const { notes, loading, error, save, updateByRow, deleteByRow } = useNotes({ 
    tableKey, 
    location: locationKey, 
    period, 
    sectionId 
  });
  const latest = useMemo(() => notes[notes.length - 1], [notes]);

  // Contenteditable for rich text (HTML)
  const summaryRef = useRef<ReactQuill | null>(null);
  const noteRef = useRef<ReactQuill | null>(null);
  const [summaryHtml, setSummaryHtml] = useState(initialSummary || '');
  const [noteHtml, setNoteHtml] = useState('');

  // When a latest version exists, allow loading it into editors for editing
  useEffect(() => {
    if (latest) {
      if (!summaryHtml) setSummaryHtml(latest.summary || '');
      if (!noteHtml) setNoteHtml(latest.note || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.timestamp]);
  
  // Per-section pins and toggles with location-specific keys
  const storageKeySummary = useMemo(() => `ai-notes-pin:summary:${tableKey}:${locationKey}:${period || 'all'}:${sectionId || 'default'}`, [tableKey, locationKey, period, sectionId]);
  const storageKeyNotes = useMemo(() => `ai-notes-pin:notes:${tableKey}:${locationKey}:${period || 'all'}:${sectionId || 'default'}`, [tableKey, locationKey, period, sectionId]);
  const storageKeyCollapsed = useMemo(() => `ai-notes-collapsed:${tableKey}:${locationKey}:${period || 'all'}:${sectionId || 'default'}`, [tableKey, locationKey, period, sectionId]);
  
  const [summaryPinned, setSummaryPinned] = useState<boolean>(() => { 
    try { return localStorage.getItem(storageKeySummary) === '1'; } catch { return false; } 
  });
  const [notesPinned, setNotesPinned] = useState<boolean>(() => { 
    try { return localStorage.getItem(storageKeyNotes) === '1'; } catch { return false; } 
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => { 
    try { return localStorage.getItem(storageKeyCollapsed) === '1'; } catch { return false; } 
  });
  
  // Always start collapsed by default; pinning won't auto-open on load
  const [summaryOpen, setSummaryOpen] = useState<boolean>(false);
  const [notesOpen, setNotesOpen] = useState<boolean>(false);

  // Enhanced modules for advanced rich text formatting
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      [{ table: 'TD' }],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  } as const;
  const formats = [
    'header','font','size','bold','italic','underline','strike',
    'color','background','script','list','indent','direction','align',
    'blockquote','code-block','link','image','video','table'
  ];

  // Auto-formatter: convert plain text into structured HTML (bold, lists, tables)
  const autoFormatToHtml = (text: string) => {
    if (!text) return '';
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const out: string[] = [];

    // Detect Markdown-style table (pipes) or tab-delimited blocks
    const isPipeRow = (s: string) => /\|/.test(s);
    const isTabRow = (s: string) => /\t/.test(s);
    const tryConsumeTable = (i: number) => {
      const start = i;
      const mode: 'pipe' | 'tab' | null = isPipeRow(lines[i]) ? 'pipe' : isTabRow(lines[i]) ? 'tab' : null;
      if (!mode) return { consumed: 0 };
      const rows: string[][] = [];
      let j = i;
      while (j < lines.length) {
        const row = lines[j];
        if ((mode === 'pipe' && isPipeRow(row)) || (mode === 'tab' && isTabRow(row))) {
          const cells = mode === 'pipe'
            ? row.split('|').map(s => s.trim()).filter((_, idx, arr) => !(idx === 0 && arr[0] === '') && !(idx === arr.length - 1 && arr[arr.length - 1] === ''))
            : row.split('\t').map(s => s.trim());
          if (cells.length > 1) rows.push(cells);
          j++;
          continue;
        }
        break;
      }
      if (rows.length >= 2) {
        const header = rows[0];
        const body = rows.slice(1);
        out.push('<table class="ai-table">');
        out.push('<thead><tr>' + header.map(h => `<th>${esc(h)}</th>`).join('') + '</tr></thead>');
        out.push('<tbody>' + body.map(r => '<tr>' + r.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>').join('') + '</tbody>');
        out.push('</table>');
        return { consumed: j - start };
      }
      return { consumed: 0 };
    };

    // Helper to flush a list buffer into UL with image bullets
    const flushList = (buf: string[]) => {
      if (!buf.length) return;
      out.push('<ul class="ai-image-bullets">' + buf.map(li => `<li>${li}</li>`).join('') + '</ul>');
      buf.length = 0;
    };
    let listBuf: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim();
      if (!raw) { flushList(listBuf); continue; }

      // Try table
      const table = tryConsumeTable(i);
      if (table.consumed) { flushList(listBuf); i += table.consumed - 1; continue; }

      // Bold **text** inline
      const boldProcessed = esc(raw).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

      // Bullet/numbered detection
      if (/^(?:\*|-|\u2022)\s+/.test(raw) || /^\d+[\.)]\s+/.test(raw)) {
        // Strip marker, push as list item
        const li = raw.replace(/^(?:\*|-|\u2022)\s+/, '').replace(/^\d+[\.)]\s+/, '');
        listBuf.push(boldProcessed.replace(/^(?:\*|-|\u2022|\d+[\.)])\s+/, ''));
        continue;
      }

      // Heading heuristic: ALL CAPS line or ends with ':'
      if (raw.endsWith(':') || (raw.length <= 64 && raw === raw.toUpperCase() && /[A-Z]/.test(raw))) {
        flushList(listBuf);
        out.push(`<h3>${boldProcessed.replace(/:$/, '')}</h3>`);
        continue;
      }

      // Paragraph by default
      flushList(listBuf);
      out.push(`<p>${boldProcessed}</p>`);
    }
    flushList(listBuf);
    return out.join('');
  };

  // Attach auto-format paste handler
  useEffect(() => {
    const attach = (rq: ReactQuill | null) => {
      if (!rq) return;
      const quill = (rq as any).getEditor?.();
      if (!quill || !quill.root) return;
      const onPaste = (e: ClipboardEvent) => {
        const dt = e.clipboardData;
        if (!dt) return;
        const html = dt.getData('text/html');
        const text = dt.getData('text/plain');
        // Only intercept plain text (let rich HTML pass through)
        if (text && !html) {
          e.preventDefault();
          const formatted = autoFormatToHtml(text);
          const safe = DOMPurify.sanitize(formatted, { USE_PROFILES: { html: true } });
          const sel = quill.getSelection(true);
          const index = sel ? sel.index : quill.getLength();
          quill.clipboard.dangerouslyPasteHTML(index, safe, 'user');
        }
      };
      quill.root.addEventListener('paste', onPaste);
      return () => quill.root.removeEventListener('paste', onPaste);
    };
    const clean1 = attach(summaryRef.current);
    const clean2 = attach(noteRef.current);
    return () => {
      if (typeof clean1 === 'function') clean1();
      if (typeof clean2 === 'function') clean2();
    };
  }, [summaryRef.current, noteRef.current]);

  const onSave = async () => {
    const rawSummary = summaryHtml;
    const rawNote = noteHtml;
    // sanitize HTML
    const summary = DOMPurify.sanitize(rawSummary, { USE_PROFILES: { html: true } });
    const note = DOMPurify.sanitize(rawNote, { USE_PROFILES: { html: true } });
    const ok = await save({ note, summary, author });
    setNoteHtml('');
    if (ok) {
      if (!summaryPinned) setSummaryOpen(false);
      if (!notesPinned) setNotesOpen(false);
    }
  };

  const cleanAndBeautify = () => {
    const htmlToText = (html: string) => {
      const el = document.createElement('div');
      el.innerHTML = html || '';
      return el.innerText; // normalize to plain text
    };
    const newSummary = DOMPurify.sanitize(autoFormatToHtml(htmlToText(summaryHtml)), { USE_PROFILES: { html: true } });
    const newNote = DOMPurify.sanitize(autoFormatToHtml(htmlToText(noteHtml)), { USE_PROFILES: { html: true } });
    setSummaryHtml(newSummary);
    setNoteHtml(newNote);
  };

  const [showHistory, setShowHistory] = useState(false);
  const restoreVersion = async (index: number) => {
    const item = notes[index];
    if (!item) {
      console.error('Cannot restore: item not found at index', index);
      return;
    }
    
    try {
      // For restoration, create a new version using the chosen previous content
      const restoredSummary = DOMPurify.sanitize(item.summary || '', { USE_PROFILES: { html: true } });
      const restoredNote = DOMPurify.sanitize(item.note || '', { USE_PROFILES: { html: true } });
      const success = await save({ 
        note: restoredNote, 
        summary: restoredSummary, 
        author: author || 'Anonymous' 
      });
      
      if (success) {
        // Update the editor contents to match the restored version
        setSummaryHtml(restoredSummary);
        setNoteHtml(restoredNote);
      }
    } catch (error) {
      console.error('Error restoring note version:', error);
    }
  };

  // Inline edit state for history items
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editSummary, setEditSummary] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const onStartEdit = (idx: number) => {
    const item = notes[idx];
    if (!item) return;
    setEditIndex(idx);
    setEditSummary(item.summary || '');
    setEditNote(item.note || '');
  };
  const onCancelEdit = () => {
    setEditIndex(null);
    setEditSummary('');
    setEditNote('');
  };
  const onSaveEdit = async () => {
    if (editIndex === null) return;
    const item = notes[editIndex];
    if (!item || !item.rowNumber) {
      console.error('Cannot save: item missing or no rowNumber', item);
      return;
    }
    
    try {
      const summary = DOMPurify.sanitize(editSummary, { USE_PROFILES: { html: true } });
      const note = DOMPurify.sanitize(editNote, { USE_PROFILES: { html: true } });
      const success = await updateByRow(item.rowNumber, { summary, note, author: author || 'Anonymous' });
      if (success) {
        onCancelEdit();
      } else {
        console.error('Update operation failed');
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };
  const onDelete = async (idx: number) => {
    const item = notes[idx];
    if (!item || !item.rowNumber) {
      console.error('Cannot delete: item missing or no rowNumber', item);
      return;
    }
    // Confirm delete
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Delete this note from ${item.timestamp}? This cannot be undone.`);
    if (!ok) return;
    
    try {
      const success = await deleteByRow(item.rowNumber);
      if (!success) {
        console.error('Delete operation failed');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const toggleSummaryPin = () => {
    const next = !summaryPinned;
    setSummaryPinned(next);
    try { localStorage.setItem(storageKeySummary, next ? '1' : '0'); } catch {}
    if (next) setSummaryOpen(true);
  };
  
  const toggleNotesPin = () => {
    const next = !notesPinned;
    setNotesPinned(next);
    try { localStorage.setItem(storageKeyNotes, next ? '1' : '0'); } catch {}
    if (next) setNotesOpen(true);
  };

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try { localStorage.setItem(storageKeyCollapsed, next ? '1' : '0'); } catch {}
    if (!next) {
      // If expanding, open pinned sections
      if (summaryPinned) setSummaryOpen(true);
      if (notesPinned) setNotesOpen(true);
    }
  };

  // Clean & Beautify a single section using Quill conversion
  const cleanAndBeautifySection = (section: 'summary' | 'notes') => {
    const rq = section === 'summary' ? summaryRef.current : noteRef.current;
    if (!rq) return;
    const quill = (rq as any).getEditor?.();
    if (!quill) return;
    // Get plain text from quill to normalize, then re-structure
    const plain = quill.getText();
    const safe = DOMPurify.sanitize(autoFormatToHtml(plain), { USE_PROFILES: { html: true } });
    // Replace entire contents with structured rich content
    quill.setSelection(0, quill.getLength());
    quill.deleteText(0, quill.getLength());
    quill.clipboard.dangerouslyPasteHTML(0, safe, 'user');
    // Sync state to keep React controlled value up-to-date
    const html = (quill.root as HTMLElement).innerHTML;
    if (section === 'summary') setSummaryHtml(html);
    else setNoteHtml(html);
  };

  // Collapsed view - show only icons
  if (isCollapsed) {
    return (
      <Card className="mt-4 ai-notes border-l-4 border-l-blue-500">
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <StickyNote className="h-5 w-5 text-green-600" />
                {notes.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {notes.length}
                  </Badge>
                )}
                {latest && (
                  <div className="text-xs text-gray-500">
                    Last: {new Date(latest.timestamp).toLocaleDateString()}
                  </div>
                )}
              </div>
              {(summaryPinned || notesPinned) && (
                <Pin className="h-4 w-4 text-orange-500" />
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleCollapsed}
              className="h-8 w-8 p-0"
              title="Expand Notes & Summary"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-4 ai-notes border-l-4 border-l-blue-500">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            AI Summary & Notes
            {notes.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {notes.length} saved
              </Badge>
            )}
            {locationKey !== 'all-locations' && (
              <Badge variant="outline" className="text-xs">
                {locationKey}
              </Badge>
            )}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleCollapsed}
            className="h-8 w-8 p-0"
            title="Collapse to Icons"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setSummaryOpen(v => !v)}>
            {summaryOpen ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />} 
            <FileText className="mr-1 h-4 w-4" />
            Summary
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={toggleSummaryPin} title={summaryPinned ? 'Unpin Summary' : 'Pin Summary'}>
            {summaryPinned ? <Pin className="h-4 w-4 text-orange-500" /> : <PinOff className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setNotesOpen(v => !v)}>
            {notesOpen ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />} 
            <StickyNote className="mr-1 h-4 w-4" />
            Notes
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={toggleNotesPin} title={notesPinned ? 'Unpin Notes' : 'Pin Notes'}>
            {notesPinned ? <Pin className="h-4 w-4 text-orange-500" /> : <PinOff className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {latest && (
          <div className="text-sm text-slate-600 ai-notes-render">
            <div className="font-medium">Last saved:</div>
            <div className="whitespace-pre-wrap">
              {latest.summary && (
                <div className="mb-2">
                  <div className="font-semibold">Summary:</div>
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: latest.summary }} />
                </div>
              )}
              {latest.note && (
                <div>
                  <div className="font-semibold">Note:</div>
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: latest.note }} />
                </div>
              )}
            </div>
            <div className="mt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowHistory(s => !s)}>
                {showHistory ? 'Hide history' : 'Show history'} ({notes.length})
              </Button>
            </div>
            {showHistory && (
              <div className="mt-2 space-y-3 max-h-64 overflow-y-auto border-t pt-2">
                {notes.map((n, idx) => (
                  <div key={`${n.rowNumber}-${idx}`} className="border rounded p-3 bg-gradient-to-r from-gray-50 to-white shadow-sm">
                    <div className="text-xs text-slate-500 mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{new Date(n.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span>{n.author || 'Anonymous'}</span>
                        {n.location && n.location !== locationKey && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {n.location}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">#{n.rowNumber || '?'}</span>
                      </div>
                    </div>
                    {editIndex === idx ? (
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-slate-600 mb-1 font-medium">Summary</div>
                          <ReactQuill
                            theme="snow"
                            value={editSummary}
                            onChange={setEditSummary}
                            modules={{
                              toolbar: [
                                ['bold', 'italic', 'underline'],
                                [{ list: 'ordered' }, { list: 'bullet' }],
                                ['link', 'clean']
                              ]
                            }}
                            className="bg-white rounded"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 mb-1 font-medium">Note</div>
                          <ReactQuill
                            theme="snow"
                            value={editNote}
                            onChange={setEditNote}
                            modules={{
                              toolbar: [
                                ['bold', 'italic', 'underline'],
                                [{ list: 'ordered' }, { list: 'bullet' }],
                                ['link', 'clean']
                              ]
                            }}
                            className="bg-white rounded"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button type="button" size="sm" onClick={onSaveEdit} disabled={loading}>
                            {loading ? <BrandSpinner size="xs" className="mr-2" /> : <Save className="mr-2 h-4 w-4"/>}
                            Save Changes
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={onCancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {n.summary && (
                          <div className="mb-2">
                            <div className="text-xs text-slate-600 mb-1 font-medium">Summary</div>
                            <div className="prose prose-sm max-w-none bg-blue-50 p-2 rounded" 
                                 dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(n.summary) }} />
                          </div>
                        )}
                        {n.note && (
                          <div className="mb-2">
                            <div className="text-xs text-slate-600 mb-1 font-medium">Note</div>
                            <div className="prose prose-sm max-w-none bg-green-50 p-2 rounded" 
                                 dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(n.note) }} />
                          </div>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                          <Button type="button" size="sm" variant="secondary" onClick={() => restoreVersion(idx)} className="flex items-center gap-1">
                            <History className="h-3 w-3" />
                            Restore
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => onStartEdit(idx)} className="flex items-center gap-1">
                            <Edit3 className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => onDelete(idx)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary Section */}
        {summaryOpen && (
          <div className="grid gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div className="text-sm font-medium text-blue-800">Summary Editor</div>
            </div>
            <ReactQuill
              ref={summaryRef as any}
              theme="snow"
              value={summaryHtml}
              onChange={setSummaryHtml}
              modules={modules}
              formats={formats}
              className="bg-white rounded-md shadow-sm"
              placeholder="Enter your summary here... Use the toolbar for advanced formatting."
            />
            <div className="flex items-center gap-2 flex-wrap">
              <Button type="button" variant="secondary" onClick={() => cleanAndBeautifySection('summary')} title="Auto-format and beautify content">
                <Wand2 className="mr-2 h-4 w-4" /> Clean & Beautify
              </Button>
              <Button
                onClick={async () => {
                  const summary = DOMPurify.sanitize(summaryHtml, { USE_PROFILES: { html: true } });
                  const note = DOMPurify.sanitize(noteHtml || latest?.note || '', { USE_PROFILES: { html: true } });
                  const ok = await save({ summary, note, author: author || 'Anonymous' });
                  if (ok && !summaryPinned) setSummaryOpen(false);
                }}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <BrandSpinner size="xs" className="mr-2" /> : <Save className="mr-2 h-4 w-4"/>}
                Save Summary
              </Button>
              {summaryHtml && (
                <Button type="button" variant="outline" onClick={() => setSummaryHtml('')} size="sm">
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Notes Section */}
        {notesOpen && (
          <div className="grid gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-green-600" />
              <div className="text-sm font-medium text-green-800">Notes Editor</div>
            </div>
            <ReactQuill
              ref={noteRef as any}
              theme="snow"
              value={noteHtml}
              onChange={setNoteHtml}
              modules={modules}
              formats={formats}
              className="bg-white rounded-md shadow-sm"
              placeholder="Enter your notes here... Supports rich formatting, tables, links, and more."
            />
            <div className="flex items-center gap-2 flex-wrap">
              <Button type="button" variant="secondary" onClick={() => cleanAndBeautifySection('notes')} title="Auto-format and beautify content">
                <Wand2 className="mr-2 h-4 w-4" /> Clean & Beautify
              </Button>
              <Button
                onClick={async () => {
                  const note = DOMPurify.sanitize(noteHtml, { USE_PROFILES: { html: true } });
                  const summary = DOMPurify.sanitize(summaryHtml || latest?.summary || '', { USE_PROFILES: { html: true } });
                  const ok = await save({ summary, note, author: author || 'Anonymous' });
                  if (ok) {
                    setNoteHtml('');
                    if (!notesPinned) setNotesOpen(false);
                  }
                }}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? <BrandSpinner size="xs" className="mr-2" /> : <Save className="mr-2 h-4 w-4"/>}
                Save Notes
              </Button>
              {noteHtml && (
                <Button type="button" variant="outline" onClick={() => setNoteHtml('')} size="sm">
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}
        {error && <div className="text-sm text-red-600">{String(error)}</div>}
      </CardContent>
    </Card>
  );
};
