import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';

interface TopbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Set color code based on user's authorization role
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Operator':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm transition-all duration-300">
      {/* Menu Toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="hidden text-lg font-bold text-slate-800 sm:block tracking-wide">
          Jharkhand Bijli Office
        </span>
        <span className="text-xs font-semibold uppercase text-slate-400 sm:block hidden">
          | Project & Document Intelligence
        </span>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        {/* User Card */}
        <div className="flex items-center space-x-2 border-r border-slate-200 pr-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-800 leading-tight">{user.full_name}</span>
            <span className="text-[10px] text-slate-400 font-medium">Emp ID: {user.employee_id || 'N/A'}</span>
          </div>
          
          {/* Role badge */}
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${getRoleBadgeClass(user.role)}`}>
            {user.role}
          </span>
        </div>

        {/* Logout Action */}
        <button
          onClick={logout}
          className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-150"
          title="Sign Out"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span className="ml-1.5 hidden text-xs font-semibold lg:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
