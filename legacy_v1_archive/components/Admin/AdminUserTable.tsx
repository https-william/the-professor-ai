
import React, { useState } from 'react';
import { toggleBanUser, deleteUserAccount, deductCredits } from '../../services/supabase';

interface AdminUserTableProps {
    users: any[];
    onUpdate: () => void;
}

export const AdminUserTable: React.FC<AdminUserTableProps> = ({ users, onUpdate }) => {
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const filtered = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleBan = async (id: string, currentStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'UNBAN' : 'BAN'} this user?`)) return;
        await toggleBanUser(id, currentStatus);
        onUpdate();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("CRITICAL: This will permanently evaluate the user record. Proceed?")) return;
        await deleteUserAccount(id);
        onUpdate();
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search by email or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white focus:border-blue-500 focus:bg-white/10 outline-none transition-colors"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                    <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold">All</button>
                    <button className="px-4 py-2 rounded-lg hover:bg-white/10 text-gray-400 text-xs font-bold">Banned</button>
                    <button className="px-4 py-2 rounded-lg hover:bg-white/10 text-gray-400 text-xs font-bold">Paid</button>
                </div>
            </div>

            <div className="glass-container overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/10 text-xs font-mono font-bold uppercase tracking-widest text-gray-500">
                            <th className="p-4">User</th>
                            <th className="p-4">Plan</th>
                            <th className="p-4 text-center">Usage</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {filtered.map(user => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                    <div className="font-bold text-white">{user.full_name || 'Anonymous'}</div>
                                    <div className="text-gray-500 text-xs font-mono">{user.email}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${user.plan === 'Excellentia' ? 'bg-amber-500/20 text-amber-500 border-amber-500/50' :
                                            user.plan === 'Scholar' ? 'bg-purple-500/20 text-purple-500 border-purple-500/50' :
                                                'bg-gray-500/20 text-gray-400 border-gray-500/50'
                                        }`}>
                                        {user.plan || 'Fresher'}
                                    </span>
                                </td>
                                <td className="p-4 text-center font-mono text-gray-400">
                                    {user.credits || 0} NT
                                </td>
                                <td className="p-4 text-center">
                                    {user.is_banned ? (
                                        <span className="text-red-500 font-bold text-xs uppercase">Banned</span>
                                    ) : (
                                        <span className="text-green-500 font-bold text-xs uppercase">Active</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleBan(user.id, user.is_banned)}
                                            className={`p-2 rounded hover:bg-white/10 ${user.is_banned ? 'text-green-500' : 'text-amber-500'}`}
                                            title={user.is_banned ? "Unban User" : "Ban User"}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-2 rounded hover:bg-red-500/20 text-red-500 transition-colors"
                                            title="Delete User"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
