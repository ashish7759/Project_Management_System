import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface ConfidenceBadgeProps {
  score: number | null | undefined;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score, className = '' }) => {
  const { t } = useLanguage();

  if (score === null || score === undefined) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-medium py-[3px] px-[10px] rounded-full border bg-transparent text-text-muted border-border-default ${className}`}>
        --
      </span>
    );
  }

  let textKey = 'docs.confidence.high';
  let inlineStyle: React.CSSProperties = {};

  if (score >= 85) {
    textKey = 'docs.confidence.high';
    inlineStyle = {
      background: 'var(--badge-success-bg, rgba(26,92,56,0.1))',
      color: 'var(--badge-success-txt, #1a5c38)',
      borderColor: 'rgba(26,92,56,0.3)',
    };
  } else if (score >= 60) {
    textKey = 'docs.confidence.medium';
    inlineStyle = {
      background: 'var(--badge-warning-bg, rgba(201,168,76,0.1))',
      color: 'var(--badge-warning-txt, #c9a84c)',
      borderColor: 'rgba(201,168,76,0.25)',
    };
  } else {
    textKey = 'docs.confidence.low';
    inlineStyle = {
      background: 'var(--badge-danger-bg, rgba(185,28,28,0.1))',
      color: 'var(--badge-danger-txt, #b91c1c)',
      borderColor: 'rgba(185,28,28,0.2)',
    };
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium py-[3px] px-[10px] rounded-full border ${className}`}
      style={inlineStyle}
    >
      {t(textKey)} ({score}%)
    </span>
  );
};

export default ConfidenceBadge;
