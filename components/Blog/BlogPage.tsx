
import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { marked } from 'marked';
import { SEOHead } from '../SEOHead';
import { BrandLogo } from '../BrandLogo';

// Add marked type definition if missing or just use require
// For now assuming marked is available globally or pkg installed

export const BlogPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            const { data } = await supabase.from('blog_posts').select('*').eq('published', true).order('created_at', { ascending: false });
            setPosts(data || []);
            setLoading(false);
        };
        fetchPosts();
    }, []);

    return (
        <div className="min-h-screen bg-core text-text-pri">
            <SEOHead
                title="The Professor Blog - Study Tips & AI Learning"
                description="Latest articles on fast learning techniques, AI study tools, and exam preparation strategies for students."
            />

            <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-panel)] backdrop-blur-xl border-b border-[var(--border-main)] py-4">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <button onClick={() => onNavigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8"><BrandLogo /></div>
                        <span className="font-bold text-lg font-serif">The Professor</span>
                    </button>
                    <button onClick={() => onNavigate('/')} className="text-xs font-bold uppercase tracking-widest text-text-sec hover:text-text-pri">Back to Home</button>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <header className="text-center mb-16">
                    <span className="text-blue-500 font-mono text-xs uppercase tracking-widest mb-2 block">The Press Room</span>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Study Smarter, Not Harder.</h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">Insights on learning science, AI technology, and academic performance.</p>
                </header>

                {loading ? (
                    <div className="space-y-8 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-white/5 rounded-2xl"></div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-12">
                        {posts.length === 0 ? (
                            <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/5">
                                <p className="text-gray-500 font-mono">No articles published yet.</p>
                            </div>
                        ) : (
                            posts.map(post => (
                                <article key={post.id} className="group cursor-pointer border-b border-white/5 pb-12 hover:border-blue-500/50 transition-colors" onClick={() => onNavigate(`/blog/${post.slug}`)}>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 font-mono mb-3">
                                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{post.author || 'The Professor Team'}</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold font-serif mb-3 group-hover:text-blue-400 transition-colors">{post.title}</h2>
                                    <p className="text-gray-400 leading-relaxed mb-4 line-clamp-3">{post.excerpt || post.content.substring(0, 150)}...</p>
                                    <span className="text-blue-500 font-bold text-xs uppercase tracking-widest group-hover:underline">Read Article →</span>
                                </article>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};
