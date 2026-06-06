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
    <div className={`overflow-hidden rounded-[10px] border border-primary/15 bg-white shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary/10 text-left text-sm">
          <thead className="bg-primary text-[12px] font-semibold uppercase tracking-[0.5px] text-white">
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
          <tbody className="divide-y divide-primary/6 text-text-body">
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
  const bgStyle = index % 2 === 0 ? 'bg-white' : 'bg-primary-bg';
  return (
    <tr 
      className={`${bgStyle} hover:bg-primary-bg2 cursor-pointer transition-colors duration-150 ${className}`}
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
      className={`px-4 py-3 text-[13px] border-b border-primary/6 ${className}`}
      {...props}
    >
      {children}
    </td>
  );
};
