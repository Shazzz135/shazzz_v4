
import { useNavigate } from 'react-router-dom';
import GhostFibers from '../components/bits/GhostFibers';
import PERSON  from '../data/data';

export default function Play() {
    const navigate = useNavigate();

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#080511] text-white">
            {/* Animated background */}
            <div className="absolute inset-0">
                <GhostFibers
                    lineColor="#1e014e"
                    glowColor="#1c0240"
                    speed={0.1}
                    scale={2}
                    rotation={45}
                    rotationSpeed={0.25}
                    layers={3}
                    waveAmplitude={0.01}
                    waveFrequency={3.6}
                    waveSpeed={0.15}
                    layerSpeed={0.08}
                    twist={0.18}
                    twistFrequency={5}
                    twistSpeed={1.2}
                    lineFrequency={5}
                    lineSpacing={2.25}
                    lineSharpness={16}
                    glowFalloff={10}
                    glowIntensity={1.6}
                    brightness={2}
                    blueBoost={1.25}
                    vignette={0.8}
                    grain={0.05}
                    dpr={2}
                    lightMode={false}
                    fps={60}
                    paused={false}
                />
            </div>

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/35" />

            {/* Login content */}
            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-10">

                <div className="flex w-full max-w-[420px] flex-col items-center">

                    {/* Profile image */}
                    <div className="mb-5 h-32 w-32 overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-2xl shadow-purple-950/40">
                        <img
                            src={PERSON}
                            alt="Profile"
                            className="h-full w-full object-cover"
                        />
                    </div>

                    {/* Account name */}
                    <h1 className="text-center text-3xl font-semibold tracking-tight">
                        Nick Shahbaz
                    </h1>

                    <button
    type="button"
    onClick={() => {
        navigate("/world");
    }}
    className="mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white shadow-lg backdrop-blur-md transition hover:bg-white/25 active:scale-95 cursor-pointer"
    aria-label="Sign in"
>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
</button>

                </div>
            </div>
        </main>
    );
}