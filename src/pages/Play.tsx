
import { useNavigate } from 'react-router-dom';
import titleBg from '../assets/backgrounds/title.webp';

export default function Play() {
    const navigate = useNavigate();

    return (
        <main 
            className="relative min-h-screen overflow-hidden text-white"
            style={{
                backgroundImage: `url(${titleBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/10" />

            {/* Login content */}
            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-10">

                <div className="flex w-full max-w-[420px] flex-col items-center">

                    <button
    type="button"
    onClick={() => navigate("/hub")}
    className="
        group relative mt-6 flex cursor-pointer
        items-center justify-center gap-4
        border-2 border-purple-400
        bg-[#180b3b] px-8 py-4
        font-mono text-sm font-bold
        uppercase tracking-widest text-purple-100
        shadow-[4px_4px_0px_#090019]
        transition-all duration-150
        hover:bg-purple-900
        hover:text-white
        active:translate-x-1
        active:translate-y-1
        active:shadow-none
    "
    aria-label="Enter Dungeon"
>
    <span className="text-purple-400">✦</span>

    <span>Enter Dungeon</span>

    <span className="text-lg text-purple-300 transition-transform group-hover:translate-x-1">
        ▶
    </span>
</button>

                </div>
            </div>
        </main>
    );
}