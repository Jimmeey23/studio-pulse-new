/**
 * Utility functions for categorizing class types based on class name patterns
 */

export type ClassFormat = 'PowerCycle' | 'Barre' | 'Strength';

/**
 * Determines the class format based on the class name
 * - PowerCycle: contains "powerCycle" (case-insensitive)
 * - Strength: contains "strength lab" (case-insensitive)
 * - Barre: everything else
 */
export const getClassFormat = (className: string | undefined): ClassFormat => {
  if (!className) return 'Barre';
  
  const lower = className.toLowerCase();
  
  if (lower.includes('powercycle')) {
    return 'PowerCycle';
  }
  
  if (lower.includes('strength lab')) {
    return 'Strength';
  }
  
  return 'Barre';
};

/**
 * Get all available class formats
 */
export const getAllFormats = (): ClassFormat[] => {
  return ['PowerCycle', 'Barre', 'Strength'];
};

/**
 * Filters sessions by class format
 */
export const filterByFormat = (sessions: any[], format: ClassFormat): any[] => {
  return sessions.filter(s => {
    const cls = s?.cleanedClass || s?.classType;
    return getClassFormat(cls) === format;
  });
};
