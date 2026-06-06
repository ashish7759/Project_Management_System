import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-text-muted font-medium">
        {language === 'en' ? 'Language' : 'भाषा'}
      </span>
      <div className="flex bg-primary-bg border border-primary/25 rounded-full p-[3px] gap-[2px]">
        <button
          onClick={() => setLanguage('en')}
          className={`w-[72px] h-[28px] rounded-full text-[11px] font-semibold cursor-pointer transition-all duration-200 select-none flex items-center justify-center gap-1 ${
            language === 'en' 
              ? 'bg-primary text-white shadow-sm' 
              : 'bg-transparent text-text-muted hover:text-primary'
          }`}
        >
          <span>🇬🇧</span>
          <span>{t('lang.english')}</span>
        </button>
        <button
          onClick={() => setLanguage('hi')}
          className={`w-[72px] h-[28px] rounded-full text-[11px] font-semibold cursor-pointer transition-all duration-200 select-none flex items-center justify-center gap-1 ${
            language === 'hi' 
              ? 'bg-primary text-white shadow-sm' 
              : 'bg-transparent text-text-muted hover:text-primary'
          }`}
        >
          <span>🇮🇳</span>
          <span>{t('lang.hindi')}</span>
        </button>
      </div>
    </div>
  );
};

export default LanguageToggle;
