import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useDrawing } from "./DrawingContext";

export const DrawingCanvas = forwardRef<
    HTMLCanvasElement, 
    { baseImage: string; isErasing: boolean; isFilling: boolean }
>(({ baseImage, isErasing, isFilling }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement | null>(null);
        const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

        useEffect (() => {
            if (!ref) return;
            if (typeof ref === "function") {
                ref(canvasRef.current);
            } else {
                (ref as React.MutableRefObject<HTMLCanvasElement | null>).current = canvasRef.current;
            }
        }, [ref]);

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
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
                const img = new Image();
                img.crossOrigin = "anonymous";
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

        const hexToRgb = (hex: string): [number, number, number] => {
            const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
            if (!match) return [0, 0, 0];
            return [
                parseInt(match[1], 16),
                parseInt(match[2], 16),
                parseInt(match[3], 16),
            ];
        };

        const floodFill = (ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string) => {
            const canvas = ctx.canvas;
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const targetColor = getPixelColor(imageData, x, y);
            const rgb = hexToRgb(fillColor);
            const replacementColor: [number, number, number, number] = [rgb[0], rgb[1], rgb[2], 255];

            if (colorsMatch(targetColor, replacementColor)) return;

            const stack = [{ x, y }];

            while (stack.length) {
                const { x, y } = stack.pop()!;
                let currentY = y;
                while (currentY >= 0 && colorsMatch(getPixelColor(imageData, x, currentY), targetColor)) currentY--;
                currentY++;

                let reachLeft = false;
                let reachRight = false;

                while (currentY < canvas.height && colorsMatch(getPixelColor(imageData, x, currentY), targetColor)) {
                    setPixelColor(imageData, x, currentY, replacementColor);

                    if (x > 0) {
                        if (colorsMatch(getPixelColor(imageData, x - 1, currentY), targetColor)) {
                            if (!reachLeft) {
                                stack.push({ x: x - 1, y: currentY });
                                reachLeft = true;
                            }
                        } else reachLeft = false;
                    }

                    if (x < canvas.width - 1) {
                        if (colorsMatch(getPixelColor(imageData, x + 1, currentY), targetColor)) {
                            if (!reachRight) {
                                stack.push({ x: x + 1, y: currentY });
                                reachRight = true;
                            }
                        } else reachRight = false;
                    }
                    currentY++;
                }
            }
            ctx.putImageData(imageData, 0, 0);
        };

        const getPixelColor = (imageData: ImageData, x: number, y: number): [number, number, number, number] => {
            const index = (y * imageData.width + x) * 4;
            return [
                imageData.data[index],
                imageData.data[index + 1],
                imageData.data[index + 2],
                imageData.data[index + 3],
            ];
        };

        const setPixelColor = (
            imageData: ImageData,
            x: number,
            y: number,
            color: [number, number, number, number]
        ) => {
            const index = (y * imageData.width + x) * 4;
            imageData.data[index] = color[0];
            imageData.data[index + 1] = color[1];
            imageData.data[index + 2] = color[2];
            imageData.data[index + 3] = color[3];
        };

        const colorsMatch = (
            a: [number, number, number, number],
            b: [number, number, number, number]
        ): boolean => {
            const tolerance = 10;
            return (
                Math.abs(a[0] - b[0]) <= tolerance &&
                Math.abs(a[1] - b[1]) <= tolerance &&
                Math.abs(a[2] - b[2]) <= tolerance &&
                Math.abs(a[3] - b[3]) <= tolerance
            );
        };

        const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
            const { x, y } = getCanvasCoords(e);
            setCursorPos({ x, y, clientX: e.clientX, clientY: e.clientY });

            if (drawing) draw(e);
        };

        const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (!ctxRef.current || !imageLoaded) return;
            const { x, y } = getCanvasCoords(e);

            if (isFilling) {
                floodFill(ctxRef.current, Math.floor(x), Math.floor(y), color);
                saveState(ctxRef.current.canvas);
                saveCanvasToStorage(ctxRef.current.canvas);
                return;
            }

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

