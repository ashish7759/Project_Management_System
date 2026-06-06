import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });

  useEffect(() => {
    let prevIsMobile = window.innerWidth < 768;
    
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile !== prevIsMobile) {
        setIsSidebarOpen(!isMobile);
        prevIsMobile = isMobile;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7faf8' }}>
      {/* Top Header Bar */}
      <Topbar onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      
      <div className="flex pt-14">
        {/* Navigation Sidebar */}
        <Sidebar isOpen={isSidebarOpen} />

        {/* Mobile Backdrop overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-15 bg-black/40 md:hidden transition-opacity duration-300"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content Area */}
        <main 
          className={`flex-grow p-6 transition-all duration-300 min-h-[calc(100vh-56px)] ${
            isSidebarOpen ? 'md:pl-[240px]' : 'md:pl-16'
          } pl-0`}
        >
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
