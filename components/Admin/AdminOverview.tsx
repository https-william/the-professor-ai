
import React from 'react';

export const AdminOverview: React.FC<{ metrics: any, loading: boolean }> = ({ metrics, loading }) => {
    const StatCard = ({ label, value, trend, color }: any) => (
        <div className="glass-container p-6 flex flex-col relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-${color}-500`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
            </div>

            <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</span>
            {loading ? (
                <div className="h-10 w-24 bg-white/5 rounded animate-pulse"></div>
            ) : (
                <div className="flex items-end gap-3 z-10">
                    <span className="text-4xl font-bold text-white tracking-tight">{value}</span>
                    {trend && (
                        <span className={`text-xs font-bold mb-1 px-1.5 py-0.5 rounded ${trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                </div>
            )}

            {/* Sparkline Placeholder */}
            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full bg-${color}-500 w-[70%]`}></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Students" value={metrics?.users?.total || 0} trend={12} color="blue" />
                <StatCard label="Scholar Plans" value={metrics?.users?.scholar || 0} trend={5} color="purple" />
                <StatCard label="Credits Consumed" value="42.5K" trend={8} color="amber" />
                <StatCard label="Revenue (YTD)" value={`$${metrics?.financials?.totalRevenue || 0}`} trend={15} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-container p-6 min-h-[300px]">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">Real-Time Traffic</h3>
                    <div className="flex items-center justify-center h-full text-gray-600 font-mono text-xs">
                        [LIVE TRAFFIC MAP VISUALIZATION LOADING...]
                    </div>
                </div>
                <div className="glass-container p-6 min-h-[300px]">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        {metrics?.recentLogs?.map((log: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                                <span className="text-gray-400 font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                                <span className="text-white">{log.action || 'System Event'}</span>
                                <span className={`px-2 py-0.5 rounded ${log.status === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>{log.status || 'INFO'}</span>
                            </div>
                        )) || <div className="text-gray-600 italic">No recent logs found.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
