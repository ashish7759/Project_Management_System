import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut } from 'lucide-react';
import LanguageToggle from './ui/LanguageToggle';
import ThemeToggle from './ui/ThemeToggle';
import { useLanguage } from '../context/LanguageContext';

interface TopbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  const getTranslatedRole = (role: string) => {
    switch (role) {
      case 'Admin': return t('users.role.admin');
      case 'Manager': return t('users.role.manager');
      case 'Operator': return t('users.role.operator');
      default: return t('users.role.viewer');
    }
  };

  // Map user roles to theme badge styles
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-danger-bg/70 text-danger border-danger/20 backdrop-blur-sm shadow-[0_1px_2px_rgba(185,28,28,0.05)]';
      case 'Manager':
        return 'bg-primary-bg2/70 text-primary border-primary/30 backdrop-blur-sm shadow-[0_1px_2px_rgba(26,92,56,0.05)]';
      case 'Operator':
        return 'bg-warning-bg/70 text-accent-dark border-accent/40 backdrop-blur-sm shadow-[0_1px_2px_rgba(201,168,76,0.05)]';
      default:
        return 'bg-primary-bg/70 text-text-muted border-primary/10';
    }
  };

  return (
    <header 
      className={`fixed top-0 right-0 z-10 flex items-center justify-between px-6 shadow-sm transition-all duration-300 ${
        isSidebarOpen ? 'md:left-[240px] left-0' : 'md:left-16 left-0'
      }`}
      style={{
        height: '56px',
        backgroundColor: 'var(--navbar-bg)',
        borderBottom: '2px solid var(--navbar-border)'
      }}
    >
      {/* Menu Toggle & Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 focus:outline-none transition-all duration-300 hover:scale-105 cursor-pointer"
          style={{ color: 'var(--text-primary)' }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
            e.currentTarget.style.boxShadow = '0 2px 8px var(--border-default)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Menu className="h-5 w-5" />
        </button>
        {!isSidebarOpen && (
          <span 
            className="hidden text-[17px] font-extrabold sm:block tracking-tight font-outfit text-gradient-primary select-none"
          >
            {t('app.name')}
          </span>
        )}
        <span 
          className="text-[10px] font-bold uppercase tracking-widest sm:block hidden select-none"
          style={{ color: 'var(--color-accent)' }}
        >
          {isSidebarOpen ? t('app.subtitle') : `| ${t('app.subtitle')}`}
        </span>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        {/* Language Toggle Component */}
        <LanguageToggle />
        
        {/* Theme Toggle Component */}
        <ThemeToggle />

        {/* User Card */}
        <div className="flex items-center space-x-2 border-r pr-4" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex flex-col text-right select-none">
            <span className="text-xs font-semibold text-text-body leading-tight">{user.full_name}</span>
            <span className="text-[10px] text-text-muted font-medium">Emp ID: {user.employee_id || 'N/A'}</span>
          </div>
          
          {/* Role badge */}
          <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase ${getRoleBadgeClass(user.role)}`}>
            {getTranslatedRole(user.role)}
          </span>
        </div>

        {/* Logout Action */}
        <button
          onClick={logout}
          className="flex items-center justify-center rounded-xl border text-xs font-semibold py-1.5 px-3.5 transition-all duration-300 hover:scale-[1.03] hover:shadow-md cursor-pointer"
          style={{ 
            backgroundColor: 'var(--bg-surface)',
            color: '#dc2626',
            borderColor: 'rgba(220, 38, 38, 0.25)',
            boxShadow: '0 1px 2px rgba(220, 38, 38, 0.05)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--badge-danger-bg)';
            e.currentTarget.style.borderColor = '#dc2626';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
            e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.25)';
          }}
          title={t('auth.logout')}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="ml-1.5 hidden lg:inline tracking-wide">{t('auth.logout')}</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
