import { useGlobalLoading } from '@/hooks/useGlobalLoading';

/**
 * Quick helper to track progress for any async operation
 * Usage:
 * 
 * const trackProgress = useProgressTracker();
 * 
 * const loadData = async () => {
 *   trackProgress.start('Loading sales data...');
 *   
 *   trackProgress.update(25, 'Fetching from database...');
 *   await fetchFromDB();
 *   
 *   trackProgress.update(50, 'Processing data...');
 *   await processData();
 *   
 *   trackProgress.update(75, 'Generating charts...');
 *   await generateCharts();
 *   
 *   trackProgress.complete();
 * };
 */
export const useProgressTracker = () => {
  const { setLoading, setProgress } = useGlobalLoading();
  
  const start = (message: string = 'Loading...') => {
    setLoading(true, message);
    setProgress(0);
  };
  
  const update = (percentage: number, message?: string) => {
    setProgress(Math.min(Math.max(percentage, 0), 100));
    if (message) {
      setLoading(true, message);
    }
  };
  
  const complete = () => {
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
    }, 200); // Small delay to show 100%
  };
  
  const error = (errorMessage: string = 'Loading failed') => {
    setProgress(100);
    setLoading(false, errorMessage);
  };

  return {
    start,
    update,
    complete,
    error
  };
};