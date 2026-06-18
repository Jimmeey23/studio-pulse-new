import * as React from "react";
import { useLocation } from "react-router-dom";

export type SectionEntry = {
  id: string;
  label: string;
  activate?: () => void | Promise<void>; // Ensure section is visible (e.g., switch tabs)
  getElement?: () => HTMLElement | null; // Optional custom element resolver
};

type SectionNavigationContextType = {
  sections: SectionEntry[];
  addSection: (section: SectionEntry) => void;
  removeSection: (id: string) => void;
  clearSections: () => void;
  jumpTo: (id: string, updateHash?: boolean) => Promise<boolean>;
};

const SectionNavigationContext = React.createContext<SectionNavigationContextType | undefined>(undefined);

export function SectionNavigationProvider({ children }: { children: React.ReactNode }) {
  const [sectionsMap, setSectionsMap] = React.useState<Map<string, SectionEntry>>(new Map());
  const location = useLocation();

  const addSection = React.useCallback((entry: SectionEntry) => {
    setSectionsMap((prev) => {
      const next = new Map(prev);
      next.set(entry.id, entry);
      return next;
    });
  }, []);

  const removeSection = React.useCallback((id: string) => {
    setSectionsMap((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearSections = React.useCallback(() => setSectionsMap(new Map()), []);

  React.useEffect(() => {
    // Clear sections on route change so registry doesn't linger across pages
    setSectionsMap(new Map());
  }, [location.pathname]);

  // Default to not mutating the hash to avoid external listeners and browser re-scroll
  const jumpTo = React.useCallback(async (id: string, updateHash: boolean = false) => {
    const entry = sectionsMap.get(id);
    if (!entry) return false;
    try {
      if (entry.activate) await entry.activate();
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const el = entry.getElement ? entry.getElement() : document.getElementById(id);
      if (!el) return false;
      // Use scroll-margin-top via CSS on sections to account for any fixed headers
      el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      // Avoid triggering hashchange observers; keep hash stable by default
      if (updateHash) {
        try { history.replaceState(null, "", `#${id}`); } catch {}
      }
      el.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 800);
      return true;
    } catch {
      return false;
    }
  }, [sectionsMap]);

  const sections = React.useMemo(() => Array.from(sectionsMap.values()), [sectionsMap]);
  const value = React.useMemo(() => ({ sections, addSection, removeSection, clearSections, jumpTo }), [sections, addSection, removeSection, clearSections, jumpTo]);

  return (
    <SectionNavigationContext.Provider value={value}>{children}</SectionNavigationContext.Provider>
  );
}

export function useSectionNavigation() {
  const ctx = React.useContext(SectionNavigationContext);
  if (!ctx) {
    console.error("useSectionNavigation must be used within SectionNavigationProvider. Returning fallback values.");
    // Return a fallback context
    return {
      sections: [],
      addSection: () => {},
      removeSection: () => {},
      clearSections: () => {},
      jumpTo: async () => false,
    };
  }
  return ctx;
}
