"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ListOrdered, Trophy } from "lucide-react";

interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  rank: number;
  rankTitle: string;
  socialLevel: number;
  wins: number;
  winRate: number;
}

interface GlobalLeaderboardProps {
  currentUser?: any;
}

export default function GlobalLeaderboard({ currentUser }: GlobalLeaderboardProps) {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "all">("all");
  const [data, setData] = useState<{ rankings: LeaderboardEntry[]; userRank: LeaderboardEntry | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?limit=50&timeframe=${timeframe}`);
        const result = await res.json();
        if (result.success) {
          setData({
            rankings: result.rankings,
            userRank: result.userRank
          });
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeframe]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col gap-12">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[var(--foreground)]/5 border border-[var(--border)] mb-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="relative z-10">
              <path d="M18 4L22.45 13.01L32.4 14.46L25.2 21.48L26.9 31.39L18 26.71L9.1 31.39L10.8 21.48L3.6 14.46L13.55 13.01L18 4Z" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-[var(--foreground)] tracking-tight mb-4 flex items-center justify-center gap-4">
            Global Leaderboards
            <span className="px-2 py-1 rounded-xl bg-[var(--accent)]/20 text-[10px] font-black text-[var(--accent)] uppercase tracking-tighter border border-[var(--accent)]/20 animate-pulse">Live</span>
          </h2>
          <p className="text-[15px] md:text-[17px] text-[var(--foreground-muted)] max-w-xl mx-auto leading-relaxed">
            Ascend the ranks of the intellectual elite. Daily, Weekly, and All-Time duels recorded for history.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-4">
          {(['daily', 'weekly', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setTimeframe(tab)}
              className={`px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${
                timeframe === tab 
                  ? 'bg-[var(--secondary)] text-white shadow-xl shadow-[var(--secondary)]/20' 
                  : 'bg-[var(--foreground)]/5 text-[var(--foreground-muted)] hover:bg-[var(--foreground)]/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Podium Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end">
          {/* 2nd Place */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="order-2 md:order-1"
          >
            <PodiumCard rank={2} user={loading ? null : data?.rankings[1]} />
          </motion.div>

          {/* 1st Place */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="order-1 md:order-2"
          >
            <PodiumCard rank={1} user={loading ? null : data?.rankings[0]} />
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="order-3"
          >
            <PodiumCard rank={3} user={loading ? null : data?.rankings[2]} />
          </motion.div>
        </div>

        {/* List View */}
        <div className="bg-[var(--foreground)]/[0.02] border border-[var(--border)] rounded-[32px] overflow-hidden container-clay">
          <div className="flex items-center gap-4 px-8 py-6 border-b border-[var(--border)] bg-[var(--foreground)]/[0.02]">
            <ListOrdered size={18} strokeWidth={1.5} className="text-[var(--foreground-muted)]" />
            <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-widest">Global Rankings</h3>
          </div>
          
          <div className="divide-y divide-[var(--border)] max-h-[600px] overflow-y-auto custom-scrollbar">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 px-8 py-6 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-[var(--foreground)]/5" />
                  <div className="w-12 h-12 rounded-xl bg-[var(--foreground)]/5" />
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 bg-[var(--foreground)]/5 rounded" />
                    <div className="w-20 h-3 bg-[var(--foreground)]/5 rounded" />
                  </div>
                  <div className="w-16 h-6 bg-[var(--foreground)]/5 rounded" />
                </div>
              ))
            ) : data?.rankings.slice(3).map((user, idx) => (
              <RankingRow 
                key={user.userId} 
                user={user} 
                isMe={user.userId === currentUser?.id}
              />
            ))}
          </div>

          {/* Current User Fixed Row (if not in top results) */}
          <AnimatePresence>
            {!loading && data?.userRank && data.userRank.rank > 3 && (
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="sticky bottom-0 bg-[var(--background)] border-t border-[var(--secondary)]/30 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-20"
              >
                <div className="bg-[var(--secondary)]/5 px-8">
                  <RankingRow user={data.userRank} isMe={true} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PodiumCard({ rank, user }: { rank: number; user: LeaderboardEntry | null | undefined }) {
  const colors = {
    1: 'var(--foreground)',
    2: 'var(--foreground-muted)',
    3: 'var(--foreground-muted)'
  } as any;

  const heights = {
    1: 'h-[360px] md:h-[420px]',
    2: 'h-[320px] md:h-[350px]',
    3: 'h-[280px] md:h-[300px]'
  } as any;

  if (!user) {
    return <div className={`${heights[rank]} bg-[var(--foreground)]/[0.02] border border-dashed border-[var(--border)] rounded-[32px] animate-pulse`} />;
  }

  return (
    <div className="relative group">
      {rank === 1 && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
           <motion.div 
             animate={{ y: [0, -10, 0] }} 
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
           >
             <Trophy size={48} strokeWidth={1.5} className="text-[var(--foreground)] drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]" />
           </motion.div>
        </div>
      )}
      
      <div 
        className={`relative overflow-hidden ${heights[rank]} bg-[var(--background-secondary)] border border-[var(--border)] rounded-[40px] p-8 flex flex-col items-center justify-end transition-all duration-500 group-hover:border-[var(--foreground)]/30 group-hover:bg-[var(--foreground)]/[0.04] container-clay`}
        style={{
            boxShadow: rank === 1 ? '0 30px 60px -12px rgba(0,0,0,0.5)' : 'none'
        }}
      >
        <div className="absolute top-8 left-8">
          <span className="text-7xl font-black opacity-5 leading-none" style={{ color: colors[rank] }}>{rank}</span>
        </div>

        <div className="flex flex-col items-center text-center w-full relative z-10">
          <div className={`relative mb-6 ${rank === 1 ? 'w-24 h-24' : 'w-20 h-20'}`}>
            <div className="absolute inset-0 rounded-full animate-spin-slow opacity-10" style={{ border: `2px dashed ${colors[rank]}` }} />
            <div className="absolute inset-2 rounded-full overflow-hidden border-2 border-[var(--background)] bg-[var(--foreground)]/5 shadow-2xl">
              {user.avatar ? (
                <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-[var(--foreground)] uppercase">
                  {user.name[0]}
                </div>
              )}
            </div>
          </div>
          
          <h3 className="text-xl font-black text-[var(--foreground)] mb-1 leading-tight tracking-tight truncate w-full px-2">{user.name}</h3>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.2em] mb-6">{user.rankTitle} • Scholar Level {user.socialLevel}</p>
          
          <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-[var(--border)]">
            <div>
              <p className="text-[9px] font-black text-[var(--foreground-muted)] uppercase tracking-tighter mb-1">Scholar XP</p>
              <p className="text-lg font-black text-[var(--foreground)] tracking-tighter">{user.xp.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-[var(--foreground-muted)] uppercase tracking-tighter mb-1">Win Rate</p>
              <p className="text-lg font-black text-[var(--foreground)] tracking-tighter">{Math.round(user.winRate)}%</p>
            </div>
          </div>
        </div>

        <div 
            className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-10" 
            style={{ backgroundColor: colors[rank] }}
        />
      </div>
    </div>
  );
}

function RankingRow({ user, isMe }: { user: LeaderboardEntry; isMe?: boolean }) {
  return (
    <div className={`flex items-center gap-6 px-8 py-6 transition-colors hover:bg-[var(--foreground)]/[0.03] ${isMe ? 'bg-[var(--secondary)]/5' : ''}`}>
      <div className="w-10 text-center flex-shrink-0">
        <span className={`text-lg font-black ${user.rank <= 5 ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}`}>
          #{user.rank}
        </span>
      </div>
      
      <div className="w-12 h-12 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--foreground)]/5 flex-shrink-0">
        {user.avatar ? (
          <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-black text-[var(--foreground)]">
            {user.name[0]}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-black text-[var(--foreground)] truncate">{user.name}</h4>
          {isMe && (
            <span className="px-2 py-0.5 rounded-md bg-[var(--secondary)] text-[8px] font-black text-white uppercase tracking-tighter shadow-lg shadow-[var(--secondary)]/20">
              You
            </span>
          )}
        </div>
        <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider truncate">
          {user.rankTitle} • Level {user.socialLevel}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-base font-black text-[var(--foreground)] leading-tight">{user.xp.toLocaleString()}</p>
        <p className="text-[9px] font-bold text-[var(--secondary)] uppercase tracking-widest">Scholar XP</p>
      </div>

      <div className="hidden md:block w-24 text-right flex-shrink-0 border-l border-[var(--border)] pl-4">
        <p className="text-sm font-black text-[var(--success)] leading-tight">{user.wins} Wins</p>
        <p className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-tighter">
          {Math.round(user.winRate)}% Rate
        </p>
      </div>
    </div>
  );
}
