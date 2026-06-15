import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard, 
  Users, 
  Upload, 
  FileText, 
  FolderGit, 
  TrendingUp, 
  FilePieChart, 
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  if (!user) return null;

  const menuItems = [
    {
      key: 'nav.dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Manager', 'Operator', 'Viewer']
    },
    {
      key: 'nav.users',
      path: '/admin/users',
      icon: Users,
      roles: ['Admin']
    },
    {
      key: 'nav.upload',
      path: '/documents/upload',
      icon: Upload,
      roles: ['Admin', 'Manager', 'Operator']
    },
    {
      key: 'nav.documents',
      path: '/documents',
      icon: FileText,
      roles: ['Admin', 'Manager', 'Operator', 'Viewer']
    },
    {
      key: 'nav.projects',
      path: '/projects',
      icon: FolderGit,
      roles: ['Admin', 'Manager', 'Operator', 'Viewer']
    },
    {
      key: 'nav.progress',
      path: '/progress',
      icon: TrendingUp,
      roles: ['Admin', 'Manager', 'Operator']
    },
    {
      key: 'nav.reports',
      path: '/reports',
      icon: FilePieChart,
      roles: ['Admin', 'Manager', 'Viewer']
    },
    {
      key: 'nav.audit',
      path: '/admin/audit-log',
      icon: ShieldCheck,
      roles: ['Admin']
    }
  ];

  const getTranslatedRole = (role: string) => {
    switch (role) {
      case 'Admin': return t('users.role.admin');
      case 'Manager': return t('users.role.manager');
      case 'Operator': return t('users.role.operator');
      default: return t('users.role.viewer');
    }
  };

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside 
      className={`fixed top-0 bottom-0 z-20 flex flex-col transition-all duration-300 ${
        isOpen 
          ? 'w-[240px] left-0' 
          : 'w-[240px] -left-[240px] md:left-0 md:w-16'
      }`}
      style={{
        backgroundColor: '#1a5c38',
        borderRight: '1px solid rgba(201, 168, 76, 0.15)'
      }}
    >
      {/* Brand Header */}
      <div 
        className={`flex h-14 items-center ${isOpen ? 'px-4' : 'justify-center px-0'}`}
        style={{ 
          backgroundColor: '#145030',
          borderBottom: '1px solid rgba(201, 168, 76, 0.15)'
        }}
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <div 
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-md shadow"
            style={{ backgroundColor: '#145030', color: '#c9a84c', border: '1px solid rgba(201, 168, 76, 0.3)' }}
          >
            JBO
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-extrabold tracking-wide text-white leading-tight font-outfit uppercase truncate max-w-[160px]" title={t('app.name')}>
                {t('app.name')}
              </span>
              <span className="text-[8px] text-white/40 font-bold tracking-wider uppercase mt-0.5 truncate max-w-[160px]" title={t('app.department')}>
                {t('app.department')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 py-4 px-3 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center py-2.5 rounded-lg transition-all duration-150 hover:bg-white/10 hover:text-white hover:[&_svg]:text-[#c9a84c] ${
                  isOpen ? 'px-3 text-[13px]' : 'justify-center mx-1'
                } ${
                  isActive
                    ? 'bg-[rgba(201,168,76,0.15)] text-white border-l-[3px] border-l-[#c9a84c] font-medium [&_svg]:text-[#c9a84c]'
                    : 'text-white/70 [&_svg]:text-white/60'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0 transition-colors" />
              {isOpen && <span className="ml-3 transition-opacity duration-300">{t(item.key)}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* 1. Bottom User Card */}
      {user && (
        <div 
          className="p-3 border-t border-white/10" 
          style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
        >
          <div className={`flex items-center overflow-hidden ${isOpen ? 'space-x-3' : 'justify-center'}`}>
            <div 
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm shadow-sm"
              style={{ backgroundColor: '#c9a84c', color: '#1a5c38' }}
            >
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {isOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-bold text-white truncate leading-tight">
                  {user.full_name}
                </span>
                <span 
                  className="mt-1 inline-flex w-max rounded px-1.5 py-0.5 text-[8.5px] font-bold tracking-wider uppercase leading-none"
                  style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: '#c9a84c' }}
                >
                  {getTranslatedRole(user.role)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer System Info */}
      {isOpen && (
        <div className="border-t border-white/10 p-3 text-[9px] text-white/30 text-center">
          <p>&copy; 2026 {t('app.name')}</p>
          <p className="mt-0.5 font-mono text-[8px]">v1.0.0 (Secure RBAC)</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
