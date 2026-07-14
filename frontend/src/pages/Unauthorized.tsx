import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const Unauthorized: React.FC = () => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div 
      className="flex min-h-screen flex-col items-center justify-center px-4 text-center" 
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      <div 
        className="rounded-full p-4 shadow-inner animate-fadeIn" 
        style={{ backgroundColor: 'var(--badge-danger-bg)', color: 'var(--badge-danger-txt)' }}
      >
        <ShieldAlert className="h-16 w-16" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl font-outfit" style={{ color: 'var(--text-heading)' }}>
        {t('auth.access_denied')}
      </h1>
      <p className="mt-4 max-w-md text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {t('auth.access_denied_desc')}
      </p>
      <div className="mt-8">
        <Link to="/dashboard">
          <Button variant="primary">
            <Home className="h-4 w-4" />
            {t('auth.back_to_dashboard')}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
