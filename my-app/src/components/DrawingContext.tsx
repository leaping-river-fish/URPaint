import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type DrawingContextType = {
    color: string;
    setColor: (color: string) => void;
    lineWidth: number;
    setLineWidth: React.Dispatch<React.SetStateAction<number>>;
    saveState: (canvas: HTMLCanvasElement) => void;
    undo: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;
    redo: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;
};

const DrawingContext = createContext<DrawingContextType | null>(null);

export const DrawingProvider = ({ children }: { children: ReactNode }) => {
    const [color, setColor] = useState("#000000");
    const [lineWidth, setLineWidth] = useState<number>(5);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [redoStack, setRedoStack] = useState<ImageData[]>([]);

    const saveCanvasToStorage = (canvas: HTMLCanvasElement) => {
    try {
        const dataURL = canvas.toDataURL("image/png");
            localStorage.setItem("drawingBoard", dataURL);
        } catch (err) {
            console.error("Error saving canvas to storage", err);
        }
    };

    const saveState = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory(prev => [...prev, data]);
        setRedoStack([]);
        saveCanvasToStorage(canvas);
    };

    const undo = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        if (history.length <= 1) return;

        const newHistory = [...history];
        const last = newHistory.pop();
        if (!last) return;

        setRedoStack(prev => [...prev, last]);

        setHistory(newHistory);

        const previous = newHistory[newHistory.length - 1];

        ctx.putImageData(previous, 0, 0);

        requestAnimationFrame(() => {
            try {
                const dataURL = canvas.toDataURL("image/png");
                localStorage.setItem("drawingBoard", dataURL);
            } catch (err) {
                console.error("Error saving canvas to storage", err);
            }
        });
    };

    const redo = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        if (redoStack.length === 0) return;

        const newRedo = [...redoStack];
        const next = newRedo.pop();
        if (!next) return;

        setRedoStack(newRedo);

        setHistory(prev => [...prev, next]);

        ctx.putImageData(next, 0, 0);

        requestAnimationFrame(() => {
            try {
                const dataURL = canvas.toDataURL("image/png");
                localStorage.setItem("drawingBoard", dataURL);
            } catch (err) {
                console.error("Error saving canvas to storage", err);
            }
        });
    };

    return (
        <DrawingContext.Provider
            value={{
                color,
                setColor,
                lineWidth,
                setLineWidth,
                undo,
                redo,
                saveState,
            }}
        >
            {children}
        </DrawingContext.Provider>
    );
};

export const useDrawing = () => {
    const ctx = useContext(DrawingContext);
    if (!ctx) throw new Error("useDrawing must be used within a DrawingProvider");
    return ctx;
};

