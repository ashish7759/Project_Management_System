import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut } from 'lucide-react';
import LanguageToggle from './ui/LanguageToggle';
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
        return 'bg-danger-bg text-danger border-danger/20';
      case 'Manager':
        return 'bg-primary-bg2 text-primary border-primary/30';
      case 'Operator':
        return 'bg-warning-bg text-accent-dark border-accent/40';
      default:
        return 'bg-primary-bg text-text-muted border-primary/10';
    }
  };

  return (
    <header 
      className={`fixed top-0 right-0 z-10 flex items-center justify-between bg-white px-4 shadow-sm transition-all duration-300 ${
        isSidebarOpen ? 'md:left-[240px] left-0' : 'md:left-16 left-0'
      }`}
      style={{
        height: '56px',
        borderBottom: '2px solid #1a5c38'
      }}
    >
      {/* Menu Toggle & Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 focus:outline-none transition duration-150 cursor-pointer"
          style={{ color: '#1a5c38' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eaf4ee'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Menu className="h-5.5 w-5.5" />
        </button>
        <span 
          className="hidden text-[18px] font-medium sm:block tracking-tight font-outfit"
          style={{ color: '#1a5c38' }}
        >
          {t('app.name')}
        </span>
        <span 
          className="text-xs font-semibold uppercase sm:block hidden"
          style={{ color: '#c9a84c' }}
        >
          | {t('app.subtitle')}
        </span>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        {/* Language Toggle Component */}
        <LanguageToggle />

        {/* User Card */}
        <div className="flex items-center space-x-2 border-r pr-4" style={{ borderColor: 'rgba(26, 92, 56, 0.15)' }}>
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold text-text-body leading-tight">{user.full_name}</span>
            <span className="text-[10px] text-text-muted font-medium">Emp ID: {user.employee_id || 'N/A'}</span>
          </div>
          
          {/* Role badge */}
          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${getRoleBadgeClass(user.role)}`}>
            {getTranslatedRole(user.role)}
          </span>
        </div>

        {/* Logout Action */}
        <button
          onClick={logout}
          className="flex items-center justify-center rounded-lg border text-xs font-medium py-1.5 px-3 transition-all duration-150 cursor-pointer"
          style={{ 
            backgroundColor: '#ffffff',
            color: '#b91c1c',
            borderColor: '#b91c1c'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#fef2f2';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
          title={t('auth.logout')}
        >
          <LogOut className="h-4 w-4" />
          <span className="ml-1.5 hidden lg:inline">{t('auth.logout')}</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
