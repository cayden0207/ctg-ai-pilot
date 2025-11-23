import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Target,
  Grid3x3,
  Brain,
  Megaphone,
  Users,
  Settings,
  LogOut,
  X,
  Zap,
  Menu
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useMembership } from '../hooks/useMembership';

interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isComingSoon?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'nine-grid-formula',
    name: '9宫格题材分析',
    href: '/',
    icon: Grid3x3,
  },
  {
    id: 'dwhy-generator',
    name: '9宫格生成选题',
    href: '/nine-grid',
    icon: Target,
  },
  {
    id: 'ctg-mindset',
    name: 'CTG Mindset AI',
    href: '/ctg-mindset',
    icon: Brain,
  },
  {
    id: 'meta-ads-sim',
    name: 'Meta Ads 模拟器',
    href: '/meta-ads-simulation',
    icon: Megaphone,
  },
];

interface NavigationProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export function Navigation({ isSidebarOpen, setIsSidebarOpen }: NavigationProps) {
  const location = useLocation();
  const { email, status, isAdmin, logout } = useMembership();

  return (
    <>
      {/* Mobile menu button - Visible only on mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg bg-gray-900 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <span className="sr-only">切换导航</span>
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 bg-gray-900 text-white transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static shadow-xl flex flex-col border-r border-gray-800",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600 rounded-lg shadow-glow">
              <Zap className="h-5 w-5 text-white" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-sans tracking-tight text-white">CTG AI-PILOT</h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Enterprise Edition</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-4 mt-2">
            核心功能
          </div>
          
          {navigationItems.concat(isAdmin ? [{
              id: 'admin-users',
              name: '会员管理',
              href: '/admin/users',
              icon: Users,
            }] : []).map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                to={item.isComingSoon ? '#' : item.href}
                onClick={(e) => {
                  if (item.isComingSoon) e.preventDefault();
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative",
                  isActive
                    ? "bg-primary-600/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white",
                  item.isComingSoon && "opacity-50 cursor-not-allowed"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-500 rounded-r-full" />
                )}
                <Icon className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  isActive ? "text-primary-400" : "text-gray-500 group-hover:text-gray-300"
                )} />
                {item.name}
                {item.isComingSoon && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-gray-800 text-gray-400 rounded border border-gray-700">
                    SOON
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-gray-800">
                {email ? email.charAt(0).toUpperCase() : 'U'}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {email || '未登录'}
                </p>
                <div className="flex items-center mt-0.5">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full mr-1.5",
                    status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" :
                    status === 'expired' ? "bg-amber-500" : "bg-gray-500"
                  )} />
                  <p className="text-xs text-gray-500 capitalize truncate">
                    {status === 'active' ? '专业版' : '免费版'}
                  </p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
             <Link 
               to="/settings" 
               className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-400 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
             >
               <Settings className="w-3.5 h-3.5 mr-1.5" />
               设置
             </Link>
             {email && (
               <button 
                 onClick={logout}
                 className="flex items-center justify-center px-3 py-2 text-xs font-medium text-rose-400 bg-gray-800/50 hover:bg-rose-900/20 rounded-lg transition-colors"
               >
                 <LogOut className="w-3.5 h-3.5 mr-1.5" />
                 退出
               </button>
             )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
}
