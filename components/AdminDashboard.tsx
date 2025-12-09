
import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db, toggleBanUser, deleteUserAccount, updateUserPlan, resetUserLimits } from '../services/firebase';
import { SubscriptionTier, SystemLog } from '../types';

interface UserData {
  id: string;
  email: string;
  plan: SubscriptionTier;
  role: string;
  createdAt: any;
  isBanned?: boolean;
  dailyQuizzesGenerated?: number;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REGISTRY' | 'LOGS'>('REGISTRY');
  const [users, setUsers] = useState<UserData[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);

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
          dailyQuizzesGenerated: data.dailyQuizzesGenerated || 0
        });
      });
      setUsers(userList);
      setPermissionError(false);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      if (error.code === 'permission-denied') {
        setPermissionError(true);
      }
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
      } catch (error: any) {
          // Silent fail for logs if permissions missing to avoid console spam, unless users failed too
          if (error.code === 'permission-denied') {
             // Already handled by fetchUsers usually, but good to know
          } else {
             console.error("Error fetching logs", error);
          }
      }
  };

  const handleUpdatePlan = async (userId: string, newPlan: SubscriptionTier) => {
      setProcessingId(userId);
      try {
          await updateUserPlan(userId, newPlan);
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
          fetchLogs(); // Refresh logs
      } catch (error) {
          alert("Failed to update plan");
      } finally {
          setProcessingId(null);
      }
  };

  const handleBan = async (userId: string, currentBanStatus: boolean) => {
      if (!confirm(currentBanStatus ? "Lift ban for this user?" : "Ban this user from accessing the platform?")) return;
      setProcessingId(userId);
      try {
          await toggleBanUser(userId, currentBanStatus);
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: !currentBanStatus } : u));
          fetchLogs();
      } catch (error) {
          alert("Failed to ban/unban user");
      } finally {
          setProcessingId(null);
      }
  };

  const handleResetLimits = async (userId: string) => {
      if (!confirm("Reset daily quiz generation limits for this user?")) return;
      setProcessingId(userId);
      try {
          await resetUserLimits(userId);
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, dailyQuizzesGenerated: 0 } : u));
          fetchLogs();
      } catch (error) {
          alert("Failed to reset limits");
      } finally {
          setProcessingId(null);
      }
  };

  const handleDelete = async (userId: string) => {
      if (!confirm("Are you sure you want to DELETE this user? This action cannot be undone.")) return;
      setProcessingId(userId);
      try {
          await deleteUserAccount(userId);
          setUsers(prev => prev.filter(u => u.id !== userId));
          fetchLogs();
      } catch (error) {
          alert("Failed to delete user");
      } finally {
          setProcessingId(null);
      }
  };

  const downloadCSV = () => {
      const headers = ["User ID", "Email", "Plan", "Role", "Join Date", "Banned", "Usage"];
      const rows = users.map(u => [
          u.id,
          u.email,
          u.plan,
          u.role,
          u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A',
          u.isBanned ? "YES" : "NO",
          u.dailyQuizzesGenerated || 0
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
          + headers.join(",") + "\n" 
          + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `student_registry_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in pb-24">
      
      {permissionError && (
        <div className="mb-8 bg-red-900/20 border border-red-500/50 p-6 rounded-2xl flex flex-col gap-4">
           <div className="flex items-center gap-3 text-red-400 font-bold text-lg">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             <h3>Security Alert: Database Locked</h3>
           </div>
           <p className="text-red-200 text-sm">
             The Dean's Office cannot access student records because Firestore Rules are blocking the connection.
             <br/><br/>
             <strong>Action Required:</strong> Go to Firebase Console &gt; Firestore &gt; Rules and paste the "God Mode" ruleset provided by your developer.
           </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/30 border border-amber-500/20">
             <span className="text-3xl">🏛️</span>
          </div>
          <div>
             <h1 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200">Dean's Office</h1>
             <p className="text-amber-500/60 font-mono text-sm uppercase tracking-widest mt-1">Excellentia Supreme Command</p>
          </div>
        </div>

        <div className="flex gap-4">
             <div className="flex bg-black/40 rounded-xl p-1 border border-amber-500/20">
                <button 
                  onClick={() => setActiveTab('REGISTRY')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'REGISTRY' ? 'bg-amber-500/20 text-amber-200 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Registry
                </button>
                <button 
                  onClick={() => setActiveTab('LOGS')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'LOGS' ? 'bg-amber-500/20 text-amber-200 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Audit Logs
                </button>
             </div>

            <button 
                onClick={downloadCSV}
                className="px-6 py-3 bg-black/40 border border-amber-500/30 text-amber-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-900/20 transition-all flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12" /></svg>
                Export
            </button>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border border-amber-500/10 shadow-2xl min-h-[500px]">
        {activeTab === 'REGISTRY' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-amber-950/20 border-b border-amber-500/10">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-bold text-amber-500/50 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-amber-500/50 uppercase tracking-widest">Enrolled</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-amber-500/50 uppercase tracking-widest">Tuition Plan</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-amber-500/50 uppercase tracking-widest">Usage</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-amber-500/50 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-amber-500/50 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className={`hover:bg-white/5 transition-colors ${user.isBanned ? 'bg-red-900/10' : ''}`}>
                    <td className="px-6 py-4">
                        <div className="font-mono text-sm text-gray-300">{user.email}</div>
                        <div className="text-[10px] text-gray-600 font-mono mt-1">{user.id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <select 
                          value={user.plan}
                          onChange={(e) => handleUpdatePlan(user.id, e.target.value as SubscriptionTier)}
                          disabled={processingId === user.id}
                          className={`bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wide outline-none focus:border-amber-500 ${
                              user.plan === 'Excellentia Supreme' ? 'text-amber-400 border-amber-500/30' : 
                              user.plan === 'Scholar' ? 'text-blue-400 border-blue-500/30' : 
                              'text-gray-400'
                          }`}
                      >
                          <option value="Fresher">Fresher</option>
                          <option value="Scholar">Scholar</option>
                          <option value="Excellentia Supreme">Supreme</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <span className={`font-mono text-sm ${user.dailyQuizzesGenerated && user.dailyQuizzesGenerated >= 3 && user.plan === 'Fresher' ? 'text-red-400' : 'text-gray-400'}`}>
                           {user.dailyQuizzesGenerated || 0}
                         </span>
                         {user.dailyQuizzesGenerated && user.dailyQuizzesGenerated > 0 && (
                           <button 
                             onClick={() => handleResetLimits(user.id)}
                             disabled={processingId === user.id}
                             title="Reset Limits"
                             className="text-[10px] bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded text-gray-500"
                           >
                             ↺
                           </button>
                         )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.isBanned ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-red-900/30 text-red-500 border border-red-500/30">
                              Expelled
                          </span>
                      ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-green-900/20 text-green-500 border border-green-500/20">
                              Active
                          </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                          <button
                              onClick={() => handleBan(user.id, user.isBanned || false)}
                              disabled={processingId === user.id}
                              className={`p-2 rounded-lg border transition-all ${
                                  user.isBanned 
                                      ? 'bg-green-900/20 border-green-500/30 text-green-400 hover:bg-green-900/40' 
                                      : 'bg-red-900/20 border-red-500/30 text-red-400 hover:bg-red-900/40'
                              }`}
                              title={user.isBanned ? "Unban User" : "Ban User"}
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          </button>
                          <button
                              onClick={() => handleDelete(user.id)}
                              disabled={processingId === user.id}
                              className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:bg-red-900/80 hover:text-white hover:border-red-500 transition-all"
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
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left">
              <thead className="bg-amber-950/20 border-b border-amber-500/10">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-bold text-amber-500/50 uppercase tracking-widest">Time</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-amber-500/50 uppercase tracking-widest">Admin</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-amber-500/50 uppercase tracking-widest">Action</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-amber-500/50 uppercase tracking-widest">Details</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-amber-500/50 uppercase tracking-widest">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                   <tr key={log.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 text-xs font-mono text-gray-500">
                         {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-amber-400">{log.adminEmail}</td>
                      <td className="px-6 py-4">
                         <span className="text-[10px] font-bold uppercase bg-white/5 px-2 py-1 rounded border border-white/10">{log.action}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{log.details}</td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-500">{log.targetUserId || '-'}</td>
                   </tr>
                ))}
              </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
};
