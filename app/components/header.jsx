"use client"

import { useRouter } from "next/navigation"

export default function Header({ userName, onLogout }) {
  const router = useRouter()

  return (
    <header className="w-full px-8 py-4 bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-md flex items-center justify-between">
      <div
        onClick={() => router.push("/dashboard")}
        className="text-xl font-bold text-white tracking-tight cursor-pointer"
      >
        Vox<span className="text-red-500">Scribe</span>
      </div>

      <nav>
        <ul className="flex items-center gap-6 text-sm">
          <li>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-zinc-300 hover:text-white transition cursor-pointer"
            >
              Home
            </button>
          </li>

          <li>
            <button
              onClick={() => router.push("/transcription")}
              className="text-zinc-300 hover:text-white transition cursor-pointer"
            >
              Transcribe
            </button>
          </li>

          <li className="ml-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm">
              👤
            </div>

            {userName && (
              <span className="hidden sm:block text-zinc-300">
                {userName}
              </span>
            )}

            <button
              onClick={onLogout}
              className="ml-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-red-600/90 to-pink-600/90 text-white text-sm font-medium shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:from-red-500 hover:to-pink-500 transition-all duration-200 cursor-pointer"
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </header>
  )
}
