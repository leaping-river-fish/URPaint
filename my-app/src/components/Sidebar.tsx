import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import URPaintLogo from "./URPaintLogo";
import { getProfile, type UserProfile } from "../api";

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const cached = localStorage.getItem("userProfile");
        if (cached) {
            try {
                setProfile(JSON.parse(cached));
            } catch {
                console.warn("Failed to parse cached profile");
            }
        } else {
            const fetchProfile = async () => {
                try {
                    const data = await getProfile();
                    setProfile(data);
                    localStorage.setItem("userProfile", JSON.stringify(data));
                } catch (err) {
                    console.error("Failed to fetch profile:", err);
                }
            };
            fetchProfile();
        }
    }, []);

    return (
        <>
            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-screen bg-white shadow-lg transform ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } lg:translate-x-0 w-52 flex flex-col justify-between transition-transform duration-300 z-40`}
            >

            {/* Top Section */}
            <div>
                <div className="flex items-center justify-center py-6 border-b border-gray-200">
                    <div
                        onClick={() => navigate("/hub")}
                        className="cursor-pointer flex items-center justify-center"
                    >
                        <URPaintLogo className="w-24 h-auto" />
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col mt-6 space-y-2 px-3">
                    <button
                        onClick={() => navigate("/hub")}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-slate-700 hover:bg-sky-100 hover:scale-105 transition-transform"
                    >
                        🚀 <span className="font-medium">Hub</span>
                    </button>
                    <button
                        onClick={() => navigate("/studio")}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-slate-700 hover:bg-green-100 hover:scale-105 transition-transform"
                    >
                        🎨 <span className="font-medium">Studio</span>
                    </button>

                    <button
                        onClick={() => navigate("/gallery")}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-slate-700 hover:bg-pink-100 hover:scale-105 transition-transform"
                    >
                        🖼️ <span className="font-medium">Gallery</span>
                    </button>
                </nav>
            </div>

            {/* Profile Section */}
            <div className="border-t border-gray-200 p-4 flex items-center gap-3">
                <button
                    onClick={() => navigate("/profile")}
                    className="button-pop button-bounce w-10 h-10 rounded-full overflow-hidden bg-gray-200 hover:ring-2 hover:ring-sky-400 flex-shrink-0"
                >
                    {profile?.avatarUrl ? (
                    <img
                        src={profile.avatarUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 text-gray-500 mx-auto my-auto"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM4 16a6 6 0 1112 0H4z" />
                        </svg>
                    )}
                </button>
                <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                        {profile?.email || "User"}
                    </p>
                </div>
            </div>
        </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </>
    );
}

export default Sidebar;