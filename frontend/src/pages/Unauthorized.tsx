import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';

const Unauthorized: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center" style={{ backgroundColor: '#f7faf8' }}>
      <div className="rounded-full p-4 text-danger shadow-inner" style={{ backgroundColor: '#fef2f2' }}>
        <ShieldAlert className="h-16 w-16" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold text-primary sm:text-4xl font-outfit">
        {t('auth.access_denied')}
      </h1>
      <p className="mt-4 max-w-md text-xs text-text-muted leading-relaxed">
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
