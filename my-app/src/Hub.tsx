import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, type UserProfile } from "./api";
import URPaintLogo from "./URPaintLogo";

function Hub() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfile();
                setProfile(data);
                localStorage.setItem("userProfile", JSON.stringify(data));
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                navigate("/login");
            }
            };

        fetchProfile();
    }, [navigate]);

    return(
        <div className="min-h-screen bg-gradient-to-b from-sky-100 to-pink-100 flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center p-6">
                <div className="flex items-center space-x-3">
                    <URPaintLogo className="w-28 h-auto" />
                    <h1 className="text-2xl font-bold text-slate-800">Hub</h1>
                </div>
                {/* Profile Avatar */}
                <button
                    onClick={() => navigate("/profile")}
                    className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center hover:ring-2 hover:ring-sky-400 overflow-hidden"
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
                            className="w-6 h-6 text-gray-700"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM4 16a6 6 0 1112 0H4z" />
                        </svg>
                    )}
                </button>
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center space-y-6 text-center p-4">
                <h2 className="text-3xl font-bold text-slate-700">Welcome to URPaint! 🎨</h2>
                <p className="text-slate-600 max-w-md">
                    Turn your favorite photos into fun coloring pages. Upload or snap a photo to get started!
                </p>

                <div className="flex space-x-4 mt-8">
                    <button
                        onClick={() => navigate("/create")}
                        className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow"
                    >
                        Upload Image
                    </button>
                    <button
                        className="px-6 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold shadow"
                    >
                        Take a Photo
                    </button>
                    <button
                        className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold shadow"
                    >
                        My Coloring Pages
                    </button>
                </div>
            </main>
        </div>
    );
}

export default Hub;