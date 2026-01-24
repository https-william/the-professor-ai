
import React, { useState } from 'react';
import { supabase } from '../../services/supabase';

// Simple Markdown Editor for now
export const BlogCMS: React.FC = () => {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('');
    const [published, setPublished] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.from('blog_posts').insert({
                title,
                slug,
                content,
                published,
                author: 'The Professor Team',
                created_at: new Date().toISOString()
            });

            if (error) throw error;
            alert('Post saved successfully!');
            setTitle('');
            setSlug('');
            setContent('');
        } catch (e: any) {
            alert('Error saving post: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate slug from title
    const handleTitleChange = (t: string) => {
        setTitle(t);
        setSlug(t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="flex flex-col gap-6 h-full">
                <div className="glass-container p-6">
                    <h2 className="text-xl font-bold font-serif mb-6">Article Metadata</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Slug (URL)</label>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-gray-400 font-mono text-sm focus:border-blue-500 outline-none transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="publish"
                                checked={published}
                                onChange={(e) => setPublished(e.target.checked)}
                                className="w-5 h-5 rounded bg-black/20 border-white/10 checked:bg-blue-500"
                            />
                            <label htmlFor="publish" className="text-sm font-bold text-white select-none cursor-pointer">Publish Immediately</label>
                        </div>
                    </div>
                </div>

                <div className="glass-container flex-1 p-0 flex flex-col relative">
                    <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Content (Markdown)</span>
                    </div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="flex-1 w-full bg-transparent p-6 text-white font-mono text-sm resize-none outline-none focus:bg-white/5 transition-colors"
                        placeholder="# Start writing..."
                    />
                </div>
            </div>

            <div className="flex flex-col gap-6 h-full">
                <div className="glass-container flex-1 p-8 bg-white text-black overflow-y-auto font-serif">
                    {/* Preview Area - Basic Rendering */}
                    <span className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-8 border-b pb-2">Live Preview</span>
                    <h1 className="text-4xl font-bold mb-4">{title || 'Untitled Post'}</h1>
                    <div className="prose prose-lg">
                        {content.split('\n').map((line, i) => (
                            <p key={i} className="mb-4">{line}</p>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={loading || !title}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-xl shadow-xl transition-all disabled:opacity-50"
                >
                    {loading ? 'Publishing...' : 'Save & Publish'}
                </button>
            </div>
        </div>
    );
};
