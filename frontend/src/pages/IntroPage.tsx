import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, LogIn, Info, ShieldCheck, Lock, Award, X } from 'lucide-react';

const IntroPage: React.FC = () => {
  const navigate = useNavigate();
  const [showInfo, setShowInfo] = useState(false);

  // Set flag indicating that the user has visited the intro page
  useEffect(() => {
    (window as any).__hasVisitedIntro = true;
  }, []);

  // Counter States
  const [docCount, setDocCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [deptCount, setDeptCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  // Counter Animation Hook
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 2000;
    const delay = 1200;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;

      if (elapsed < delay) {
        animationFrameId = requestAnimationFrame(step);
        return;
      }

      const animationProgress = Math.min((elapsed - delay) / duration, 1);
      // easeOutCubic: 1 - Math.pow(1 - p, 3)
      const easeProgress = 1 - Math.pow(1 - animationProgress, 3);

      setDocCount(Math.floor(easeProgress * 1240));
      setProjectCount(Math.floor(easeProgress * 86));
      setDeptCount(Math.floor(easeProgress * 6));
      setUserCount(Math.floor(easeProgress * 48));

      if (animationProgress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center bg-white overflow-hidden select-none">
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
          animation: pulse 2s infinite ease-in-out;
        }
      `}} />

      {/* 1. TOP COLOR BAR */}
      <div
        className="fixed top-0 left-0 right-0 h-[6px] z-50"
        style={{
          background: 'linear-gradient(to right, #1a5c38, #2e7d52, #c9a84c, #2e7d52, #1a5c38)'
        }}
      />

      {/* 2. SIDE ACCENTS */}
      <div
        className="fixed top-0 bottom-0 left-0 w-[4px] z-50"
        style={{ backgroundColor: '#1a5c38' }}
      />
      <div
        className="fixed top-0 bottom-0 right-0 w-[4px] z-50"
        style={{ backgroundColor: '#1a5c38' }}
      />

      {/* 3. CORNER ORNAMENTS */}
      <div
        className="absolute top-[14px] left-[14px] w-[28px] h-[28px] border-t-2 border-l-2 opacity-50 pointer-events-none"
        style={{ borderColor: '#c9a84c' }}
      />
      <div
        className="absolute top-[14px] right-[14px] w-[28px] h-[28px] border-t-2 border-r-2 opacity-50 pointer-events-none"
        style={{ borderColor: '#c9a84c' }}
      />
      <div
        className="absolute bottom-[14px] left-[14px] w-[28px] h-[28px] border-b-2 border-l-2 opacity-50 pointer-events-none"
        style={{ borderColor: '#c9a84c' }}
      />
      <div
        className="absolute bottom-[14px] right-[14px] w-[28px] h-[28px] border-b-2 border-r-2 opacity-50 pointer-events-none"
        style={{ borderColor: '#c9a84c' }}
      />

      {/* 4. BACKGROUND GRID PATTERN */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundSize: '36px 36px',
          backgroundImage: `
            linear-gradient(to right, rgba(26, 92, 86, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(26, 92, 86, 0.04) 1px, transparent 1px)
          `
        }}
      />

      {/* Center Layout Panel */}
      <div className="flex flex-col items-center justify-center text-center px-4 md:px-0 max-w-[680px] w-full mx-auto space-y-6 md:space-y-7 z-10">

        {/* 5. EMBLEM / ICON SECTION */}
        <div
          className="relative w-[92px] h-[92px] rounded-full border-[1.5px] flex items-center justify-center shadow-sm"
          style={{
            borderColor: '#c9a84c',
            backgroundColor: '#f9f5ec',
            animation: 'fadeDown 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '0s'
          }}
        >
          {/* 4 golden dots */}
          <div className="absolute -top-[3.5px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#c9a84c' }} />
          <div className="absolute -bottom-[3.5px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#c9a84c' }} />
          <div className="absolute -left-[3.5px] top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#c9a84c' }} />
          <div className="absolute -right-[3.5px] top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#c9a84c' }} />

          {/* Inner circle */}
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center shadow"
            style={{ backgroundColor: '#1a5c38' }}
          >
            <Zap
              size={32}
              style={{ color: '#c9a84c' }}
              className="animate-boltFlash"
            />
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-2.5">
          {/* 6. GOVERNMENT LABEL */}
          <div
            className="text-[10px] font-semibold tracking-[2.5px] uppercase"
            style={{
              color: '#888888',
              animation: 'fadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
              animationDelay: '200ms'
            }}
          >
            Government of Jharkhand &middot; Energy Department
          </div>

          {/* 7. OFFICE NAME (English) */}
          <h1
            className="text-2xl md:text-3xl font-medium tracking-tight"
            style={{
              color: '#1a5c38',
              animation: 'fadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
              animationDelay: '350ms'
            }}
          >
            Jharkhand Bijli Vitran Nigam Limited
          </h1>

          {/* 8. OFFICE NAME (Hindi) */}
          <div
            className="text-[13px] font-medium"
            style={{
              color: '#2e7d52',
              animation: 'fadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
              animationDelay: '450ms'
            }}
          >
            झारखंड बिजली कार्यालय
          </div>

          {/* 9. SYSTEM NAME */}
          <div
            className="text-[10px] md:text-[11px] font-bold tracking-[1.2px] uppercase px-4"
            style={{
              color: '#c9a84c',
              animation: 'fadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
              animationDelay: '550ms'
            }}
          >
            AI-Powered Project Management & Document Intelligence System
          </div>
        </div>

        {/* 10. GOLDEN DIVIDER */}
        <div
          className="flex items-center justify-center gap-[10px]"
          style={{
            animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '700ms'
          }}
        >
          <div
            className="h-[1px] animate-lineGrow"
            style={{ backgroundColor: '#c9a84c', opacity: 0.5 }}
          />
          <div
            className="w-[7px] h-[7px] rotate-45 shrink-0"
            style={{ backgroundColor: '#c9a84c' }}
          />
          <div
            className="h-[1px] animate-lineGrow"
            style={{ backgroundColor: '#c9a84c', opacity: 0.5 }}
          />
        </div>

        {/* 11. TAGLINE */}
        <p
          className="text-[12px] leading-[1.7] max-w-[400px] px-2"
          style={{
            color: '#666666',
            animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '800ms'
          }}
        >
          A centralized digital platform for document management, OCR-based data extraction, project tracking, and transparent reporting for the Jharkhand Energy Department.
        </p>

        {/* 12. STATS ROW */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 w-full max-w-[480px] pt-2"
          style={{
            animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '950ms'
          }}
        >
          {/* Stat 1 */}
          <div
            className="rounded-lg py-2.5 px-4 min-w-[80px]"
            style={{
              backgroundColor: '#f7faf8',
              border: '0.5px solid rgba(26, 92, 56, 0.2)',
              borderTop: '2.5px solid #c9a84c'
            }}
          >
            <div className="text-xl md:text-[22px] font-medium" style={{ color: '#1a5c38' }}>
              {docCount}+
            </div>
            <div className="text-[9px] uppercase tracking-[0.8px] font-semibold mt-0.5" style={{ color: '#888888' }}>
              Documents
            </div>
          </div>

          {/* Stat 2 */}
          <div
            className="rounded-lg py-2.5 px-4 min-w-[80px]"
            style={{
              backgroundColor: '#f7faf8',
              border: '0.5px solid rgba(26, 92, 56, 0.2)',
              borderTop: '2.5px solid #c9a84c'
            }}
          >
            <div className="text-xl md:text-[22px] font-medium" style={{ color: '#1a5c38' }}>
              {projectCount}
            </div>
            <div className="text-[9px] uppercase tracking-[0.8px] font-semibold mt-0.5" style={{ color: '#888888' }}>
              Projects
            </div>
          </div>

          {/* Stat 3 */}
          <div
            className="rounded-lg py-2.5 px-4 min-w-[80px]"
            style={{
              backgroundColor: '#f7faf8',
              border: '0.5px solid rgba(26, 92, 56, 0.2)',
              borderTop: '2.5px solid #c9a84c'
            }}
          >
            <div className="text-xl md:text-[22px] font-medium" style={{ color: '#1a5c38' }}>
              {deptCount}
            </div>
            <div className="text-[9px] uppercase tracking-[0.8px] font-semibold mt-0.5" style={{ color: '#888888' }}>
              Departments
            </div>
          </div>

          {/* Stat 4 */}
          <div
            className="rounded-lg py-2.5 px-4 min-w-[80px]"
            style={{
              backgroundColor: '#f7faf8',
              border: '0.5px solid rgba(26, 92, 56, 0.2)',
              borderTop: '2.5px solid #c9a84c'
            }}
          >
            <div className="text-xl md:text-[22px] font-medium" style={{ color: '#1a5c38' }}>
              {userCount}
            </div>
            <div className="text-[9px] uppercase tracking-[0.8px] font-semibold mt-0.5" style={{ color: '#888888' }}>
              Users
            </div>
          </div>
        </div>

        {/* 13. BUTTON ROW */}
        <div
          className="flex flex-row items-center gap-3.5 pt-2"
          style={{
            animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '1100ms'
          }}
        >
          {/* Button 1: Primary Login */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 rounded-lg py-2.5 px-6 font-medium text-[13px] shadow transition duration-200 cursor-pointer"
            style={{
              backgroundColor: '#1a5c38',
              color: '#ffffff',
              borderBottom: '2.5px solid #c9a84c'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#145030';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#1a5c38';
            }}
          >
            <LogIn size={14} className="shrink-0" />
            <span>Login to Portal</span>
          </button>

          {/* Button 2: Secondary About */}
          <button
            onClick={() => setShowInfo(true)}
            className="flex items-center gap-1.5 rounded-lg py-2.5 px-5 font-medium text-[13px] border shadow-sm transition duration-200 cursor-pointer"
            style={{
              backgroundColor: '#ffffff',
              color: '#1a5c38',
              borderColor: 'rgba(26, 92, 56, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f7f3';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            <Info size={14} className="shrink-0" />
            <span>About System</span>
          </button>
        </div>

        {/* 14. BADGE ROW */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 pt-2"
          style={{
            animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '1200ms'
          }}
        >
          {/* Badge 1 */}
          <div
            className="flex items-center gap-1.5 rounded-full py-[3px] px-2.5 text-[9px] font-semibold border"
            style={{
              color: '#2e7d52',
              backgroundColor: '#eaf4ee',
              borderColor: 'rgba(46, 125, 82, 0.3)'
            }}
          >
            <ShieldCheck size={11} className="shrink-0" />
            <span>Secure Access</span>
          </div>

          {/* Badge 2 */}
          <div
            className="flex items-center gap-1.5 rounded-full py-[3px] px-2.5 text-[9px] font-semibold border"
            style={{
              color: '#2e7d52',
              backgroundColor: '#eaf4ee',
              borderColor: 'rgba(46, 125, 82, 0.3)'
            }}
          >
            <Lock size={11} className="shrink-0" />
            <span>Role Based</span>
          </div>

          {/* Badge 3 */}
          <div
            className="flex items-center gap-1.5 rounded-full py-[3px] px-2.5 text-[9px] font-semibold border"
            style={{
              color: '#2e7d52',
              backgroundColor: '#eaf4ee',
              borderColor: 'rgba(46, 125, 82, 0.3)'
            }}
          >
            <Award size={11} className="shrink-0" />
            <span>Government Verified</span>
          </div>
        </div>

      </div>

      {/* 15. BOTTOM FOOTER STRIP */}
      <div
        className="absolute bottom-[12px] flex items-center justify-center gap-1.5 text-[9px] tracking-[0.5px] pointer-events-none"
        style={{
          color: '#aaaaaa',
          animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
          animationDelay: '1300ms'
        }}
      >
        <span
          className="w-[6px] h-[6px] rounded-full animate-pulseSlow shrink-0"
          style={{ backgroundColor: '#2e7d52' }}
        />
        <span>System Online</span>
        <span style={{ color: '#c9a84c' }}>&middot;</span>
        <span>Version 1.0.0</span>
        <span style={{ color: '#c9a84c' }}>&middot;</span>
        <span>&copy; 2025 Jharkhand Energy Department</span>
      </div>

      {/* 16. BOTTOM COLOR BAR */}
      <div
        className="fixed bottom-0 left-0 right-0 h-[3px] z-50"
        style={{ backgroundColor: '#1a5c38' }}
      />

      {/* Interactive Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fadeUp">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border" style={{ borderColor: 'rgba(26, 92, 56, 0.2)' }}>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b text-[#1a5c38]" style={{ borderColor: 'rgba(26, 92, 56, 0.1)', backgroundColor: '#f7faf8' }}>
              <div className="flex items-center gap-2">
                <Info size={18} style={{ color: '#c9a84c' }} />
                <span className="font-bold text-sm uppercase tracking-wider">About Jharkhand JBO System</span>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 rounded-full text-[#1a5c38] hover:bg-slate-100 transition duration-150 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 text-left text-xs leading-relaxed text-[#666666] space-y-3.5">
              <p>
                The <strong>Jharkhand Bijli Vitran Nigam Limited (JBO)</strong> Document Intelligence & Project Management System is a state-of-the-art enterprise solution designed to streamline digital administration.
              </p>
              <div className="space-y-2">
                <h4 className="font-bold text-[#1a5c38] uppercase text-[10px] tracking-wider">Key Functional Areas</h4>
                <ul className="list-disc list-inside pl-1 space-y-1">
                  <li><strong>AI OCR Extraction</strong>: Automated text parsing of work orders and invoice credentials.</li>
                  <li><strong>Project Milestones</strong>: Dynamic tracking of grid expansion works and physical progress.</li>
                  <li><strong>Secure RBAC</strong>: Strict role-based control ensuring secure document verification.</li>
                  <li><strong>Audit Trail logs</strong>: Detailed compliance monitoring and logging for full transparency.</li>
                </ul>
              </div>
              <p className="text-[10px] text-[#888888] border-t pt-3 flex justify-between">
                <span>Developer: Energy Dept IT Wing</span>
                <span>Security Protocol: AES-256</span>
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-5 py-3 border-t bg-[#f7faf8]" style={{ borderColor: 'rgba(26, 92, 56, 0.1)' }}>
              <button
                onClick={() => setShowInfo(false)}
                className="rounded-lg py-1.5 px-4 text-xs font-semibold text-white shadow-sm cursor-pointer"
                style={{ backgroundColor: '#1a5c38' }}
              >
                Close Spec
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default IntroPage;
