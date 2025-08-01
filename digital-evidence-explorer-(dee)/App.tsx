
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CaseProvider } from './context/CaseContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CaseViewPage from './pages/CaseViewPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-screen bg-btp-gray-100">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-btp-gray-100 p-4 md:p-8">
        {children}
      </main>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CaseProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/case/:caseId" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CaseViewPage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </HashRouter>
      </CaseProvider>
    </AuthProvider>
  );
};

export default App;
