
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * DEPRECATED: This page has been merged into Class Formats Comparison
 * All PowerCycle vs Barre vs Strength analytics are now in the Overview tab
 * of the Class Formats page for better organization and to avoid duplication.
 * 
 * Redirecting to: /class-formats
 */

const PowerCycleVsBarre = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Class Formats page
    navigate('/class-formats', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-purple-50/40 to-pink-50/30 flex items-center justify-center">
      <div className="text-center p-12 bg-white rounded-3xl shadow-2xl border border-violet-200 max-w-2xl mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 mb-4">
          Page Moved
        </h2>
        <p className="text-gray-600 text-lg mb-6">
          PowerCycle vs Barre vs Strength analytics have been consolidated into the <strong>Class Formats</strong> page for better organization.
        </p>
        <p className="text-gray-500 text-sm">
          Redirecting you now...
        </p>
      </div>
    </div>
      </div>
    </div>
  );
};

export default PowerCycleVsBarre;
