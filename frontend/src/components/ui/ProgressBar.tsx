import React from 'react';

interface ProgressBarProps {
  progress: number;
  delayed?: boolean;
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  delayed = false,
  showLabel = true,
  className = '',
}) => {
  // Safe progress boundary
  const pct = Math.max(0, Math.min(100, progress));

  let fillClass = 'bg-primary';
  if (delayed) {
    fillClass = 'bg-danger';
  } else if (pct > 80) {
    fillClass = 'bg-primary';
  } else if (pct >= 40) {
    fillClass = 'bg-primary-light';
  } else {
    fillClass = 'bg-accent';
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-[12px] font-medium text-primary select-none">
          <span>Completion Progress</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="w-full bg-primary/10 rounded-full h-2 overflow-hidden">
        <div 
          className={`${fillClass} h-full rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
