import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, X } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxDisplay?: number;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  maxDisplay = 2
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  const selectAll = () => {
    onChange(options);
  };

  const clearAll = () => {
    onChange([]);
  };

  const displayText = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === options.length) return "All Locations";
    if (selected.length <= maxDisplay) return selected.join(", ");
    return `${selected.slice(0, maxDisplay).join(", ")} +${selected.length - maxDisplay} more`;
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-48 justify-between text-left font-normal"
      >
        <span className="truncate">{displayText()}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          {/* Header with Select All / Clear All */}
          <div className="flex items-center justify-between p-2 border-b border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="text-xs h-6 px-2"
              disabled={selected.length === options.length}
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs h-6 px-2"
              disabled={selected.length === 0}
            >
              Clear All
            </Button>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {options.map((option) => (
              <div
                key={option}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleOption(option)}
              >
                <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                  selected.includes(option) 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'border-gray-300'
                }`}>
                  {selected.includes(option) && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className="text-sm flex-1">{option}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};