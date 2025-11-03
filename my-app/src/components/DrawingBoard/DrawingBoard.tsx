import { useState, forwardRef } from "react";
import { DrawingProvider } from "./DrawingContext";
import { DrawingCanvas } from "./DrawingCanvas";
import { DrawingToolbar } from "./DrawingToolbar";

export default forwardRef<HTMLCanvasElement, { baseImage: string }>(
    function DrawingBoard({ baseImage }, ref) {
        const [isErasing, setIsErasing] = useState(false);
        const [isFilling, setIsFilling] = useState(false);

        return (
            <DrawingProvider>
                <div className="flex flex-col items-center justify-center w-full h-full relative">
                    <DrawingCanvas 
                        baseImage={baseImage} 
                        ref={ref} 
                        isErasing={isErasing} 
                        isFilling={isFilling} 
                    />
                    <DrawingToolbar 
                        isErasing={isErasing} 
                        setIsErasing={setIsErasing} 
                        isFilling={isFilling} 
                        setIsFilling={setIsFilling} 
                    />
                </div>
            </DrawingProvider>
        );
    }
);