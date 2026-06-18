import { useGlobalLoading } from './useGlobalLoading';

interface DataFetchStep {
  name: string;
  weight: number; // Relative importance (1-10)
  completed: boolean;
}

interface DataProgressTracker {
  steps: DataFetchStep[];
  currentStep: string;
  overallProgress: number;
}

export const useDataProgress = () => {
  const { setProgress } = useGlobalLoading();
  
  const createTracker = (stepNames: string[], weights?: number[]): DataProgressTracker => {
    const steps: DataFetchStep[] = stepNames.map((name, index) => ({
      name,
      weight: weights?.[index] || 1,
      completed: false
    }));
    
    return {
      steps,
      currentStep: '',
      overallProgress: 0
    };
  };
  
  const updateStep = (tracker: DataProgressTracker, stepName: string, completed: boolean = true): DataProgressTracker => {
    const updatedSteps = tracker.steps.map(step => 
      step.name === stepName ? { ...step, completed } : step
    );
    
    const totalWeight = updatedSteps.reduce((sum, step) => sum + step.weight, 0);
    const completedWeight = updatedSteps
      .filter(step => step.completed)
      .reduce((sum, step) => sum + step.weight, 0);
    
    const progress = Math.round((completedWeight / totalWeight) * 100);
    
    // Update global progress
    setProgress(progress);
    
    return {
      ...tracker,
      steps: updatedSteps,
      currentStep: stepName,
      overallProgress: progress
    };
  };
  
  const setCurrentStep = (tracker: DataProgressTracker, stepName: string): DataProgressTracker => {
    return {
      ...tracker,
      currentStep: stepName
    };
  };

  return {
    createTracker,
    updateStep,
    setCurrentStep
  };
};