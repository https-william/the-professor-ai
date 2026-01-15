
import React, { useEffect, useState } from 'react';
import { getAllData, toggleBanUser, deleteUserAccount } from '../services/supabase';

interface AdminDashboardProps {
    onExit?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'LOGS' | 'SHARES'>('USERS');
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, totalQuizzes: 0, activeNow: 0 });

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = async () => {
      setLoading(true);
      if (activeTab === 'USERS') {
          const data = await getAllData('profiles');
          setUsers(data || []);
          setStats(prev => ({ ...prev, totalUsers: data?.length || 0 }));
      } else if (activeTab === 'LOGS') {
          const data = await getAllData('system_logs');
          setLogs(data || []);
      } else if (activeTab === 'SHARES') {
          const data = await getAllData('public_shares');
          setShares(data || []);
      }
      setLoading(false);
  };

  const handleAction = async (action: string, id: string) => {
      if (!confirm(`Confirm Action: ${action}?`)) return;
      if (action === 'BAN') await toggleBanUser(id, false);
      if (action === 'UNBAN') await toggleBanUser(id, true);
      if (action === 'DELETE') await deleteUserAccount(id);
      refreshData();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono p-6">
        {/* Master Header */}
        <div className="flex justify-between items-end mb-8 border-b border-red-900/50 pb-4">
            <div>
                <h1 className="text-4xl font-bold text-red-600 tracking-tight">ADMINISTRATION</h1>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">System Status: <span className="text-green-500">OPERATIONAL</span></p>
            </div>
            <div className="flex gap-4">
                <button onClick={onExit} className="px-6 py-2 border border-white/20 text-gray-400 hover:text-white uppercase text-xs font-bold transition-colors">Log Out</button>
                <button onClick={refreshData} className="px-6 py-2 bg-red-600 text-black uppercase text-xs font-bold hover:bg-red-500 transition-colors shadow-[0_0_15px_red]">Refresh Data</button>
            </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-[#0f0f10] border border-white/10 p-4 rounded-xl">
                <p className="text-[10px] text-gray-500 uppercase">Total Students</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <div className="bg-[#0f0f10] border border-white/10 p-4 rounded-xl">
                <p className="text-[10px] text-gray-500 uppercase">System Load</p>
                <p className="text-2xl font-bold text-blue-500">24%</p>
            </div>
            <div className="bg-[#0f0f10] border border-white/10 p-4 rounded-xl">
                <p className="text-[10px] text-gray-500 uppercase">System Health</p>
                <p className="text-2xl font-bold text-green-500">GOOD</p>
            </div>
            <div className="bg-[#0f0f10] border border-white/10 p-4 rounded-xl">
                <p className="text-[10px] text-gray-500 uppercase">Revenue</p>
                <p className="text-2xl font-bold text-amber-500">$0.00</p>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
            {['USERS', 'LOGS', 'SHARES'].map(tab => (
                <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                >
                    {tab}
                </button>
            ))}
        </div>

        {/* Data Grid */}
        <div className="bg-[#0a0a0c] border border-white/10 rounded-xl overflow-hidden min-h-[500px]">
            {loading ? (
                <div className="p-10 text-center text-gray-500 animate-pulse">Loading Records...</div>
            ) : (
                <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-gray-400 uppercase tracking-wider">
                        <tr>
                            {activeTab === 'USERS' && (
                                <>
                                    <th className="p-4">ID / Alias</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Plan</th>
                                    <th className="p-4">XP</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Control</th>
                                </>
                            )}
                            {activeTab === 'LOGS' && (
                                <>
                                    <th className="p-4">Timestamp</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Admin</th>
                                    <th className="p-4">Details</th>
                                </>
                            )}
                            {activeTab === 'SHARES' && (
                                <>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Title</th>
                                    <th className="p-4">Created</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {activeTab === 'USERS' && users.map(u => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-bold text-white">{u.alias || 'Unknown'}</td>
                                <td className="p-4 text-gray-400">{u.email}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded bg-white/10 ${u.plan === 'Excellentia' ? 'text-amber-500' : 'text-gray-400'}`}>{u.plan}</span></td>
                                <td className="p-4 font-mono text-blue-400">{u.xp}</td>
                                <td className="p-4">{u.is_banned ? <span className="text-red-500 font-bold">SUSPENDED</span> : <span className="text-green-500">ACTIVE</span>}</td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button onClick={() => handleAction(u.is_banned ? 'UNBAN' : 'BAN', u.id)} className="text-amber-500 hover:text-white">{u.is_banned ? 'Restore' : 'Suspend'}</button>
                                    <button onClick={() => handleAction('DELETE', u.id)} className="text-red-500 hover:text-white">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {activeTab === 'LOGS' && logs.map(l => (
                            <tr key={l.id} className="hover:bg-white/5">
                                <td className="p-4 text-gray-500">{new Date(l.created_at).toLocaleString()}</td>
                                <td className="p-4 font-bold text-blue-400">{l.action}</td>
                                <td className="p-4 text-gray-400">{l.admin_email}</td>
                                <td className="p-4 text-gray-300">{l.details}</td>
                            </tr>
                        ))}
                        {activeTab === 'SHARES' && shares.map(s => (
                            <tr key={s.id} className="hover:bg-white/5">
                                <td className="p-4 font-mono text-gray-500">{s.id.substring(0, 8)}...</td>
                                <td className="p-4 font-bold text-purple-400">{s.type}</td>
                                <td className="p-4 text-white">{s.title || 'Untitled'}</td>
                                <td className="p-4 text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    </div>
  );
};

export default AdminDashboard;
