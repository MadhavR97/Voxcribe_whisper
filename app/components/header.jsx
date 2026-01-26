"use client"

import { useRouter } from "next/navigation"

export default function Header() {
  const router = useRouter()

  return (
    <header className="w-full px-8 py-4 bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-md flex items-center justify-between">
      
      {/* Brand */}
      <div
        onClick={() => router.push("/dashboard")}
        className="text-xl font-bold text-white tracking-tight cursor-pointer"
      >
        Vox<span className="text-red-500">Scribe</span>
      </div>

      {/* Nav */}
      <nav>
        <ul className="flex items-center gap-6 text-sm">
          <li>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-zinc-300 hover:text-white transition"
            >
              Home
            </button>
          </li>

          <li>
            <button
              onClick={() => router.push("/transcription")}
              className="text-zinc-300 hover:text-white transition"
            >
              Transcribe
            </button>
          </li>

          <li>
            <button
              onClick={() => router.push("/auth/login")}
              className="text-zinc-300 hover:text-white transition"
            >
              Login
            </button>
          </li>

          <li>
            <button
              onClick={() => router.push("/auth/signup")}
              className="text-zinc-300 hover:text-white transition"
            >
              Sign Up
            </button>
          </li>

          {/* User Avatar Placeholder */}
          <li className="ml-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm">
              👤
            </div>
            <span className="hidden sm:block text-zinc-300">
              you@email.com
            </span>
          </li>
        </ul>
      </nav>
    </header>
  )
}
