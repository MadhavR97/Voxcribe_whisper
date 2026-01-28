"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function SignupPage() {
    const navigate = useRouter()

    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        
        if (!supabase) {
            setError('Supabase client not available')
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                },
            },
        })

        setLoading(false)

        if (error) {
            setError(error.message)
        } else {
            navigate.push("/auth/login")
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden">

            {/* Animated background blobs */}
            <motion.div
                className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/30 rounded-full blur-3xl will-change-transform!"
                animate={{ x: [0, 60, -40, 0], y: [0, 40, -60, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl will-change-transform!"
                animate={{ x: [0, -50, 30, 0], y: [0, -40, 50, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md mx-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8"
            >
                {/* Title */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Create your <span className="text-red-500">VoxScribe</span> account
                    </h1>
                    <p className="text-sm text-zinc-400 mt-2">
                        Start transcribing your audio in seconds
                    </p>
                </div>

                {/* Form */}
                <form className="space-y-4" onSubmit={handleSignup}>
                    {/* Username */}
                    <div>
                        <label className="block text-sm text-zinc-300 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            placeholder="your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-red-500/60 transition"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm text-zinc-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-red-500/60 transition"
                        />
                    </div>

                    {/* Password with eye */}
                    <div>
                        <label className="block text-sm text-zinc-300 mb-1">
                            Password
                        </label>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 pr-11 rounded-lg bg-black/40 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-red-500/60 transition"
                            />

                            {/* Eye button */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    // Eye off
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.06.165-2.08.469-3.037M6.225 6.225A9.956 9.956 0 0112 5c5.523 0 10 4.477 10 10a9.96 9.96 0 01-1.397 5.132M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 3l18 18"
                                        />
                                    </svg>
                                ) : (
                                    // Eye
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-400 text-center">
                            {error}
                        </p>
                    )}

                    {/* Signup button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white font-medium shadow-lg shadow-red-600/20 hover:shadow-red-600/40 transition disabled:opacity-60 cursor-pointer"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </motion.button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-zinc-400">OR</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Login link */}
                <p className="text-center text-sm text-zinc-400">
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={() => navigate.push("/auth/login")}
                        className="text-red-400 hover:text-red-300 transition font-medium cursor-pointer"
                    >
                        Sign in
                    </button>
                </p>
            </motion.div>
        </div>
    )
}
