import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header Bar */}
      <Topbar onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      
      <div className="flex pt-16">
        {/* Navigation Sidebar */}
        <Sidebar isOpen={isSidebarOpen} />

        {/* Main Content Area */}
        <main 
          className={`flex-1 p-6 transition-all duration-300 ${
            isSidebarOpen ? 'pl-70' : 'pl-26'
          }`}
          style={{ paddingLeft: isSidebarOpen ? '17rem' : '6rem' }}
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
