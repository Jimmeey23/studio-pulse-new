
// NOTE: The NoteTaker feature has been removed from the app.
// To keep the codebase safe from accidental imports while preserving compatibility,
// we export a lightweight noop component that renders nothing. This prevents runtime
// errors if some part of the app still imports `NoteTaker` but ensures the UI
// behavior is disabled.

import React from 'react';

export interface NoteTakerProps {
  className?: string;
}

export const NoteTaker: React.FC<NoteTakerProps> = () => {
  return null;
};

export default NoteTaker;
