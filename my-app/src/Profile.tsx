import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, type UserProfile } from "./api.ts";

function Profile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        getProfile()
            .then(setProfile)
            .catch(() => navigate("/login"));
    }, [navigate]);

    return (
        <div className="p-8">
            <h1 className="text-x1 font-bold mb-4">Profile</h1>

            {profile ? (
                <pre>{JSON.stringify(profile, null, 2)}</pre>
                ) : (
                    <p>Loading...</p>
                )}
        </div>
    );
}

export default Profile;


