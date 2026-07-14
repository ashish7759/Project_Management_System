import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ 
  headers, 
  children, 
  className = '' 
}) => {
  return (
    <div 
      className={`overflow-hidden rounded-[10px] border shadow-sm ${className}`}
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--table-border)' }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y text-left text-sm" style={{ borderColor: 'var(--table-border)' }}>
          <thead 
            className="text-[12px] font-semibold uppercase tracking-[0.5px]"
            style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)' }}
          >
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  className="px-4 py-3 border-r border-white/10 last:border-r-0"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--table-border)', color: 'var(--text-body)' }}>
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  index: number;
  children: React.ReactNode;
  className?: string;
}

export const TableRow: React.FC<TableRowProps> = ({ 
  index, 
  children, 
  className = '', 
  ...props 
}) => {
  const bgStyle = index % 2 === 0 ? 'var(--table-row-even)' : 'var(--table-row-odd)';
  return (
    <tr 
      className={`cursor-pointer transition-colors duration-150 ${className}`}
      style={{ backgroundColor: bgStyle }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--table-row-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = bgStyle;
      }}
      {...props}
    >
      {children}
    </tr>
  );
};

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <td 
      className={`px-4 py-3 text-[13px] border-b ${className}`}
      style={{ borderColor: 'var(--table-border)' }}
      {...props}
    >
      {children}
    </td>
  );
};
