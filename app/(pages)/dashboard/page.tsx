"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "../../components/header"

type VoxFile = {
  id: string
  name: string
  size: number
  duration: number
  language: string
  createdAt: string
  status: "processing" | "completed"
}

export default function DashboardPage() {
  const [files, setFiles] = useState<VoxFile[]>([])
  const router = useRouter()

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("voxscribe_files") || "[]"
    )
    setFiles(stored)
  }, [])

  const clearRecentFiles = () => {
    localStorage.removeItem("voxscribe_files")
    setFiles([])
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-black via-zinc-900 to-black overflow-hidden">

      {/* Liquid blobs (same as login/signup) */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/30 rounded-full blur-3xl"
        animate={{ x: [0, 60, -40, 0], y: [0, 40, -60, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl"
        animate={{ x: [0, -50, 30, 0], y: [0, -40, 50, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* /* Header */}
      <Header/>

      {/* Main layout */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 flex gap-8">

        {/* Sidebar */}
        <div className="w-64 shrink-0 hidden md:block">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow p-4 mb-4">
            <p className="text-sm text-zinc-400 mb-2">
              {files.length} daily transcriptions used
            </p>

            <button className="w-full py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm font-medium shadow-lg shadow-red-600/20 hover:shadow-red-600/40 transition">
              Go Unlimited
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow p-4">
            <p className="text-xs text-zinc-400 mb-2">Shortcuts</p>

            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-sm font-medium text-white">
              📁 Recent Files
            </button>

            <div className="mt-4">
              <p className="text-xs text-zinc-400 mb-2">Folders</p>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-zinc-300">
                ➕ New Folder
              </button>
            </div>
          </div>
        </div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-xl font-semibold text-white">
              ⬛⬛⬛ Recent Files
            </div>

            <div className="flex items-center gap-3">
              {files.length > 0 && (
                <button
                  onClick={clearRecentFiles}
                  className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-red-400 transition"
                >
                  🗑️ Clear All
                </button>
              )}
              <button
                onClick={() => router.push("/transcription")}
                className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition"
              >
                🎙 Record
              </button>
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {files.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center py-20"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl mb-4"
                >
                  📂
                </motion.div>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  Welcome to VoxScribe!
                </h2>

                <button
                  onClick={() => router.push("/transcription")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white font-medium shadow-lg shadow-red-600/20 hover:shadow-red-600/40 transition"
                >
                  ⬆️ Transcribe Your First File
                </button>

                <p className="mt-4 text-sm text-zinc-400">
                  💡 TIP: Drag and drop files to upload them into VoxScribe.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="divide-y divide-white/10"
              >
                {files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => router.push(`/file/${file.id}`)}
                    className="w-full text-left px-4 py-4 hover:bg-white/5 transition flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {file.name}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {file.language} •{" "}
                        {formatDuration(file.duration)} •{" "}
                        {new Date(file.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <span className="text-sm text-green-400">
                      {file.status}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}