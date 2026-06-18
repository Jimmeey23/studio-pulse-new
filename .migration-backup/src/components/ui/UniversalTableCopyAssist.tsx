import React from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { discoverPageTables } from '@/utils/tableCopy';

interface OverlayTableTarget {
  id: string;
  name: string;
  table: HTMLTableElement;
  host: HTMLDivElement;
}

const createOverlayHost = (table: HTMLTableElement) => {
  const wrapper =
    (table.closest('.overflow-x-auto, .overflow-auto, [data-table-host], .table-wrapper') as HTMLElement | null) ||
    (table.parentElement as HTMLElement | null);

  if (!wrapper) return null;

  const host = document.createElement('div');
  host.setAttribute('data-auto-copy-overlay', 'true');
  host.className = 'pointer-events-auto absolute right-2 top-2 z-30';

  if (window.getComputedStyle(wrapper).position === 'static') {
    wrapper.style.position = 'relative';
  }

  wrapper.appendChild(host);
  return host;
};

export const UniversalTableCopyAssist: React.FC = () => {
  const location = useLocation();
  const [targets, setTargets] = React.useState<OverlayTableTarget[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const targetsRef = new Map<string, OverlayTableTarget>();
    let timeoutId: number | undefined;

    const cleanup = () => {
      targetsRef.forEach((target) => {
        target.host.remove();
        target.table.removeAttribute('data-auto-copy-managed');
      });
      targetsRef.clear();
      setTargets([]);
    };

    const syncTargets = () => {
      if (cancelled) return;

      const discoveredTables = discoverPageTables(document)
        .filter(({ element }) => element.hasAttribute('data-auto-copy-managed') || !element.hasAttribute('data-has-copy-button'))
        .filter(({ element }) => element.offsetParent !== null)
        .map(({ id, name, element }) => ({ id, name, element }));

      const nextIds = new Set(discoveredTables.map((table) => table.id));

      Array.from(targetsRef.entries()).forEach(([id, target]) => {
        if (!nextIds.has(id) || !target.table.isConnected || target.table.offsetParent === null) {
          target.host.remove();
          target.table.removeAttribute('data-auto-copy-managed');
          targetsRef.delete(id);
        }
      });

      discoveredTables.forEach(({ id, name, element }) => {
        const existing = targetsRef.get(id);
        if (existing) {
          if (existing.table === element && existing.name === name) {
            return;
          }

          existing.host.remove();
          existing.table.removeAttribute('data-auto-copy-managed');
          targetsRef.delete(id);
        }

        const host = createOverlayHost(element);
        if (!host) return;

        element.setAttribute('data-auto-copy-managed', 'true');
        targetsRef.set(id, { id, name, table: element, host });
      });

      if (!cancelled) {
        setTargets(Array.from(targetsRef.values()));
      }
    };

    const scheduleSync = (delay = 150) => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(syncTargets, delay);
    };

    scheduleSync(450);

    const observer = new MutationObserver((mutations) => {
      const onlyOverlayMutations = mutations.every((mutation) => {
        const mutationTarget = mutation.target instanceof Element ? mutation.target : null;
        if (mutationTarget?.closest('[data-auto-copy-overlay="true"]')) {
          return true;
        }

        const addedAreOverlayOnly = Array.from(mutation.addedNodes).every((node) => {
          if (!(node instanceof Element)) return true;
          return node.matches('[data-auto-copy-overlay="true"]') || Boolean(node.closest('[data-auto-copy-overlay="true"]'));
        });

        const removedAreOverlayOnly = Array.from(mutation.removedNodes).every((node) => {
          if (!(node instanceof Element)) return true;
          return node.matches('[data-auto-copy-overlay="true"]') || Boolean(node.closest('[data-auto-copy-overlay="true"]'));
        });

        return addedAreOverlayOnly && removedAreOverlayOnly;
      });

      if (!onlyOverlayMutations) {
        scheduleSync();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-has-copy-button', 'data-table', 'data-table-name'],
    });

    return () => {
      cancelled = true;
      observer.disconnect();
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      cleanup();
    };
  }, [location.pathname]);

  if (targets.length === 0) return null;

  return (
    <>
      {targets.map((target) =>
        createPortal(
          <CopyTableButton
            tableRef={{ current: target.table }}
            tableName={target.name}
            size="sm"
            className="bg-white/90 backdrop-blur-sm"
          />,
          target.host,
          target.id,
        ),
      )}
    </>
  );
};

export default UniversalTableCopyAssist;