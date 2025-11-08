// TO DO: fix lasso tool (WTF IS HAPPENING), add layers feature
import { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import DrawingBoard from "./components/DrawingBoard/DrawingBoard";
import Toast from "./components/Toast";

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
    const [toast, setToast] = useState<{ message: string; type?: string } | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingUrl, setEditingUrl] = useState<string | null>(null);

    const isEditMode = editingId !== null && editingUrl !== null;

    const drawingBoardRef = useRef<HTMLCanvasElement | null>(null);
    const editBoardRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const storedId = sessionStorage.getItem("studio-edit-id");
        const storedUrl = sessionStorage.getItem("studio-edit-url");

        if (storedId && storedUrl) {
            setEditingId(Number(storedId));
            setEditingUrl(storedUrl);
            setResult(storedUrl);
            setFreeDrawMode(false);
            setUsingWebcam(false);
            setWebcamImage(null);
            setUploadImage(null);
        }
    }, []);

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

            sessionStorage.removeItem("studio-free-draw");
            sessionStorage.removeItem("studio-uploaded-draw");

            setWebcamImage(dataUrl);
            
            // Stop webcam
            if (webcamStream) {
                webcamStream.getTracks().forEach(track => track.stop());
            }
            setWebcamStream(null);
            setUsingWebcam(false);
        };
    }

    const handleSaveToGallery = async () => {
        const canvas = isEditMode ? editBoardRef.current : drawingBoardRef.current;
        if (!canvas) return;

        try {
            const exportWithBackground = (canvas: HTMLCanvasElement) => {
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;

                const ctx = tempCanvas.getContext("2d");
                if (!ctx) throw new Error("Failed to get canvas context");

                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                ctx.drawImage(canvas, 0, 0);

                return tempCanvas;
            };

            const galleryCanvas = exportWithBackground(canvas);

            const galleryBlob: Blob = await new Promise((resolve, reject) => {
                galleryCanvas.toBlob((blob: Blob | null) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Failed to create gallery blob"));
                }, "image/png");
            });

            const editBlob: Blob = await new Promise((resolve, reject) => {
                canvas.toBlob((blob: Blob | null) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Failed to create edit blob"));
                }, "image/png");
            });

            const token = localStorage.getItem("token");

            if (editingId) {
                const formData = new FormData();
                formData.append("editImage", editBlob,"edit.png");
                formData.append("galleryImage", galleryBlob, "gallery.png");

                const res = await fetch(`http://localhost:8080/gallery/update?id=${editingId}`, {
                    method: "PUT",
                    body: formData,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error("Failed to update drawing");

                sessionStorage.removeItem("studio-edit-id");
                sessionStorage.removeItem("studio-edit-url");

                setToast({ message: "Drawing updated successfully!", type: "success" });
                window.location.href = "/gallery";
                return;
            }

            const formData = new FormData();
            formData.append("galleryImage", galleryBlob, "gallery.png");
            formData.append("editImage", editBlob, "edit.png");

            const res = await fetch("http://localhost:8080/gallery/upload", {
                method: "POST",
                body: formData,
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Failed to save drawing");

            sessionStorage.removeItem("studio-free-draw");
            sessionStorage.removeItem("studio-uploaded-draw");

            setToast({ message: "Drawing saved to your gallery!", type: "success" });
        } catch (err) {
            console.error(err);
            setToast({ message: "Error saving drawing", type: "error" });
        }
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
                    {!isEditMode && (
                        <div className="mt-4">
                            <button
                                onClick={() => {
                                    setFreeDrawMode(!freeDrawMode);
                                    setResult(null);
                                    setUsingWebcam(false);
                                    setWebcamImage(null);
                                    setUploadImage(null);
                                }}
                                className={`button-pop button-bounce px-4 py-2 rounded-lg text-white font-medium transition ${
                                    freeDrawMode ? "bg-pink-500 hover:bg-pink-600" : "bg-sky-500 hover:bg-sky-600"
                                }`}
                            >
                                {freeDrawMode ? "Exit Free Draw Mode" : "Start Free Draw Mode"}
                            </button>
                        </div>
                    )}

                    {/* Workspace Window */}
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[600px] flex items-center justify-center mt-6">
                        {/* Free Draw Mode */}
                        {freeDrawMode && !isEditMode && <DrawingBoard baseImage={""} ref={drawingBoardRef} />}
                        
                        {/* Initial */}
                        {!uploadImage && !webcamImage && !usingWebcam && !freeDrawMode && !isEditMode && (
                            <div className="absolute bottom-4 flex gap-4">
                                <button
                                    onClick={startWebcam}
                                    className="button-pop button-bounce px-4 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600"
                                >
                                    Use Webcam
                                </button>
                                <label className="button-pop button-bounce px-4 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 cursor-pointer">
                                    Upload Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {

                                            sessionStorage.removeItem("studio-free-draw");
                                            sessionStorage.removeItem("studio-uploaded-draw");

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
                        {webcamImage && !freeDrawMode && !isEditMode && (
                            <img
                                src={webcamImage}
                                alt="Captured"
                                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                            />
                        )}

                        {/* Uploaded image */}
                        {uploadImage && !freeDrawMode && !isEditMode && (
                            <img
                                src={uploadImage}
                                alt="Uploaded"
                                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                            />
                        )}

                        {/* Converted coloring page */}
                        {!freeDrawMode && (
                            <>
                                {isEditMode ? (
                                    <DrawingBoard baseImage={editingUrl!} ref={editBoardRef} />
                                ) : result ? (
                                    <DrawingBoard baseImage={result} ref={drawingBoardRef} />
                                ) : null}
                            </>
                        )}

                        {/* Webcam buttons */}
                        {usingWebcam && !webcamImage && (
                            <div className="absolute bottom-4 flex gap-4">
                                <button
                                    onClick={captureFromWebcam}
                                    className="button-pop button-bounce px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                >
                                    Capture Image
                                </button>
                                <button
                                    onClick={() => {
                                        webcamStream?.getTracks().forEach(track => track.stop());
                                        setWebcamStream(null);
                                        setUsingWebcam(false);
                                    }}
                                    className="button-pop button-bounce px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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
                                    className="button-pop button-bounce px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
                                >
                                    Retake Photo
                                </button>
                                <button
                                    onClick={() => {
                                        setWebcamImage(null);
                                        setUsingWebcam(false);
                                    }}
                                    className="button-pop button-bounce px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Upload buttons */}
                        {uploadImage && !freeDrawMode && !result && (
                            <div className="absolute bottom-4 flex gap-4">
                                <label className="button-pop button-bounce px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer">
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
                                    className="button-pop button-bounce px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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
                                    className="button-pop button-bounce px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
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
                                onClick={() => {
                                    if (isEditMode) {
                                        sessionStorage.removeItem("studio-edit-id");
                                        sessionStorage.removeItem("studio-edit-url");
                                        window.location.href = "/gallery";
                                    } else {
                                        setShowRestartConfirm(true);
                                    }
                                }}
                                className="button-pop button-bounce px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                            >
                                {isEditMode ? "Cancel" : "Restart"}
                            </button>

                            {/* Save Button */}
                            <button
                                onClick={handleSaveToGallery}
                                className="button-pop button-bounce px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
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
                                            
                                            sessionStorage.removeItem("studio-free-draw");
                                            sessionStorage.removeItem("studio-uploaded-draw");

                                            setShowRestartConfirm(false);
                                        }}
                                        className="button-pop button-bounce px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                    >
                                        Yes, Restart
                                    </button>
                                    <button
                                        onClick={() => setShowRestartConfirm(false)}
                                        className="button-pop button-bounce px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {toast && (
                        <Toast
                            message={toast.message}
                            type={toast.type as any}
                            onClose={() => setToast(null)}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}

export default Studio;