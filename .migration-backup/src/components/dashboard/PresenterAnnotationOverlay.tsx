import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

type Tool = 'pointer' | 'pen' | 'highlight' | 'arrow' | 'text' | 'circle';

interface Point { x: number; y: number }
interface Annotation {
  id: string;
  tool: Tool;
  points: Point[];
  color: string;
  text?: string;
}

interface PresenterAnnotationOverlayProps {
  active: boolean;           // show the overlay
  isPresenter: boolean;      // only presenter can draw
}

const COLORS = ['#FBBF24', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F97316'];

export function PresenterAnnotationOverlay({ active, isPresenter }: PresenterAnnotationOverlayProps) {
  const [tool, setTool] = useState<Tool>('pointer');
  const [color, setColor] = useState(COLORS[0]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [drawing, setDrawing] = useState<Annotation | null>(null);
  const [pointerPos, setPointerPos] = useState<Point | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<Point | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!isPresenter) return;
    const pos = getPos(e);
    if (tool === 'text') {
      setTextPos(pos);
      return;
    }
    const ann: Annotation = { id: `${Date.now()}`, tool, points: [pos], color };
    setDrawing(ann);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const pos = getPos(e);
    setPointerPos(pos);
    if (!drawing) return;
    setDrawing((d) => d ? { ...d, points: [...d.points, pos] } : null);
  };

  const onMouseUp = () => {
    if (!drawing) return;
    setAnnotations((a) => [...a, drawing]);
    setDrawing(null);
  };

  const addText = () => {
    if (!textPos || !textInput.trim()) { setTextPos(null); setTextInput(''); return; }
    setAnnotations((a) => [...a, { id: `${Date.now()}`, tool: 'text', points: [textPos], color, text: textInput }]);
    setTextPos(null);
    setTextInput('');
  };

  const clear = () => { setAnnotations([]); setDrawing(null); };

  const renderAnnotation = (ann: Annotation, key: string) => {
    const { points, color: c, tool: t, text } = ann;
    if (!points.length) return null;
    if (t === 'pen') {
      const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      return <path key={key} d={d} stroke={c} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />;
    }
    if (t === 'highlight') {
      const x = Math.min(points[0].x, points[points.length - 1].x);
      const y = Math.min(points[0].y, points[points.length - 1].y);
      const w = Math.abs(points[points.length - 1].x - points[0].x);
      const h = Math.abs(points[points.length - 1].y - points[0].y);
      return <rect key={key} x={x} y={y} width={w} height={h} fill={c} opacity={0.25} rx={4} />;
    }
    if (t === 'circle') {
      const cx = (points[0].x + points[points.length - 1].x) / 2;
      const cy = (points[0].y + points[points.length - 1].y) / 2;
      const rx = Math.abs(points[points.length - 1].x - points[0].x) / 2;
      const ry = Math.abs(points[points.length - 1].y - points[0].y) / 2;
      return <ellipse key={key} cx={cx} cy={cy} rx={Math.max(rx, 4)} ry={Math.max(ry, 4)} stroke={c} strokeWidth={2.5} fill="none" opacity={0.9} />;
    }
    if (t === 'arrow' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const alen = 14;
      const spread = 0.4;
      const ax1 = end.x - alen * Math.cos(angle - spread);
      const ay1 = end.y - alen * Math.sin(angle - spread);
      const ax2 = end.x - alen * Math.cos(angle + spread);
      const ay2 = end.y - alen * Math.sin(angle + spread);
      return (
        <g key={key}>
          <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={c} strokeWidth={2.5} opacity={0.9} strokeLinecap="round" />
          <polygon points={`${end.x},${end.y} ${ax1},${ay1} ${ax2},${ay2}`} fill={c} opacity={0.9} />
        </g>
      );
    }
    if (t === 'text' && text) {
      return (
        <text key={key} x={points[0].x} y={points[0].y} fill={c} fontSize={16} fontWeight={700} fontFamily="system-ui" style={{ userSelect: 'none' }}>
          {text}
        </text>
      );
    }
    return null;
  };

  if (!active) return null;

  const TOOLS: { id: Tool; icon: string; label: string }[] = [
    { id: 'pointer', icon: '◎', label: 'Spotlight' },
    { id: 'pen', icon: '✏️', label: 'Pen' },
    { id: 'highlight', icon: '▬', label: 'Highlight' },
    { id: 'circle', icon: '○', label: 'Circle' },
    { id: 'arrow', icon: '→', label: 'Arrow' },
    { id: 'text', icon: 'T', label: 'Text' },
  ];

  return (
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: isPresenter ? 'auto' : 'none' }}>
      {/* SVG canvas */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: tool === 'pointer' ? 'none' : tool === 'text' ? 'text' : 'crosshair' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => setPointerPos(null)}
      >
        {/* Spotlight ring for pointer tool */}
        {tool === 'pointer' && pointerPos && (
          <g>
            <circle cx={pointerPos.x} cy={pointerPos.y} r={24} fill="rgba(251,191,36,0.15)" stroke="#FBBF24" strokeWidth={2} />
            <circle cx={pointerPos.x} cy={pointerPos.y} r={4} fill="#FBBF24" />
          </g>
        )}
        {annotations.map((a) => renderAnnotation(a, a.id))}
        {drawing && renderAnnotation(drawing, 'drawing')}
      </svg>

      {/* Text input popup */}
      {textPos && (
        <div
          className="absolute z-10 flex gap-2 items-center bg-white rounded-xl border border-slate-200 shadow-xl px-3 py-2"
          style={{ left: textPos.x, top: textPos.y - 48 }}
        >
          <input
            autoFocus
            className="w-40 text-sm font-medium text-slate-800 outline-none border-b border-slate-200 pb-0.5"
            placeholder="Type label…"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addText(); if (e.key === 'Escape') { setTextPos(null); setTextInput(''); } }}
          />
          <button onClick={addText} className="text-xs font-bold text-violet-600 hover:text-violet-800">Add</button>
        </div>
      )}

      {/* Toolbar */}
      {isPresenter && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur px-4 py-2.5 shadow-2xl"
          style={{ pointerEvents: 'auto' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {TOOLS.map((t) => (
            <button
              key={t.id}
              title={t.label}
              onClick={() => setTool(t.id)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold transition-all ${
                tool === t.id
                  ? 'bg-slate-900 text-white shadow-sm scale-105'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.icon}
            </button>
          ))}
          <div className="h-6 w-px bg-slate-200 mx-1" />
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-5 w-5 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <button
            onClick={clear}
            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
          >
            Clear
          </button>
        </motion.div>
      )}
    </div>
  );
}
