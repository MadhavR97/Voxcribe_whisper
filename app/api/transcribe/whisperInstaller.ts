import fs from "fs"
import path from "path"
import https from "https"
import { execSync } from "child_process"

const WHISPER_DIR = path.join(process.cwd(), "whisper")

const MODEL_NAME = "ggml-small.bin"
const MODEL_PATH = path.join(WHISPER_DIR, MODEL_NAME)

const MODEL_URL =
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"

export function getWhisperBinaryPath() {
  const platform = process.platform

  if (platform === "win32") {
    return path.join(WHISPER_DIR, "whisper-cli.exe")
  }

  if (platform === "linux") {
    return path.join(WHISPER_DIR, "whisper")
  }

  if (platform === "darwin") {
    return "/usr/local/bin/whisper-cli"
  }

  throw new Error(`Unsupported platform: ${platform}`)
}

export function getWhisperModelPath() {
  return MODEL_PATH
}

export async function ensureWhisperInstalled() {
  const platform = process.platform

  if (!fs.existsSync(WHISPER_DIR)) {
    fs.mkdirSync(WHISPER_DIR, { recursive: true })
  }

  // =========================
  // 1️⃣ Ensure Whisper binary
  // =========================

  if (platform === "darwin") {
    try {
      execSync("which whisper-cli", { stdio: "ignore" })
    } catch {
      throw new Error(
        "Whisper not found on macOS. Please run: brew install whisper-cpp"
      )
    }
  } else {
    const binPath = getWhisperBinaryPath()

    if (!fs.existsSync(binPath)) {
      console.log("⬇️ Downloading Whisper binary for", platform)

      let url: string
      let extractZip = false

      if (platform === "win32") {
        url =
          "https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip"
        extractZip = true
      } else if (platform === "linux") {
        url =
          "https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-cli-linux-x64"
      } else {
        throw new Error(`Auto-install not supported on ${platform}`)
      }

      const tmpPath = path.join(WHISPER_DIR, path.basename(url))

      await downloadFileWithProgress(url, tmpPath, "Whisper binary")

      if (extractZip) {
        execSync(
          `powershell -Command "Expand-Archive -Force '${tmpPath}' '${WHISPER_DIR}'"`,
          { stdio: "inherit" }
        )

        // Windows ZIP now ships main.exe instead of whisper.exe
        const exePath =
          findFileRecursive(WHISPER_DIR, "whisper.exe") ||
          findFileRecursive(WHISPER_DIR, "main.exe")

        if (!exePath) {
          throw new Error(
            "Whisper ZIP extracted but neither whisper.exe nor main.exe was found"
          )
        }

        fs.renameSync(exePath, binPath)

        // 🧹 Clean up ZIP after extraction
        if (fs.existsSync(tmpPath)) {
          fs.unlinkSync(tmpPath)
        }

        // 🛡 Ensure executable (safe no-op on Windows)
        try {
          fs.chmodSync(binPath, 0o755)
        } catch { }

      } else {
        fs.renameSync(tmpPath, binPath)
        fs.chmodSync(binPath, 0o755)
      }

      if (!fs.existsSync(binPath)) {
        throw new Error("Whisper binary install failed")
      }

      console.log("✅ Whisper binary installed at", binPath)
    }
  }

  // =========================
  // 2️⃣ Ensure Whisper model
  // =========================

  if (!fs.existsSync(MODEL_PATH)) {
    console.log("⬇️ Downloading Whisper model:", MODEL_NAME)

    await downloadFileWithProgress(MODEL_URL, MODEL_PATH, "Whisper model")

    if (!fs.existsSync(MODEL_PATH)) {
      throw new Error("Whisper model download failed")
    }

    console.log("✅ Whisper model downloaded at", MODEL_PATH)
  }
}

// =========================
// Helpers
// =========================

function downloadFileWithProgress(
  url: string,
  dest: string,
  label: string,
  redirects = 0
): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)

    https
      .get(url, (res) => {
        // 🔁 Handle redirects (GitHub, HuggingFace)
        if (
          res.statusCode &&
          [301, 302, 303, 307, 308].includes(res.statusCode)
        ) {
          if (!res.headers.location) {
            reject(new Error("Redirect with no Location header"))
            return
          }

          if (redirects > 5) {
            reject(new Error("Too many redirects"))
            return
          }

          console.log(`↪ Redirected → ${res.headers.location}`)
          file.close()
          fs.unlinkSync(dest)

          downloadFileWithProgress(
            res.headers.location,
            dest,
            label,
            redirects + 1
          )
            .then(resolve)
            .catch(reject)

          return
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: ${res.statusCode}`))
          return
        }

        const total = parseInt(res.headers["content-length"] || "0", 10)
        let downloaded = 0
        let lastPercent = 0

        res.on("data", (chunk) => {
          downloaded += chunk.length

          if (total) {
            const percent = Math.floor((downloaded / total) * 100)

            if (percent !== lastPercent && percent % 5 === 0) {
              lastPercent = percent
              process.stdout.write(
                `\r⬇️ ${label}: ${percent}% (${(
                  downloaded /
                  1024 /
                  1024
                ).toFixed(1)} MB)`
              )
            }
          }
        })

        res.pipe(file)

        file.on("finish", () => {
          file.close()
          process.stdout.write("\n")
          resolve()
        })
      })
      .on("error", (err) => {
        fs.unlink(dest, () => reject(err))
      })
  })
}

function findFileRecursive(dir: string, filename: string): string | null {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (
      entry.isFile() &&
      entry.name.toLowerCase() === filename.toLowerCase()
    ) {
      return fullPath
    }

    if (entry.isDirectory()) {
      const result = findFileRecursive(fullPath, filename)
      if (result) return result
    }
  }

  return null
}