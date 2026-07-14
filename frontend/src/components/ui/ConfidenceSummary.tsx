import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import ConfidenceBar from './ConfidenceBar';
import FieldConfidence from './FieldConfidence';
import { Sparkles, AlertTriangle } from 'lucide-react';

interface ConfidenceSummaryProps {
  confidenceScores: Record<string, number> | null | undefined;
  overallConfidence: number | null | undefined;
}

const getFieldLabel = (field: string, t: (key: string) => string): string => {
  switch (field) {
    case 'project_name': return t('projects.project_name');
    case 'project_id': return t('projects.project_id');
    case 'location': return t('projects.location');
    case 'district': return t('projects.district');
    case 'contractor_name': return t('projects.contractor');
    case 'contractor_id': return `${t('projects.contractor')} ID`;
    case 'work_order_number': return t('docs.work_order');
    case 'budget_amount': return t('docs.budget');
    case 'start_date': return t('projects.start_date');
    case 'end_date': return t('projects.end_date');
    case 'department': return t('common.department');
    case 'document_type': return t('docs.doc_type');
    case 'status': return t('common.status');
    case 'description': return t('docs.description');
    default: return field.replace(/_/g, ' ');
  }
};

export const ConfidenceSummary: React.FC<ConfidenceSummaryProps> = ({
  confidenceScores,
  overallConfidence,
}) => {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);

  if (!confidenceScores || Object.keys(confidenceScores).length === 0) {
    return null;
  }

  const scoresArray = Object.entries(confidenceScores);
  const totalFields = scoresArray.length;

  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  const lowFields: string[] = [];

  scoresArray.forEach(([field, score]) => {
    if (score >= 85) {
      highCount++;
    } else if (score >= 60) {
      mediumCount++;
    } else {
      lowCount++;
      lowFields.push(field);
    }
  });

  return (
    <div
      className="rounded-[10px] p-5 mb-5"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Title block */}
      <div className="pb-3 mb-4 border-b" style={{ borderBottomColor: 'var(--border-subtle)' }}>
        <h3 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
          <Sparkles className="h-4 w-4 text-accent shrink-0 animate-pulse" />
          <span>{t('docs.confidence.summary')}</span>
          {overallConfidence !== undefined && overallConfidence !== null && (
            <span className="text-[13px] font-normal" style={{ color: 'var(--text-muted)' }}>
              ({t('docs.confidence')}: {overallConfidence}%)
            </span>
          )}
        </h3>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {t('docs.confidence.summary.desc')}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-2.5 rounded-lg border flex flex-col justify-between" style={{ backgroundColor: 'rgba(26,92,56,0.04)', borderColor: 'rgba(26,92,56,0.15)' }}>
          <span className="text-[11px] font-medium text-text-muted" style={{ color: '#1a5c38' }}>{t('docs.confidence.high_label')}</span>
          <span className="text-xl font-bold mt-1" style={{ color: '#1a5c38' }}>{highCount}</span>
        </div>
        <div className="p-2.5 rounded-lg border flex flex-col justify-between" style={{ backgroundColor: 'rgba(201,168,76,0.04)', borderColor: 'rgba(201,168,76,0.15)' }}>
          <span className="text-[11px] font-medium text-text-muted" style={{ color: '#c9a84c' }}>{t('docs.confidence.medium_label')}</span>
          <span className="text-xl font-bold mt-1" style={{ color: '#c9a84c' }}>{mediumCount}</span>
        </div>
        <div className="p-2.5 rounded-lg border flex flex-col justify-between" style={{ backgroundColor: 'rgba(185,28,28,0.04)', borderColor: 'rgba(185,28,28,0.15)' }}>
          <span className="text-[11px] font-medium text-text-muted" style={{ color: '#b91c1c' }}>{t('docs.confidence.low_label')}</span>
          <span className="text-xl font-bold mt-1" style={{ color: '#b91c1c' }}>{lowCount}</span>
        </div>
      </div>

      {/* Warnings block */}
      {lowCount > 0 && (
        <div className="p-3 mb-4 rounded-lg border flex items-start gap-3" style={{ backgroundColor: 'rgba(185,28,28,0.06)', borderColor: 'rgba(185,28,28,0.2)' }}>
          <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
          <div className="text-[12px]">
            <span className="font-bold text-red-700" style={{ color: '#b91c1c' }}>
              {lowCount} {lowCount === 1 ? t('docs.confidence.warning_note_single') : t('docs.confidence.warning_note')}
            </span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {lowFields.map((field) => (
                <span
                  key={field}
                  className="px-2 py-0.5 rounded text-[10px] font-medium border"
                  style={{ backgroundColor: 'rgba(185,28,28,0.08)', color: '#b91c1c', borderColor: 'rgba(185,28,28,0.15)' }}
                >
                  {getFieldLabel(field, t)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Collapsible toggle */}
      <div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full py-1.5 px-3 rounded border text-[12px] font-medium transition-colors cursor-pointer select-none flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: 'var(--bg-surface-hover)',
            color: 'var(--text-main)',
            borderColor: 'var(--border-default)',
          }}
        >
          <span>{showDetails ? '▲' : '▼'}</span>
          <span>{showDetails ? 'Hide Field-by-Field Breakdown' : 'Show Field-by-Field Breakdown'}</span>
        </button>

        {showDetails && (
          <div className="mt-4 pt-3 border-t grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3" style={{ borderTopColor: 'var(--border-subtle)' }}>
            {scoresArray.map(([field, score]) => (
              <div key={field} className="flex flex-col gap-1 py-1">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <FieldConfidence score={score} />
                    {getFieldLabel(field, t)}
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{score}%</span>
                </div>
                <ConfidenceBar score={score} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfidenceSummary;
