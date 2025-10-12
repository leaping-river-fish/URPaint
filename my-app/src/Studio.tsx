// TO DO: Add the result to be displayed in frontend, and add coloring options like scribbl.io, also make sure webcam view fills entire
// window, etc
import { useState } from "react";
import Sidebar from "./components/Sidebar";

function Studio() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [usingWebcam, setUsingWebcam] = useState(false);
    const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleUpload = async () => {
        if (!image) return;

        try {
            const res = await fetch(image); 
            const blob = await res.blob();         
            const formData = new FormData();
            formData.append("file", blob, "image.png");

            setLoading(true);
            const response = await fetch("http://localhost:8000/convert", {
                method: "POST",
                body: formData,
            });

            const processedBlob = await response.blob();
            setResult(URL.createObjectURL(processedBlob));
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
                        Here you can upload or take a photo to create your coloring page.
                    </p>

                    {/* Workspace Window */}
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[600px] flex items-center justify-center mt-6">
                        
                        {/* Webcam live feed */}
                        {usingWebcam && webcamStream && (
                            <video 
                                autoPlay
                                playsInline
                                ref={videoEl => { if (videoEl) videoEl.srcObject = webcamStream; }}
                                className="w-full h-full object-contain rounded-xl"
                            />
                        )}

                        {/* Uploaded or captured image */}
                        {image && !result && (
                            <img src={image} alt="Original" className="w-full h-full object-contain rounded-xl" />
                        )}

                        {/* Converted coloring page */}
                        {result && (
                            <img src={result} alt="Coloring Page" className="w-full h-full object-contain rounded-xl" />
                            // Later replace <img> with <canvas> for drawing
                        )}

                        {/* Overlayed buttons */}
                        {!image && !usingWebcam && (
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

                        {/* Capture button when using webcam */}
                        {usingWebcam && (
                            <button
                                onClick={captureFromWebcam}
                                className="absolute bottom-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                Capture Image
                            </button>
                        )}

                        {/* Convert button only appears if image exists and result is null */}
                        {image && !result && !usingWebcam && (
                            <form
                                onSubmit={handleUpload} 
                                className="absolute bottom-4 flex gap-4 items-center"
                            >
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
                                    disabled={loading}
                                >
                                    {loading ? "Processing..." : "Convert to Coloring Page"}
                                </button>
                            </form>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Studio;