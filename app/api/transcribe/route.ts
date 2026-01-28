export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { writeFile, readFile, unlink, access } from "fs/promises"
import { exec } from "child_process"
import path from "path"
import os from "os"

import { LANGUAGES } from "@/app/constants/languages"

import {
  ensureWhisperInstalled,
  getWhisperBinaryPath,
  getWhisperModelPath,
} from "./whisperInstaller"

import {
  ensureFFmpegInstalled,
  getFFmpegPath,
} from "./ffmpegInstaller"

/* ---------------------------------- */
/* Helpers                            */
/* ---------------------------------- */

function execAsync(cmd: string, label: string) {
  return new Promise<void>((resolve, reject) => {
    console.log(`▶️ ${label}`)
    console.log(cmd)

    exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
      if (stdout?.trim()) console.log(stdout)
      if (stderr?.trim()) console.log(stderr)

      if (error) return reject(error)
      resolve()
    })
  })
}

/* ---------------------------------- */
/* Supported language set             */
/* ---------------------------------- */

const SUPPORTED_LANGUAGE_CODES = new Set(
  LANGUAGES.filter(l => l.supported).map(l => l.code)
)

/* ---------------------------------- */
/* POST                               */
/* ---------------------------------- */

export async function POST(req: Request) {
  const start = Date.now()

  try {
    console.log("\n==============================")
    console.log("🎙 NEW TRANSCRIPTION REQUEST")
    console.log("==============================")

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const languageCode = (formData.get("language") as string | null)?.trim()

    if (!file) throw new Error("No file uploaded")
    if (!languageCode) throw new Error("Language code missing")

    console.log("📄 File:", file.name)
    console.log("🌍 Language code:", languageCode)

    /* ---------------------------------- */
    /* Validate language                  */
    /* ---------------------------------- */

    if (!SUPPORTED_LANGUAGE_CODES.has(languageCode)) {
      throw new Error(`Language "${languageCode}" is not supported yet`)
    }

    /* ---------------------------------- */
    /* Temp paths                         */
    /* ---------------------------------- */

    const tmp = os.tmpdir()
    const base = `voxscribe-${Date.now()}`
    const safeName = file.name.replace(/[^\w.-]/g, "_")

    const inputPath = path.join(tmp, `${base}-${safeName}`)
    const wavPath = path.join(tmp, `${base}.wav`)
    const outputBase = path.join(tmp, base)
    const outputTxt = `${outputBase}.txt`

    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()))
    console.log("✅ Input saved")

    /* ---------------------------------- */
    /* FFmpeg                             */
    /* ---------------------------------- */

    await ensureFFmpegInstalled()
    const ffmpeg = getFFmpegPath()

    await execAsync(
      `"${ffmpeg}" -y -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${wavPath}"`,
      "FFMPEG"
    )

    await access(wavPath)
    console.log("🎧 WAV prepared")

    /* ---------------------------------- */
    /* Whisper                            */
    /* ---------------------------------- */

    await ensureWhisperInstalled()

    const whisper = getWhisperBinaryPath()
    const model = getWhisperModelPath()
    const threads = Math.max(2, os.cpus().length - 1)

    const whisperCmd =
      `"${whisper}" -m "${model}" -f "${wavPath}" -of "${outputBase}" -l ${languageCode} -otxt -t ${threads}`

    await execAsync(whisperCmd, "WHISPER")

    await access(outputTxt)

    /* ---------------------------------- */
    /* Read transcript                   */
    /* ---------------------------------- */

    const raw = await readFile(outputTxt, "utf8")
    if (!raw.trim()) throw new Error("Empty transcript")

    const transcript = raw
      .replace(/\[\d+m\d+s\d+ms-\d+m\d+s\d+ms\]/g, "")
      .replace(/\s+/g, " ")
      .trim()

    /* ---------------------------------- */
    /* Cleanup                            */
    /* ---------------------------------- */

    Promise.allSettled([
      unlink(inputPath),
      unlink(wavPath),
      unlink(outputTxt),
    ])

    const duration = Math.round((Date.now() - start) / 1000)

    console.log(`✅ DONE in ${duration}s`)
    console.log("==============================\n")

    return NextResponse.json({
      transcript,
      duration,
      language: languageCode,
    })
  } catch (err: any) {
    console.error("🔥 TRANSCRIPTION FAILED")
    console.error(err)

    return NextResponse.json(
      { error: err.message || "Transcription failed" },
      { status: 500 }
    )
  }
}
