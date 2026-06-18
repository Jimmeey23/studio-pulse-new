import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useNavigate, useLocation } from "react-router-dom";
import { useSectionNavigation } from "@/contexts/SectionNavigationContext";
import { OPEN_CONSOLIDATED_REPORT_EVENT } from "@/components/ui/consolidatedReportEvents";

type QuickLink = {
  label: string;
  to?: string;
  action?: string;
  keywords?: string[];
  shortcut?: string; // e.g., "G S" for Go Sales
};

const pages: { group: string; items: QuickLink[] }[] = [
  {
    group: "Dashboards",
    items: [
      { label: "Home", to: "/", keywords: ["index", "home", "landing"] },
      { label: "Executive Summary", to: "/executive-summary", keywords: ["exec", "summary"] },
      { label: "Custom Data Lab", to: "/outlier-analysis", keywords: ["data lab", "pivot", "chart builder", "joins", "relationships"] },
      { label: "Sales Analytics", to: "/sales-analytics", keywords: ["revenue", "sales", "kpi"] },
      { label: "Funnel & Leads", to: "/funnel-leads", keywords: ["leads", "funnel", "mql"] },
      { label: "Client Retention", to: "/client-retention", keywords: ["retention", "churn"] },
      { label: "Forecasting & Action Center", to: "/forecasting-action-center", keywords: ["forecast", "prediction", "actions", "renewals", "risk"] },
      { label: "Member 360 & Lifecycle", to: "/member-lifecycle", keywords: ["lifecycle", "member 360", "segments", "behavior", "engagement"] },
      { label: "Trainer Performance", to: "/trainer-performance", keywords: ["trainer", "coach", "instructor"] },
      { label: "Class Attendance", to: "/class-attendance", keywords: ["attendance", "checkins"] },
      { label: "Class Formats Comparison", to: "/class-formats", keywords: ["formats", "comparison", "barre", "cycle"] },
      { label: "Discounts & Promotions", to: "/discounts-promotions", keywords: ["discounts", "promotions", "codes"] },
      { label: "Sessions", to: "/sessions", keywords: ["bookings", "classes"] },
      { label: "PowerCycle vs Barre", to: "/powercycle-vs-barre", keywords: ["cycle", "barre", "compare"] },
      { label: "Expiration Analytics", to: "/expiration-analytics", keywords: ["expirations", "passes"] },
      { label: "Late Cancellations", to: "/late-cancellations", keywords: ["late", "cxl", "cancellations"] },
      { label: "Consolidated Table Report", action: "open-consolidated-report", keywords: ["report", "consolidated", "document", "export", "all tabs"] },
    ],
  },
];

interface GlobalCommandPaletteProps {
  initialOpen?: boolean;
}

export function GlobalCommandPalette({ initialOpen = false }: GlobalCommandPaletteProps) {
  const [open, setOpen] = React.useState(initialOpen);
  const navigate = useNavigate();
  const location = useLocation();
  const { sections, jumpTo } = useSectionNavigation();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      // Cmd/Ctrl + K to open
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      // Press "/" to quick open when not typing in an input/textarea
      if (e.key === "/") {
        const activeTag = (document.activeElement?.tagName || "").toLowerCase();
        if (activeTag !== "input" && activeTag !== "textarea") {
          e.preventDefault();
          setOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (item: QuickLink) => {
    setOpen(false);
    if (item.action === 'open-consolidated-report') {
      window.dispatchEvent(new Event(OPEN_CONSOLIDATED_REPORT_EVENT));
      return;
    }
    if (item.to) {
      navigate(item.to);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type to jump… (Try: sales, retention, class)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {pages.map((group) => (
          <CommandGroup key={group.group} heading={group.group}>
            {group.items.map((item) => (
              <CommandItem key={item.to || item.action || item.label} value={`${item.label} ${item.keywords?.join(" ") ?? ""}`} onSelect={() => go(item)}>
                {item.label}
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        {sections.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="This page">
              {sections.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`${s.label} ${s.id}`}
                  onSelect={() => {
                    setOpen(false);
                    jumpTo(s.id);
                  }}
                >
                  {s.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading="Tips">
          <CommandItem disabled>
            Press ⌘/Ctrl+K to open anywhere
          </CommandItem>
          <CommandItem disabled>
            Press / to search quickly
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export default GlobalCommandPalette;
