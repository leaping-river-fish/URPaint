import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Undo2, Redo2, Brush, Move, X, Plus, Minus, Eraser } from "lucide-react";
import { DrawingProvider, useDrawing } from "./DrawingContext";
import useIsMobile from "./useIsMobile";


const DrawingCanvas = forwardRef<HTMLCanvasElement, { baseImage: string; isErasing: boolean }>(
    ({ baseImage, isErasing }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement | null>(null);
        const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
        const [drawing, setDrawing] = useState(false);
        const [imageLoaded, setImageLoaded] = useState(false);
        const [cursorPos, setCursorPos] = useState<{
            x: number;
            y: number;
            clientX: number;
            clientY: number;
        } | null>(null);


        const { color, lineWidth, saveState } = useDrawing();

        useEffect (() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const parent = canvas.parentElement;
            if (!parent) return;

            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;

            const restored = loadCanvasFromStorage(ctx, canvas);
            if (restored) {
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                saveState(canvas);
                return;
            }
            
            if (!baseImage) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                const img = new Image();
                img.src = baseImage;
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                };
            }

            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctxRef.current = ctx;
            saveState(canvas);
            setImageLoaded(true);
        }, [baseImage]);

        // Update brush dynamically
        useEffect (() => {
            if (ctxRef.current) {
                ctxRef.current.strokeStyle = color;
                ctxRef.current.lineWidth = lineWidth;
            }
        }, [color, lineWidth]);

        const STORAGE_KEY = baseImage ? "studio-uploaded-draw" : "studio-free-draw";

        const saveCanvasToStorage = (canvas: HTMLCanvasElement) => {
            try {
                const dataURL = canvas.toDataURL("image/png");
                sessionStorage.setItem(STORAGE_KEY, dataURL);
            } catch (err) {
                console.error("Error saving canvas to storage", err);
            }
        };

        const loadCanvasFromStorage = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (!saved) return false;

            const img = new Image();
            img.src = saved;
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                ctxRef.current = ctx;
                setImageLoaded(true);
            };
            return true;
        };

        const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
            const canvas = e.currentTarget;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            };
        };

        const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
            const { x, y } = getCanvasCoords(e);
            setCursorPos({ x, y, clientX: e.clientX, clientY: e.clientY });

            if (drawing) draw(e);
        };

        const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (!ctxRef.current || !imageLoaded) return;
            const { x, y } = getCanvasCoords(e);
            ctxRef.current.beginPath();
            ctxRef.current.moveTo(x, y);
            setDrawing(true); 
        };

        const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (!drawing || !ctxRef.current) return;
            const { x, y } = getCanvasCoords(e);

            if (isErasing) {
                ctxRef.current.globalCompositeOperation = "source-over";
                ctxRef.current.strokeStyle = "#ffffff"; 
            } else {
                ctxRef.current.globalCompositeOperation = "source-over";
                ctxRef.current.strokeStyle = color;
            }

            ctxRef.current.lineTo(x, y);
            ctxRef.current.stroke();
        };

        const stopDrawing = () => {
            if (!drawing || !ctxRef.current || !canvasRef.current) return;
            ctxRef.current.closePath();
            ctxRef.current.globalCompositeOperation = "source-over";
            setDrawing(false);
            saveState(canvasRef.current);
            saveCanvasToStorage(canvasRef.current);
        };

        useImperativeHandle(ref, () => canvasRef.current!);

        return (
            <>
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={handleMouseMove}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className={`w-full h-full rounded-2xl ${isErasing ? "cursor-none" : "cursor-crosshair"}`}
                />

                {isErasing && cursorPos && canvasRef.current && (
                    <div 
                        style={{
                            position: "fixed",
                            left: cursorPos.clientX - lineWidth / 2,
                            top: cursorPos.clientY - lineWidth / 2,
                            width: lineWidth,
                            height: lineWidth,
                            borderRadius: "50%",
                            border: "2px solid rgba(0,0,0,0.4)",
                            pointerEvents: "none",
                            zIndex: 9999,
                        }}  
                    />
                )}
            </>
        );
    }
);

function DrawingToolbar({ isErasing, setIsErasing }: { isErasing: boolean; setIsErasing: React.Dispatch<React.SetStateAction<boolean>> }) {
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
                            />
                        </label>

                        <button
                            onClick={() => setIsErasing(!isErasing)}
                            className={`p-2 rounded-lg transition self-start ${
                                isErasing
                                ? "bg-sky-500 text-white shadow-md"
                                : "bg-sky-100 text-slate-700 hover:bg-sky-200"
                            }`}
                            title="Eraser"
                        >
                            <Eraser className="w-5 h-5" />
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

            <label className="flex items-center gap-2">
                <Brush className="w-5 h-5 text-slate-600" />
                <input 
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                />
            </label>

            <button
                onClick={() => setIsErasing(!isErasing)}
                className={`p-2 rounded-lg transition ${
                    isErasing ? "bg-red-200 text-red-600" : "bg-sky-100 hover:bg-sky-200 text-slate-700"
                }`}
                title={isErasing ? "Switch to brush" : "Eraser mode"}
            >
                <Eraser className="w-5 h-5" />
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

export default forwardRef<HTMLCanvasElement, { baseImage: string }>(
    function DrawingBoard({ baseImage }, ref) {
        const [isErasing, setIsErasing] = useState(false);

        return (
            <DrawingProvider>
                <div className="flex flex-col items-center justify-center w-full h-full relative">
                    <DrawingCanvas baseImage={baseImage} ref={ref} isErasing={isErasing} />
                    <DrawingToolbar isErasing={isErasing} setIsErasing={setIsErasing} />
                </div>
            </DrawingProvider>
        );
    }
);