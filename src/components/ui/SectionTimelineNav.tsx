import * as React from "react";
import { cn } from "@/lib/utils";
import { useSectionNavigation } from "@/contexts/SectionNavigationContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ListTree, Navigation } from "lucide-react";
import { useTheme } from "next-themes";

type SectionTimelineNavProps = {
  title?: string;
  position?: "left" | "right";
  className?: string;
  collapseOnMobile?: boolean;
};

export function SectionTimelineNav({
  title = "On this page",
  position = "right",
  className,
  collapseOnMobile = true,
}: SectionTimelineNavProps) {
  const { sections, jumpTo } = useSectionNavigation();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [adaptiveDark, setAdaptiveDark] = React.useState<boolean | null>(null);
  const { resolvedTheme } = useTheme();
  const scrollSpyEnabled = React.useRef(false);

  // Compute background luminance from CSS variable --background (shadcn uses hsl(var(--background)))
  React.useEffect(() => {
    const compute = () => {
      try {
        const root = getComputedStyle(document.documentElement);
        const bg = root.getPropertyValue("--background").trim(); // e.g., "222.2 84% 4.9%"
        const parts = bg.split(/\s+/);
        if (parts.length >= 3) {
          const h = parseFloat(parts[0]);
          const s = parseFloat(parts[1].replace('%',''))/100;
          const l = parseFloat(parts[2].replace('%',''))/100;
          // Convert HSL to RGB
          const c = (1 - Math.abs(2*l - 1)) * s;
          const x = c * (1 - Math.abs(((h/60) % 2) - 1));
          const m = l - c/2;
          let r=0,g=0,b=0;
          if (0 <= h && h < 60) { r=c; g=x; b=0; }
          else if (60 <= h && h < 120) { r=x; g=c; b=0; }
          else if (120 <= h && h < 180) { r=0; g=c; b=x; }
          else if (180 <= h && h < 240) { r=0; g=x; b=c; }
          else if (240 <= h && h < 300) { r=x; g=0; b=c; }
          else { r=c; g=0; b=x; }
          r = (r + m); g = (g + m); b = (b + m);
          // relative luminance
          const srgb = [r,g,b].map(v => {
            return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
          });
          const lum = 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
          setAdaptiveDark(lum > 0.6);
        } else {
          // Fallback: use theme
          if (resolvedTheme === 'dark') setAdaptiveDark(false);
          else if (resolvedTheme === 'light') setAdaptiveDark(true);
          else setAdaptiveDark(!document.documentElement.classList.contains('dark'));
        }
      } catch {
        // Fallback: use theme
        if (resolvedTheme === 'dark') setAdaptiveDark(false);
        else if (resolvedTheme === 'light') setAdaptiveDark(true);
        else setAdaptiveDark(!document.documentElement.classList.contains('dark'));
      }
    };

    compute();

    // Observe theme changes via class mutations on documentElement (e.g., 'dark')
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && (m.attributeName === 'class' || m.attributeName === 'style')) {
          compute();
        }
      }
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class','style'] });

    // Also react to system theme changes
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onMedia = () => compute();
    try { media.addEventListener('change', onMedia); } catch { /* older safari */ media.addListener(onMedia); }

    return () => {
      obs.disconnect();
      try { media.removeEventListener('change', onMedia); } catch { media.removeListener(onMedia); }
    };
  }, [resolvedTheme]);

  React.useEffect(() => {
    if (!sections.length) return;

    const elements: { id: string; el: HTMLElement }[] = sections
      .map((s) => ({ id: s.id, el: (s.getElement?.() || document.getElementById(s.id)) as HTMLElement | null }))
      .filter((x): x is { id: string; el: HTMLElement } => !!x.el);

    const onScroll = () => {
      if (!scrollSpyEnabled.current) return;
      const viewportTop = 0;
      const candidates = elements
        .map(({ id, el }) => ({ id, rect: el.getBoundingClientRect() }))
        .sort((a, b) => a.rect.top - b.rect.top);

      let current: string | null = candidates[0]?.id ?? null;
      for (const c of candidates) {
        if (c.rect.top <= window.innerHeight * 0.3) {
          current = c.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };

    // Defer enabling scrollspy to avoid auto-selecting last section on initial layout
    const enableTimer = setTimeout(() => {
      scrollSpyEnabled.current = true;
      onScroll();
    }, 250);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      clearTimeout(enableTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  if (!sections.length) return null;

  const fixedPos = position === "right" ? "right-3" : "left-3";
  const visibility = collapseOnMobile ? "sm:block" : "block"; // show from small screens upward

  return (
    <nav
      aria-label="Section timeline"
      className={cn(
        visibility,
        "group fixed z-20",
        fixedPos,
        "top-28",
        // fixed slim width; no expansion on hover
        "w-6",
        // don't block interactions unless hovering
        "pointer-events-none",
        className
      )}
    >
      <div className="relative h-auto pointer-events-auto">
        <ol className="relative ml-3 py-4 pr-2">
          {/* ultra-thin vertical line with better contrast */}
          <div className="absolute left-1 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-foreground/20 to-transparent" />
          {sections.map((s) => {
            const isActive = s.id === activeId;
            // Adaptive ring colors
            const ringActive = adaptiveDark === null ? 'ring-blue-500/40' : (adaptiveDark ? 'ring-blue-600/40' : 'ring-blue-400/50');
            const ringHover = adaptiveDark === null ? 'hover:ring-blue-500/20' : (adaptiveDark ? 'hover:ring-blue-600/20' : 'hover:ring-blue-400/30');
            // Adaptive dot base and active colors (light on dark, dark/brand on light)
            const dotBase = adaptiveDark === false ? 'bg-white/80 hover:bg-white' : 'bg-foreground/70 hover:bg-foreground';
            const dotActive = adaptiveDark === false ? 'bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.25)]' : 'bg-blue-600 shadow-[0_0_0_2px_rgba(37,99,235,0.18)]';
            return (
              <li key={s.id} className="relative pl-6 py-5">
                {/* clickable dot only (small visual dot, larger hit area) */}
                <button
                  type="button"
                  onClick={() => jumpTo(s.id)}
                  title={s.label}
                  aria-label={s.label}
                  aria-current={isActive ? 'location' : undefined}
                  className={cn(
                    "absolute left-[-13px] top-0.5 w-6 h-6 rounded-full transition-transform",
                    "outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 focus:ring-offset-background",
                    isActive ? cn("scale-105 ring-2", ringActive) : cn("hover:ring-1", ringHover)
                  )}
                >
                  <span
                    className={cn(
                      "block m-auto rounded-full",
                      "w-2.5 h-2.5",
                      isActive ? dotActive : dotBase
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      {/* floating quick-access button with popover, non-obstructive */}
      <div className={cn("fixed", position === "right" ? "right-3" : "left-3", "bottom-6 z-30")}
        style={{ pointerEvents: 'auto' }}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Open section navigator"
              className={cn(
                "h-10 w-10 rounded-full transition flex items-center justify-center",
                "shadow-lg hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                adaptiveDark === null 
                  ? "bg-primary text-primary-foreground ring-1 ring-primary/30 focus-visible:ring-primary" 
                  : adaptiveDark 
                    ? "bg-foreground text-background ring-1 ring-foreground/20 focus-visible:ring-foreground"
                    : "bg-background text-foreground ring-1 ring-foreground/20 focus-visible:ring-foreground"
              )}
            >
              <Navigation className="w-5 h-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide p-2">{title}</div>
            <ul className="max-h-80 overflow-auto">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="w-full text-left text-sm px-2 py-2 rounded hover:bg-accent"
                    onClick={() => jumpTo(s.id)}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}

export default SectionTimelineNav;
