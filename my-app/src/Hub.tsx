import { useState } from "react";
import Sidebar from "./components/Sidebar";

function Hub() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return(
        <div className="min-h-screen bg-gradient-to-b from-sky-100 to-pink-100 flex flex-col">
            
            {/* Sidebar */}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Header */}
            <header className="flex items-center justify-between p-4 lg:pl-56">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 rounded-md hover:bg-sky-200"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-slate-800"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16m-7 6h7"
                        />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-slate-800">Hub</h1>
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center text-center p-6 lg:ml-52">
                <h2 className="text-3xl font-bold text-slate-700">
                    Welcome to URPaint! 🎨
                </h2>
                <p className="text-slate-600 max-w-md mt-4">
                    Turn your favorite photos into fun coloring pages. Upload or snap a
                    photo to get started!
                </p>
            </main>
        </div>
    );
}

export default Hub;