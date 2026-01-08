
import React, { useEffect, useState } from 'react';
import { fetchAllUsers, sendAnnouncement, adminUpdateProfile } from '../services/supabase';
import { SubscriptionTier, UserProfile } from '../types';

interface UserData {
  id: string;
  email: string;
  plan: SubscriptionTier;
  createdAt: any;
  profile?: UserProfile;
}

interface AdminDashboardProps {
    onExit: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'STUDENTS' | 'COMMS'>('OVERVIEW');
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Student Dossier Modal State
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
      if (!search.trim()) {
          setFilteredUsers(users);
      } else {
          const lower = search.toLowerCase();
          setFilteredUsers(users.filter(u => 
              u.email?.toLowerCase().includes(lower) || 
              u.profile?.alias?.toLowerCase().includes(lower)
          ));
      }
  }, [search, users]);

  const loadData = async () => {
    try {
      const profiles = await fetchAllUsers();
      if (profiles) {
          const mappedUsers: UserData[] = profiles.map((p: any) => ({
              id: p.id,
              email: p.email,
              plan: p.subscription_tier || 'Fresher',
              createdAt: p.created_at,
              profile: {
                  alias: p.alias,
                  school: p.school,
                  country: p.country,
                  xp: p.xp,
                  subscriptionTier: p.subscription_tier,
                  streak: p.streak
              } as UserProfile
          }));
          setUsers(mappedUsers);
          setFilteredUsers(mappedUsers);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDossier = (user: UserData) => {
      setSelectedUser(user);
      setEditForm({
          alias: user.profile?.alias,
          school: user.profile?.school,
          country: user.profile?.country,
          xp: user.profile?.xp,
          subscriptionTier: user.plan
      });
  };

  const handleSaveDossier = async () => {
      if (!selectedUser) return;
      try {
          await adminUpdateProfile(selectedUser.id, editForm);
          setUsers(prev => prev.map(u => u.id === selectedUser.id ? { 
              ...u, 
              plan: editForm.subscriptionTier || u.plan,
              profile: { ...u.profile, ...editForm } as UserProfile 
          } : u));
          setSelectedUser(null);
      } catch (e) {
          alert("Failed to update dossier. Check permissions.");
      }
  };

  const handleSendBroadcast = async () => {
      if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
      if (!confirm("This will notify EVERY student. Confirm broadcast?")) return;
      
      try {
          await sendAnnouncement(broadcastTitle, broadcastMessage);
          setBroadcastTitle('');
          setBroadcastMessage('');
          alert("Signal Sent.");
      } catch (e) {
          alert("Signal Failed.");
      }
  };

  // Stats Calculation
  const totalUsers = users.length;
  const excellentiaUsers = users.filter(u => u.plan === 'Excellentia').length;
  const scholarUsers = users.filter(u => u.plan === 'Scholar').length;
  const totalXP = users.reduce((acc, curr) => acc + (curr.profile?.xp || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#050505]"><div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono p-4 md:p-8 animate-fade-in relative selection:bg-amber-500/30">
      
      {/* HUD Background */}
      <div className="fixed inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      <div className="fixed top-0 left-0 w-full h-1 bg-amber-600/50 shadow-[0_0_20px_rgba(245,158,11,0.5)] z-50"></div>

      <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-white/10">
              <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#0f0f10] border border-amber-500/50 rounded-none flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)] text-amber-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                  </div>
                  <div>
                      <h1 className="text-3xl font-black text-white tracking-[0.2em] uppercase glitch-effect">GOD MODE</h1>
                      <div className="flex items-center gap-3 mt-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">System Nominal // v2.4.0</span>
                      </div>
                  </div>
              </div>
              
              <div className="flex gap-1 mt-4 md:mt-0 bg-[#121212] p-1 rounded-lg border border-white/10">
                  <button onClick={() => setActiveTab('OVERVIEW')} className={`px-6 py-2 rounded font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'OVERVIEW' ? 'bg-amber-600 text-black' : 'text-gray-500 hover:text-white'}`}>Overview</button>
                  <button onClick={() => setActiveTab('STUDENTS')} className={`px-6 py-2 rounded font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'STUDENTS' ? 'bg-amber-600 text-black' : 'text-gray-500 hover:text-white'}`}>Registry</button>
                  <button onClick={() => setActiveTab('COMMS')} className={`px-6 py-2 rounded font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'COMMS' ? 'bg-amber-600 text-black' : 'text-gray-500 hover:text-white'}`}>Comms</button>
                  <button onClick={onExit} className="px-6 py-2 rounded font-bold text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-900/20">Logout</button>
              </div>
          </div>

          {activeTab === 'OVERVIEW' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
                  <div className="bg-[#0f0f10] border-l-4 border-blue-500 p-6 rounded-r-xl">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Population</p>
                      <h2 className="text-4xl font-bold text-white mt-2">{totalUsers}</h2>
                  </div>
                  <div className="bg-[#0f0f10] border-l-4 border-amber-500 p-6 rounded-r-xl">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Excellentia Elite</p>
                      <h2 className="text-4xl font-bold text-amber-500 mt-2">{excellentiaUsers}</h2>
                  </div>
                  <div className="bg-[#0f0f10] border-l-4 border-purple-500 p-6 rounded-r-xl">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Scholars</p>
                      <h2 className="text-4xl font-bold text-purple-500 mt-2">{scholarUsers}</h2>
                  </div>
                  <div className="bg-[#0f0f10] border-l-4 border-green-500 p-6 rounded-r-xl">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total XP Mined</p>
                      <h2 className="text-4xl font-bold text-green-500 mt-2">{(totalXP / 1000).toFixed(1)}k</h2>
                  </div>
              </div>
          )}

          {activeTab === 'STUDENTS' && (
              <div className="animate-fade-in">
                  <div className="mb-6 flex justify-between items-center bg-[#0f0f10] p-4 rounded-xl border border-white/5">
                      <input 
                        type="text" 
                        placeholder="SEARCH ID / EMAIL..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent border-b border-white/20 px-4 py-2 text-white outline-none w-64 text-xs font-mono focus:border-amber-500 transition-colors uppercase"
                      />
                      <span className="text-[10px] text-gray-500 font-mono">{filteredUsers.length} RECORDS FOUND</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full text-left bg-[#0f0f10]">
                          <thead className="bg-[#1a1a1c] text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                              <tr>
                                  <th className="px-6 py-4">Identity</th>
                                  <th className="px-6 py-4">Clearance</th>
                                  <th className="px-6 py-4">XP</th>
                                  <th className="px-6 py-4">Joined</th>
                                  <th className="px-6 py-4 text-right">Action</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {filteredUsers.map(user => (
                                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                      <td className="px-6 py-4">
                                          <div className="font-bold text-white text-sm">{user.profile?.alias || 'Unknown'}</div>
                                          <div className="text-[10px] text-gray-500 font-mono">{user.email}</div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase border ${user.plan === 'Excellentia' ? 'bg-amber-900/20 text-amber-500 border-amber-500/20' : user.plan === 'Scholar' ? 'bg-blue-900/20 text-blue-500 border-blue-500/20' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                                              {user.plan}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 font-mono text-xs text-gray-300">
                                          {user.profile?.xp?.toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4 text-[10px] text-gray-500 font-mono">
                                          {new Date(user.createdAt).toLocaleDateString()}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button onClick={() => handleOpenDossier(user)} className="text-[10px] font-bold uppercase text-amber-500 hover:text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded hover:bg-amber-900/20 transition-all">
                                              Modify
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeTab === 'COMMS' && (
              <div className="bg-[#0f0f10] border border-white/5 rounded-2xl p-8 max-w-2xl mx-auto animate-fade-in relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                  <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">Global Broadcast System</h3>
                  <div className="space-y-4 mb-6">
                      <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Frequency Header</label>
                          <input type="text" placeholder="URGENT UPDATE" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 font-mono text-sm" />
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Payload</label>
                          <textarea placeholder="Message content..." value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} className="w-full h-40 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 font-mono text-sm" />
                      </div>
                  </div>
                  <button onClick={handleSendBroadcast} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase text-xs tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-amber-500/20">Transmit Signal</button>
              </div>
          )}
      </div>

      {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
              <div className="w-full max-w-2xl bg-[#0f0f10] border border-amber-500/30 rounded-none shadow-[0_0_50px_rgba(245,158,11,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="p-4 border-b border-amber-500/20 bg-amber-900/10 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <span className="text-2xl">📁</span>
                          <h2 className="text-sm font-bold text-amber-500 uppercase tracking-[0.2em]">Subject Dossier</h2>
                      </div>
                      <button onClick={() => setSelectedUser(null)} className="text-amber-500 hover:text-white font-mono text-xl">×</button>
                  </div>
                  
                  <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Codename</label>
                              <input type="text" value={editForm.alias || ''} onChange={(e) => setEditForm({...editForm, alias: e.target.value})} className="w-full bg-black border border-white/10 px-3 py-2 text-white font-mono text-sm focus:border-amber-500 outline-none" />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Clearance Level</label>
                              <select 
                                value={editForm.subscriptionTier} 
                                onChange={(e) => setEditForm({...editForm, subscriptionTier: e.target.value as SubscriptionTier})}
                                className="w-full bg-black border border-white/10 px-3 py-2 text-white font-mono text-sm focus:border-amber-500 outline-none"
                              >
                                  <option value="Fresher">Fresher</option>
                                  <option value="Scholar">Scholar</option>
                                  <option value="Excellentia">Excellentia</option>
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">XP Override</label>
                          <div className="bg-white/5 p-4 border border-white/10">
                              <div className="flex items-center gap-4">
                                  <input type="range" min="0" max="10000" step="100" value={editForm.xp || 0} onChange={(e) => setEditForm({...editForm, xp: parseInt(e.target.value)})} className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                                  <span className="text-amber-500 font-mono font-bold">{editForm.xp} XP</span>
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">School</label>
                              <input type="text" value={editForm.school || ''} onChange={(e) => setEditForm({...editForm, school: e.target.value})} className="w-full bg-black border border-white/10 px-3 py-2 text-white font-mono text-sm focus:border-amber-500 outline-none" />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Country</label>
                              <input type="text" value={editForm.country || ''} onChange={(e) => setEditForm({...editForm, country: e.target.value})} className="w-full bg-black border border-white/10 px-3 py-2 text-white font-mono text-sm focus:border-amber-500 outline-none" />
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t border-white/10 bg-black flex justify-end gap-3">
                      <button onClick={() => setSelectedUser(null)} className="px-6 py-3 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest">Cancel</button>
                      <button onClick={handleSaveDossier} className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold uppercase tracking-widest shadow-lg shadow-amber-500/20">Save Records</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
