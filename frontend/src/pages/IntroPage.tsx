import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, LogIn, Info, ShieldCheck, Lock, Award, X, FileText, BarChart3 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import LanguageToggle from '../components/ui/LanguageToggle';

const IntroPage: React.FC = () => {
  const navigate = useNavigate();
  const [showInfo, setShowInfo] = useState(false);
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // Set flag indicating that the user has visited the intro page
  useEffect(() => {
    (window as any).__hasVisitedIntro = true;
  }, []);

  return (
    <div 
      className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background: isDark ? '#0f1a13' : '#ffffff',
        border: isDark ? '0.5px solid rgba(46,125,82,0.2)' : '0.5px solid #e0e0e0',
      }}
    >
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineGrow {
          from { width: 0; }
          to { width: 60px; }
        }
        @keyframes boltFlash {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.12); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes rotation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-fadeDown {
          animation: fadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-fadeUp {
          animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-lineGrow {
          animation: lineGrow 0.5s ease-out both;
        }
        .animate-boltFlash {
          animation: boltFlash 1.6s infinite ease-in-out;
        }
        .animate-pulseSlow {
          animation: pulse 2.5s infinite ease-in-out;
        }
        .rotate-slow {
          animation: rotation 20s infinite linear;
        }
      `}} />

      {/* Floating Language Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* 1. TOP COLOR BAR */}
      <div
        className="fixed top-0 left-0 right-0 h-[6px] z-50"
        style={{
          background: isDark 
            ? 'linear-gradient(to right, #2e7d52, #4a9e6e, #d4a847, #4a9e6e, #2e7d52)'
            : 'linear-gradient(to right, #1a5c38, #2e7d52, #c9a84c, #2e7d52, #1a5c38)'
        }}
      />

      {/* 2. SIDE ACCENTS */}
      <div
        className="fixed top-0 bottom-0 left-0 w-[4px] z-50"
        style={{ backgroundColor: isDark ? '#2e7d52' : '#1a5c38' }}
      />
      <div
        className="fixed top-0 bottom-0 right-0 w-[4px] z-50"
        style={{ backgroundColor: isDark ? '#2e7d52' : '#1a5c38' }}
      />

      {/* 3. CORNER ORNAMENTS */}
      <div
        className="absolute top-[14px] left-[14px] w-[28px] h-[28px] border-t-2 border-l-2 opacity-50 pointer-events-none"
        style={{ borderColor: isDark ? '#d4a847' : '#c9a84c' }}
      />
      <div
        className="absolute top-[14px] right-[14px] w-[28px] h-[28px] border-t-2 border-r-2 opacity-50 pointer-events-none"
        style={{ borderColor: isDark ? '#d4a847' : '#c9a84c' }}
      />
      <div
        className="absolute bottom-[14px] left-[14px] w-[28px] h-[28px] border-b-2 border-l-2 opacity-50 pointer-events-none"
        style={{ borderColor: isDark ? '#d4a847' : '#c9a84c' }}
      />
      <div
        className="absolute bottom-[14px] right-[14px] w-[28px] h-[28px] border-b-2 border-r-2 opacity-50 pointer-events-none"
        style={{ borderColor: isDark ? '#d4a847' : '#c9a84c' }}
      />

      {/* 4. BACKGROUND GRID PATTERN */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundSize: '36px 36px',
          backgroundImage: `
            linear-gradient(to right, rgba(46, 125, 82, ${isDark ? 0.08 : 0.04}) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(46, 125, 82, ${isDark ? 0.08 : 0.04}) 1px, transparent 1px)
          `
        }}
      />

      {/* Center Layout Panel */}
      <div className="flex flex-col items-center justify-center text-center px-4 md:px-0 max-w-[680px] w-full mx-auto space-y-6 md:space-y-7 z-10">

        {/* 5. EMBLEM / ICON SECTION */}
        <div
          className="relative w-[92px] h-[92px] rounded-full flex items-center justify-center"
          style={{
            animation: 'fadeDown 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '0s'
          }}
        >
          {/* Rotating outer ring */}
          <div className="absolute inset-0 rounded-full border-[1.5px] rotate-slow" style={{ borderColor: isDark ? '#d4a847' : '#c9a84c' }}>
            {/* 4 golden dots */}
            <div className="absolute -top-[3.5px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: isDark ? '#d4a847' : '#c9a84c' }} />
            <div className="absolute -bottom-[3.5px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: isDark ? '#d4a847' : '#c9a84c' }} />
            <div className="absolute -left-[3.5px] top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: isDark ? '#d4a847' : '#c9a84c' }} />
            <div className="absolute -right-[3.5px] top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: isDark ? '#d4a847' : '#c9a84c' }} />
          </div>

          {/* Inner circle */}
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center shadow z-10 transition-transform duration-300 hover:scale-105"
            style={{ backgroundColor: isDark ? '#2e7d52' : '#1a5c38' }}
          >
            <Zap
              size={32}
              style={{ color: isDark ? '#d4a847' : '#c9a84c' }}
              className="animate-boltFlash"
            />
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-3">
          {/* 6. GOVERNMENT LABEL */}
          <div
            className="text-[10px] md:text-[11px] font-semibold tracking-[2.5px] uppercase"
            style={{
              color: isDark ? '#5a7a62' : '#888888',
              animation: 'fadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
              animationDelay: '200ms'
            }}
          >
            {t('app.department')}
          </div>

          {/* 7. OFFICE NAME */}
          <h1
            className="text-3xl md:text-4xl font-extrabold tracking-tight py-1"
            style={{
              color: isDark ? '#c9e8d4' : '#1a5c38',
              animation: 'fadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
              animationDelay: '350ms'
            }}
          >
            {t('app.name')}
          </h1>

          {/* 8. TAGLINE */}
          <div
            className="text-[11px] md:text-[12px] font-bold tracking-[1.5px] uppercase px-4"
            style={{
              color: isDark ? '#d4a847' : '#c9a84c',
              animation: 'fadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
              animationDelay: '450ms'
            }}
          >
            {t('app.tagline')}
          </div>
        </div>

        {/* 10. GOLDEN DIVIDER */}
        <div
          className="flex items-center justify-center gap-[10px]"
          style={{
            animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '600ms'
          }}
        >
          <div
            className="h-[1px] w-[50px] animate-lineGrow"
            style={{ backgroundColor: isDark ? '#d4a847' : '#c9a84c', opacity: 0.5 }}
          />
          <div
            className="w-[7px] h-[7px] rotate-45 shrink-0"
            style={{ backgroundColor: isDark ? '#d4a847' : '#c9a84c' }}
          />
          <div
            className="h-[1px] w-[50px] animate-lineGrow"
            style={{ backgroundColor: isDark ? '#d4a847' : '#c9a84c', opacity: 0.5 }}
          />
        </div>

        {/* 11. TAGLINE / DESCRIPTION */}
        <p
          className="text-[12px] leading-[1.7] max-w-[520px] px-4"
          style={{
            color: isDark ? '#9ab5a0' : '#666666',
            animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '750ms'
          }}
        >
          {t('app.description')}
        </p>

        {/* 12. FEATURES ROW */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-[620px] pt-2 px-2"
          style={{
            animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '900ms'
          }}
        >
          {/* Card 1: OCR */}
          <div
            className="group rounded-xl p-4 text-left transition-all duration-300 hover:shadow-md cursor-default border hover:-translate-y-1 relative overflow-hidden"
            style={{
              backgroundColor: isDark ? '#1a2b1f' : '#ffffff',
              borderColor: isDark ? 'rgba(46, 125, 82, 0.3)' : 'rgba(26, 92, 56, 0.15)',
              borderTop: isDark ? '2.5px solid #2e7d52' : '3px solid #1a5c38'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-[#1a5c38] group-hover:text-white"
                style={{
                  backgroundColor: isDark ? 'rgba(46, 125, 82, 0.15)' : '#eaf4ee',
                  color: isDark ? '#6ed9a0' : '#1a5c38'
                }}
              >
                <FileText size={16} />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: isDark ? '#6ed9a0' : '#1a5c38' }}>
                {t('intro.feat_ocr_title')}
              </h3>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: isDark ? '#9ab5a0' : '#666666' }}>
              {t('intro.feat_ocr_desc')}
            </p>
          </div>

          {/* Card 2: Milestones */}
          <div
            className="group rounded-xl p-4 text-left transition-all duration-300 hover:shadow-md cursor-default border hover:-translate-y-1 relative overflow-hidden"
            style={{
              backgroundColor: isDark ? '#1a2b1f' : '#ffffff',
              borderColor: isDark ? 'rgba(46, 125, 82, 0.3)' : 'rgba(26, 92, 56, 0.15)',
              borderTop: isDark ? '2.5px solid #d4a847' : '3px solid #c9a84c'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-[#c9a84c] group-hover:text-white"
                style={{
                  backgroundColor: isDark ? 'rgba(201, 168, 76, 0.15)' : '#f9f5ec',
                  color: isDark ? '#d4a847' : '#c9a84c'
                }}
              >
                <BarChart3 size={16} />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: isDark ? '#6ed9a0' : '#1a5c38' }}>
                {t('intro.feat_proj_title')}
              </h3>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: isDark ? '#9ab5a0' : '#666666' }}>
              {t('intro.feat_proj_desc')}
            </p>
          </div>

          {/* Card 3: Secure Audit */}
          <div
            className="group rounded-xl p-4 text-left transition-all duration-300 hover:shadow-md cursor-default border hover:-translate-y-1 relative overflow-hidden"
            style={{
              backgroundColor: isDark ? '#1a2b1f' : '#ffffff',
              borderColor: isDark ? 'rgba(46, 125, 82, 0.3)' : 'rgba(26, 92, 56, 0.15)',
              borderTop: isDark ? '2.5px solid #2e7d52' : '3px solid #1a5c38'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-[#1a5c38] group-hover:text-white"
                style={{
                  backgroundColor: isDark ? 'rgba(46, 125, 82, 0.15)' : '#eaf4ee',
                  color: isDark ? '#6ed9a0' : '#1a5c38'
                }}
              >
                <Lock size={16} />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: isDark ? '#6ed9a0' : '#1a5c38' }}>
                {t('intro.feat_audit_title')}
              </h3>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: isDark ? '#9ab5a0' : '#666666' }}>
              {t('intro.feat_audit_desc')}
            </p>
          </div>
        </div>

        {/* 13. BUTTON ROW */}
        <div
          className="flex flex-row items-center justify-center gap-4 pt-3"
          style={{
            animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '1050ms'
          }}
        >
          {/* Button 1: Primary Login */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 rounded-xl py-3 px-7 font-bold text-xs shadow-md transition duration-200 cursor-pointer uppercase tracking-wider hover:shadow-lg active:scale-95"
            style={{
              backgroundColor: '#1a5c38',
              color: '#ffffff',
              borderBottom: isDark ? '3.5px solid #d4a847' : '3.5px solid #c9a84c'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#145030';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#1a5c38';
            }}
          >
            <LogIn size={15} className="shrink-0" />
            <span>{t('intro.login_btn')}</span>
          </button>

          {/* Button 2: Secondary About */}
          <button
            onClick={() => setShowInfo(true)}
            className="flex items-center gap-2 rounded-xl py-3 px-6 font-bold text-xs border shadow-sm transition duration-200 cursor-pointer uppercase tracking-wider active:scale-95"
            style={{
              backgroundColor: isDark ? '#1a2b1f' : '#ffffff',
              color: isDark ? '#6ed9a0' : '#1a5c38',
              borderColor: isDark ? 'rgba(46, 125, 82, 0.3)' : 'rgba(26, 92, 56, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#2a3d2f' : '#f0f7f3';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#1a2b1f' : '#ffffff';
            }}
          >
            <Info size={15} className="shrink-0" />
            <span>{t('intro.about_btn')}</span>
          </button>
        </div>

        {/* 14. BADGE ROW */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 pt-2"
          style={{
            animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '1150ms'
          }}
        >
          {/* Badge 1 */}
          <div
            className="flex items-center gap-1.5 rounded-full py-1 px-3 text-[10px] font-bold border shadow-sm"
            style={{
              color: isDark ? '#6ed9a0' : '#1a5c38',
              backgroundColor: isDark ? 'rgba(26, 92, 56, 0.3)' : '#eaf4ee',
              borderColor: isDark ? 'rgba(46, 125, 82, 0.25)' : 'rgba(26, 92, 56, 0.25)'
            }}
          >
            <ShieldCheck size={12} className="shrink-0" style={{ color: isDark ? '#6ed9a0' : '#1a5c38' }} />
            <span>{t('intro.secure_access')}</span>
          </div>

          {/* Badge 2 */}
          <div
            className="flex items-center gap-1.5 rounded-full py-1 px-3 text-[10px] font-bold border shadow-sm"
            style={{
              color: isDark ? '#6ed9a0' : '#1a5c38',
              backgroundColor: isDark ? 'rgba(26, 92, 56, 0.3)' : '#eaf4ee',
              borderColor: isDark ? 'rgba(46, 125, 82, 0.25)' : 'rgba(26, 92, 56, 0.25)'
            }}
          >
            <Lock size={12} className="shrink-0" style={{ color: isDark ? '#6ed9a0' : '#1a5c38' }} />
            <span>{t('intro.role_based')}</span>
          </div>

          {/* Badge 3 */}
          <div
            className="flex items-center gap-1.5 rounded-full py-1 px-3 text-[10px] font-bold border shadow-sm"
            style={{
              color: isDark ? '#d4a847' : '#c9a84c',
              backgroundColor: isDark ? 'rgba(201, 168, 76, 0.2)' : '#eaf4ee',
              borderColor: isDark ? 'rgba(201, 168, 76, 0.25)' : 'rgba(26, 92, 56, 0.25)'
            }}
          >
            <Award size={12} className="shrink-0" style={{ color: isDark ? '#d4a847' : '#c9a84c' }} />
            <span>{t('intro.gov_verified')}</span>
          </div>
        </div>

      </div>

      {/* 15. BOTTOM FOOTER STRIP */}
      <div
        className="absolute bottom-[16px] flex items-center justify-center gap-1.5 text-[9px] tracking-[0.5px] pointer-events-none"
        style={{
          color: isDark ? '#5a7a62' : '#aaaaaa',
          animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
          animationDelay: '1250ms'
        }}
      >
        <span
          className="w-[6px] h-[6px] rounded-full animate-pulseSlow shrink-0"
          style={{ backgroundColor: '#2e7d52' }}
        />
        <span>{t('intro.system_online')}</span>
        <span style={{ color: isDark ? '#d4a847' : '#c9a84c' }}>&middot;</span>
        <span>{t('intro.version')} 1.0.0</span>
        <span style={{ color: isDark ? '#d4a847' : '#c9a84c' }}>&middot;</span>
        <span>&copy; 2026 {t('app.department')}</span>
      </div>

      {/* 16. BOTTOM COLOR BAR */}
      <div
        className="fixed bottom-0 left-0 right-0 h-[3px] z-50"
        style={{ backgroundColor: isDark ? '#2e7d52' : '#1a5c38' }}
      />

      {/* Interactive Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeUp">
          <div 
            className="w-full max-w-md rounded-xl shadow-2xl overflow-hidden border" 
            style={{ 
              backgroundColor: isDark ? '#223328' : '#ffffff',
              borderColor: isDark ? 'rgba(46, 125, 82, 0.3)' : 'rgba(26, 92, 56, 0.25)' 
            }}
          >

            {/* Modal Header */}
            <div 
              className="flex items-center justify-between px-5 py-4 border-b" 
              style={{ 
                borderColor: isDark ? 'rgba(46, 125, 82, 0.2)' : 'rgba(26, 92, 56, 0.1)', 
                backgroundColor: isDark ? '#1a2b1f' : '#f7faf8',
                color: isDark ? '#c9e8d4' : '#1a5c38' 
              }}
            >
              <div className="flex items-center gap-2">
                <Info size={18} style={{ color: isDark ? '#d4a847' : '#c9a84c' }} />
                <span className="font-bold text-sm uppercase tracking-wider">{t('intro.about_title')}</span>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1.5 rounded-full hover:bg-slate-100/10 transition duration-150 cursor-pointer"
                style={{ color: isDark ? '#c9e8d4' : '#1a5c38' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div 
              className="p-5 text-left text-xs leading-relaxed space-y-4"
              style={{ color: isDark ? '#9ab5a0' : '#666666' }}
            >
              <p>
                {t('intro.about_desc')}
              </p>
              <div className="space-y-2">
                <h4 className="font-bold uppercase text-[10px] tracking-wider" style={{ color: isDark ? '#c9e8d4' : '#1a5c38' }}>{t('intro.key_functional_areas')}</h4>
                <ul className="list-disc list-inside pl-1 space-y-2">
                  <li>{t('intro.area_ocr')}</li>
                  <li>{t('intro.area_milestones')}</li>
                  <li>{t('intro.area_rbac')}</li>
                  <li>{t('intro.area_audit')}</li>
                </ul>
              </div>
              <p className="text-[10px] border-t pt-3 flex justify-between" style={{ borderColor: isDark ? 'rgba(46, 125, 82, 0.2)' : 'rgba(0,0,0,0.1)', color: isDark ? '#5a7a62' : '#888888' }}>
                <span>{t('intro.developer')}</span>
                <span>{t('intro.security_protocol')}</span>
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-5 py-3 border-t bg-[#f7faf8]" style={{ borderColor: isDark ? 'rgba(46, 125, 82, 0.2)' : 'rgba(26, 92, 56, 0.1)' }}>
              <button
                onClick={() => setShowInfo(false)}
                className="rounded-lg py-2 px-4 text-xs font-semibold text-white shadow-sm cursor-pointer hover:bg-primary-dark transition duration-150"
                style={{ backgroundColor: '#1a5c38' }}
              >
                {t('intro.close_spec')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default IntroPage;
