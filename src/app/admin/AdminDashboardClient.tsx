"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboardClient() {
  const [generations, setGenerations] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"live" | "broadcasts" | "users" | "blog">("live");
  
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'generations' }, (payload) => {
         setGenerations(prev => [payload.new, ...prev].slice(0, 50));
      }).subscribe();
      
    const subBroadcast = supabase.channel('admin_broad')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, (payload) => {
         if (payload.eventType === 'INSERT') setBroadcasts(prev => [payload.new, ...prev]);
         if (payload.eventType === 'DELETE') setBroadcasts(prev => prev.filter(b => b.id !== payload.old.id));
      }).subscribe();

    const subProfile = supabase.channel('admin_prof')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
         // handle profile updates live
         if (payload.eventType === 'UPDATE') {
             setProfiles(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
         } else if (payload.eventType === 'INSERT') {
             setProfiles(prev => [payload.new, ...prev]);
         }
      }).subscribe();

    const subBlog = supabase.channel('admin_blog')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, (payload) => {
         if (payload.eventType === 'INSERT') setBlogs(prev => [payload.new, ...prev]);
         if (payload.eventType === 'DELETE') setBlogs(prev => prev.filter(b => b.id !== payload.old.id));
      }).subscribe();

    return () => {
      supabase.removeChannel(subGen);
      supabase.removeChannel(subBroadcast);
      supabase.removeChannel(subProfile);
      supabase.removeChannel(subBlog);
    };
  }, []);

  const fetchInitialData = async () => {
      const [genRes, bRes, profRes, blogRes] = await Promise.all([
          supabase.from("generations").select("*, profiles(first_name, last_name, email)").order('created_at', { ascending: false }).limit(50),
          supabase.from("broadcasts").select("*").order('created_at', { ascending: false }),
          supabase.from("profiles").select("*").order('created_at', { ascending: false }).limit(100),
          supabase.from("blog_posts").select("*").order('created_at', { ascending: false })
      ]);
      if (genRes.data) setGenerations(genRes.data);
      if (bRes.data) setBroadcasts(bRes.data);
      if (profRes.data) setProfiles(profRes.data);
      if (blogRes.data) setBlogs(blogRes.data);
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

  return (
    <div className="space-y-8">
       {/* Top Navigation Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
              { id: "live", title: "Live Activity", icon: "monitoring", val: generations.length + " logged" },
              { id: "broadcasts", title: "Broadcast Engine", icon: "campaign", val: broadcasts.length + " sent" },
              { id: "users", title: "User Directory", icon: "group", val: profiles.length + " users" },
              { id: "blog", title: "Blog CMS", icon: "edit_document", val: blogs.length + " posts" }
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
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">Master Directory</h2>
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="border-b border-[var(--border)] text-[var(--foreground-muted)] text-[11px] uppercase tracking-widest">
                            <th className="font-semibold p-4">Profile</th>
                            <th className="font-semibold p-4">Credits</th>
                            <th className="font-semibold p-4">Status</th>
                            <th className="font-semibold p-4">Joined</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                         {profiles.map(p => (
                             <tr key={p.id} className="hover:bg-[var(--background-secondary)]/50 transition-colors">
                                <td className="p-4">
                                   <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-[var(--accent-bg)] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold text-[var(--accent)] uppercase">
                                          {p.first_name ? p.first_name[0] : "?"}{p.last_name ? p.last_name[0] : ""}
                                      </div>
                                      <div>
                                         <p className="font-bold text-sm text-[var(--foreground)]">{p.first_name} {p.last_name}</p>
                                         <p className="text-xs text-[var(--foreground-muted)]">{p.email}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="p-4"><span className="text-sm font-bold text-[var(--foreground)]">{p.credits} <span className="text-[var(--accent)]">⚡</span></span></td>
                                <td className="p-4">
                                   <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${p.has_onboarded ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-500"}`}>
                                      {p.has_onboarded ? "Active" : "Ghost"}
                                   </span>
                                </td>
                                <td className="p-4 text-xs text-[var(--foreground-muted)]">
                                   {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(p.created_at))}
                                </td>
                             </tr>
                         ))}
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
