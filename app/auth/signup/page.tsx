"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"


export default function SignupPage() {

    const navigate = useRouter()


    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden">

            {/* Animated background blobs */}
            <motion.div
                className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/30 rounded-full blur-3xl"
                animate={{ x: [0, 60, -40, 0], y: [0, 40, -60, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl"
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
                <form className="space-y-4">

                    {/* Email */}
                    <div>
                        <label className="block text-sm text-zinc-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-red-500/60 transition"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm text-zinc-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-red-500/60 transition"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm text-zinc-300 mb-1">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-red-500/60 transition"
                        />
                    </div>


                    {/* Signup button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        type="submit"
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white font-medium shadow-lg shadow-red-600/20 hover:shadow-red-600/40 transition"
                    >
                        Create Account
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
                        className="text-red-400 hover:text-red-300 transition font-medium"
                    >
                        Sign in
                    </button>
                </p>
            </motion.div>
        </div>
    )
}