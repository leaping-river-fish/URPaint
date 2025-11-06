// TO DO: Add edit feature to images
import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import { rectSortingStrategy } from "@dnd-kit/sortable";
import { GripVertical, Download, Share2 } from "lucide-react";
import Toast from "./components/Toast";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Drawing {
    id: number;
    url: string;
    editUrl?: string | null;
    uploadedAt: string;
    title?: string;
}

interface SortableItemProps {
    drawing: Drawing;
    onClick: (d: Drawing) => void;
}

function SortableItem({ drawing, onClick }: SortableItemProps) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = /Mobi|Android/i.test(navigator.userAgent);
        setIsMobile(checkMobile);
    }, []);

    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: drawing.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: "none" as const,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...(!isMobile ? listeners : {})}
            {...attributes}
            className="relative group cursor-grab active:cursor-grabbing"
        >
            <img 
                src={drawing.url}
                alt="Drawing"
                className="w-full h-auto rounded-2xl shadow-md cursor-pointer"
                onClick={() => onClick(drawing)}
            />

            <div
                {...(isMobile ? listeners : {})}
                className="absolute top-2 left-2 bg-white/70 text-slate-700 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition cursor-grab active:cursor-grabbing"
            >
                <GripVertical size={16} />
            </div>
        </div>
    );
}

function Gallery() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [selected, setSelected] = useState<Drawing | null>(null);
    const [toast, setToast] = useState<{ message: string; type?: string } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }),
    useSensor(KeyboardSensor)
    );

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:8080/gallery", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Failed to fetch gallery");

                const data = await res.json();
                setDrawings(Array.isArray(data) ? data.map((d: any) => ({
                    id: d.id,
                    url: d.image_url || d.url,
                    editUrl: d.edit_url || d.editUrl || null,
                    uploadedAt: d.uploadedAt || d.uploaded_at,
                    title: d.title,
                })) : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchGallery();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/gallery/delete?id=${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error("Failed to delete drawing");

            setDrawings((prev) => prev.filter((d) => d.id !== id));
            setSelected(null);
            setToast({ message: "Drawing deleted successfully!", type: "success" });
        } catch (err) {
            console.error(err);
            setToast({ message: "Error deleting drawing", type: "error" });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setDrawings((items) => {
            const oldIndex = items.findIndex((i) => i.id === Number(active.id));
            const newIndex = items.findIndex((i) => i.id === Number(over.id));
            const newItems = arrayMove(items, oldIndex, newIndex);

            const token = localStorage.getItem("token");
            const newOrder = newItems.map((item) => item.id);

            fetch("http://localhost:8080/gallery/reorder", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ order: newOrder }),
            }).catch((err) => console.error("Failed to update order:", err));

            return newItems;
        });
    };
    
    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-100 to-pink-100 flex">
            {/* Sidebar */}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col">
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
                    <h1 className="text-2xl font-bold text-slate-800">Gallery</h1>
                </header>

                {/* Gallery Grid */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={drawings.map(d => d.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-6 lg:ml-52 min-h-[60vh]">
                            {drawings?.length > 0 ? (
                                drawings.map(d => (
                                    <SortableItem key={d.id} drawing={d} onClick={setSelected} />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center w-full col-span-full text-center text-2xl sm:text-3xl font-bold text-slate-700 py-20">
                                    Your gallery is empty… 🌟 Start creating some amazing drawings!
                                </div>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>

                {selected && (
                    <div
                        className="fixed inset-0 flex justify-center items-center bg-black/50 z-50"
                        onClick={() => setSelected(null)}
                    >
                        <div
                            className="relative bg-white rounded-2xl shadow-2xl p-4 max-w-4xl w-[90%]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Action Buttons */}
                            <div className="absolute top-4 right-4 flex gap-3">
                                <div className="flex gap-3">
                                    <div className="text-xs text-slate-500 font-medium text-right mt-1">
                                        Tip: Download and print from your device for best results.
                                    </div>
                                    {/* Share Button */}
                                    <button
                                        onClick={async () => {
                                            if (navigator.share) {
                                            try {
                                                await navigator.share({
                                                title: selected.title || "My Drawing",
                                                text: "Check out my artwork!",
                                                url: selected.url,
                                                });
                                            } catch (err) {
                                                console.error("Share failed:", err);
                                            }
                                            } else {
                                            navigator.clipboard.writeText(selected.url);
                                                setToast({ message: "Link copied to clipboard!", type: "success" });
                                            }
                                        }}
                                        className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-md transition"
                                        title="Share"
                                    >
                                        <Share2 size={18} />
                                    </button>

                                    {/* Download Button */}
                                    <button
                                        onClick={async () => {
                                            try {
                                                const response = await fetch(selected.url);
                                                const blob = await response.blob();

                                                const blobUrl = URL.createObjectURL(blob);
                                                const link = document.createElement("a");
                                                link.href = blobUrl;
                                                link.download = (selected.title || "drawing") + ".png";
                                                link.click();

                                                URL.revokeObjectURL(blobUrl);
                                            } catch (err) {
                                                console.error("Download failed:", err);
                                                setToast({ message: "Failed to download image. Please try again.", type: "error" })
                                            }
                                        }}
                                        className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-md transition"
                                        title="Download"
                                    >
                                        <Download size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Image */}
                            <img
                                src={selected.url}
                                alt={selected.title || "Drawing"}
                                className="max-h-[75vh] w-auto mx-auto rounded-lg shadow-md"
                            />

                            {/* Footer Info */}
                            <div className="flex justify-between items-center mt-4">
                                <span className="text-slate-700 font-medium text-lg">
                                    {selected.title || "Untitled"}
                                </span>
                                <div className="flex gap-2">
                                    {/* Edit Button */}
                                    <button
                                        onClick={() => {
                                            sessionStorage.setItem("studio-edit-id", String(selected.id));
                                            sessionStorage.setItem("studio-edit-url", (selected as any).editUrl || selected.url);
                                            window.location.href = "/studio";
                                        }}
                                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition"
                                    >
                                        Edit
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => {
                                            setDeleteTarget(selected.id);
                                            setShowDeleteConfirm(true);
                                        }}
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteConfirm && (
                    <div
                        className="fixed inset-0 flex justify-center items-center bg-black/50 z-50"
                        onClick={() => setShowDeleteConfirm(false)}
                    >
                        <div
                            className="bg-white p-6 rounded-2xl shadow-2xl text-center w-[90%] max-w-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Delete Drawing?</h2>
                            <p className="text-slate-600 mb-6">
                                Are you sure you want to delete this drawing? This action cannot be undone.
                            </p>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 rounded-lg bg-slate-300 hover:bg-slate-400 text-slate-800 font-medium"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={() => {
                                        if (deleteTarget) handleDelete(deleteTarget);
                                        setShowDeleteConfirm(false);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium"          
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type as any}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        </div>
    )

}

export default Gallery;