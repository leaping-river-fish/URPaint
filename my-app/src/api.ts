
const API_URL = "http://localhost:8080"; //change based on where backend is hosted**

export interface AuthResponse {
    token: string;
}

export interface UserProfile {
    id: number;
    email: string;
}

export async function signup(email: string, password: string): Promise<void> {
    const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),  
    });

    if (!res.ok) {
        throw new Error("Signup failed");
    }
}

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

export async function getProfile(): Promise<UserProfile> {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");

    const res = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        throw new Error("Unauthorized");
    }

    return res.json();
}
