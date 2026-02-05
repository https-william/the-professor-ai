
import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { marked } from 'marked';
import { SEOHead } from '../SEOHead';
import { BrandLogo } from '../BrandLogo';

export const BlogPost: React.FC<{ slug: string, onNavigate: (path: string) => void }> = ({ slug, onNavigate }) => {
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [htmlContent, setHtmlContent] = useState('');

    useEffect(() => {
        const fetchPost = async () => {
            const { data } = await supabase.from('blog_posts').select('*').eq('slug', slug).single();
            if (data) {
                setPost(data);
                // Parse markdown securely (in real app sanitization is needed)
                const parsed = marked.parse(data.content);
                setHtmlContent(parsed as string);
            }
            setLoading(false);
        };
        fetchPost();
    }, [slug]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

    if (!post) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
            <h1 className="text-4xl font-bold mb-4 font-serif">Self-Destruct Sequence Initiated.</h1>
            <p className="text-gray-500 mb-8">Just kidding. But this article has vanished.</p>
            <button onClick={() => onNavigate('/blog')} className="text-blue-500 hover:underline">Return to Blog</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-core text-text-pri selection:bg-blue-500/30">
            <SEOHead
                title={post.title}
                description={post.excerpt || post.content.substring(0, 150)}
                type="article"
                path={`/blog/${slug}`}
            />

            <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-panel)] backdrop-blur-xl border-b border-[var(--border-main)] py-4">
                <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
                    <button onClick={() => onNavigate('/blog')} className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white flex items-center gap-2">
                        <span>←</span> Back
                    </button>
                    <button onClick={() => onNavigate('/')} className="w-8 h-8 opacity-50 hover:opacity-100 transition-opacity"><BrandLogo /></button>
                </div>
            </nav>

            <article className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
                <header className="mb-12 text-center">
                    <div className="flex items-center justify-center gap-3 text-xs text-gray-500 font-mono mb-6 uppercase tracking-widest">
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{post.author || 'The Professor Team'}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-8 leading-tight">{post.title}</h1>
                </header>

                <div
                    className="prose prose-invert prose-lg max-w-none prose-headings:font-serif prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-img:rounded-2xl"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />

                <div className="mt-20 pt-12 border-t border-white/10 text-center">
                    <h3 className="text-2xl font-serif font-bold mb-4">Ready to put this into practice?</h3>
                    <p className="text-gray-400 mb-8">The Professor automates everything you just read. Generate your first exam in seconds.</p>
                    <button onClick={() => onNavigate('/login')} className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest hover:scale-105 transition-transform">
                        Launch The Professor
                    </button>
                </div>
            </article>
        </div>
    );
};
