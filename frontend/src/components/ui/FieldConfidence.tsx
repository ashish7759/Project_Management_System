import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface FieldConfidenceProps {
  score: number | null | undefined;
  className?: string;
}

export const FieldConfidence: React.FC<FieldConfidenceProps> = ({ score, className = '' }) => {
  const { t } = useLanguage();

  if (score === null || score === undefined) return null;

  let symbol = '✓';
  let inlineStyle: React.CSSProperties = {};
  let titleKey = 'docs.confidence.tooltip.high';

  if (score >= 85) {
    symbol = '✓';
    inlineStyle = {
      backgroundColor: 'rgba(26,92,56,0.1)',
      color: '#1a5c38',
      borderColor: 'rgba(26,92,56,0.3)',
    };
    titleKey = 'docs.confidence.tooltip.high';
  } else if (score >= 60) {
    symbol = '~';
    inlineStyle = {
      backgroundColor: 'rgba(201,168,76,0.1)',
      color: '#c9a84c',
      borderColor: 'rgba(201,168,76,0.25)',
    };
    titleKey = 'docs.confidence.tooltip.medium';
  } else {
    symbol = '!';
    inlineStyle = {
      backgroundColor: 'rgba(185,28,28,0.1)',
      color: '#b91c1c',
      borderColor: 'rgba(185,28,28,0.3)',
    };
    titleKey = 'docs.confidence.tooltip.low';
  }

  return (
    <span
      title={`${t(titleKey)} (${score}%)`}
      className={`inline-flex items-center justify-center w-[16px] h-[16px] rounded-full border text-[10px] font-bold select-none cursor-help ${className}`}
      style={inlineStyle}
    >
      {symbol}
    </span>
  );
};

export default FieldConfidence;
