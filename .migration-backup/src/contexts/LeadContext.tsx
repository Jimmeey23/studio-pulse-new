
import * as React from 'react';
import { ReactNode } from 'react';
import { LeadsData } from '@/types/leads';

interface LeadFilters {
  source: string[];
  associate: string[];
  center: string[];
  stage: string[];
  status: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

interface LeadContextType {
  filters: LeadFilters;
  setFilters: (filters: LeadFilters) => void;
  clearFilters: () => void;
  sourceOptions: string[];
  associateOptions: string[];
  centerOptions: string[];
  stageOptions: string[];
  statusOptions: string[];
  setOptions: (options: {
    sourceOptions: string[];
    associateOptions: string[];
    centerOptions: string[];
    stageOptions: string[];
    statusOptions: string[];
  }) => void;
}

const defaultFilters: LeadFilters = {
  source: [],
  associate: [],
  center: [],
  stage: [],
  status: [],
  dateRange: {
    start: null,
    end: null
  }
};

const LeadContext = React.createContext<LeadContextType | undefined>(undefined);

export const LeadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = React.useState<LeadFilters>(defaultFilters);
  const [sourceOptions, setSourceOptions] = React.useState<string[]>([]);
  const [associateOptions, setAssociateOptions] = React.useState<string[]>([]);
  const [centerOptions, setCenterOptions] = React.useState<string[]>([]);
  const [stageOptions, setStageOptions] = React.useState<string[]>([]);
  const [statusOptions, setStatusOptions] = React.useState<string[]>([]);

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const setOptions = (options: {
    sourceOptions: string[];
    associateOptions: string[];
    centerOptions: string[];
    stageOptions: string[];
    statusOptions: string[];
  }) => {
    setSourceOptions(options.sourceOptions);
    setAssociateOptions(options.associateOptions);
    setCenterOptions(options.centerOptions);
    setStageOptions(options.stageOptions);
    setStatusOptions(options.statusOptions);
  };

  return (
    <LeadContext.Provider value={{
      filters,
      setFilters,
      clearFilters,
      sourceOptions,
      associateOptions,
      centerOptions,
      stageOptions,
      statusOptions,
      setOptions
    }}>
      {children}
    </LeadContext.Provider>
  );
};

export const useLeads = () => {
  const context = React.useContext(LeadContext);
  if (context === undefined) {
    console.error('useLeads must be used within a LeadProvider. Returning fallback values.');
    // Return a fallback context
    return {
      leads: [],
      loading: false,
      error: null,
      refetch: () => Promise.resolve(),
      updateLead: () => Promise.resolve(),
      deleteLead: () => Promise.resolve(),
      addNote: () => Promise.resolve(),
      deleteNote: () => Promise.resolve()
    };
  }
  return context;
};
