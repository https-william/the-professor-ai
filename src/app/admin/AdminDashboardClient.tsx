"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboardClient() {
  const [generations, setGenerations] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    premiumUsers: 0,
    activeStreaks: 0,
    totalPacks: 0,
    totalPqls: 0
  });
  const [blogs, setBlogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"live" | "broadcasts" | "users" | "blog" | "logs">("live");
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPQL, setFilterPQL] = useState<string>("all");

  // Grant Credits State
  const [grantUserId, setGrantUserId] = useState<string | null>(null);
  const [grantAmount, setGrantAmount] = useState<number>(50);
  const [isGranting, setIsGranting] = useState(false);

  // Broadcast State
  const [bTitle, setBTitle] = useState("");
  const [bMessage, setBMessage] = useState("");

  // Blog State
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [blogExcerpt, setBlogExcerpt] = useState("");
  const [blogCategory, setBlogCategory] = useState("");
  const [blogContent, setBlogContent] = useState("");
  
  const supabase = createClient();

  useEffect(() => {
    // Initial fetches
    fetchInitialData();

    // Subscriptions
    const subGen = supabase.channel('admin_gen')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'duel_results' }, () => {
         // Refresh overview stats and live gen stream
         fetchInitialData();
      }).subscribe();
      
    const subBroadcast = supabase.channel('admin_broad')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, (payload: any) => {
         if (payload.eventType === 'INSERT') setBroadcasts(prev => [payload.new, ...prev]);
         if (payload.eventType === 'DELETE') setBroadcasts(prev => prev.filter(b => b.id !== payload.old.id));
      }).subscribe();

    const subProfile = supabase.channel('admin_prof')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
         // Refresh list dynamically when profiles change
         fetchInitialData();
      }).subscribe();

    const subBlog = supabase.channel('admin_blog')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, (payload: any) => {
         if (payload.eventType === 'INSERT') setBlogs(prev => [payload.new, ...prev]);
         if (payload.eventType === 'DELETE') setBlogs(prev => prev.filter(b => b.id !== payload.old.id));
      }).subscribe();

    const subLogs = supabase.channel('admin_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, (payload: any) => {
         setLogs(prev => [payload.new, ...prev]);
      }).subscribe();

    return () => {
      supabase.removeChannel(subGen);
      supabase.removeChannel(subBroadcast);
      supabase.removeChannel(subProfile);
      supabase.removeChannel(subBlog);
      supabase.removeChannel(subLogs);
    };
  }, []);

  const fetchInitialData = async () => {
      try {
          const [genRes, bRes, overviewRes, blogRes, logsRes] = await Promise.all([
              supabase.from("generations").select("*, profiles(first_name, last_name, email)").order('created_at', { ascending: false }).limit(50),
              supabase.from("broadcasts").select("*").order('created_at', { ascending: false }),
              fetch("/api/admin/overview?t=" + Date.now()).then(res => res.json()),
              supabase.from("blog_posts").select("*").order('created_at', { ascending: false }),
              supabase.from("system_logs").select("*").order('created_at', { ascending: false }).limit(50)
          ]);
          if (genRes.data) setGenerations(genRes.data);
          if (bRes.data) setBroadcasts(bRes.data);
          if (logsRes.data) setLogs(logsRes.data);
          if (overviewRes && !overviewRes.error) {
              setUsers(overviewRes.users || []);
              setStats(overviewRes.stats || {
                totalUsers: 0,
                premiumUsers: 0,
                activeStreaks: 0,
                totalPacks: 0,
                totalPqls: 0
              });
          }
          if (blogRes.data) setBlogs(blogRes.data);
      } catch (err) {
          console.error("Error fetching initial admin data:", err);
      }
  };

  const handleSendBroadcast = async () => {
      if (!bTitle || !bMessage) return;
      await supabase.from("broadcasts").insert({ title: bTitle, message: bMessage, type: "broadcast", icon: "campaign" });
      setBTitle("");
      setBMessage("");
  };

  const handleDeleteBroadcast = async (id: string) => {
      await supabase.from("broadcasts").delete().eq("id", id);
  };

  const handleCreateBlog = async () => {
      if (!blogTitle || !blogSlug || !blogContent) return;
      await supabase.from("blog_posts").insert({
          title: blogTitle,
          slug: blogSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          excerpt: blogExcerpt || "No excerpt provided.",
          content: blogContent,
          category: blogCategory || "General",
          read_time_minutes: Math.max(1, Math.ceil(blogContent.split(' ').length / 200)),
          is_published: true
      });
      setBlogTitle(""); setBlogSlug(""); setBlogExcerpt(""); setBlogCategory(""); setBlogContent("");
  };

  const handleDeleteBlog = async (id: string) => {
      await supabase.from("blog_posts").delete().eq("id", id);
  };

  const handleGrantSubmit = async (userId: string) => {
    setIsGranting(true);
    try {
        const res = await fetch("/api/admin/grant-credits", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ userId, amount: grantAmount })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            // Update local state instantly
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits: Math.max(0, u.credits + grantAmount) } : u));
            setGrantUserId(null);
            fetchInitialData(); // Sync aggregates
        } else {
            alert(data.error || "Failed to grant credits");
        }
    } catch (err) {
        console.error(err);
        alert("An error occurred while granting credits");
    } finally {
        setIsGranting(false);
    }
  };

  // Filter users based on search & PQL selection
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
        u.alias.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
        
    const matchesPQL = 
        filterPQL === "all" || 
        (filterPQL === "pql" && u.pql_status.length > 0) ||
        (filterPQL === "high_usage" && u.pql_status.includes("High Usage")) ||
        (filterPQL === "low_credits" && u.pql_status.includes("Credit Depleted")) ||
        (filterPQL === "high_streak" && u.pql_status.includes("High Streak"));

    return matchesSearch && matchesPQL;
  });

  return (
    <div className="space-y-8">
       {/* Executive Metrics Overview */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-6 rounded-[24px] bg-zinc-950/45 border border-white/5 backdrop-blur-2xl">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-1">Total Scholars</p>
             <h3 className="text-3xl font-black text-white italic">{stats.totalUsers}</h3>
             <p className="text-[10px] text-[var(--foreground-muted)] mt-1">Registered accounts</p>
          </div>
          <div className="p-6 rounded-[24px] bg-zinc-950/45 border border-white/5 backdrop-blur-2xl">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-1">Premium Tier</p>
             <h3 className="text-3xl font-black text-[var(--emerald)] italic">{stats.premiumUsers}</h3>
             <p className="text-[10px] text-[var(--foreground-muted)] mt-1">Paid plans active</p>
          </div>
          <div className="p-6 rounded-[24px] bg-zinc-950/45 border border-white/5 backdrop-blur-2xl">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-1">Active Streaks</p>
             <h3 className="text-3xl font-black text-[var(--amber)] italic">{stats.activeStreaks}</h3>
             <p className="text-[10px] text-[var(--foreground-muted)] mt-1">Ongoing study streaks</p>
          </div>
          <div className="p-6 rounded-[24px] bg-zinc-950/45 border border-white/5 backdrop-blur-2xl">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-1">Study Packs</p>
             <h3 className="text-3xl font-black text-[var(--violet)] italic">{stats.totalPacks}</h3>
             <p className="text-[10px] text-[var(--foreground-muted)] mt-1">Ingested wisdom</p>
          </div>
          <div className="p-6 rounded-[24px] bg-zinc-950/45 border border-[var(--amber)]/30 backdrop-blur-2xl shadow-[0_0_15px_rgba(229,169,60,0.05)]">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--amber)] mb-1">PQL Leads</p>
             <h3 className="text-3xl font-black text-[var(--amber)] italic">{stats.totalPqls}</h3>
             <p className="text-[10px] text-[var(--foreground-muted)] mt-1">Conversion targets</p>
          </div>
       </div>

       {/* Top Navigation Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
              { id: "live", title: "Live Activity", icon: "monitoring", val: generations.length + " logged" },
              { id: "broadcasts", title: "Broadcast Engine", icon: "campaign", val: broadcasts.length + " sent" },
              { id: "users", title: "User Directory", icon: "group", val: users.length + " profiles" },
              { id: "blog", title: "Blog CMS", icon: "edit_document", val: blogs.length + " posts" },
              { id: "logs", title: "System Logs", icon: "terminal", val: logs.length + " errors" }
          ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                 className={`p-5 rounded-[24px] text-left transition-all border ${
                     activeTab === tab.id 
                       ? "bg-[var(--accent-bg)] border-[var(--border)] shadow-[var(--shadow-md)]" 
                       : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--background-secondary)]"
                 }`}
              >
                  <div className="flex items-center justify-between mb-4">
                      <span className={`material-symbols-outlined text-2xl ${activeTab === tab.id ? "text-[var(--accent)]" : "text-[var(--foreground-muted)]"}`}>{tab.icon}</span>
                  </div>
                  <h3 className="font-bold text-[var(--foreground)] truncate">{tab.title}</h3>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1 tracking-wide">{tab.val}</p>
              </button>
          ))}
       </div>

       {/* TAB CONTENTS */}
       <div className="bg-[var(--card)] border border-[var(--border)] rounded-[32px] p-6 lg:p-10 shadow-[var(--shadow-lg)] min-h-[500px]">
          
          {/* LIVE ACTIVITY */}
          {activeTab === "live" && (
             <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                   <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                       <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Live Generation Stream
                   </h2>
                </div>
                <div className="space-y-4">
                   {generations.length === 0 ? (
                       <p className="text-[var(--foreground-muted)] text-sm">No recent generations.</p>
                   ) : (
                       generations.map((gen, i) => (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                             key={gen.id || i} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)]"
                          >
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-muted)]`}>
                                <span className="material-symbols-outlined text-[18px]">
                                   {gen.type === 'flashcards' ? 'style' : gen.type === 'quiz' ? 'quiz' : 'summarize'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[var(--foreground)] truncate">
                                    Generated {gen.type} <span className="text-[var(--foreground-muted)] font-normal text-xs ml-2">{new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric' }).format(new Date(gen.created_at))}</span>
                                </p>
                                <p className="text-xs text-[var(--accent)] truncate capitalize mt-0.5">
                                    By {gen.profiles?.first_name || 'Anonymous'} {gen.profiles?.last_name || ''} ({gen.profiles?.email || 'unverified'})
                                </p>
                              </div>
                          </motion.div>
                       ))
                   )}
                </div>
             </div>
          )}

          {/* BROADCASTS */}
          {activeTab === "broadcasts" && (
             <div className="space-y-10">
                <div className="space-y-5">
                   <h2 className="text-xl font-bold text-[var(--foreground)]">Create Broadcast</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                         type="text" placeholder="Broadcast Title..." value={bTitle} onChange={e => setBTitle(e.target.value)}
                         className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--foreground-muted)]/50"
                      />
                      <input 
                         type="text" placeholder="Message content..." value={bMessage} onChange={e => setBMessage(e.target.value)}
                         className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--foreground-muted)]/50"
                      />
                   </div>
                   <button onClick={handleSendBroadcast} className="px-6 py-3 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-bold text-sm tracking-wide shadow-md active:scale-95 transition-all">
                       Deploy Broadcast
                   </button>
                </div>

                <div className="border-t border-[var(--border)] pt-8">
                   <h3 className="text-sm uppercase tracking-widest font-black text-[var(--foreground-muted)] mb-4">Broadcast History</h3>
                   <div className="space-y-3">
                      {broadcasts.length === 0 && <p className="text-sm text-[var(--foreground-muted)]">No broadcasts deployed.</p>}
                      {broadcasts.map(b => (
                          <div key={b.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--background)]">
                             <div>
                                <h4 className="text-sm font-bold text-[var(--foreground)]">{b.title}</h4>
                                <p className="text-xs text-[var(--foreground-muted)] mt-1">{b.message}</p>
                                <p className="text-[10px] text-[var(--foreground-muted)]/60 mt-2">{new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(b.created_at))}</p>
                             </div>
                             <button onClick={() => handleDeleteBroadcast(b.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all">
                                 <span className="material-symbols-outlined text-[16px]">delete</span>
                             </button>
                          </div>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {/* USERS */}
          {activeTab === "users" && (
             <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
                   <h2 className="text-xl font-bold text-[var(--foreground)]">Master Directory</h2>
                </div>

                {/* Filters strip */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                   <div className="flex-1 relative">
                      <input 
                         type="text" 
                         placeholder="Search by name, alias, or email..." 
                         value={searchQuery} 
                         onChange={e => setSearchQuery(e.target.value)}
                         className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-950/40 border border-white/5 text-sm text-white focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--foreground-muted)]/50"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-[var(--foreground-muted)]">search</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {[
                         { id: "all", label: "All Users" },
                         { id: "pql", label: "PQLs Only" },
                         { id: "high_usage", label: "High Usage" },
                         { id: "low_credits", label: "Low Credits" },
                         { id: "high_streak", label: "High Streak" }
                      ].map(opt => (
                         <button 
                            key={opt.id} 
                            onClick={() => setFilterPQL(opt.id)}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                               filterPQL === opt.id 
                                  ? "bg-[var(--accent-bg)] border-[var(--border)] text-white" 
                                  : "bg-zinc-950/20 border-white/5 text-[var(--foreground-muted)] hover:bg-zinc-950/40 hover:text-white"
                            }`}
                         >
                            {opt.label}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="border-b border-[var(--border)] text-[var(--foreground-muted)] text-[11px] uppercase tracking-widest">
                            <th className="font-semibold p-4">Profile</th>
                            <th className="font-semibold p-4">Streak & Usage</th>
                            <th className="font-semibold p-4">Plan Status</th>
                            <th className="font-semibold p-4">PQL Status</th>
                            <th className="font-semibold p-4">Credits</th>
                            <th className="font-semibold p-4">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                         {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-sm text-[var(--foreground-muted)]">
                                 No scholars found matching the filters.
                              </td>
                            </tr>
                         ) : (
                            filteredUsers.map(p => (
                                <tr key={p.id} className="hover:bg-[var(--background-secondary)]/50 transition-colors">
                                   <td className="p-4">
                                      <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-full bg-[var(--accent-bg)] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold text-[var(--accent)] uppercase">
                                             {p.first_name ? p.first_name[0] : "?"}{p.last_name ? p.last_name[0] : ""}
                                         </div>
                                         <div>
                                            <p className="font-bold text-sm text-[var(--foreground)]">{p.first_name} {p.last_name} <span className="text-[10px] text-[var(--foreground-muted)] font-normal">({p.alias})</span></p>
                                            <p className="text-xs text-[var(--foreground-muted)]">{p.email}</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="p-4">
                                      <div className="space-y-1">
                                         <p className="text-xs text-[var(--foreground)] font-semibold flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px] text-[var(--amber)]">local_fire_department</span>
                                            {p.current_streak} days streak
                                         </p>
                                         <p className="text-[10px] text-[var(--foreground-muted)]">
                                            {p.packs_count} study packs ingested
                                         </p>
                                      </div>
                                   </td>
                                   <td className="p-4">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border ${
                                         p.plan_status === 'free'
                                            ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                            : p.plan_status === 'unlimited'
                                            ? "bg-amber-500/10 text-[var(--amber)] border-amber-500/20"
                                            : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                      }`}>
                                         {p.plan_status}
                                      </span>
                                   </td>
                                   <td className="p-4">
                                      <div className="flex flex-wrap gap-1">
                                         {p.pql_status.length === 0 ? (
                                            <span className="text-[10px] text-[var(--foreground-muted)]">—</span>
                                         ) : (
                                            p.pql_status.map((flag: string) => (
                                               <span key={flag} className={`px-2 py-0.5 rounded-[6px] text-[9px] font-bold border ${
                                                  flag === "High Usage"
                                                     ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                                     : flag === "Credit Depleted"
                                                     ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                     : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                               }`}>
                                                  {flag}
                                               </span>
                                            ))
                                         )}
                                      </div>
                                   </td>
                                   <td className="p-4">
                                      <span className="text-sm font-bold text-[var(--foreground)]">{p.credits} <span className="text-[var(--accent)] text-[10px]">⚡</span></span>
                                   </td>
                                   <td className="p-4">
                                      {grantUserId === p.id ? (
                                         <div className="flex items-center gap-2">
                                            <input 
                                               type="number" 
                                               value={grantAmount} 
                                               onChange={e => setGrantAmount(Number(e.target.value))} 
                                               className="w-16 p-1.5 text-xs rounded bg-zinc-950 border border-white/10 text-white focus:outline-none"
                                            />
                                            <button onClick={() => handleGrantSubmit(p.id)} disabled={isGranting} className="p-1 bg-emerald-500/10 text-emerald-500 rounded hover:bg-emerald-500/20">
                                               <span className="material-symbols-outlined text-[14px]">check</span>
                                            </button>
                                            <button onClick={() => setGrantUserId(null)} className="p-1 bg-zinc-500/10 text-zinc-500 rounded hover:bg-zinc-500/20">
                                               <span className="material-symbols-outlined text-[14px]">close</span>
                                            </button>
                                         </div>
                                      ) : (
                                         <button 
                                            onClick={() => { setGrantUserId(p.id); setGrantAmount(50); }}
                                            className="px-2.5 py-1 text-[11px] font-bold bg-zinc-950/40 hover:bg-[var(--accent-bg)] hover:text-white border border-white/5 rounded-lg transition-all text-[var(--foreground-muted)]"
                                         >
                                            Grant Credits
                                         </button>
                                      )}
                                   </td>
                                </tr>
                             ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {/* BLOG CMS */}
          {activeTab === "blog" && (
             <div className="space-y-10">
                <div className="space-y-5">
                   <h2 className="text-xl font-bold text-[var(--foreground)]">New Blog Post</h2>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Title" value={blogTitle} onChange={e => setBlogTitle(e.target.value)} className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--foreground-muted)]/50" />
                      <input type="text" placeholder="URL Slug (e.g. active-recall)" value={blogSlug} onChange={e => setBlogSlug(e.target.value)} className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--foreground-muted)]/50" />
                      <input type="text" placeholder="Excerpt" value={blogExcerpt} onChange={e => setBlogExcerpt(e.target.value)} className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all md:col-span-2 placeholder:text-[var(--foreground-muted)]/50" />
                      <input type="text" placeholder="Category (e.g. Pedagogy)" value={blogCategory} onChange={e => setBlogCategory(e.target.value)} className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--foreground-muted)]/50" />
                   </div>
                   
                   <textarea 
                     placeholder="Write your markdown content here..." 
                     value={blogContent} 
                     onChange={e => setBlogContent(e.target.value)}
                     className="w-full h-64 p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--foreground-muted)]/50 resize-none font-mono"
                   />

                   <button onClick={handleCreateBlog} className="px-6 py-3 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-bold text-sm tracking-wide shadow-md active:scale-95 transition-all">
                       Publish Post
                   </button>
                </div>

                <div className="border-t border-[var(--border)] pt-8">
                   <h3 className="text-sm uppercase tracking-widest font-black text-[var(--foreground-muted)] mb-4">Published Posts</h3>
                   <div className="space-y-3">
                      {blogs.length === 0 && <p className="text-sm text-[var(--foreground-muted)]">No blog posts found in Supabase.</p>}
                      {blogs.map(b => (
                          <div key={b.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--background)]">
                             <div>
                                <h4 className="text-sm font-bold text-[var(--foreground)]">{b.title}</h4>
                                <p className="text-xs text-[var(--accent)] mt-1">/{b.slug} — {b.category}</p>
                                <p className="text-[10px] text-[var(--foreground-muted)]/60 mt-2">{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(b.created_at))}</p>
                             </div>
                             <button onClick={() => handleDeleteBlog(b.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all">
                                 <span className="material-symbols-outlined text-[16px]">delete</span>
                             </button>
                          </div>
                      ))}
                   </div>
                </div>
             </div>
          )}

       </div>
    </div>
  );
}
