import React from 'react';
import { createPortal } from 'react-dom';
import { Copy } from 'lucide-react';
import { Button } from './button';
import { toast } from './use-toast';
import { buildClipboardHtml, buildElementPayload, extractElementTitle, isCopyableDashboardElement } from '@/utils/elementCopy';

interface OverlayTarget {
  id: string;
  element: HTMLElement;
  host: HTMLDivElement;
  title: string;
}

const createOverlayHost = (element: HTMLElement) => {
  const wrapper = (element.closest('.overflow-x-auto, .overflow-auto, [data-copy-host], .card, .rounded-xl, .rounded-2xl') as HTMLElement | null) || element.parentElement;
  if (!wrapper) return null;

  const host = document.createElement('div');
  host.setAttribute('data-copy-overlay-host', 'true');
  host.className = 'pointer-events-auto absolute right-2 top-2 z-30';

  if (window.getComputedStyle(wrapper).position === 'static') {
    wrapper.style.position = 'relative';
  }

  wrapper.appendChild(host);
  return host;
};

export const UniversalElementCopyAssist: React.FC = () => {
  const [targets, setTargets] = React.useState<OverlayTarget[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const targetMap = new Map<string, OverlayTarget>();
    let timeoutId: number | undefined;

    const cleanup = () => {
      targetMap.forEach((target) => target.host.remove());
      targetMap.clear();
      setTargets([]);
    };

    const syncTargets = () => {
      if (cancelled) return;

      const discovered = Array.from(document.querySelectorAll<HTMLElement>('[data-copyable-element="true"]'))
        .filter((element) => isCopyableDashboardElement(element))
        .filter((element) => element.offsetParent !== null)
        .map((element, index) => ({
          id: element.getAttribute('data-copyable-id') || `${extractElementTitle(element, 'Element')}-${index}`,
          element,
          title: extractElementTitle(element),
        }));

      const nextIds = new Set(discovered.map((item) => item.id));

      Array.from(targetMap.entries()).forEach(([id, target]) => {
        if (!nextIds.has(id) || !target.element.isConnected || target.element.offsetParent === null) {
          target.host.remove();
          targetMap.delete(id);
        }
      });

      discovered.forEach(({ id, element, title }) => {
        const existing = targetMap.get(id);
        if (existing?.element === element) return;
        if (existing) {
          existing.host.remove();
          targetMap.delete(id);
        }

        const host = createOverlayHost(element);
        if (!host) return;
        targetMap.set(id, { id, element, host, title });
      });

      setTargets(Array.from(targetMap.values()));
    };

    const scheduleSync = (delay = 200) => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(syncTargets, delay);
    };

    scheduleSync(400);

    const observer = new MutationObserver(() => scheduleSync());
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      cancelled = true;
      observer.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
      cleanup();
    };
  }, []);

  if (targets.length === 0) return null;

  const handleCopy = async (element: HTMLElement, title: string) => {
    try {
      const payload = buildElementPayload(element, title);
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([buildClipboardHtml(payload)], { type: 'text/html' }),
          'text/plain': new Blob([payload.text], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(payload.text);
      }

      toast({ title: 'Element copied', description: `${title} is ready to paste into the workspace.` });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: error instanceof Error ? error.message : 'Unable to copy this element',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      {targets.map((target) =>
        createPortal(
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 gap-1 rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-sm backdrop-blur-sm"
            onClick={() => void handleCopy(target.element, target.title)}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>,
          target.host,
          target.id,
        ),
      )}
    </>
  );
};

export default UniversalElementCopyAssist;
