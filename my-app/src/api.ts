export const API_URL = "http://localhost:8080"; //change based on where backend is hosted**

export interface AuthResponse {
    token: string;
}

export interface UserProfile {
    id: number;
    email: string;
    bio?: string;
    joinedAt?: string;
    avatarUrl?: string;
}

// Signup Function
export async function signup(email: string, password: string): Promise<void> {
    const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw { status: res.status, message: text };
    }
}

// Login Function
export async function login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        throw new Error("Login failed");
    }

    const data: AuthResponse = await res.json();
    localStorage.setItem("token", data.token);
    return data;
}

// Get Profile Function
export async function getProfile(): Promise<UserProfile> {
    const token = localStorage.getItem("token");
    console.log(token);
    if (!token) throw new Error("No token");

    const res = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        throw new Error("Unauthorized");
    }

    return res.json();
}

// Update Profile Function
export async function updateProfile(data: { bio: string }) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");

    const res = await fetch(`${API_URL}/profile`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update profile");
    }
}

// Upload Avatar Function
export async function uploadAvatar(file: File) {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await fetch(`${API_URL}/profile/avatar`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
    });

    if (!res.ok) {
        throw new Error("Failed to upload avatar");
    }

    return res.json();
}
