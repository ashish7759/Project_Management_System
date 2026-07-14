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

  useEffect(() => {
    // Determine the API URL and WebSocket server endpoint
    const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsHost = 'localhost:8000';
    if (apiURL.startsWith('http://') || apiURL.startsWith('https://')) {
      try {
        const url = new URL(apiURL);
        wsHost = url.host;
      } catch (e) {
        console.error("Invalid VITE_API_URL configured:", apiURL);
      }
    } else {
      wsHost = window.location.host;
    }
    const wsURL = `${wsProtocol}//${wsHost}/api/v1/ws`;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let reconnectDelay = 1000;

    const connectWS = () => {
      console.log(`[WS] Connecting to ${wsURL}...`);
      socket = new WebSocket(wsURL);

      socket.onopen = () => {
        console.log('[WS] Connected successfully.');
        reconnectDelay = 1000; // Reset delay
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'database_update') {
            console.log('[WS] Database update event received:', data);
            window.dispatchEvent(new CustomEvent('database-update', { detail: data }));
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      socket.onclose = (e) => {
        console.log(`[WS] Closed: ${e.reason || 'No reason specified'}. Reconnecting in ${reconnectDelay}ms...`);
        reconnectTimeout = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, 30000); // cap at 30s
          connectWS();
        }, reconnectDelay);
      };

      socket.onerror = (err) => {
        console.error('[WS] WebSocket error:', err);
        socket?.close();
      };
    };

    connectWS();

    return () => {
      if (socket) {
        socket.onclose = null; // Prevent reconnect loop on unmount
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
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
            isSidebarOpen ? 'md:pl-[264px]' : 'md:pl-[88px]'
          }`}
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
