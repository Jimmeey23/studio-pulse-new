import * as React from 'react';
import { OPEN_CONSOLIDATED_REPORT_EVENT } from '@/components/ui/consolidatedReportEvents';

const ConsolidatedReportExporterDialog = React.lazy(() =>
  import('@/components/ui/ConsolidatedReportExporterDialog'),
);

export function LazyConsolidatedReportExporterDialog() {
  const [shouldLoad, setShouldLoad] = React.useState(false);

  React.useEffect(() => {
    const loadDialog = () => setShouldLoad(true);
    window.addEventListener(OPEN_CONSOLIDATED_REPORT_EVENT, loadDialog);
    return () => window.removeEventListener(OPEN_CONSOLIDATED_REPORT_EVENT, loadDialog);
  }, []);

  if (!shouldLoad) return null;

  return (
    <React.Suspense fallback={null}>
      <ConsolidatedReportExporterDialog initialOpen />
    </React.Suspense>
  );
}

export default LazyConsolidatedReportExporterDialog;
