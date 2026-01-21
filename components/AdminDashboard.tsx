
import React, { useEffect, useState } from 'react';
import { getAdminAnalytics, toggleBanUser, deleteUserAccount, deductCredits } from '../services/supabase';

interface AdminDashboardProps {
    onExit?: () => void;
}

// Simple Icon Components for Admin Dashboard
const Icons = {
    Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" /></svg>,
    Users: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
    Finance: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Logs: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>,
    Exit: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'FINANCE' | 'LOGS'>('OVERVIEW');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Manual Refresh Function
  const refresh = async () => {
      setLoading(true);
      const data = await getAdminAnalytics();
      setAnalytics(data);
      setLoading(false);
  };

  useEffect(() => {
      refresh();
  }, []);

  const handleUserAction = async (action: string, id: string) => {
      if (!confirm(`Execute ${action} on user? This action is logged.`)) return;
      
      if (action === 'BAN_TOGGLE') {
          const user = analytics.profiles.find((p: any) => p.id === id);
          await toggleBanUser(id, user.is_banned);
      }
      if (action === 'DELETE') await deleteUserAccount(id);
      if (action === 'GIFT_CREDITS') await deductCredits(id, -500, 'Admin Grant'); // Negative deduction = grant
      
      refresh();
  };

  // --- SUB-COMPONENTS ---

  const SidebarItem = ({ id, label, icon: Icon }: any) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-medium rounded-lg transition-colors ${activeTab === id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
      >
          <Icon />
          <span>{label}</span>
      </button>
  );

  const StatCard = ({ label, value, trend, trendUp }: any) => (
      <div className="bg-[#09090b] border border-zinc-800 p-6 rounded-xl flex flex-col justify-between">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-2">{label}</p>
          <div className="flex items-end justify-between">
              <span className="text-3xl text-white font-mono font-medium tracking-tight">{value}</span>
              {trend && (
                  <span className={`text-xs font-medium px-2 py-1 rounded ${trendUp ? 'text-emerald-400 bg-emerald-950/30' : 'text-rose-400 bg-rose-950/30'}`}>
                      {trend}
                  </span>
              )}
          </div>
      </div>
  );

  const StatusBadge = ({ active, banned }: { active: boolean, banned: boolean }) => {
      if (banned) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/50 text-rose-500 border border-rose-900/50">SUSPENDED</span>;
      if (active) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/50 text-emerald-500 border border-emerald-900/50">ACTIVE</span>;
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-500">IDLE</span>;
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 flex font-sans selection:bg-zinc-800">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-64 border-r border-zinc-900 bg-[#050505] flex flex-col p-4 fixed h-full z-20">
            <div className="mb-8 px-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-white tracking-tight">THE PROFESSOR</span>
                </div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">Control Center v2.0</p>
            </div>

            <div className="space-y-1 flex-1">
                <SidebarItem id="OVERVIEW" label="Overview" icon={Icons.Dashboard} />
                <SidebarItem id="USERS" label="User Management" icon={Icons.Users} />
                <SidebarItem id="FINANCE" label="Financials" icon={Icons.Finance} />
                <SidebarItem id="LOGS" label="System Logs" icon={Icons.Logs} />
            </div>

            <div className="mt-auto px-4 pb-4">
                <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hydra Engine</span>
                    </div>
                    <p className="text-[9px] text-zinc-600 font-mono">Status: ONLINE</p>
                    <p className="text-[9px] text-zinc-600 font-mono">Uptime: 99.9%</p>
                </div>
            </div>

            <div className="border-t border-zinc-900 pt-4">
                <button onClick={onExit} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-rose-500 hover:bg-rose-950/10 rounded-lg transition-colors">
                    <Icons.Exit />
                    <span>Secure Logout</span>
                </button>
            </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 ml-64 p-8 bg-[#020202]">
            
            {/* Header Breadcrumb */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-white mb-1 capitalize">{activeTab.toLowerCase().replace('_', ' ')}</h1>
                    <p className="text-xs text-zinc-500 font-mono">System Time: {new Date().toISOString()}</p>
                </div>
                <button onClick={refresh} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs rounded border border-zinc-800 transition-colors">
                    {loading ? 'Syncing...' : 'Sync Data'}
                </button>
            </div>

            {loading && !analytics ? (
                <div className="flex items-center justify-center h-64 text-zinc-600 font-mono text-xs">
                    Establishing Secure Link...
                </div>
            ) : (
                <>
                    {/* OVERVIEW DASHBOARD */}
                    {activeTab === 'OVERVIEW' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <StatCard label="Total ARR" value={`$${(analytics?.financials?.totalRevenue || 0).toLocaleString()}`} trend="+12.5%" trendUp={true} />
                                <StatCard label="Active Scholars" value={analytics?.users?.total || 0} trend="+5%" trendUp={true} />
                                <StatCard label="Premium Ratio" value={`${((analytics?.users?.excellentia / analytics?.users?.total) * 100 || 0).toFixed(1)}%`} trend="Stable" trendUp={true} />
                                <StatCard label="System Health" value="99.9%" trend="Optimal" trendUp={true} />
                            </div>

                            {/* Analytics Visualization (CSS/SVG Chart) */}
                            <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-6">
                                <h3 className="text-sm font-medium text-white mb-6">Traffic Volume (24h)</h3>
                                <div className="h-48 flex items-end gap-2 px-2">
                                    {[35, 45, 30, 60, 75, 50, 45, 65, 80, 70, 60, 90, 100, 85, 70, 50, 40, 55, 65, 70, 80, 95, 85, 75].map((h, i) => (
                                        <div key={i} className="flex-1 bg-zinc-800 hover:bg-zinc-600 transition-colors rounded-t-sm relative group" style={{ height: `${h}%` }}>
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                {h}% Load
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] text-zinc-600 font-mono uppercase">
                                    <span>00:00</span>
                                    <span>12:00</span>
                                    <span>23:59</span>
                                </div>
                            </div>

                            {/* Recent Activity Mini-Feed */}
                            <div className="bg-[#09090b] border border-zinc-800 rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Live Operations</h3>
                                </div>
                                <div className="divide-y divide-zinc-800/50">
                                    {analytics?.recentLogs.slice(0, 5).map((log: any) => (
                                        <div key={log.id} className="p-3 flex justify-between items-center text-xs hover:bg-zinc-900/50 transition-colors">
                                            <span className="font-mono text-zinc-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                                            <span className="text-zinc-300 flex-1 ml-4">{log.details}</span>
                                            <span className={`px-2 py-0.5 rounded uppercase font-bold text-[9px] ${log.action.includes('ERROR') ? 'text-rose-500 bg-rose-950/20' : 'text-emerald-500 bg-emerald-950/20'}`}>{log.action}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USERS TABLE */}
                    {activeTab === 'USERS' && (
                        <div className="bg-[#09090b] border border-zinc-800 rounded-xl overflow-hidden animate-fade-in flex flex-col h-[calc(100vh-140px)]">
                            <div className="p-4 border-b border-zinc-800 flex gap-4 bg-zinc-900/30">
                                <input 
                                    type="text" 
                                    placeholder="Search by ID, Email or Alias..." 
                                    className="bg-black border border-zinc-700 text-white text-xs rounded-lg px-4 py-2 w-64 focus:border-zinc-500 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div className="flex-1"></div>
                                <span className="text-xs text-zinc-500 self-center font-mono">Total Records: {analytics?.profiles?.length}</span>
                            </div>
                            
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-zinc-900/80 text-zinc-500 font-medium uppercase tracking-wider sticky top-0 z-10">
                                        <tr>
                                            <th className="p-4">User Identity</th>
                                            <th className="p-4">Plan & Credits</th>
                                            <th className="p-4">Join Date</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {analytics?.profiles
                                            .filter((p: any) => p.email?.toLowerCase().includes(searchTerm.toLowerCase()) || p.alias?.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.includes(searchTerm))
                                            .map((user: any) => (
                                            <tr key={user.id} className="hover:bg-zinc-900/40 transition-colors group">
                                                <td className="p-4">
                                                    <div className="font-bold text-white">{user.alias || 'Unknown'}</div>
                                                    <div className="text-zinc-500 font-mono text-[10px]">{user.email}</div>
                                                    <div className="text-zinc-600 font-mono text-[9px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">ID: {user.id}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className={`inline-block px-2 py-0.5 rounded mb-1 text-[10px] font-bold uppercase ${user.plan === 'Excellentia' ? 'bg-amber-950/30 text-amber-500 border border-amber-900/30' : 'bg-blue-950/30 text-blue-500 border border-blue-900/30'}`}>
                                                        {user.plan}
                                                    </div>
                                                    <div className="text-zinc-400 font-mono">{user.credits} NT</div>
                                                </td>
                                                <td className="p-4 text-zinc-500 font-mono">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="p-4">
                                                    <StatusBadge active={true} banned={user.is_banned} />
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleUserAction('GIFT_CREDITS', user.id)} className="p-1 hover:text-emerald-400" title="Grant 500 Credits">+</button>
                                                        <button onClick={() => handleUserAction('BAN_TOGGLE', user.id)} className="p-1 hover:text-amber-400" title="Suspend/Restore">
                                                            {user.is_banned ? 'Restore' : 'Ban'}
                                                        </button>
                                                        <button onClick={() => handleUserAction('DELETE', user.id)} className="p-1 hover:text-rose-500" title="Delete Permanently">×</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* LOGS TERMINAL */}
                    {activeTab === 'LOGS' && (
                        <div className="bg-[#09090b] border border-zinc-800 rounded-xl overflow-hidden animate-fade-in font-mono text-xs">
                            <div className="p-3 bg-zinc-900/50 border-b border-zinc-800 text-zinc-500">
                                console_output_stream :: tail -f
                            </div>
                            <div className="p-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                                {analytics?.recentLogs.map((log: any) => (
                                    <div key={log.id} className="flex gap-4 hover:bg-white/5 p-1 rounded">
                                        <span className="text-zinc-600 shrink-0">{new Date(log.created_at).toISOString()}</span>
                                        <span className={`font-bold shrink-0 w-24 ${log.action.includes('ERROR') ? 'text-rose-500' : 'text-blue-400'}`}>{log.action}</span>
                                        <span className="text-zinc-300">{log.details}</span>
                                        <span className="text-zinc-600 ml-auto">{log.admin_email}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
  );
};

export default AdminDashboard;
