import * as React from "react";

type Section = {
  id: string; // DOM id to scroll to
  label: string;
};

type QuickSectionsProps = {
  sections: Section[];
  title?: string;
  className?: string;
  beforeJump?: (id: string) => void | Promise<void>;
  updateHash?: boolean; // default true
};

export function QuickSections({ sections, title = "Jump to", className, beforeJump, updateHash = true }: QuickSectionsProps) {
  const onClick = async (id: string) => {
    // Allow parent to make content visible (e.g., switch tabs) before scrolling
    if (beforeJump) {
      await beforeJump(id);
    }
    // Wait for DOM to update/render the target
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (updateHash) {
        try {
          history.replaceState(null, "", `#${id}`);
        } catch {}
      }
      // Briefly highlight target
      el.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 800);
    }
  };

  return (
    <div data-quick-sections="true" className={"flex items-center gap-2 flex-wrap " + (className ?? "") }>
      <span className="text-sm text-muted-foreground mr-1">{title}:</span>
      {sections.map((s) => (
        <button
          type="button"
          key={s.id}
          onClick={() => onClick(s.id)}
          data-target-id={s.id}
          data-label={s.label}
          className="text-sm px-2 py-1 rounded-md bg-muted hover:bg-muted/70 transition-colors"
          aria-label={`Jump to ${s.label}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export default QuickSections;
