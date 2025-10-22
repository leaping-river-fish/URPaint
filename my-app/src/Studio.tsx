// TO DO: Fix undo feature with images action not being saved when exiting, add more toolbar features, add layers,
import { useState, useRef } from "react";
import Sidebar from "./components/Sidebar";
import DrawingBoard from "./components/DrawingBoard";

function Studio() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [usingWebcam, setUsingWebcam] = useState(false);
    const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
    const [freeDrawMode, setFreeDrawMode] = useState(false);
    const [webcamImage, setWebcamImage] = useState<string | null>(null);
    const [uploadImage, setUploadImage] = useState<string | null>(null);
    const [showRestartConfirm, setShowRestartConfirm] = useState(false);


    const drawingBoardRef = useRef<HTMLCanvasElement | null>(null);

    const handleUpload = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const source = webcamImage || uploadImage;
        if (!source) return;

        try {
            setLoading(true);

            const res = await fetch(source); 
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
            setWebcamImage(dataUrl);
            
            // Stop webcam
            if (webcamStream) {
                webcamStream.getTracks().forEach(track => track.stop());
            }
            setWebcamStream(null);
            setUsingWebcam(false);
        };
    }

    const handleSaveToGallery = () => {
        const canvas = drawingBoardRef.current;
        if(!canvas) return;

        canvas.toBlob(async (blob) => {
            if (!blob) return;

            const formData = new FormData();
            formData.append("drawing", blob, "drawing.png");

            const token = localStorage.getItem("token");
            if (!token) {
                alert("You must be logged in to save drawings.");
                return;
            }

            try {
                const res = await fetch("http://localhost:8080/gallery/upload", {
                    method: "POST",
                    body: formData,
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Failed to save drawing");

                alert("Drawing saved to your gallery!");
            } catch (err) {
                console.error(err);
                alert("Error saving drawing");
            }
        });
    };

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
                                setResult(null);
                                setUsingWebcam(false);
                                setWebcamImage(null);
                                setUploadImage(null);
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
                        {freeDrawMode && <DrawingBoard baseImage={""} ref={drawingBoardRef} />}
                        
                        {/* Initial */}
                        {!uploadImage && !webcamImage && !usingWebcam && !freeDrawMode && (
                            <div className="absolute bottom-4 flex gap-4">
                                <button
                                    onClick={startWebcam}
                                    className="px-4 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600"
                                >
                                    Use Webcam
                                </button>
                                <label className="px-4 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 cursor-pointer">
                                    Upload Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setUploadImage(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }}
                                    className="hidden"
                                />
                                </label>
                            </div>
                        )}
                        
                        {/* Webcam live feed */}
                        {usingWebcam && !webcamImage && webcamStream && (
                            <video 
                                autoPlay
                                playsInline
                                ref={videoEl => { if (videoEl) videoEl.srcObject = webcamStream; }}
                                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                            />
                        )}

                        {/* Captured webcam image */}
                        {webcamImage && !freeDrawMode && (
                            <img
                                src={webcamImage}
                                alt="Captured"
                                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                            />
                        )}

                        {/* Uploaded image */}
                        {uploadImage && !freeDrawMode && (
                            <img
                                src={uploadImage}
                                alt="Uploaded"
                                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                            />
                        )}

                        {/* Converted coloring page */}
                        {!freeDrawMode && result && <DrawingBoard baseImage={result} ref={drawingBoardRef} />}

                        {/* Webcam buttons */}
                        {usingWebcam && !webcamImage && (
                            <div className="absolute bottom-4 flex gap-4">
                                <button
                                    onClick={captureFromWebcam}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                >
                                    Capture Image
                                </button>
                                <button
                                    onClick={() => {
                                        webcamStream?.getTracks().forEach(track => track.stop());
                                        setWebcamStream(null);
                                        setUsingWebcam(false);
                                    }}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {webcamImage && !freeDrawMode && !result && (
                            <div className="absolute bottom-4 flex gap-4">
                                <button
                                    onClick={() => {
                                        setWebcamImage(null);
                                        startWebcam();
                                    }}
                                    className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
                                >
                                    Retake Photo
                                </button>
                                <button
                                    onClick={() => {
                                        setWebcamImage(null);
                                        setUsingWebcam(false);
                                    }}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Upload buttons */}
                        {uploadImage && !freeDrawMode && !result && (
                            <div className="absolute bottom-4 flex gap-4">
                                <label className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer">
                                    Upload Another
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setUploadImage(URL.createObjectURL(e.target.files[0]));
                                            }
                                        }}
                                        className="hidden"
                                    />
                                </label>
                                <button
                                    onClick={() => setUploadImage(null)}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Convert button */}
                        {(uploadImage || webcamImage) && !result && (
                            <div className="absolute bottom-4 right-4">
                                <button
                                    onClick={handleUpload}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                    disabled={loading}
                                >
                                    {loading ? "Processing..." : "Convert to Coloring Page"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Save button */}
                    {(freeDrawMode || result) && (
                        <div className="flex justify-between max-w-4xl w-full mt-4 mx-auto">
                            {/* Restart Button */}
                            <button
                                onClick={() => setShowRestartConfirm(true)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                            >
                                Restart
                            </button>

                            {/* Save Button */}
                            <button
                                onClick={handleSaveToGallery}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                            >
                                Save to Gallery
                            </button>
                        </div>
                    )} 
                    {showRestartConfirm && (
                        <div className="fixed inset-0 flex items-center justify-center z-50">
                            <div className="absolute inset-0 bg-black/30"></div>
                            <div className="relative bg-white rounded-2xl p-6 w-96 flex flex-col items-center shadow-xl z-10">
                                <h2 className="text-lg font-semibold mb-4">Confirm Restart</h2>
                                <p className="text-slate-700 mb-6 text-center">
                                    Are you sure you want to restart? All unsaved work will be lost.
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setFreeDrawMode(false);
                                            setUploadImage(null);
                                            setWebcamImage(null);
                                            setResult(null);
                                            setUsingWebcam(false);
                                            setWebcamStream(null);
                                            setShowRestartConfirm(false);
                                        }}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                    >
                                        Yes, Restart
                                    </button>
                                    <button
                                        onClick={() => setShowRestartConfirm(false)}
                                        className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default Studio;