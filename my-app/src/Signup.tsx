import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import URPaintLogo from "./components/URPaintLogo";
import { signup, login } from "./api";



function Signup() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [cpassword, setCPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSignup = async () => {
        setError("");
            if (password !== cpassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            await signup(email, password);
            await login(email, password);
            navigate("/hub");
        } catch (err: any) {
            console.error("Signup error:", err);
            if (err.status === 409) {
                setError("Email is already in use");
            } else {
                setError(err.message || "Something went wrong. Please try again.");
            }
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-100 to-pink-100 relative">

            {/*waves*/}

            <div className="absolute bottom-0 left-0 w-full z-40">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path fill="#0EA5E9" fillOpacity="1" 
                        d="M0,32L60,74.7C120,117,240,203,360,234.7C480,267,600,245,720,229.3C840,213,960,203,1080,176C1200,149,1320,107,1380,85.3L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z">
                    </path>
                </svg>
            </div>

            <div className="absolute bottom-0 left-0 w-full z-30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path fill="#EC4899" fillOpacity="1" 
                        d="M0,96L80,122.7C160,149,320,203,480,197.3C640,192,800,128,960,117.3C1120,107,1280,149,1360,170.7L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z">
                    </path>
                </svg>
            </div>

            <div className="absolute bottom-0 left-0 w-full z-20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path fill="#22C55E" fillOpacity="1" 
                        d="M0,320L34.3,272C68.6,224,137,128,206,90.7C274.3,53,343,75,411,90.7C480,107,549,117,617,106.7C685.7,96,754,64,823,64C891.4,64,960,96,1029,90.7C1097.1,85,1166,43,1234,26.7C1302.9,11,1371,21,1406,26.7L1440,32L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z">        
                    </path>
                </svg>
            </div>

            <div className="absolute bottom-0 left-0 w-full z-10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path fill="#FACC15" fillOpacity="1" 
                        d="M0,32L48,26.7C96,21,192,11,288,10.7C384,11,480,21,576,37.3C672,53,768,75,864,106.7C960,139,1056,181,1152,218.7C1248,256,1344,288,1392,304L1440,320L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"> 
                    </path>
                </svg>
            </div>

            <div className="absolute bottom-15 left-0 w-full z-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path fill="#A855F7" fillOpacity="1" 
                        d="M0,160L48,144C96,128,192,96,288,112C384,128,480,192,576,186.7C672,181,768,107,864,80C960,53,1056,75,1152,96C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
                    </path>
                </svg>
            </div>

            {/*Sign up form*/}

            <div className="absolute top-0 left-0 w-full z-50">
                <div className="min-h-screen flex flex-col items-center">
                    <div className="flex flex-col justify-center sm:h-screen p-4">
                        <div className="max-w-md w-full mx-auto bg-white border border-slate-300 rounded-2xl p-8 shadow-lg">
                            <div className="text-center mb-12">
                                <URPaintLogo className="w-full h-auto max-w-xs"/>
                            </div>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSignup();
                                }}
                            >
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-slate-800 text-sm font-medium mb-2 block">Email</label>
                                        <input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)} 
                                        type="text" 
                                        className="text-slate-800 bg-white border border-slate-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500" 
                                        placeholder="Enter email" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-800 text-sm font-medium mb-2 block">Password</label>
                                        <input 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        type="password" 
                                        className="text-slate-800 bg-white border border-slate-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500" 
                                        placeholder="Enter password" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-800 text-sm font-medium mb-2 block">Confirm Password</label>
                                        <input 
                                        value={cpassword}
                                        onChange={(e) => setCPassword(e.target.value)}
                                        type="password" className="text-slate-800 bg-white border border-slate-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500" 
                                        placeholder="Confirm password"
                                        />
                                        {error && (
                                            <p className="mt-2 text-sm text-red-600">{error}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center">
                                        <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 shrink-0 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
                                        <label className="text-slate-800 ml-3 font-medium block text-sm">Remember Me</label>
                                    </div>
                                </div>

                                <div className="mt-12">
                                    <button type="submit" className="w-full py-3 px-4 text-sm tracking-wider font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer">
                                        Create an account
                                    </button>
                                </div>
                                <p className="text-slate-800 font-medium text-sm mt-6 text-center">Already have an account?
                                    <Link to="/login" className="text-blue-600 font-medium hover:underline ml-1">
                                        Login here
                                    </Link>
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Signup;