import { useEffect, useRef, useState } from "react";
import { Undo2, Redo2, Brush, Move, X, Plus, Minus, Eraser, PaintBucket } from "lucide-react";
import { useDrawing } from "./DrawingContext";
import useIsMobile from "../../utils/useIsMobile";

export function DrawingToolbar({ 
    isErasing, setIsErasing, 
    isFilling, setIsFilling 
}: { 
    isErasing: boolean; 
    setIsErasing: React.Dispatch<React.SetStateAction<boolean>>; 
    isFilling: boolean; 
    setIsFilling: React.Dispatch<React.SetStateAction<boolean>>; 
}) {
    const { color, setColor, lineWidth, setLineWidth, undo, redo } = useDrawing();
    const [position, setPosition] = useState({ x: 250, y: 500 });
    const [dragging, setDragging] = useState(false);
    const offsetRef = useRef({ x: 0, y: 0 });
    const [isOpen, setIsOpen] = useState(false);
    const isMobile = useIsMobile();

    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        offsetRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragging) return;
        setPosition({
            x: e.clientX - offsetRef.current.x,
            y: e.clientY - offsetRef.current.y,
        });
    };

    const handleMouseUp = () => setDragging(false);

    useEffect (() => {
        if (dragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging]);

    const getCanvasAndCtx = () => {
        const canvas = document.querySelector("canvas");
        if (!canvas) return {};
        const ctx = canvas.getContext("2d");
        return { canvas, ctx };
    }

    {/* MOBILE */}

    if (isMobile) {
        return (
            <>
                {/* Floating toggle button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-sky-500 text-white shadow-lg hover:bg-sky-600"
                >
                    <Brush className="w-6 h-6" />
                </button>

                {/* Sidebar drawer */}
                <div
                    className={`fixed top-0 right-0 h-full w-64 bg-white shadow-2xl transform transition-transform duration-300 z-50 ${
                        isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
                >
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-lg font-semibold">Tools</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-full hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-4 p-4">
                        <label className="flex items-center justify-between">
                            <span>Color</span>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="appearance-none w-0 h-0 absolute opacity-0"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                                    input.click();
                                }}
                                className="w-8 h-8 rounded-full border-2 border-slate-400"
                                style={{ backgroundColor: color }}
                                title="Choose color"
                            />
                        </label>

                        <button
                            onClick={() => {
                                setIsErasing(!isErasing)
                                setIsFilling(false);
                            }}
                            className={`p-2 rounded-lg transition self-start ${
                                isErasing
                                ? "bg-sky-500 text-white shadow-md"
                                : "bg-sky-100 text-slate-700 hover:bg-sky-200"
                            }`}
                            title="Eraser"
                        >
                            <Eraser className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => {
                                setIsFilling(!isFilling);
                                setIsErasing(false);
                            }}
                            className={`p-2 rounded-lg transition self-start ${
                                isFilling
                                ? "bg-yellow-500 text-white shadow-md"
                                : "bg-sky-100 text-slate-700 hover:bg-sky-200"
                            }`}
                            title="Fill tool"
                        >
                            <PaintBucket className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-1 justify-between">
                            <span>Brush Size</span>
                            <button
                                onClick={() => setLineWidth((w) => Math.max(1, w - 1))}
                                className="px-2 py-1 bg-sky-100 rounded hover:bg-sky-200"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={lineWidth}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    val = val.replace(/^0+/, "");
                                    const num = val === "" ? 0 : parseInt(val);
                                    setLineWidth(Math.min(Math.max(num, 1), 50));
                                }}
                                className="w-16 border rounded-md text-center px-2 py-1 no-arrows"
                            />
                            <button
                                onClick={() => setLineWidth((w) => Math.min(100, w + 1))}
                                className="px-2 py-1 bg-sky-100 rounded hover:bg-sky-200"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const { canvas, ctx } = getCanvasAndCtx();
                                    if (ctx && canvas) undo(ctx, canvas);
                                }}
                                className="p-2 rounded-lg bg-sky-100 hover:bg-sky-200"
                            >
                                <Undo2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => {
                                    const { canvas, ctx } = getCanvasAndCtx();
                                    if (ctx && canvas) redo(ctx, canvas);
                                }}
                                className="p-2 rounded-lg bg-sky-100 hover:bg-sky-200"
                            >
                                <Redo2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    {/* DESKTOP */}

    return ( 
        <div 
            style={{
                position: "absolute",
                top: position.y,
                left: position.x,
                cursor: dragging ? "grabbing" : "grab",
                zIndex: 10,
            }}
            className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg p-3 flex items-center gap-4 border border-slate-200 select-none"
        >
            <button
                onMouseDown={handleMouseDown}
                className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-700"
                title="Drag toolbar"
            >
                <Move className="w-5 h-5" />
            </button>

            <label className="relative">
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="appearance-none w-0 h-0 absolute opacity-0"
                />
                <button
                    type="button"
                    onClick={(e) => {
                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                        input.click();
                    }}
                    className="w-8 h-8 rounded-full border-2 border-slate-400"
                    style={{ backgroundColor: color }}
                    title="Choose color"
                />
            </label>

            <button
                onClick={() => {
                    setIsErasing(!isErasing)
                    setIsFilling(false);
                }}
                className={`p-2 rounded-lg transition ${
                    isErasing ? "bg-red-200 text-red-600" : "bg-sky-100 hover:bg-sky-200 text-slate-700"
                }`}
                title={isErasing ? "Switch to brush" : "Eraser mode"}
            >
                <Eraser className="w-5 h-5" />
            </button>

            <button
                onClick={() => {
                    setIsFilling(!isFilling);
                    setIsErasing(false);
                }}
                className={`p-2 rounded-lg transition ${
                    isFilling
                    ? "bg-yellow-200 text-yellow-700"
                    : "bg-sky-100 hover:bg-sky-200 text-slate-700"
                }`}
                title={isFilling ? "Switch to brush" : "Fill mode"}
            >
                <PaintBucket className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1 justify-between">
                <button
                    onClick={() => setLineWidth((w) => Math.max(1, w - 1))}
                    className="px-2 py-1 bg-sky-100 rounded hover:bg-sky-200"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <input
                    type="number"
                    min="1"
                    max="100"
                    value={lineWidth}
                    onChange={(e) => {
                        let val = e.target.value;
                        val = val.replace(/^0+/, "");
                        const num = val === "" ? 0 : parseInt(val);
                        setLineWidth(Math.min(Math.max(num, 1), 50));
                    }}
                    className="w-16 border rounded-md text-center px-2 py-1 no-arrows"
                />
                <button
                    onClick={() => setLineWidth((w) => Math.min(100, w + 1))}
                    className="px-2 py-1 bg-sky-100 rounded hover:bg-sky-200"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <button
                onClick={() => {
                    const { canvas, ctx } = getCanvasAndCtx();
                    if (ctx && canvas) undo(ctx, canvas);
                }}
                className="p-2 rounded-lg bg-sky-100 hover:bg-sky-200"
            >
                <Undo2 className="w-5 h-5" />
            </button>

            <button 
                onClick={() => {
                    const { canvas, ctx } = getCanvasAndCtx();
                    if (ctx && canvas) redo(ctx, canvas);
                }}
                className="p-2 rounded-lg bg-sky-100 hover:bg-sky-200"
            >
                <Redo2 className="w-5 h-5" />
            </button>
        </div>
    );
}