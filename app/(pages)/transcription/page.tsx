"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { storeAudioFile } from "@/app/utils/audioStorage"
import { FiChevronDown } from "react-icons/fi"

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  // { code: "hi", label: "Hindi", flag: "🇮🇳" },
  // { code: "es", label: "Spanish", flag: "🇪🇸" },
  // { code: "fr", label: "French", flag: "🇫🇷" },
  // { code: "de", label: "German", flag: "🇩🇪" },
  // { code: "it", label: "Italian", flag: "🇮🇹" },
  // { code: "pt", label: "Portuguese", flag: "🇵🇹" },
  // { code: "ru", label: "Russian", flag: "🇷🇺" },
  // { code: "zh", label: "Chinese", flag: "🇨🇳" },
  // { code: "ja", label: "Japanese", flag: "🇯🇵" },
  // { code: "ko", label: "Korean", flag: "🇰🇷" },
  // { code: "ar", label: "Arabic", flag: "🇸🇦" },
  // { code: "bn", label: "Bengali", flag: "🇧🇩" },
  // { code: "ur", label: "Urdu", flag: "🇵🇰" },
  // { code: "tr", label: "Turkish", flag: "🇹🇷" },
  // { code: "th", label: "Thai", flag: "🇹🇭" },
  // { code: "vi", label: "Vietnamese", flag: "🇻🇳" },
  // { code: "id", label: "Indonesian", flag: "🇮🇩" },
]

export default function TranscriptionPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [language, setLanguage] = useState(LANGUAGES[0])
  const [recentLanguages, setRecentLanguages] = useState<typeof LANGUAGES>([])

  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)
const [eta, setEta] = useState<string | null>(null)

  // ---- Drag & Drop ----
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) setFile(droppedFile)
  }

  const handleBrowse = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  // ---- Click outside dropdown ----
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // ---- Language logic ----
  const selectLanguage = (lang: (typeof LANGUAGES)[0]) => {
    setLanguage(lang)
    setIsOpen(false)
    setSearch("")

    setRecentLanguages((prev) => {
      const filtered = prev.filter((l) => l.code !== lang.code)
      return [lang, ...filtered].slice(0, 3)
    })
  }

  const filteredLanguages = LANGUAGES.filter((l) =>
    l.label.toLowerCase().includes(search.toLowerCase())
  )

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)

    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const handleTranscribe = async () => {
    if (!file) {
      alert("Please upload an audio file")
      return
    }

    setIsTranscribing(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("language", language.label)

    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      let data
      try {
        data = await res.json()
      } catch (parseError) {
        throw new Error("Failed to parse server response. Please try again.")
      }

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`)
      }

      // Validate transcript exists
      if (!data.transcript || data.transcript.trim() === "") {
        throw new Error("Transcription returned empty result. Please try again.")
      }

      const stored = JSON.parse(
        localStorage.getItem("voxscribe_files") || "[]"
      )

      const fileId = crypto.randomUUID()
      
      // Store audio file in IndexedDB (not localStorage to avoid quota issues)
      await storeAudioFile(fileId, file)
      setEta(`${data.duration}s`)
      stored.unshift({
        id: fileId,
        name: file.name,
        size: file.size,
        
        duration: data.duration,
        language: language.label,
        createdAt: new Date().toISOString(),
        status: "completed",
        transcript: data.transcript,
        // Don't store audioData in localStorage - it's in IndexedDB
      })

      localStorage.setItem("voxscribe_files", JSON.stringify(stored))

      // Redirect to the file page to show the transcript immediately
      setTimeout(() => {
  window.location.href = `/file/${fileId}`
}, 1500) // show ETA for 1.5s before redirect

    } catch (err: any) {
      // Show user-friendly error message
      const errorMessage = err.message || "An error occurred during transcription. Please try again."
      alert(errorMessage)
      console.error("Transcription error:", err)
    } finally {
      setIsTranscribing(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden px-4">

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center mb-10"
      >
        <p className="inline-flex items-center gap-2 text-sm sm:text-base text-zinc-300 mb-3">
          <span className="text-red-400">📈</span>
          <span>30+ hours transcribed</span>
        </p>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Unlimited{" "}
          <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
            audio
          </span>{" "}
          transcription
        </h1>

        <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto">
          Convert audio and video into accurate text in seconds with VoxScribe.
        </p>
      </motion.div>

      {/* Liquid blobs */}
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
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8"
      >


        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">
          Transcribe Files
        </h1>

        {/* Upload box */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={handleBrowse}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition
            ${isDragging ? "border-red-400 bg-red-500/10" : "border-red-500/50 bg-black/30 hover:bg-black/40"}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            hidden
            onChange={handleFileChange}
          />

          <p className="text-lg font-medium text-white">
            {file ? file.name : isDragging ? "Drop file here" : "Drag & Drop"}
          </p>

          {!file && (
            <>
              <p className="text-sm text-zinc-400 mt-2">
                MP3, MP4, M4A, MOV, AAC, WAV, OGG, OPUS, MPEG, WMA, WMV
              </p>
              <p className="text-sm text-zinc-500 my-2">— OR —</p>
              <button className="px-5 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm font-medium">
                Browse Files
              </button>
            </>
          )}
        </div>

        {/* Language dropdown */}
        <div className="mt-5 relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Audio Language
          </label>

          <button
            type="button"
            onClick={() => setIsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white hover:bg-black/50 transition"
          >
            <span className="flex items-center gap-2">
              <span>{language.flag}</span>
              <span>{language.label}</span>
            </span>
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="text-zinc-400 flex items-center"
            >
              <FiChevronDown size={18} />
            </motion.span>
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute z-[999] bottom-full mb-2 w-full
                 bg-zinc-900/95 backdrop-blur-xl
                 border border-white/10 rounded-xl shadow-xl p-2"
              >
                {/* Search */}
                {/* <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Search language..."
                  className="w-full mb-2 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
                /> */}

                {/* Recent */}
                {/* {recentLanguages.length > 0 && (
                  <>
                    <p className="text-xs text-zinc-400 mb-1">Recent</p>
                    {recentLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => selectLanguage(lang)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left"
                      >
                        <span>{lang.flag}</span>
                        <span className="text-white">{lang.label}</span>
                      </button>
                    ))}
                    <div className="h-px bg-white/10 my-2" />
                  </>
                )} */}

                {/* All */}
                <div className="max-h-56 overflow-y-auto pr-1">
                  {filteredLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => selectLanguage(lang)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left"
                    >
                      <span>{lang.flag}</span>
                      <span className="text-white">{lang.label}</span>
                    </button>
                  ))}

                  {filteredLanguages.length === 0 && (
                    <p className="text-sm text-zinc-500 px-3 py-2">
                      No languages found
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Transcribe */}
        <motion.button
          onClick={handleTranscribe}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={isTranscribing}
          className="mt-6 w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold shadow-lg shadow-red-600/20 hover:shadow-red-600/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTranscribing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              TRANSCRIBING...
            </span>
          ) : (
            "TRANSCRIBE"
          )}
        </motion.button>
        {eta && !isTranscribing && (
  <p className="text-sm text-zinc-400 mt-3 text-center">
    ⏱ Processed in {eta}
  </p>
)}

      </motion.div>
    </div>
  )
}