import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import RecordSession from './components/RecordSession';
import Analysis from './components/Analysis';
import History from './components/History';
import Report from './components/Report';
import Modal from './components/Modal';
import type { ViewName } from './types';

function AppInner() {
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
            <Navbar current={view} onNavigate={setView} sessionCount={sessions.length} />
            {views[view]}
            <Modal />
        </div>
    );
}

export default function App() {
    return (
        <AppProvider>
            <AppInner />
        </AppProvider>
    );
}
