
import React, { useEffect, useState } from 'react';
import { getAdminAnalytics, toggleBanUser, deleteUserAccount, deductCredits, broadcastNotification } from '../services/supabase';
import { AdminSidebar } from './Admin/AdminSidebar';
import { AdminOverview } from './Admin/AdminOverview';
import { AdminUserTable } from './Admin/AdminUserTable';
import { BlogCMS } from './Admin/BlogCMS';
import { AdminBroadcast } from './Admin/AdminBroadcast';

interface AdminDashboardProps {
    onExit?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
    const [activeTab, setActiveTab] = useState('OVERVIEW');
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const refreshMetrics = async () => {
        setLoading(true);
        try {
            const data = await getAdminAnalytics();
            setMetrics(data);
        } catch (e) {
            console.error('Failed to fetch admin metrics', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshMetrics();
        // Poll every 30s
        const interval = setInterval(refreshMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    // Placeholder components for now
    const SystemLogs = () => (
        <div className="p-8 text-center text-gray-500 font-mono">
            LOGS SYSTEM OFFLINE. CONNECTING TO EDGE NETWORK...
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex text-white font-sans">
            {/* Background Mesh */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/20 blur-[100px] rounded-full mix-blend-screen"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/20 blur-[100px] rounded-full mix-blend-screen"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            </div>

            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onExit={onExit || (() => { })}
            />

            <div className="flex-1 overflow-y-auto relative z-10 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold font-serif tracking-tight text-white mb-1">
                            {activeTab === 'OVERVIEW' && 'Mission Control'}
                            {activeTab === 'USERS' && 'Student Database'}
                            {activeTab === 'CONTENT' && 'The Press Room'}
                            {activeTab === 'BROADCAST' && 'Broadcast Center'}
                            {activeTab === 'LOGS' && 'System Diagnostics'}
                        </h1>
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • LIVE
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={refreshMetrics} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white" title="Refresh Data">
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </header>

                <div className="animate-fade-in-up">
                    {activeTab === 'OVERVIEW' && <AdminOverview metrics={metrics} loading={loading} />}
                    {activeTab === 'USERS' && <AdminUserTable users={metrics?.profiles || []} onUpdate={refreshMetrics} />}
                    {activeTab === 'CONTENT' && <BlogCMS />}
                    {activeTab === 'BROADCAST' && <AdminBroadcast onBroadcast={broadcastNotification} />}
                    {activeTab === 'LOGS' && <SystemLogs />}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
