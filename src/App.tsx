import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { DwhyGenerator } from './pages/DwhyGenerator';
import { NineGridAnalyzer } from './pages/NineGridAnalyzer';
import { CTGMindset } from './pages/CTGMindset';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import AdminUsersPage from './pages/AdminUsers';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        {/* Navigation */}
        <Navigation 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* Mobile header */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">内容创作工具</h1>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<NineGridAnalyzer />} />
              <Route path="/nine-grid" element={<DwhyGenerator />} />
              <Route path="/ctg-mindset" element={<ProtectedRoute><CTGMindset /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/analytics" element={<ComingSoon title="数据分析" />} />
              <Route path="/optimizer" element={<ComingSoon title="内容优化器" />} />
              <Route path="/assistant" element={<ComingSoon title="AI 助手" />} />
              <Route path="/settings" element={<ComingSoon title="设置" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl text-gray-300 mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">此功能正在开发中，敬请期待</p>
        <div className="text-sm text-gray-500">
          更多功能即将上线，感谢您的耐心等待
        </div>
      </div>
    </div>
  );
}

export default App; 
