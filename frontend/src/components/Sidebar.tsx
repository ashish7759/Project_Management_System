import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Upload, 
  FileText, 
  FolderGit, 
  TrendingUp, 
  FilePieChart, 
  History,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user } = useAuth();
  
  if (!user) return null;

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Manager', 'Operator', 'Viewer']
    },
    {
      name: 'User Management',
      path: '/admin/users',
      icon: Users,
      roles: ['Admin']
    },
    {
      name: 'Upload Document',
      path: '/documents/upload',
      icon: Upload,
      roles: ['Admin', 'Manager', 'Operator']
    },
    {
      name: 'Document List',
      path: '/documents',
      icon: FileText,
      roles: ['Admin', 'Manager', 'Operator', 'Viewer']
    },
    {
      name: 'Projects',
      path: '/projects',
      icon: FolderGit,
      roles: ['Admin', 'Manager', 'Operator', 'Viewer']
    },
    {
      name: 'Progress Tracker',
      path: '/progress',
      icon: TrendingUp,
      roles: ['Admin', 'Manager', 'Operator']
    },
    {
      name: 'Reports Hub',
      path: '/reports',
      icon: FilePieChart,
      roles: ['Admin', 'Manager', 'Viewer']
    },
    {
      name: 'Audit Trail',
      path: '/admin/audit-log',
      icon: ShieldCheck,
      roles: ['Admin']
    }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside 
      className={`fixed top-0 bottom-0 left-0 z-20 flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500 font-bold text-white shadow-md">
            JBO
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wider text-slate-100 leading-tight">JHARKHAND BIJLI</span>
              <span className="text-[10px] text-slate-400 font-medium">Electricity Department</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 py-4 px-3 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center rounded-lg py-2.5 px-3.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {isOpen && <span className="ml-3 transition-opacity duration-300">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Info */}
      {isOpen && (
        <div className="border-t border-slate-800 p-4 text-[10px] text-slate-500 text-center">
          <p>© 2026 Jharkhand Bijli Office</p>
          <p className="mt-0.5 font-mono text-[9px]">v1.0.0 (Secure RBAC)</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
