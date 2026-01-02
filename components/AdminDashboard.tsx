
import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db, toggleBanUser, deleteUserAccount, updateUserPlan, resetUserLimits, adminUpdateUser } from '../services/firebase';
import { SubscriptionTier, SystemLog, UserProfile } from '../types';

interface UserData {
  id: string;
  email: string;
  plan: SubscriptionTier;
  role: string;
  createdAt: any;
  isBanned?: boolean;
  dailyQuizzesGenerated?: number;
  profile?: UserProfile; // Full profile data
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REGISTRY' | 'LOGS'>('REGISTRY');
  const [users, setUsers] = useState<UserData[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Student Dossier Modal State
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile> & { socials?: any }>({});

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList: UserData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userList.push({
          id: doc.id,
          email: data.email,
          plan: data.plan || 'Fresher',
          role: data.role || 'student',
          createdAt: data.createdAt,
          isBanned: data.isBanned || false,
          dailyQuizzesGenerated: data.dailyQuizzesGenerated || 0,
          profile: {
              alias: data.alias || '',
              fullName: data.fullName || '',
              country: data.country || '',
              school: data.school || '',
              academicLevel: data.academicLevel || '',
              socials: data.socials || {},
              xp: data.xp || 0,
              // Map other fields as needed
          } as UserProfile
        });
      });
      setUsers(userList);
    } catch (error: any) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
      try {
          const q = query(collection(db, "system_logs"), orderBy("timestamp", "desc"), limit(50));
          const querySnapshot = await getDocs(q);
          const logList: SystemLog[] = [];
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              logList.push({
                  id: doc.id,
                  action: data.action,
                  details: data.details,
                  adminEmail: data.adminEmail,
                  targetUserId: data.targetUserId,
                  timestamp: data.timestamp
              });
          });
          setLogs(logList);
      } catch (error) {
          console.error("Error fetching logs", error);
      }
  };

  const handleOpenDossier = (user: UserData) => {
      setSelectedUser(user);
      setEditForm({
          alias: user.profile?.alias,
          fullName: user.profile?.fullName,
          school: user.profile?.school,
          country: user.profile?.country,
          academicLevel: user.profile?.academicLevel,
          xp: user.profile?.xp,
          socials: { ...(user.profile?.socials || {}) }
      });
  };

  const handleSaveDossier = async () => {
      if (!selectedUser) return;
      setProcessingId(selectedUser.id);
      try {
          // Merge edits into firestore
          await adminUpdateUser(selectedUser.id, editForm);
          
          // Update local state
          setUsers(prev => prev.map(u => u.id === selectedUser.id ? { 
              ...u, 
              profile: { ...u.profile, ...editForm } as UserProfile 
          } : u));
          
          setSelectedUser(null);
          alert("Dossier Updated Successfully");
      } catch (e) {
          alert("Failed to update dossier");
      } finally {
          setProcessingId(null);
      }
  };

  const handleDelete = async (userId: string) => {
      if (!confirm("CONFIRM EXPULSION: This will permanently delete the student record.")) return;
      setProcessingId(userId);
      try {
          await deleteUserAccount(userId);
          setUsers(prev => prev.filter(u => u.id !== userId));
          setSelectedUser(null); // Close modal if open
      } catch (error) {
          alert("Failed to delete user");
      } finally {
          setProcessingId(null);
      }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#050505]"><div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans p-4 md:p-8 animate-fade-in relative">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-900/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-amber-500/20 pb-6">
              <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-[#0f0f10] border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.1)] text-amber-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" /></svg>
                  </div>
                  <div>
                      <h1 className="text-4xl md:text-5xl font-serif font-black text-amber-500 tracking-tight">DEAN'S OFFICE</h1>
                      <div className="flex items-center gap-3 mt-2">
                          <span className="px-2 py-0.5 bg-amber-900/30 border border-amber-500/30 rounded text-[10px] font-bold uppercase tracking-widest text-amber-200">Superintendent Access</span>
                          <span className="text-xs text-gray-500 font-mono">:: SECURE CONNECTION ESTABLISHED</span>
                      </div>
                  </div>
              </div>
              
              <div className="flex gap-2 mt-4 md:mt-0">
                  <button onClick={() => setActiveTab('REGISTRY')} className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'REGISTRY' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-400 hover:text-white'}`}>Student Registry</button>
                  <button onClick={() => setActiveTab('LOGS')} className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'LOGS' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-400 hover:text-white'}`}>Audit Logs</button>
              </div>
          </div>

          {activeTab === 'REGISTRY' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {users.map(user => (
                      <div key={user.id} className="bg-[#0f0f10] border border-white/5 hover:border-amber-500/30 rounded-2xl p-6 transition-all group hover:bg-[#151515] relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors">{user.profile?.alias || 'Unknown Student'}</h3>
                                  <p className="text-xs text-gray-500 font-mono">{user.email}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${user.plan === 'Excellentia Supreme' ? 'bg-amber-900/20 text-amber-500 border border-amber-500/20' : 'bg-blue-900/20 text-blue-500 border border-blue-500/20'}`}>
                                  {user.plan}
                              </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                  <div className="text-[10px] text-gray-500 uppercase">XP</div>
                                  <div className="text-xl font-mono text-white">{user.profile?.xp || 0}</div>
                              </div>
                              <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                  <div className="text-[10px] text-gray-500 uppercase">Usage</div>
                                  <div className="text-xl font-mono text-white">{user.dailyQuizzesGenerated || 0}</div>
                              </div>
                          </div>

                          <button 
                            onClick={() => handleOpenDossier(user)}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-300 transition-all flex items-center justify-center gap-2"
                          >
                             <span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
                             </span>
                             Open Dossier
                          </button>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="bg-[#0f0f10] border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-black/40 border-b border-white/5">
                          <tr>
                              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Time</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Action</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Details</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {logs.map(log => (
                              <tr key={log.id} className="hover:bg-white/5">
                                  <td className="px-6 py-4 text-xs font-mono text-gray-500">{new Date(log.timestamp?.seconds * 1000).toLocaleString()}</td>
                                  <td className="px-6 py-4"><span className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold uppercase">{log.action}</span></td>
                                  <td className="px-6 py-4 text-sm text-gray-400">{log.details}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
      </div>

      {/* STUDENT DOSSIER MODAL */}
      {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
              <div className="w-full max-w-4xl bg-[#0f0f10] border border-amber-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="p-6 border-b border-white/5 bg-black/40 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-amber-900/20 rounded-xl border border-amber-500/20 flex items-center justify-center text-2xl text-amber-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
                          </div>
                          <div>
                              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Restricted Dossier</h2>
                              <p className="text-xs text-gray-500 font-mono">{selectedUser.id}</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">✕</button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          
                          {/* Identity Section */}
                          <div className="space-y-6">
                              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-amber-500/20 pb-2">Identity Matrix</h3>
                              
                              <div className="space-y-4">
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Alias (Codename)</label>
                                      <input 
                                          type="text" 
                                          value={editForm.alias || ''} 
                                          onChange={(e) => setEditForm({...editForm, alias: e.target.value})}
                                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Full Name</label>
                                      <input 
                                          type="text" 
                                          value={editForm.fullName || ''} 
                                          onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none"
                                      />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Country</label>
                                          <input 
                                              type="text" 
                                              value={editForm.country || ''} 
                                              onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                                              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none"
                                          />
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Academic Level</label>
                                          <input 
                                              type="text" 
                                              value={editForm.academicLevel || ''} 
                                              onChange={(e) => setEditForm({...editForm, academicLevel: e.target.value})}
                                              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none"
                                          />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Institution</label>
                                      <input 
                                          type="text" 
                                          value={editForm.school || ''} 
                                          onChange={(e) => setEditForm({...editForm, school: e.target.value})}
                                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none"
                                      />
                                  </div>
                              </div>
                          </div>

                          {/* Metrics & Socials */}
                          <div className="space-y-6">
                              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-amber-500/20 pb-2">Academic & Network</h3>
                              
                              <div className="bg-amber-900/10 p-4 rounded-xl border border-amber-500/20">
                                  <label className="text-[10px] font-bold text-amber-500 uppercase block mb-2">Override Experience Points (XP)</label>
                                  <div className="flex items-center gap-4">
                                      <input 
                                          type="range" min="0" max="10000" step="100" 
                                          value={editForm.xp || 0} 
                                          onChange={(e) => setEditForm({...editForm, xp: parseInt(e.target.value)})}
                                          className="flex-1 h-2 bg-black rounded-lg appearance-none cursor-pointer accent-amber-500"
                                      />
                                      <input 
                                          type="number" 
                                          value={editForm.xp || 0} 
                                          onChange={(e) => setEditForm({...editForm, xp: parseInt(e.target.value)})}
                                          className="w-24 bg-black/40 border border-amber-500/30 rounded px-2 py-1 text-right font-mono text-amber-400"
                                      />
                                  </div>
                              </div>

                              <div className="space-y-3">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase block">Social Handles</label>
                                  {['whatsapp', 'telegram', 'instagram', 'snapchat'].map(platform => (
                                      <div key={platform} className="flex items-center gap-2">
                                          <span className="w-24 text-xs text-gray-400 capitalize">{platform}:</span>
                                          <input 
                                              type="text" 
                                              value={editForm.socials?.[platform] || ''}
                                              onChange={(e) => setEditForm({
                                                  ...editForm, 
                                                  socials: { ...editForm.socials, [platform]: e.target.value }
                                              })}
                                              className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                                              placeholder="Not linked"
                                          />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-white/5 bg-black/40 flex justify-between items-center">
                      <button 
                        onClick={() => handleDelete(selectedUser.id)} 
                        className="px-6 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                      >
                          Expel Student
                      </button>
                      <div className="flex gap-4">
                          <button onClick={() => setSelectedUser(null)} className="px-6 py-3 text-gray-500 hover:text-white font-bold uppercase text-xs">Cancel</button>
                          <button 
                             onClick={handleSaveDossier}
                             className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all"
                          >
                             Update Records
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
