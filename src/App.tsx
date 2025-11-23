import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { DwhyGenerator } from './pages/DwhyGenerator';
import { NineGridAnalyzer } from './pages/NineGridAnalyzer';
import { CTGMindset } from './pages/CTGMindset';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import AdminUsersPage from './pages/AdminUsers';
import { MetaAdsSimulation } from './pages/MetaAdsSimulation';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-gray-900 antialiased">
        {/* Navigation Sidebar */}
        <Navigation 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Decorative top gradient line */}
          <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500" />

          {/* Main Scrollable Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 scroll-smooth">
             {/* Page Container */}
             <div className="max-w-7xl mx-auto w-full">
              <Routes>
                <Route path="/" element={<ProtectedRoute><NineGridAnalyzer /></ProtectedRoute>} />
                <Route path="/nine-grid" element={<ProtectedRoute><DwhyGenerator /></ProtectedRoute>} />
                <Route path="/ctg-mindset" element={<ProtectedRoute><CTGMindset /></ProtectedRoute>} />
                <Route path="/meta-ads-simulation/*" element={<ProtectedRoute><MetaAdsSimulation /></ProtectedRoute>} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/analytics" element={<ProtectedRoute><ComingSoon title="数据分析" /></ProtectedRoute>} />
                <Route path="/optimizer" element={<ProtectedRoute><ComingSoon title="内容优化器" /></ProtectedRoute>} />
                <Route path="/assistant" element={<ProtectedRoute><ComingSoon title="AI 助手" /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><ComingSoon title="设置" /></ProtectedRoute>} />
              </Routes>
             </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        <span className="text-3xl">🚧</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-sm mx-auto mb-8">
        此功能正在紧锣密鼓地开发中，我们将为您带来更强大的 AI 体验。
      </p>
      <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
        了解开发计划
      </button>
    </div>
  );
}

export default App;
