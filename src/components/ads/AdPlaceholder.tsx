import React from 'react';

interface Props {
  slotId?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
  label?: string;
}

export default function AdPlaceholder({ slotId, className = '', label = 'إعلان' }: Props) {
  // In production, this would render the actual Google AdSense code
  // For development, it renders a placeholder to visualize layout
  
  return (
    <div className={`w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 p-4 my-6 ${className}`}>
      <span className="text-xs uppercase tracking-wider font-semibold mb-2">{label}</span>
      <div className="text-center text-sm">
        <p>Google AdSense Space</p>
        {slotId && <p className="text-xs mt-1 font-mono">{slotId}</p>}
      </div>
    </div>
  );
}
