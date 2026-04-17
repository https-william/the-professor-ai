"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    PlusCircle, 
    X, 
    Users, 
    MessageSquareText, 
    GraduationCap, 
    Globe 
} from "lucide-react";

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (roomId: string, code: string) => void;
}

export default function CreateRoomModal({ isOpen, onClose, onCreated }: CreateRoomModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [roomType, setRoomType] = useState<'study_group' | 'review' | 'office_hours'>('study_group');
    const [isPublic, setIsPublic] = useState(true);
    const [maxMembers, setMaxMembers] = useState(10);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!name.trim() || name.length < 2) {
            setError("Room name must be at least 2 characters");
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const res = await fetch("/api/lobby", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    room_type: roomType,
                    is_public: isPublic,
                    max_members: maxMembers
                })
            });

            const data = await res.json();
            console.log("Create room response:", data);

            if (data.success) {
                console.log("Calling onCreated with:", data.room.id, data.room.code);
                onCreated(data.room.id, data.room.code);
                handleClose();
            } else {
                console.error("Create room error:", data.error);
                setError(data.error || "Failed to create room");
            }
        } catch (e) {
            setError("Network error. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        setName("");
        setDescription("");
        setRoomType('study_group');
        setIsPublic(true);
        setMaxMembers(10);
        setError(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="w-full max-w-md bg-[#0A0A0F] rounded-3xl border border-white/10 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                                        <PlusCircle size={20} strokeWidth={1.5} className="text-[#10B981]" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Create Study Room</h2>
                                        <p className="text-[10px] text-white/40">Start a collaborative session</p>
                                    </div>
                                </div>
                                <button onClick={handleClose} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all">
                                    <X size={20} strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5">
                            {/* Room Name */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                                    Room Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g., Physics Study Group"
                                    maxLength={50}
                                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 font-medium text-white placeholder:text-white/20 outline-none focus:border-[#10B981]/50 transition-all"
                                />
                            </div>

                            {/* Room Type */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                                    Room Type
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'study_group', label: 'Study Group', icon: Users },
                                        { id: 'review', label: 'Review', icon: MessageSquareText },
                                        { id: 'office_hours', label: 'Office Hours', icon: GraduationCap }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setRoomType(type.id as any)}
                                            className={`p-3 rounded-xl border text-center transition-all ${
                                                roomType === type.id
                                                    ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                                                    : 'bg-white/[0.02] border-white/5 text-white/40 hover:border-white/10'
                                            }`}
                                        >
                                            <type.icon size={18} strokeWidth={1.5} className="block mx-auto mb-1" />
                                            <span className="text-[10px] font-bold">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="What's this room about?"
                                    maxLength={200}
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 font-medium text-white placeholder:text-white/20 outline-none focus:border-[#10B981]/50 transition-all resize-none"
                                />
                            </div>

                            {/* Public/Private */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Globe size={20} strokeWidth={1.5} className="text-white/40" />
                                    <div>
                                        <p className="text-sm font-bold text-white">Public Room</p>
                                        <p className="text-[10px] text-white/30">Others can discover and join</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsPublic(!isPublic)}
                                    className={`w-12 h-7 rounded-full transition-all ${isPublic ? 'bg-[#10B981]' : 'bg-white/10'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Max Members */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                                    Max Members: {maxMembers}
                                </label>
                                <input
                                    type="range"
                                    min={2}
                                    max={50}
                                    value={maxMembers}
                                    onChange={e => setMaxMembers(parseInt(e.target.value))}
                                    className="w-full accent-[#10B981]"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={isCreating || !name.trim()}
                                    className="flex-1 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
                                    style={{
                                        background: "linear-gradient(135deg, #10B981, #059669)",
                                        color: "#fff",
                                        boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)"
                                    }}
                                >
                                    {isCreating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Creating...
                                        </span>
                                    ) : (
                                        "Create Room"
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
