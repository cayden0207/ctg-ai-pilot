
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Target, 
  BarChart3, 
  FileText, 
  Settings, 
  Sparkles,
  Menu,
  X,
  Zap,
  Grid3x3
} from 'lucide-react';
import { cn } from '../utils/cn';

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
    name: '九宫格爆款生成器',
    href: '/',
    icon: Grid3x3,
  },
  {
    id: 'dwhy-generator',
    name: '9宫格生成选题',
    href: '/nine-grid',
    icon: Target,
  },
  
];

interface NavigationProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export function Navigation({ isSidebarOpen, setIsSidebarOpen }: NavigationProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
        >
          <span className="sr-only">打开导航菜单</span>
          {isSidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-primary-600 to-secondary-600">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">内容创作工具</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.id}
                  to={item.isComingSoon ? '#' : item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative",
                    isActive
                      ? "bg-primary-50 text-primary-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    item.isComingSoon && "cursor-not-allowed opacity-50"
                  )}
                  onClick={(e) => {
                    if (item.isComingSoon) {
                      e.preventDefault();
                    }
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                >
                  <Icon className={cn(
                    "h-5 w-5 mr-3 transition-colors",
                    isActive ? "text-primary-600" : "text-gray-400 group-hover:text-gray-500"
                  )} />
                  <span>{item.name}</span>
                  {item.isComingSoon && (
                    <span className="ml-auto px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                      即将推出
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Link
              to="/settings"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Settings className="h-5 w-5 mr-3 text-gray-400" />
              <span>设置</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
} 