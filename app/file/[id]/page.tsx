"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Header from "@/app/components/header"
import { getAudioFile } from "@/app/utils/audioStorage"

type Word = {
  text: string
  time: string
}

type WordWithTiming = {
  text: string
  start: number
  end: number
}

type Sentence = {
  speaker: string
  words: Word[]
}

type SentenceWithTiming = {
  speaker: string
  words: WordWithTiming[]
}

type StoredFile = {
  id: string
  name: string
  transcript?: string
  createdAt: string
}

export default function FilePage() {
  // 🔌 Backend will inject these later
  const [audioName, setAudioName] = useState<string>("")
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [recentFiles, setRecentFiles] = useState<{ id: string; name: string }[]>([])

  const [currentTime, setCurrentTime] = useState<number>(0)
  const [totalTime, setTotalTime] = useState<number>(0)
  const [volume, setVolume] = useState<number>(0.8)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [audioUrl, setAudioUrl] = useState<string>("")

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const activeWordRef = useRef<HTMLSpanElement | null>(null)
  const { id } = useParams()
  const router = useRouter()

  // Word-level timings: distribute duration by character length for better sync with speech
  const sentencesWithTiming = useMemo((): SentenceWithTiming[] => {
    if (sentences.length === 0 || totalTime <= 0) return []
    const allWords = sentences.flatMap((s) => s.words)
    if (allWords.length === 0) return []
    const totalChars = allWords.reduce((acc, w) => acc + Math.max(1, w.text.length), 0)
    let t = 0
    let wi = 0
    return sentences.map((s) => ({
      speaker: s.speaker,
      words: s.words.map((w) => {
        const duration = (Math.max(1, w.text.length) / totalChars) * totalTime
        const start = t
        t += duration
        wi += 1
        const end = wi === allWords.length ? totalTime : t
        return { text: w.text, start, end }
      }),
    }))
  }, [sentences, totalTime])

  // Which word is currently being spoken (for highlight)
  const activeWord = useMemo((): { sentenceIndex: number; wordIndex: number } | null => {
    if (sentencesWithTiming.length === 0) return null
    for (let si = 0; si < sentencesWithTiming.length; si++) {
      const sent = sentencesWithTiming[si]
      for (let wi = 0; wi < sent.words.length; wi++) {
        const w = sent.words[wi]
        if (currentTime >= w.start && currentTime < w.end) return { sentenceIndex: si, wordIndex: wi }
      }
    }
    // At or past end: keep last word highlighted
    const last = sentencesWithTiming[sentencesWithTiming.length - 1]
    if (last.words.length > 0 && currentTime >= last.words[last.words.length - 1].start) {
      return { sentenceIndex: sentencesWithTiming.length - 1, wordIndex: last.words.length - 1 }
    }
    return null
  }, [sentencesWithTiming, currentTime])

  // Auto-scroll transcript so the active word stays in view
  useEffect(() => {
    if (activeWord) {
      activeWordRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [activeWord])

  useEffect(() => {
    const loadFile = async () => {
      const stored = JSON.parse(
        localStorage.getItem("voxscribe_files") || "[]"
      )

      // Find current file
      const current = stored.find((f: any) => f.id === id)

      if (current) {
        setAudioName(current.name)

        // Load audio file from IndexedDB
        try {
          const audioFile = await getAudioFile(current.id)
          if (audioFile) {
            const blobUrl = URL.createObjectURL(audioFile)
            setAudioUrl(blobUrl)
          }
        } catch (error) {
          console.error("Failed to load audio file:", error)
        }

        // Convert plain transcript string → UI sentence format
        if (current.transcript && current.transcript.trim() !== "") {
          // Split by words and filter out empty strings
          const words = current.transcript.trim().split(/\s+/).filter((word: string) => word.length > 0)

          if (words.length > 0) {
            setSentences([
              {
                speaker: "Speaker 1",
                words: words.map((word: string) => ({
                  text: word,
                  time: "",
                })),
              },
            ])
          }
        }
      }

      // Populate recent files (left sidebar)
      setRecentFiles(
        stored.slice(0, 5).map((f: any) => ({ id: f.id, name: f.name }))
      )
    }

    loadFile()
  }, [id])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setTotalTime(audio.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [audioUrl])

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Play/Pause handler
  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  // Format time helper
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)

    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  // Progress % for audio bar
  const progressPercent =
    totalTime > 0 ? (currentTime / totalTime) * 100 : 0

  // --- Export helpers ---
  const getBaseFilename = () =>
    (audioName || "transcript").replace(/\.[^/.]+$/, "") || "transcript"

  const getTranscriptText = () =>
    sentences
      .map((s) => s.words.map((w) => w.text).join(" "))
      .join("\n\n")
      .trim()

  const secondsToSrtTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    const ms = Math.round((seconds % 1) * 1000)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`
  }

  const getSrtContent = () => {
    const hasTiming = totalTime > 0 && sentencesWithTiming.length > 0
    if (hasTiming) {
      return sentencesWithTiming
        .map((sent, i) => {
          const words = (sent as SentenceWithTiming).words
          if (words.length === 0) return ""
          const start = words[0].start
          const end = words[words.length - 1].end
          const text = words.map((w) => w.text).join(" ")
          return `${i + 1}\n${secondsToSrtTime(start)} --> ${secondsToSrtTime(end)}\n${text}\n`
        })
        .filter(Boolean)
        .join("\n")
    }
    // No timing: use sequential placeholders
    return sentences
      .map((sent, i) => {
        const text = sent.words.map((w) => w.text).join(" ")
        if (!text) return ""
        const start = i
        const end = i + 1
        return `${i + 1}\n${secondsToSrtTime(start)} --> ${secondsToSrtTime(end)}\n${text}\n`
      })
      .filter(Boolean)
      .join("\n")
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadTxt = () => {
    const text = getTranscriptText() || "(No transcript)"
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    downloadBlob(blob, `${getBaseFilename()}.txt`)
  }

  const downloadSrt = () => {
    const srt = getSrtContent() || "1\n00:00:00,000 --> 00:00:01,000\n(No transcript)\n"
    const blob = new Blob([srt], { type: "text/plain;charset=utf-8" })
    downloadBlob(blob, `${getBaseFilename()}.srt`)
  }

  const downloadPdf = async () => {
    const text = getTranscriptText()

    if (!text || text.trim().length === 0) {
      alert("Transcript is empty. Generate transcription first.")
      return
    }

    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          filename: getBaseFilename(),
        }),
      })

      if (!res.ok) throw new Error("PDF export failed")

      const blob = await res.blob()
      downloadBlob(blob, `${getBaseFilename()}.pdf`)
    } catch (e) {
      console.error("PDF export failed:", e)
    }
  }

  const downloadDocx = async () => {
    try {
      const res = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: getTranscriptText(),
          filename: getBaseFilename(),
        }),
      })
      if (!res.ok) throw new Error("DOCX export failed")
      const blob = await res.blob()
      downloadBlob(blob, `${getBaseFilename()}.docx`)
    } catch (e) {
      console.error("DOCX export failed:", e)
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-black via-zinc-900 to-black overflow-hidden">

      {/* Background blobs */}
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

      {/* Header */}
      <Header />

      {/* Main layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 flex gap-8">

        {/* LEFT: Recent Files */}
        <div className="w-64 shrink-0 hidden md:block">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow p-4">
            <h3 className="text-sm font-semibold text-white mb-3">
              Recent Files
            </h3>

            {recentFiles.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No recent files
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {recentFiles.map((file, i) => (
                  <button
                    key={file.id || `recent-${i}`}
                    onClick={() => file.id && router.push(`/file/${file.id}`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-300"
                  >
                    {file.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE: Transcript */}
        <div className="flex-1">

          {/* File info */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 mb-6">
            <h1 className="text-xl font-semibold text-white mb-1">
              {audioName || "No file selected"}
            </h1>
            <p className="text-sm text-zinc-400">
              {/* Backend injects date */}
              —
            </p>
          </div>

          {/* Transcript display with audio-synced highlighting */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 min-h-[260px] max-h-[50vh] overflow-y-auto">
            {sentences.length === 0 ? (
              <div className="text-center text-zinc-400">
                <p className="mb-2">📝 No transcript yet</p>
                <p className="text-sm">
                  Transcript will appear here once generated
                </p>
              </div>
            ) : (
              (() => {
                const useTiming = totalTime > 0 && sentencesWithTiming.length > 0
                const list = useTiming ? sentencesWithTiming : sentences
                return (
                  <div className="space-y-4">
                    {list.map((sentence, si) => (
                      <div
                        key={si}
                        className="rounded-lg p-3 hover:bg-white/5 transition"
                      >
                        <div className="text-xs text-red-400 font-semibold mb-1">
                          {sentence.speaker}
                        </div>
                        <div className="text-white leading-relaxed break-words overflow-wrap-anywhere">
                          {useTiming
                            ? (sentence as SentenceWithTiming).words.map((word, wi) => {
                              const isActive = activeWord?.sentenceIndex === si && activeWord?.wordIndex === wi
                              return (
                                <span
                                  key={wi}
                                  ref={isActive ? activeWordRef : undefined}
                                  onClick={() => {
                                    const a = audioRef.current
                                    if (a) a.currentTime = word.start
                                  }}
                                  className={`mr-1 inline-block transition-all cursor-pointer rounded px-0.5 -mx-0.5 ${isActive ? "bg-red-500/50 text-white" : "hover:text-red-400 hover:bg-white/10"
                                    }`}
                                  title={`${word.start.toFixed(1)}s – ${word.end.toFixed(1)}s`}
                                >
                                  {word.text}
                                </span>
                              )
                            })
                            : (sentence as Sentence).words.map((word, wi) => (
                              <span key={wi} className="mr-1 hover:text-red-400 transition inline-block" title={word.time || undefined}>
                                {word.text}
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()
            )}
          </div>
        </div>

        {/* RIGHT: Export */}
        <div className="w-72 shrink-0 hidden lg:block">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow p-4">
            <h3 className="text-sm font-semibold text-white mb-3">
              Export
            </h3>

            <div className="space-y-2 text-sm">
              <button
                onClick={downloadPdf}
                className="w-full px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-300 text-left"
              >
                📄 Download PDF
              </button>
              <button
                onClick={downloadDocx}
                className="w-full px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-300 text-left"
              >
                📝 Download DOCX
              </button>
              <button
                onClick={downloadTxt}
                className="w-full px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-300 text-left"
              >
                📃 Download TXT
              </button>
              <button
                onClick={downloadSrt}
                className="w-full px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-300 text-left"
              >
                🎬 Download SRT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
        />
      )}

      {/* Bottom audio bar (centered + volume) */}
      {audioUrl && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-3xl bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 shadow-2xl flex items-center gap-4">

          {/* Play / Pause */}
          <button
            onClick={togglePlayPause}
            className="text-white text-xl hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!audioUrl}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          {/* Progress bar */}
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const audio = audioRef.current
              if (!audio) return
              const rect = e.currentTarget.getBoundingClientRect()
              const percent = (e.clientX - rect.left) / rect.width
              audio.currentTime = percent * audio.duration
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-red-600 to-pink-600 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Time */}
          <div className="text-xs text-zinc-400 whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(totalTime)}
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">🔊</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 accent-red-300 cursor-pointer"
            />
          </div>

        </div>
      )}
    </div>
  )
}