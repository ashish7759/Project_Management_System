import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

interface MenuItem {
  key: string;
  path?: string;
  icon: any;
  roles: string[];
  children?: {
    key: string;
    path: string;
    icon: any;
    roles: string[];
  }[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const location = useLocation();
  
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    'nav.document_management': true
  });

  const toggleSubMenu = (key: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!user) return null;

  const menuItems: MenuItem[] = [
    {
      key: 'nav.dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Manager', 'Operator', 'Viewer']
    },
    {
      key: 'nav.projects',
      path: '/projects',
      icon: FolderGit,
      roles: ['Admin', 'Manager', 'Operator', 'Viewer']
    },
    {
      key: 'nav.document_management',
      path: '/documents',
      icon: FileText,
      roles: ['Admin', 'Manager', 'Operator', 'Viewer']
    },
    {
      key: 'nav.progress',
      path: '/progress',
      icon: TrendingUp,
      roles: ['Admin', 'Manager', 'Operator']
    },
    {
      key: 'nav.issues',
      path: '/issues',
      icon: AlertTriangle,
      roles: ['Admin', 'Manager', 'Operator', 'Viewer']
    },
    {
      key: 'nav.reports',
      path: '/reports',
      icon: FilePieChart,
      roles: ['Admin', 'Manager', 'Viewer']
    },
    {
      key: 'nav.users',
      path: '/admin/users',
      icon: Users,
      roles: ['Admin']
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

  const filteredItems = menuItems
    .map(item => {
      if (item.children) {
        const visibleChildren = item.children.filter(child => child.roles.includes(user.role));
        return { ...item, children: visibleChildren };
      }
      return item;
    })
    .filter(item => {
      const roleMatches = item.roles ? item.roles.includes(user.role) : true;
      if (item.children) {
        return roleMatches && item.children.length > 0;
      }
      return roleMatches;
    });

  return (
    <aside 
      className={`fixed top-0 bottom-0 z-20 flex flex-col transition-all duration-300 sidebar-gradient shadow-xl ${
        isOpen 
          ? 'w-[240px] left-0' 
          : 'w-[240px] -left-[240px] md:left-0 md:w-16'
      }`}
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-subtle)'
      }}
    >
      {/* Brand Header */}
      <div 
        className={`flex h-14 items-center brand-shimmer transition-all duration-300 ${isOpen ? 'px-4' : 'justify-center px-0'}`}
        style={{ 
          backgroundColor: 'rgba(9, 40, 23, 0.4)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(4px)'
        }}
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <div 
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-md transition-all duration-300 hover:rotate-6 hover:scale-105 select-none"
            style={{ 
              background: 'linear-gradient(135deg, #104225 0%, #0d2e1c 100%)', 
              color: 'var(--color-accent)', 
              border: '1px solid rgba(201, 168, 76, 0.35)',
              boxShadow: '0 0 10px rgba(201, 168, 76, 0.15)' 
            }}
          >
            JBO
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-extrabold tracking-wide text-white leading-tight font-outfit uppercase truncate max-w-[160px] select-none" title={t('app.name')}>
                {t('app.name')}
              </span>
              <span className="text-[8px] text-white/40 font-bold tracking-wider uppercase mt-0.5 truncate max-w-[160px] select-none" title={t('app.department')}>
                {t('app.department')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-3 py-6 px-2 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children && item.children.length > 0;
          const isSubMenuOpen = !!openSubMenus[item.key];
          const isChildActive = (childPath: string) => {
            const [path, search] = childPath.split('?');
            if (location.pathname !== path) return false;
            
            const params = new URLSearchParams(location.search);
            const currentTab = params.get('tab') || 'view';
            
            if (!search) {
              return currentTab === 'view';
            }
            
            const linkParams = new URLSearchParams(search);
            const linkTab = linkParams.get('tab') || 'view';
            
            return currentTab === linkTab;
          };

          const isAnyChildActive = hasChildren && item.children?.some(child => {
            const childBasePath = child.path.split('?')[0];
            return location.pathname === childBasePath || 
              (childBasePath !== '/' && location.pathname.startsWith(childBasePath + '/'));
          });

          if (hasChildren) {
            return (
              <div 
                key={item.key} 
                className={`transition-all duration-300 ${
                  isOpen 
                    ? 'mx-2 rounded-xl border border-white/[0.04] bg-white/[0.02] overflow-hidden' 
                    : 'mx-1.5 space-y-1'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSubMenu(item.key)}
                  className={`w-full flex items-center py-3.5 transition-all duration-300 group ${
                    isOpen ? 'px-4.5 text-[15.5px] justify-between' : 'justify-center rounded-xl py-3.5'
                  } ${
                    isAnyChildActive
                      ? 'text-white font-semibold [&_svg]:text-[#c9a84c] bg-white/[0.04]'
                      : 'text-white/70 hover:bg-white/[0.06] hover:text-white [&_svg]:text-white/50 hover:[&_svg]:text-[#e5c158] font-medium'
                  }`}
                  style={isAnyChildActive && isOpen ? { borderLeft: '3px solid var(--color-accent)' } : {}}
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 shrink-0 transition-all duration-300 group-hover:scale-110" />
                    {isOpen && <span className="ml-3 tracking-wide transition-opacity duration-300">{t(item.key)}</span>}
                  </div>
                  {isOpen && (
                    <div className="text-white/40 group-hover:text-white transition-colors duration-300">
                      {isSubMenuOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </button>
                {isSubMenuOpen && (
                  <div 
                    className={`transition-all duration-300 ${
                      isOpen 
                        ? 'bg-black/10 border-t border-white/[0.03] py-1.5' 
                        : 'space-y-1'
                    }`}
                  >
                    {item.children!.map((child) => {
                      const ChildIcon = child.icon;
                      const active = isChildActive(child.path);
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={() =>
                            `flex items-center py-2.5 rounded-lg transition-all duration-300 group ${
                              isOpen ? 'px-6 text-[14px] mx-2' : 'justify-center mx-1 py-2 rounded-xl'
                            } ${
                              active
                                ? 'text-white font-semibold active-glow shadow-sm [&_svg]:text-[#c9a84c]'
                                : 'text-white/70 hover:bg-white/[0.04] hover:text-white [&_svg]:text-white/50 hover:[&_svg]:text-[#e5c158] font-medium'
                            }`
                          }
                          style={() =>
                            active && !isOpen
                              ? { background: 'var(--sidebar-active)', borderLeft: '3px solid var(--color-accent)' }
                              : active && isOpen
                              ? { background: 'rgba(201, 168, 76, 0.08)' }
                              : {}
                          }
                        >
                          <ChildIcon className="h-4 w-4 shrink-0 transition-all duration-300 group-hover:scale-110" />
                          {isOpen && <span className="ml-3 tracking-wide transition-opacity duration-300">{t(child.key)}</span>}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path!}
              className={({ isActive }) =>
                `flex items-center py-3.5 rounded-xl transition-all duration-300 group ${
                  isOpen ? 'px-4.5 text-[15.5px] mx-2' : 'justify-center mx-1.5'
                } ${
                  isActive
                    ? 'text-white font-semibold active-glow shadow-sm [&_svg]:text-[#c9a84c]'
                    : 'text-white/70 hover:bg-white/[0.06] hover:text-white hover:translate-x-1 [&_svg]:text-white/50 hover:[&_svg]:text-[#e5c158] font-medium'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: 'var(--sidebar-active)', borderLeft: '3px solid var(--color-accent)' }
                  : {}
              }
            >
              <Icon className="h-5 w-5 shrink-0 transition-all duration-300 group-hover:scale-110" />
              {isOpen && <span className="ml-3 tracking-wide transition-opacity duration-300">{t(item.key)}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom User Card */}
      {user && (
        <div className="p-3 mt-auto">
          <div 
            className={`rounded-xl border transition-all duration-300 p-2.5 ${
              isOpen ? 'flex items-center space-x-3 bg-white/[0.03] border-white/10 shadow-sm' : 'flex justify-center bg-transparent border-transparent'
            }`}
          >
            <div 
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm shadow-md transition-transform duration-300 hover:scale-105"
              style={{ 
                background: 'linear-gradient(135deg, #c9a84c 0%, #a8863c 100%)', 
                color: '#092817',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {isOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-bold text-white truncate leading-tight select-none">
                  {user.full_name}
                </span>
                <span 
                  className="mt-1.5 inline-flex w-max rounded-full px-2 py-0.5 text-[8px] font-extrabold tracking-widest uppercase leading-none"
                  style={{ 
                    backgroundColor: 'rgba(201,168,76,0.15)', 
                    color: '#e5c158',
                    border: '1px solid rgba(201,168,76,0.25)' 
                  }}
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
        <div className="border-t border-white/[0.06] p-3 text-[9px] text-white/20 text-center select-none font-medium">
          <p>&copy; 2026 {t('app.name')}</p>
          <p className="mt-0.5 font-mono text-[8px] text-white/12">v1.0.0 (Secure RBAC)</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
