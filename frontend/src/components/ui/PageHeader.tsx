import React from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  breadcrumbs = [],
  action,
  className = '',
}) => {
  return (
    <div 
      className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4 mb-6 ${className}`}
      style={{ borderBottomColor: 'var(--border-subtle)' }}
    >
      <div className="space-y-1">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-text-hint">
            {breadcrumbs.map((bc, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {bc.path && !isLast ? (
                    <Link 
                      to={bc.path} 
                      className="hover:text-primary transition-colors duration-150"
                    >
                      {bc.label}
                    </Link>
                  ) : (
                    <span 
                      className={isLast ? 'font-medium' : ''}
                      style={{ color: isLast ? 'var(--text-primary)' : 'inherit' }}
                    >
                      {bc.label}
                    </span>
                  )}
                  {!isLast && <span style={{ color: 'var(--color-accent)' }}>/</span>}
                </React.Fragment>
              );
            })}
          </nav>
        )}
        
        {/* Page Title */}
        <h1 className="text-[18px] font-medium tracking-tight font-outfit" style={{ color: 'var(--text-heading)' }}>
          {title}
        </h1>
      </div>

      {/* Action slot */}
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
