import React, { createContext, useContext, useRef, useCallback } from 'react';

interface RegisteredTable {
  id: string; // usually the title
  getTextContent: () => string; // tab-separated text representation
}

interface MetricsTablesRegistryContextValue {
  register: (table: RegisteredTable) => void;
  unregister: (id: string) => void;
  getAllTabsContent: () => string;
  getAllTables: () => Map<string, RegisteredTable>;
}

const MetricsTablesRegistryContext = createContext<MetricsTablesRegistryContextValue | null>(null);

export const MetricsTablesRegistryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tablesRef = useRef<Map<string, RegisteredTable>>(new Map());

  const register = useCallback((table: RegisteredTable) => {
    tablesRef.current.set(table.id, table);
  }, []);

  const unregister = useCallback((id: string) => {
    tablesRef.current.delete(id);
  }, []);

  const getAllTabsContent = useCallback(() => {
    const parts: string[] = [];
    const dateStamp = new Date().toLocaleDateString();
    const timeStamp = new Date().toLocaleTimeString();
    parts.push(`All Metrics Export`);
    parts.push(`Generated on: ${dateStamp} at ${timeStamp}`);
    parts.push(`Total Tables: ${tablesRef.current.size}`);
    parts.push(`\n${'='.repeat(60)}\n`);
    
    tablesRef.current.forEach((table, id) => {
      try {
        parts.push(`\n${'-'.repeat(40)}`);
        parts.push(`TABLE: ${id}`);
        parts.push(`${'-'.repeat(40)}`);
        parts.push(table.getTextContent());
        parts.push(`\n`);
      } catch (err) {
        parts.push(`\n${'-'.repeat(40)}`);
        parts.push(`TABLE: ${id} (FAILED TO EXTRACT)`);
        parts.push(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        parts.push(`${'-'.repeat(40)}\n`);
      }
    });
    return parts.join('\n');
  }, []);

  const getAllTables = useCallback(() => new Map(tablesRef.current), []);

  return (
    <MetricsTablesRegistryContext.Provider value={{ register, unregister, getAllTabsContent, getAllTables }}>
      {children}
    </MetricsTablesRegistryContext.Provider>
  );
};

export const useMetricsTablesRegistry = () => {
  const ctx = useContext(MetricsTablesRegistryContext);
  if (!ctx) {
    // Return safe defaults if context is not available
    return {
      register: () => {},
      unregister: () => {},
      registerTable: () => {},
      unregisterTable: () => {},
      getAllTabsContent: () => '',
      getAllTables: () => new Map()
    };
  }
  // Also expose registerTable/unregisterTable aliases for compatibility
  return {
    ...ctx,
    registerTable: ctx.register,
    unregisterTable: ctx.unregister
  };
};
