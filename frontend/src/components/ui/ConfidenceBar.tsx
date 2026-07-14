import React from 'react';

interface ConfidenceBarProps {
  score: number;
  showLabel?: boolean;
  className?: string;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  score,
  showLabel = false,
  className = '',
}) => {
  const pct = Math.max(0, Math.min(100, score));

  let barColor = '#1a5c38'; // Primary green (High)
  if (pct < 60) {
    barColor = '#b91c1c'; // Red (Low)
  } else if (pct < 85) {
    barColor = '#c9a84c'; // Golden (Medium)
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-[11px] font-medium text-text-main select-none">
          <span>OCR Confidence</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="w-full rounded-full h-1.5 overflow-hidden bg-bg-surface-hover border border-border-default/10" style={{ backgroundColor: 'var(--border-default)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
};

export default ConfidenceBar;
