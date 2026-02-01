import fs from "fs"
import path from "path"
import https from "https"
import { spawn } from "child_process"

const WHISPER_DIR = path.join((process as any).cwd(), "whisper")

const MODEL_NAME = "ggml-small.bin"
const MODEL_PATH = path.join(WHISPER_DIR, MODEL_NAME)

const MODEL_URL =
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"

export function getWhisperBinaryPath() {
  const platform = (process as any).platform

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
  const platform = (process as any).platform

  if (!fs.existsSync(WHISPER_DIR)) {
    fs.mkdirSync(WHISPER_DIR, { recursive: true })
  }

  // =========================
  // 1️⃣ Ensure Whisper binary
  // =========================

  if (platform === "darwin") {
    try {
      await runCommand("which", ["whisper-cli"], undefined, true)
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
        // Official releases do not provide pre-built Linux binaries.
        // We download the source code and compile it locally.
        // Note: The repo moved from ggerganov to ggml-org
        url =
          "https://github.com/ggml-org/whisper.cpp/archive/refs/tags/v1.5.4.zip"
        extractZip = true
      } else {
        throw new Error(`Auto-install not supported on ${platform}`)
      }

      const tmpPath = path.join(WHISPER_DIR, path.basename(url))

      // GitHub requires User-Agent
      await downloadFileWithProgress(url, tmpPath, "Whisper binary")

      if (extractZip) {
        if (platform === "win32") {
          await runCommand("powershell", [
            "-Command",
            `"Expand-Archive -Force '${tmpPath}' '${WHISPER_DIR}'"`
          ])
        } else {
          // Linux/Unix: Use unzip
          // Ensure unzip is available
          try {
             await runCommand("which", ["unzip"], undefined, true)
          } catch {
             throw new Error("unzip is required but not found.")
          }
          await runCommand("unzip", ["-o", tmpPath, "-d", WHISPER_DIR])
        }

        if (platform === "linux") {
          console.log("🔨 Compiling Whisper from source (this may take a while)...")
          
          // Find the extracted source directory by looking for the Makefile
          const makefilePath = findFileRecursive(WHISPER_DIR, "Makefile")
          if (!makefilePath) {
             throw new Error("Could not find Makefile in extracted source.")
          }
          const sourceDir = path.dirname(makefilePath)

          try {
            // Run 'make main' to only build the main binary, saving time.
            // Using spawn (via runCommand) ensures we don't block the event loop.
            await runCommand("make", ["main"], sourceDir)
          } catch (error) {
            throw new Error(
              "Failed to compile Whisper. Ensure 'make' and 'g++' are installed. Error: " + (error as any).message
            )
          }
        }

        // Locate the binary
        // Windows: whisper.exe or main.exe
        // Linux: main (produced by make)
        let exePath: string | null = null
        
        if (platform === "win32") {
            exePath =
            findFileRecursive(WHISPER_DIR, "whisper.exe") ||
            findFileRecursive(WHISPER_DIR, "main.exe")
        } else {
            // On Linux the compiled binary is usually named 'main'
            exePath = findFileRecursive(WHISPER_DIR, "main")
        }

        if (!exePath) {
          throw new Error(
            "Whisper binary not found after extraction/compilation"
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
        } catch {}
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

function runCommand(command: string, args: string[], cwd?: string, silent: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { 
          cwd, 
          stdio: silent ? 'ignore' : 'inherit', 
          shell: true 
      })
      proc.on("close", (code) => {
        if (code === 0) resolve()
        else reject(new Error(`Command ${command} failed with code ${code}`))
      })
      proc.on("error", (err) => reject(err))
    })
  }

function downloadFileWithProgress(
  url: string,
  dest: string,
  label: string,
  redirects = 0
): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    
    const options = {
        headers: {
            'User-Agent': 'Node.js/HTTPS', // GitHub requires a User-Agent
        }
    };

    https
      .get(url, options, (res) => {
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
              ;(process as any).stdout.write(
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
          ;(process as any).stdout.write("\n")
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
