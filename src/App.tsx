import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import RecordSession from './components/RecordSession';
import Analysis from './components/Analysis';
import History from './components/History';
import Report from './components/Report';
import Modal from './components/Modal';
import { LoginPage } from './components/pages/LoginPage';
import { SignupPage } from './components/pages/SignupPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import type { ViewName } from './types';
import DashboardBackground from './components/DashboardBackground';

function AppContent() {
    const [view, setView] = useState<ViewName>('dashboard');
    const { sessions } = useApp();

    const views: Record<ViewName, React.ReactNode> = {
        dashboard: <Dashboard onNavigate={setView} />,
        record: <RecordSession />,
        analysis: <Analysis onNavigate={setView} />,
        history: <History onNavigate={setView} />,
        report: <Report onNavigate={setView} />,
    };

    return (
        <div className="app">
            <DashboardBackground />
            <Navbar current={view} onNavigate={setView} sessionCount={sessions.length} />
            {views[view]}
            <Modal />
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route
                            path="/dashboard/*"
                            element={
                                <ProtectedRoute>
                                    <AppContent />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </BrowserRouter>
            </AppProvider>
        </AuthProvider>
    );
}
