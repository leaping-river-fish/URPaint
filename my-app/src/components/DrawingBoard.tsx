import { useRef, useState, useEffect } from "react";
import { Undo2, Redo2, Brush, Move } from "lucide-react";
import { DrawingProvider, useDrawing } from "./DrawingContext";

function DrawingCanvas({ baseImage }: { baseImage: string }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [drawing, setDrawing] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const { color, lineWidth, saveState } = useDrawing();

    useEffect (() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.src = baseImage;
        
        img.onload = () => {
            const parent = canvas.parentElement;
            if (!parent) return;

            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;

            ctxRef.current = ctx;
            saveState(canvas); 
            setImageLoaded(true);
        };
    }, [baseImage]);

    // Update brush dynamically
    useEffect (() => {
        if (ctxRef.current) {
            ctxRef.current.strokeStyle = color;
            ctxRef.current.lineWidth = lineWidth;
        }
    }, [color, lineWidth]);

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
        ctxRef.current.lineTo(x, y);
        ctxRef.current.stroke();
    };

    const stopDrawing = () => {
        if (!drawing || !ctxRef.current || !canvasRef.current) return;
        ctxRef.current.closePath();
        setDrawing(false);
        saveState(canvasRef.current);
    };

    return (
        <canvas 
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-full cursor-crosshair rounded-2xl"
        />
    );
}

function DrawingToolbar() {
    const { color, setColor, lineWidth, setLineWidth, undo, redo } = useDrawing();
    const [position, setPosition] = useState({ x: 250, y: 500 });
    const [dragging, setDragging] = useState(false);
    const offsetRef = useRef({ x: 0, y: 0 });

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

            <label className="flex items-center gap-2">
                🖌️
                <input 
                    type="range"
                    min="1"
                    max="50"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(Number(e.target.value))}
                />
            </label>

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

export default function DrawingBoard({ baseImage }: { baseImage: string }) {
    return (
        <DrawingProvider>
            <div className="flex flex-col items-center justify-center w-full h-full relative">
                <DrawingCanvas baseImage={baseImage} />
                <DrawingToolbar />
            </div>
        </DrawingProvider>
    );
}