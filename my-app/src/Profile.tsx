import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL ,getProfile, updateProfile, type UserProfile } from "./api.ts";

function Profile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const cached = localStorage.getItem("userProfile");
        if (cached) {
        try {
            setProfile(JSON.parse(cached));
        } catch {
            console.warn("Failed to parse cached profile");
        }
        }

        const fetchProfile = async () => {
            try {
                const fresh = await getProfile();
                setProfile(fresh);
                localStorage.setItem("userProfile", JSON.stringify(fresh));
            } catch (err) {
                console.error("Profile fetch failed:", err);
                navigate("/login");
            }
        };

        fetchProfile();
    }, [navigate]);

    // Handle Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userProfile");
        navigate("/login");
    };

    // Handle bio change
    const handleBioChange = (newBio: string) => {
        if (!profile) return;
        setProfile({ ...profile, bio: newBio });
        
        // Debounce
        if (debounceTimer) clearTimeout(debounceTimer);
        const timer = setTimeout(() => saveBio(newBio), 500);
        setDebounceTimer(timer);
    }

    // Save bio
    const saveBio = async (bio: string) => {
        if (!profile) return;
        setSaving(true);
        try {
            await updateProfile({ bio });
        } catch (err) {
            console.error("Failed to save bio:", err);
        } finally {
            setSaving(false);
        }
    };

    // Handle avatar change
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !profile) return;

        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const newProfile = { ...profile, avatarUrl: reader.result as string };
            setProfile(newProfile);
            localStorage.setItem("userProfile", JSON.stringify(newProfile));
        };
        reader.readAsDataURL(file);

        // const formData = new FormData();
        // formData.append("avatar", file);

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("No token");

            const res = await fetch(`${API_URL}/profile/avatar`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: (() => {
                    const formData = new FormData();
                    formData.append("avatar", file);
                    return formData;
                })(),
            });

            if (!res.ok) {
                throw new Error("Failed to upload avatar");
            }

            const data = await res.json();

            const updated = { ...profile, avatarUrl: data.avatarUrl };
            setProfile(updated);
            localStorage.setItem("userProfile", JSON.stringify(updated));

        } catch (err) {
            console.error("Avatar upload failed:", err);
        }
    }

    if (!profile) {
        return (
        <div className="flex justify-center items-center h-full p-8">
            <p className="text-gray-500">Loading profile...</p>
        </div>
        );
    }

    return (
        <div className="p-8 min-h-screen bg-gradient-to-b from-sky-100 to-pink-100 flex justify-center">

            {/* Back to Hub Button */}
            <button
                onClick={() => navigate("/hub")}
                className="button-pop button-bounce absolute top-6 left-6 flex items-center space-x-1 px-3 py-2 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-600 shadow-md transition"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Hub</span>
            </button>

            <div className="w-full max-w-md bg-white shadow rounded-lg p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 relative">
                        {/* Avatar */}
                        {profile.avatarUrl ? (
                            <img
                                src={profile.avatarUrl}
                                alt="Avatar"
                                className="w-24 h-24 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4" />
                        )}

                        <input
                            id="avatarUpload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                        <label
                            htmlFor="avatarUpload"
                            className="absolute inset-0 flex items-center justify-center rounded-full 
                                    bg-black/40 opacity-0 hover:opacity-100 cursor-pointer 
                                    transition-opacity duration-200"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-6 h-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                >
                                <path d="M4 5a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2.586l-.707-.707A1 1 0 0012.586 4H7.414a1 1 0 00-.707.293L6 5H4z" />
                                <path d="M10 8a4 4 0 100 8 4 4 0 000-8z" />
                            </svg>
                        </label>
                    </div>
                <h2 className="text-lg font-bold">
                    {/* Name */}
                    {profile.email}
                </h2>
                </div>

                {/* Profile details */}
                <div className="mt-6 space-y-4 text-gray-700">

                    {/* Joined date */}
                    <div>
                        <p className="text-sm font-semibold">Joined</p>
                        <p className="text-sm">
                            {profile.joinedAt // FIX THIS IN BACKEND
                                ? new Date(profile.joinedAt).toLocaleDateString()
                                : "Unknown"}
                        </p>
                    </div>

                    {/* Editable Bio */}
                    <div>
                        <p className="text-sm font-semibold mb-1">Bio</p>
                        <textarea
                            value={profile.bio}
                            onChange={(e) => handleBioChange(e.target.value)}
                            placeholder="Write something about yourself..."
                            className="w-full border border-gray-300 rounded p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                        />
                        {saving && <p className="text-xs text-gray-500 mt-1">Saving...</p>}
                    </div>
                </div>

                {/* Placeholder for extra details */}
                <div className="mt-6 space-y-2 text-gray-700">
                    <p className="text-sm">Additional details go here</p>
                </div>

                {/* Actions */}
                <div className="mt-6">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Confirm logout Modal */}
            {showLogoutModal && (
                <div 
                    className="fixed inset-0 flex items-center justify-center bg-black/40"
                    onClick={() => setShowLogoutModal(false)}
                >
                    <div 
                        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-4">Confirm Logout</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to log out?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="button-pop button-bounce px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="button-pop button-bounce px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Profile;


