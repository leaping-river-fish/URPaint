// TO DO: Fix undo feature with images action not being saved when exiting, add more toolbar features, add layers, start on gallery
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import DrawingBoard from "./components/DrawingBoard";

function Studio() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [usingWebcam, setUsingWebcam] = useState(false);
    const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
    const [freeDrawMode, setFreeDrawMode] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleUpload = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!image) return;

        try {
            setLoading(true);

            const res = await fetch(image); 
            const blob = await res.blob();

            const formData = new FormData();
            formData.append("file", blob, "image.png");

            const response = await fetch("http://localhost:8000/convert", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const processedBlob = await response.blob();
            const processedUrl = URL.createObjectURL(processedBlob);
            setResult(processedUrl);
        } catch (err) {
            console.error("Error uploading image:", err);
        } finally {
            setLoading(false);
        }
    };

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setWebcamStream(stream);
            setUsingWebcam(true);
        } catch (err) {
            console.error("Error accessing webcam:", err);
        }
    };

    const captureFromWebcam = () => {
        if (!webcamStream) return;

        const video = document.createElement("video");
        video.srcObject = webcamStream;
        video.play();

        video.oncanplay = () => {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            
            const ctx = canvas.getContext("2d");
            if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const dataUrl = canvas.toDataURL("image/png");
            setImage(dataUrl);
            
            // Stop webcam
            webcamStream.getTracks().forEach(track => track.stop());
            setWebcamStream(null);
            setUsingWebcam(false);
        };
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
                    <h1 className="text-2xl font-bold text-slate-800">Studio</h1>
                </header>

                {/* Main content area */}
                <main className="flex-1 flex flex-col items-center justify-center text-center p-6 lg:ml-52">
                    <h2 className="text-3xl font-bold text-slate-700">
                        Welcome to the Studio! 🎨
                    </h2>
                    <p className="text-slate-600 max-w-md mt-4">
                        Upload or take a photo to create your coloring page.
                    </p>

                    {/* Free Draw Toggle */}
                    <div className="mt-4">
                        <button
                            onClick={() => {
                                setFreeDrawMode(!freeDrawMode);
                                setImage(null);
                                setResult(null);
                                setUsingWebcam(false);
                            }}
                            className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                                freeDrawMode
                                    ? "bg-pink-500 hover:bg-pink-600"
                                    : "bg-sky-500 hover:bg-sky-600"
                            }`}
                        >
                            {freeDrawMode ? "Exit Free Draw Mode" : "Start Free Draw Mode"}
                        </button>
                    </div>

                    {/* Workspace Window */}
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[600px] flex items-center justify-center mt-6">
                        {/* Free Draw Mode */}
                        {freeDrawMode && <DrawingBoard baseImage={""} />}

                        {/* Webcam live feed */}
                        {!freeDrawMode && usingWebcam && webcamStream && (
                            <video 
                                autoPlay
                                playsInline
                                ref={videoEl => { if (videoEl) videoEl.srcObject = webcamStream; }}
                                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                            />
                        )}

                        {/* Uploaded or captured image */}
                        {!freeDrawMode && image && !result && (
                            <img src={image} alt="Original" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                        )}

                        {/* Converted coloring page */}
                        {!freeDrawMode && result && <DrawingBoard baseImage={result} />}

                        {/* Overlayed buttons */}
                        {!freeDrawMode && !image && !usingWebcam && (
                            <div className="absolute bottom-4 flex gap-4">
                                <button
                                    onClick={startWebcam}
                                    className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
                                >
                                    Use Webcam
                                </button>

                                <label className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 cursor-pointer">
                                    Upload Image
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        )}

                        {/* Capture button */}
                        {!freeDrawMode && usingWebcam && (
                            <button
                                onClick={captureFromWebcam}
                                className="absolute bottom-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                Capture Image
                            </button>
                        )}

                        {/* Convert button */}
                        {!freeDrawMode && image && !result && !usingWebcam && (
                            <div className="absolute bottom-4 flex gap-4 items-center">
                                <button
                                    onClick={handleUpload}
                                    className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
                                    disabled={loading}
                                >
                                    {loading ? "Processing..." : "Convert to Coloring Page"}
                                </button>
                            </div>
                        )}                      
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Studio;