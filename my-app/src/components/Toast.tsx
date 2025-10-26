// TO DO: fix animations
import { useEffect, useState } from "react";

interface ToastProps {
    message: string;
    type?: "success" | "error" | "info";
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type = "info", onClose, duration = 3000, }: ToastProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer1 = setTimeout(() => setVisible(false), duration - 100);
        const timer2 = setTimeout(onClose, duration);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [duration, onClose]);

    const barColor = 
        type === "success"
            ? "bg-emerald-500"
            : type === "error"
            ? "bg-red-500"
            : "bg-sky-500";

    return (
        <div
            className={`fixed top-4 right-4 z-50 w-80 max-w-[90%] rounded-lg shadow-lg overflow-hidden
            ${visible ? "fade-in" : "fade-out"}`}
        >
            <div className="bg-white p-4 flex items-center justify-between">
                <span className="text-gray-800">{message}</span>
            </div>

            <div
                className={`h-1 w-full origin-left ${barColor} progress`}
                style={{ animationDuration: `${duration}ms` }}
            />
        </div>
    );
}


