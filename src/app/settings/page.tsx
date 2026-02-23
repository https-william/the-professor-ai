"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";

export default function SettingsPage() {
    const { user } = useUser();
    const { theme, resolvedTheme, toggleTheme } = useTheme();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState("profile");

    const [settings, setSettings] = useState({
        name: user.name,
        email: "scholar@example.com",
        notifications: true,
        studyReminders: true,
        weeklyDigest: true,
        language: "English",
        timezone: "UTC+1",
        studyGoal: 30,
    });

    const handleSave = async () => {
        setSaving(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleDeleteAccount = () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            if (window.confirm("This will permanently delete all your study data. Last chance.")) {
                alert("Account deletion scheduled (simulated).");
            }
        }
    };

    const handleLogoutAll = () => {
        if (confirm("Sign out of all other devices?")) {
            alert("Signed out of 2 other sessions.");
        }
    };

    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") setDeferredPrompt(null);
        } else {
            alert("To install, use your browser's menu (e.g. 'Add to Home Screen' or 'Install The Professor').");
        }
    };

    const router = useRouter();

    const sections = [
        { id: "profile", icon: "person", label: "Profile" },
        { id: "billing", icon: "account_balance_wallet", label: "Billing & Credits" },
        { id: "notifications", icon: "notifications", label: "Notifications" },
        { id: "preferences", icon: "tune", label: "Preferences" },
        { id: "appearance", icon: "palette", label: "Appearance" },
        { id: "pwa", icon: "install_mobile", label: "Install App" },
        { id: "danger", icon: "warning", label: "Danger Zone" },
    ];

    const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-[var(--accent)]" : "bg-[var(--background-tertiary)]"}`}
        >
            <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "left-[22px]" : "left-0.5"}`}
            />
        </button>
    );

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Ambient Blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="blob blob-coral absolute w-[400px] h-[400px] top-[20%] right-[30%] animate-float" />
            </div>

            {/* Main */}
            <main>
                {/* Header */}
                <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-8 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[var(--accent)] text-xl">settings</span>
                        </div>
                        <div>
                            <h1 className="text-base font-medium text-[var(--foreground)]">Settings</h1>
                            <p className="text-xs text-[var(--foreground-secondary)]">Customize your experience</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
                            title={resolvedTheme === "light" ? "Switch to dark" : "Switch to light"}
                        >
                            <span className="material-symbols-outlined text-xl">
                                {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
                            </span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${saved
                                ? "bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30"
                                : "bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)] shadow-md"
                                }`}
                        >
                            {saving ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                    Saving...
                                </>
                            ) : saved ? (
                                <>
                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">save</span>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </header>

                <div className="flex">
                    {/* Settings Nav */}
                    <nav className="w-56 p-6 border-r border-[var(--border)] shrink-0">
                        <div className="space-y-1">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => {
                                        if (section.id === "billing") {
                                            router.push("/settings/billing");
                                        } else {
                                            setActiveSection(section.id);
                                        }
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${activeSection === section.id
                                        ? "bg-[var(--accent-bg)] text-[var(--accent)]"
                                        : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]"
                                        }`}
                                >
                                    <span className={`material-symbols-outlined text-lg ${section.id === "danger" ? "text-[var(--danger)]" : ""}`}>
                                        {section.icon}
                                    </span>
                                    {section.label}
                                </button>
                            ))}
                        </div>
                    </nav>

                    {/* Settings Content */}
                    <div className="flex-1 p-8 max-w-2xl">
                        {activeSection === "profile" && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div>
                                    <h2 className="text-lg font-medium text-[var(--foreground)] mb-1">Profile</h2>
                                    <p className="text-sm text-[var(--foreground-secondary)]">Manage your account information</p>
                                </div>

                                <div className="flex items-center gap-6 p-6 card">
                                    <div className="w-20 h-20 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-white text-4xl font-bold">
                                        {user.avatar}
                                    </div>
                                    <div>
                                        <h3 className="text-[var(--foreground)] font-medium mb-1">{settings.name}</h3>
                                        <p className="text-xs text-[var(--foreground-secondary)] mb-3">{settings.email}</p>
                                        <button className="text-xs text-[var(--accent)] hover:opacity-80 transition-opacity">
                                            Change Avatar
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-[var(--foreground-secondary)] mb-1.5 block">Display Name</label>
                                        <input
                                            type="text"
                                            value={settings.name}
                                            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--foreground-secondary)] mb-1.5 block">Email</label>
                                        <input
                                            type="email"
                                            value={settings.email}
                                            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--foreground-secondary)] mb-1.5 block">Password</label>
                                        <button className="text-sm text-[var(--accent)] hover:opacity-80 transition-opacity">
                                            Change Password →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "notifications" && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div>
                                    <h2 className="text-lg font-medium text-[var(--foreground)] mb-1">Notifications</h2>
                                    <p className="text-sm text-[var(--foreground-secondary)]">Choose what updates you receive</p>
                                </div>

                                <div className="card divide-y divide-[var(--border)]">
                                    <div className="flex items-center justify-between p-5">
                                        <div>
                                            <h3 className="text-[var(--foreground)] font-medium mb-0.5">Push Notifications</h3>
                                            <p className="text-xs text-[var(--foreground-secondary)]">Get notified on your device</p>
                                        </div>
                                        <Toggle enabled={settings.notifications} onChange={() => setSettings({ ...settings, notifications: !settings.notifications })} />
                                    </div>
                                    <div className="flex items-center justify-between p-5">
                                        <div>
                                            <h3 className="text-[var(--foreground)] font-medium mb-0.5">Study Reminders</h3>
                                            <p className="text-xs text-[var(--foreground-secondary)]">Daily reminders to hit your goals</p>
                                        </div>
                                        <Toggle enabled={settings.studyReminders} onChange={() => setSettings({ ...settings, studyReminders: !settings.studyReminders })} />
                                    </div>
                                    <div className="flex items-center justify-between p-5">
                                        <div>
                                            <h3 className="text-[var(--foreground)] font-medium mb-0.5">Weekly Digest</h3>
                                            <p className="text-xs text-[var(--foreground-secondary)]">Summary of your weekly progress</p>
                                        </div>
                                        <Toggle enabled={settings.weeklyDigest} onChange={() => setSettings({ ...settings, weeklyDigest: !settings.weeklyDigest })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "preferences" && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div>
                                    <h2 className="text-lg font-medium text-[var(--foreground)] mb-1">Preferences</h2>
                                    <p className="text-sm text-[var(--foreground-secondary)]">Customize your study experience</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 card">
                                        <label className="text-xs text-[var(--foreground-secondary)] mb-3 block">Daily Study Goal (minutes)</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="10"
                                                max="120"
                                                step="5"
                                                value={settings.studyGoal}
                                                onChange={(e) => setSettings({ ...settings, studyGoal: parseInt(e.target.value) })}
                                                className="flex-1 accent-[var(--accent)]"
                                            />
                                            <span className="w-16 text-center text-[var(--foreground)] font-medium">{settings.studyGoal} min</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-[var(--foreground-muted)] mt-1">
                                            <span>10 min</span>
                                            <span>120 min</span>
                                        </div>
                                    </div>

                                    <div className="p-5 card">
                                        <label className="text-xs text-[var(--foreground-secondary)] mb-2 block">Language</label>
                                        <select
                                            value={settings.language}
                                            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                            className="w-full px-4 py-3 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none cursor-pointer"
                                        >
                                            <option>English</option>
                                            <option>Spanish</option>
                                            <option>French</option>
                                            <option>German</option>
                                        </select>
                                    </div>

                                    <div className="p-5 card">
                                        <label className="text-xs text-[var(--foreground-secondary)] mb-2 block">Timezone</label>
                                        <select
                                            value={settings.timezone}
                                            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                            className="w-full px-4 py-3 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none cursor-pointer"
                                        >
                                            <option>UTC+1 (Central European)</option>
                                            <option>UTC+0 (GMT)</option>
                                            <option>UTC-5 (Eastern)</option>
                                            <option>UTC-8 (Pacific)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "appearance" && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div>
                                    <h2 className="text-lg font-medium text-[var(--foreground)] mb-1">Appearance</h2>
                                    <p className="text-sm text-[var(--foreground-secondary)]">Customize how the app looks</p>
                                </div>

                                <div className="card p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-[var(--foreground)] font-medium mb-0.5">Dark Mode</h3>
                                            <p className="text-xs text-[var(--foreground-secondary)]">Switch between light and dark themes</p>
                                        </div>
                                        <Toggle enabled={theme === "dark"} onChange={toggleTheme} />
                                    </div>
                                </div>

                                <div className="p-5 card">
                                    <label className="text-xs text-[var(--foreground-secondary)] mb-3 block">Theme Color</label>
                                    <div className="flex gap-3">
                                        {["coral", "teal", "amber", "blue"].map((color) => (
                                            <button
                                                key={color}
                                                className={`w-10 h-10 rounded-xl transition-transform hover:scale-110 ${color === "coral" ? "bg-[#F4845F] ring-2 ring-[var(--accent)]/30 ring-offset-2 ring-offset-[var(--background)]" :
                                                    color === "teal" ? "bg-teal-500" :
                                                        color === "amber" ? "bg-amber-500" :
                                                            "bg-blue-500"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-[var(--foreground-muted)] mt-2">Coming soon</p>
                                </div>
                            </div>
                        )}

                        {activeSection === "pwa" && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div>
                                    <h2 className="text-lg font-medium text-[var(--foreground)] mb-1">Install App</h2>
                                    <p className="text-sm text-[var(--foreground-secondary)]">Get the full experience on your device</p>
                                </div>

                                <div className="card p-8 text-center flex flex-col items-center gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-xl shadow-[#6366F1]/20">
                                        <span className="text-white text-4xl font-bold">P</span>
                                    </div>
                                    <div className="max-w-xs mx-auto">
                                        <h3 className="text-[var(--foreground)] font-semibold mb-2">The Professor Desktop & Mobile</h3>
                                        <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">
                                            Install our Progressive Web App for faster access, offline mode, and a native app experience.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleInstall}
                                        className="px-8 py-3 rounded-xl bg-[var(--accent)] text-white font-bold shadow-lg shadow-[var(--accent)]/20 hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">download</span>
                                        Install Now
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSection === "danger" && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div>
                                    <h2 className="text-lg font-medium text-[var(--foreground)] mb-1">Danger Zone</h2>
                                    <p className="text-sm text-[var(--foreground-secondary)]">Irreversible actions</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 card border-[var(--danger)]/20">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-[var(--foreground)] font-medium mb-0.5">Export Data</h3>
                                                <p className="text-xs text-[var(--foreground-secondary)]">Download all your data</p>
                                            </div>
                                            <button className="px-4 py-2 rounded-xl bg-[var(--background-tertiary)] text-[var(--foreground)] text-sm hover:bg-[var(--background-secondary)] transition-colors">
                                                Export
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-5 card border-[var(--danger)]/20">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-[var(--foreground)] font-medium mb-0.5">Log Out All Devices</h3>
                                                <p className="text-xs text-[var(--foreground-secondary)]">Sign out from all sessions</p>
                                            </div>
                                            <button
                                                onClick={handleLogoutAll}
                                                className="px-4 py-2 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-sm hover:bg-[var(--danger)]/20 transition-colors"
                                            >
                                                Log Out All
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-5 card border-[var(--danger)]/30">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-[var(--danger)] font-medium mb-0.5">Delete Account</h3>
                                                <p className="text-xs text-[var(--foreground-secondary)]">Permanently delete your account and all data</p>
                                            </div>
                                            <button
                                                onClick={handleDeleteAccount}
                                                className="px-4 py-2 rounded-xl bg-[var(--danger)] text-white text-sm hover:opacity-90 transition-opacity"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
