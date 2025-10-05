import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile, type UserProfile } from "./api.ts";

function Profile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        getProfile()
            .then((data) => {
                console.log("Profile data:", data);
                setProfile({
                    ...data,
                    bio: data.bio ?? "",
                    joinedAt: data.joinedAt ?? new Date().toISOString(),
                });
            })
            .catch((err) => {
                console.error("Profile fetch failed:", err);
                navigate("/login");
            });
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const handleBioChange = (newBio: string) => {
        if (!profile) return;
        setProfile({ ...profile, bio: newBio });
        
        // Debounce
        if (debounceTimer) clearTimeout(debounceTimer);
        const timer = setTimeout(() => saveBio(newBio), 500);
        setDebounceTimer(timer);
    }

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

    if (!profile) {
        return (
        <div className="flex justify-center items-center h-full p-8">
            <p className="text-gray-500">Loading profile...</p>
        </div>
        );
    }

    return (
        <div className="p-8 flex justify-center">
            <div className="w-full max-w-md bg-white shadow rounded-lg p-6">
                {/* Profile picture + name */}
                <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mb-4" />
                <h2 className="text-lg font-bold">
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
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
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


