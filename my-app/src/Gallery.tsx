import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
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
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Drawing {
    id: number;
    url: string;
    uploadedAt: string;
    title?: string;
}

interface SortableItemProps {
    drawing: Drawing;
    handleDelete: (id: number) => void;
}

function SortableItem({ drawing, handleDelete }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: drawing.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: "none",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="relative group cursor-grab active:cursor-grabbing"
        >
            <img
                src={drawing.url}
                alt="Drawing"
                className="w-full h-48 object-cover rounded-2xl shadow-md"
            />
            <button
                onClick={() => handleDelete(drawing.id)}
                className="absolute top-2 right-2 bg-red-500 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
            >
                Delete
            </button>
        </div>
    );
}

function Gallery() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [drawings, setDrawings] = useState<Drawing[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
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
        if (!confirm("Are you sure you want to delete this drawing?")) return;

        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8080/gallery/delete?id=${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            setDrawings(drawings.filter((d: any) => d.id !== id));
        } else {
            alert("Failed to delete drawing");
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        if (active.id !== over?.id) {
            setDrawings((items) => {
                const oldIndex = items.findIndex((i) => i.id === Number(active.id));
                const newIndex = items.findIndex((i) => i.id === Number(over.id));
                return arrayMove(items, oldIndex, newIndex);
            });
        }
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
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 lg:ml-52">
                            {drawings?.length > 0 ? (
                                drawings.map(d => (
                                    <SortableItem key={d.id} drawing={d} handleDelete={handleDelete} />
                                ))
                            ) : (
                                <div className="text-3xl font-bold text-slate-700">
                                    Your gallery is empty… 🌟 Start creating some amazing drawings!
                                </div>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    )

}

export default Gallery;